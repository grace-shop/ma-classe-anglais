// =====================================================================
//  English Classes — réponse automatique du professeur (Supabase Edge Function)
//  Appelée par la base de données à chaque message d'élève, dans les deux
//  messageries :
//   • « Your teacher » (table prof_messages)  → body { id }
//   • « My teacher » (table docs, students/<uid>/msgs/<id>) → body { path }
//  Vérifie le secret, lit la conversation, répond EN ANGLAIS avec Gemini,
//  puis écrit la réponse (marquée « auto »).
//  Secret : PROF_BOT_SECRET (même valeur que app_config.prof_bot_secret)
//  Réglage : app_config.prof_bot = 'on' (sinon rien n'est envoyé)
//  Variables : GEMINI_API_KEY, PROF_BOT_SECRET (SUPABASE_URL et la clé
//  de service sont fournies automatiquement par Supabase).
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM = `You are the automatic assistant of the English teacher in an English-learning app used in Togo. The teacher is not available right now, so you answer the pupils and students for her. Rules:
- ALWAYS answer in English only, even if the message is written in French.
- Use simple English (A1–B2) adapted to the learner. Keep replies short (under 150 words).
- If the pupil sends a picture or a screenshot, read it carefully and answer the question it shows, step by step. Explain why. For graded exercises, give hints first rather than only the final answer.
- For ordinary chat, be friendly and encouraging, and bring the conversation back to English learning.
- Be kind, safe and age-appropriate: many users are minors. Never ask for addresses, phone numbers, passwords or personal photos.
- If a pupil mentions being hurt, abused, threatened, in danger or thinking about hurting themselves, tell them to talk right away to a trusted adult, and say that the message is passed to the teacher.
- Say clearly, when it fits, that you are the automatic assistant and that the teacher reads the conversation and will reply personally when she is available. Never pretend to be a human.`;

const CORS = { "Access-Control-Allow-Origin": "*" };
const MODELS = [Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];
const DAILY_AUTO_LIMIT = 60;
const TEACHER_QUIET_MINUTES = 15;
const PATH_RE = /^students\/([0-9a-f-]{36})\/msgs\/[A-Za-z0-9_.~:@+-]{1,120}$/i;

function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
  try { const o = JSON.parse(raw); const v = typeof o === "string" ? o : Object.values(o)[0]; if (v) return String(v); } catch { /* texte brut */ }
  return raw.split(",")[0].trim();
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// Gemini: returns the reply text ("" if none)
async function askGemini(contents: { role: string; parts: Record<string, unknown>[] }[]): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return "";
  let reply = "";
  for (const model of [...new Set(MODELS)]) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(25000),
      });
      const out: any = await res.json().catch(() => ({}));
      reply = (out?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").trim();
      if (res.ok && reply) break;
    } catch (_e) { /* on essaie le modèle suivant */ }
  }
  return reply;
}

// Joins consecutive turns of the same speaker (Gemini needs alternating roles)
function toContents(turns: { from_student: boolean; body: string }[]) {
  const contents: { role: string; parts: Record<string, unknown>[] }[] = [];
  for (const t of turns) {
    const role = t.from_student ? "user" : "model";
    const text = String(t.body || "");
    if (!text) continue;
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push({ text });
    else contents.push({ role, parts: [{ text }] });
  }
  if (!contents.length || contents[0].role !== "user") contents.unshift({ role: "user", parts: [{ text: "Hello." }] });
  return contents;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey());

  // 1. Appel venant bien de la base de données (secret partagé)
  const { data: cfg } = await admin.from("app_config").select("key,value").in("key", ["prof_bot", "prof_bot_secret"]);
  const conf = Object.fromEntries((cfg ?? []).map((r: any) => [r.key, r.value]));
  if (conf.prof_bot !== "on") return new Response("off", { status: 200 });
  if (!conf.prof_bot_secret || req.headers.get("x-bot-secret") !== conf.prof_bot_secret) return new Response("forbidden", { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch { return new Response("bad request", { status: 400 }); }

  // ---------- A. Messagerie « My teacher » (table docs) ----------
  if (typeof body?.path === "string") {
    const path: string = body.path;
    const m = PATH_RE.exec(path);
    if (!m) return new Response("bad path", { status: 400 });
    const student = m[1];
    const col = `students/${student}/msgs`;

    const { data: row } = await admin.from("docs").select("data").eq("path", path).maybeSingle();
    const d: any = row?.data ?? {};
    if (d.from !== "student" || d.auto) return new Response("skip", { status: 200 });

    // Conversation (the most recent 40 messages, oldest first)
    const { data: rows } = await admin.from("docs").select("path,data").eq("col", col).limit(400);
    const all = (rows ?? []).map((r: any) => ({ path: r.path, d: r.data ?? {} }))
      .sort((a, b) => Number(a.d.at ?? 0) - Number(b.d.at ?? 0));
    const now = Date.now();

    // Teacher replied herself recently? Then Nova stays quiet.
    const quietSince = now - TEACHER_QUIET_MINUTES * 60_000;
    if (all.some((x) => x.d.from === "teacher" && !x.d.auto && Number(x.d.at ?? 0) > quietSince)) {
      return new Response("teacher active", { status: 200 });
    }
    // Daily limit of automatic replies for this pupil
    const dayStart = now - 24 * 3600_000;
    if (all.filter((x) => x.d.auto && Number(x.d.at ?? 0) > dayStart).length >= DAILY_AUTO_LIMIT) {
      return new Response("limit", { status: 200 });
    }

    const turns = all.slice(-40).map((x) => ({ from_student: x.d.from === "student", body: String(x.d.text ?? "") }));
    const reply = await askGemini(toContents(turns));
    if (!reply) return new Response("no reply", { status: 502 });

    const id = `auto${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const { error: insErr } = await admin.from("docs").insert({
      path: `${col}/${id}`,
      data: { from: "teacher", auto: true, text: reply.slice(0, 4000), at: now },
    });
    if (insErr) return new Response("insert failed: " + insErr.message, { status: 500 });
    return new Response("ok", { status: 200 });
  }

  // ---------- B. Messagerie « Your teacher » (table prof_messages) ----------
  const id = String(body?.id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("bad id", { status: 400 });

  const { data: msg } = await admin.from("prof_messages").select("*").eq("id", id).maybeSingle();
  if (!msg || !msg.from_student || msg.auto) return new Response("skip", { status: 200 });
  const student: string = msg.student;

  const since = new Date(Date.now() - TEACHER_QUIET_MINUTES * 60_000).toISOString();
  const { count: manual } = await admin.from("prof_messages").select("id", { count: "exact", head: true })
    .eq("student", student).eq("from_student", false).eq("auto", false).gt("created_at", since);
  if ((manual ?? 0) > 0) return new Response("teacher active", { status: 200 });

  const dayStart = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count: autoToday } = await admin.from("prof_messages").select("id", { count: "exact", head: true })
    .eq("student", student).eq("auto", true).gt("created_at", dayStart);
  if ((autoToday ?? 0) >= DAILY_AUTO_LIMIT) return new Response("limit", { status: 200 });

  const { data: hist } = await admin.from("prof_messages").select("*").eq("student", student)
    .order("created_at", { ascending: false }).limit(20);
  const turns = (hist ?? []).reverse().map((t: any) => ({
    from_student: !!t.from_student,
    body: t.id === msg.id && t.att ? (t.body || "(The pupil sent a picture or a file.)") : String(t.body || ""),
  }));
  const contents = toContents(turns);

  // Photo ou capture d'écran du message (bucket privé « chat »)
  const att = msg.att as { k?: string; p?: string; t?: string } | null;
  if (att && att.k === "img" && att.p && /^image\/(jpeg|png|webp|gif)$/.test(att.t ?? "")) {
    const { data: file, error } = await admin.storage.from("chat").download(att.p);
    if (!error && file) {
      const b64 = toBase64(new Uint8Array(await file.arrayBuffer()));
      const lastUser = [...contents].reverse().find((c) => c.role === "user")!;
      lastUser.parts.push({ inline_data: { mime_type: att.t, data: b64 } });
    }
  }

  if (!Deno.env.get("GEMINI_API_KEY")) return new Response("no key", { status: 500 });
  const reply = await askGemini(contents);
  if (!reply) return new Response("no reply", { status: 502 });

  const { error: insErr } = await admin.from("prof_messages").insert({
    student, from_student: false, auto: true, body: reply.slice(0, 4000),
  });
  if (insErr) return new Response("insert failed: " + insErr.message, { status: 500 });
  return new Response("ok", { status: 200 });
});
