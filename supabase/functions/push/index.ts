// Envoie une notification push (Firebase Cloud Messaging) pour :
//  • un nouveau message entre élèves (table peer_messages)
//  • un appel qui sonne (table call_signals, kind = 'ring')
// Appelée par un « Database Webhook » de Supabase (tables peer_messages, call_signals et notifications). Secrets à définir :
//  FIREBASE_SERVICE_ACCOUNT = contenu complet du fichier JSON de la clé de service
//  PUSH_WEBHOOK_SECRET      = une longue phrase au hasard (la même que dans le webhook)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const b64urlText = (s: string) => b64url(enc.encode(s));

let cached: { token: string; exp: number } | null = null;
async function googleToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64urlText(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const pem = String(sa.private_key || "").replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${head}.${claim}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${head}.${claim}.${b64url(sig)}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("google token: " + JSON.stringify(j));
  cached = { token: j.access_token, exp: Date.now() + 3500_000 };
  return cached.token;
}

const PUSH_TEXT: Record<string, string> = {
  msg: "New message from a classmate",
  story_reply: "Someone replied to your story",
  comment: "Someone commented on your post",
  like: "Someone reacted to your post",
  share: "Someone shared your post",
  story_like: "Someone reacted to your story",
  tmsg: "New message from your teacher",
  smsg: "New message",
  staff: "New message from the school",
  report: "Something needs your attention",
  challenge: "New English challenge: come and answer!",
  friend_req: "A classmate wants to be your friend",
  friend_ok: "Your friend request was accepted",
};

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("PUSH_WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const rec = body.record || {};
  let uids: string[] = [];
  let text = "";
  let kind = "";
  if (body.table === "peer_messages" && body.type === "INSERT" && rec.receiver) {
    uids = [rec.receiver];
    text = "New message from a classmate";   // le texte reste privé sur l'écran verrouillé
    kind = "message";
  } else if (body.table === "game_matches" && body.type === "INSERT" && rec.status === "invited" && rec.guest) {
    // invitation a une partie : previent l'invite (texte sans detail sur l'ecran verrouille)
    uids = [rec.guest];
    text = "You have a game invitation";
    kind = "game";
  } else if (body.table === "call_signals" && body.type === "INSERT" && rec.kind === "ring" && rec.to_uid) {
    uids = [rec.to_uid];
    text = "Incoming call";
    kind = "call";
  } else if (body.table === "notifications" && body.type === "INSERT" && rec.uid && rec.kind === "game") {
    // l'invitation de jeu est déjà notifiée par la table game_matches : pas de deuxième notification
    return new Response("ignored");
  } else if (body.table === "notifications" && body.type === "INSERT" && rec.uid) {
    // tout ce qui apparaît dans la cloche de la Communauté (commentaires, j'aime, défis…)
    uids = [rec.uid];
    text = PUSH_TEXT[rec.kind] || "You have a new notification";  // texte générique : rien de privé sur l'écran verrouillé
    kind = String(rec.kind || "");
  } else {
    return new Response("ignored");
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows } = await sb.from("push_tokens").select("token").in("uid", uids);
  if (!rows || !rows.length) return new Response("no device");

  const access = await googleToken();
  const project = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}").project_id;
  let sent = 0;
  for (const { token } of rows) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${access}` },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: "English Classes", body: text },
          data: { kind },
          android: { priority: "HIGH", notification: { channel_id: "default" } },
        },
      }),
    });
    if (r.ok) sent++;
    else {
      const err = await r.text();
      // appareil désinstallé ou jeton périmé : on le supprime
      if (err.includes("UNREGISTERED") || err.includes("INVALID_ARGUMENT")) {
        await sb.from("push_tokens").delete().eq("token", token);
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { "content-type": "application/json" } });
});
