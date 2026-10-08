// =====================================================================
//  Ma Classe d'Anglais — serveur IA « Nova » (Supabase Edge Function)
//  Reçoit les demandes de l'application, vérifie le compte de l'élève,
//  applique la limite quotidienne, puis interroge Google Gemini.
//  Secret obligatoire : GEMINI_API_KEY (Supabase → Edge Functions → Secrets)
//  Secrets facultatifs : GEMINI_MODEL, GEMINI_MODEL_QUICK, GEMINI_MODEL_COMPLEX
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MODELS: Record<string, string> = {
  quick: Deno.env.get("GEMINI_MODEL_QUICK") ?? "gemini-3.5-flash-lite",
  default: Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash",
  complex: Deno.env.get("GEMINI_MODEL_COMPLEX") ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash",
};
const SYSTEM = `Tu es Nova, l'assistant d'une application d'apprentissage de l'anglais utilisée au Togo par des élèves (souvent mineurs), des étudiants, des adultes, des parents et des professeurs. Sois bienveillant, exact et adapté à l'âge. Refuse poliment tout contenu inapproprié pour des élèves. Suis précisément les consignes de format données dans chaque demande.`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (code: string, message: string, status = 400) => json({ error: { code, message } }, status);

type Turn = { role: string; content: string };

// Clé serveur : ancienne (SUPABASE_SERVICE_ROLE_KEY) ou nouvelle (SUPABASE_SECRET_KEYS)
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
  try { const o = JSON.parse(raw); const v = typeof o === "string" ? o : Object.values(o)[0]; if (v) return String(v); } catch { /* texte brut */ }
  return raw.split(",")[0].trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("invalid_request", "POST uniquement", 405);

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return fail("sampling_disabled", "La clé GEMINI_API_KEY n'est pas configurée sur le serveur.", 500);

  // 1. Qui demande ?
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey());
  const { data: auth, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !auth?.user) return fail("session_expired", "Reconnecte-toi pour utiliser Nova.", 401);

  let body: { input?: string | Turn[]; json?: boolean; modelTier?: string; images?: { mime: string; data: string }[] };
  try { body = await req.json(); } catch { return fail("invalid_request", "Requête illisible."); }
  if (JSON.stringify(body).length > 6_000_000) return fail("prompt_too_large", "Demande trop longue.", 413);

  // 2. Limite quotidienne par personne (réglable dans la table app_config)
  const { data: count, error: limErr } = await admin.rpc("ai_take", { p_uid: auth.user.id });
  if (limErr) return fail("upstream_error", "Compteur indisponible : " + limErr.message, 500);
  if (typeof count === "number" && count < 0) return fail("rate_limited", "Limite d'utilisation de Nova atteinte pour aujourd'hui. Réessaie demain.", 429);

  // 3. Conversation au format Gemini
  const turns: Turn[] = typeof body.input === "string" ? [{ role: "user", content: body.input }]
    : Array.isArray(body.input) ? body.input : [];
  if (!turns.length) return fail("invalid_request", "Message vide.");
  const contents: { role: string; parts: Record<string, unknown>[] }[] = [];
  for (const t of turns) {
    const role = t.role === "assistant" ? "model" : "user";
    const text = String(t.content ?? "");
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push({ text });
    else contents.push({ role, parts: [{ text }] });
  }
  if (contents[0].role !== "user") contents.unshift({ role: "user", parts: [{ text: "Bonjour." }] });
  const lastUser = [...contents].reverse().find((c) => c.role === "user")!;
  for (const im of (body.images ?? []).slice(0, 4)) {
    if (im?.data && /^image\/(jpeg|png|webp|gif)$/.test(im.mime)) lastUser.parts.push({ inline_data: { mime_type: im.mime, data: im.data } });
  }

  const first = MODELS[body.modelTier ?? "default"] ?? MODELS.default;
  // Si un modèle est saturé (503/429), lent ou retiré (404), on essaie le suivant : Nova répond presque toujours.
  const chain = [...new Set([first, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"])];
  let res: Response | null = null;
  let out: any = {};
  let model = first;
  for (const m of chain) {
    for (const variant of [0, 1]) {
      const gen: Record<string, unknown> = { temperature: 0.7, maxOutputTokens: 8192, ...(body.json ? { responseMimeType: "application/json" } : {}) };
      if (variant === 0) gen.thinkingConfig = { thinkingBudget: 0 };   // réponses beaucoup plus rapides
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents, generationConfig: gen }),
          signal: AbortSignal.timeout(25000),
        });
      } catch (_e) { res = null; break; }
      out = await res.json().catch(() => ({}));
      model = m;
      console.log(`modèle ${m}, variante ${variant}, statut ${res.status}`);
      if (res.ok) break;
      if (res.status === 400 && variant === 0) continue;   // ce modèle refuse le réglage « sans réflexion » : on réessaie sans
      break;
    }
    if (res && (res.ok || res.status === 401 || res.status === 403)) break;
  }
  if (!res) return fail("upstream_error", "Impossible de joindre Gemini.", 502);
  if (!res.ok) {
    const msg = out?.error?.message ?? `Erreur Gemini ${res.status}`;
    if (res.status === 429) return fail("rate_limited", "Gemini est saturé ou le quota du projet est atteint. Réessaie dans un moment.", 429);
    if (res.status === 400) return fail("invalid_request", msg, 400);
    if (res.status === 403 || res.status === 401) return fail("sampling_disabled", "Clé Gemini refusée : " + msg, 500);
    return fail("upstream_error", msg, 502);
  }
  if (out?.promptFeedback?.blockReason) return fail("refused", "Nova ne peut pas répondre à cette demande.", 400);
  const cand = out?.candidates?.[0];
  if (cand?.finishReason === "SAFETY" || cand?.finishReason === "PROHIBITED_CONTENT") return fail("refused", "Nova ne peut pas répondre à cette demande.", 400);
  const text = (cand?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? "").join("");
  if (!text.trim()) return fail("empty_completion", "Nova n'a rien répondu. Reformule ta demande.", 502);
  return json({ text, truncated: cand?.finishReason === "MAX_TOKENS", model });
});
