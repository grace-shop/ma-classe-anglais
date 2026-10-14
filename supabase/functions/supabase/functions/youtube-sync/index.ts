// Publie dans « Posts » les nouvelles vidéos d'une chaîne YouTube.
// Appelée toutes les 30 min par .github/workflows/youtube.yml.
// Secrets à définir (Edge Functions → Secrets) :
//  YT_HANDLE        = @iliass1                  (ou YT_CHANNEL_ID = UC… si vous le connaissez)
//  YT_SYNC_SECRET   = une longue phrase au hasard (la même que dans GitHub → Secrets)
//  YT_AUTHOR_EMAIL  = (facultatif) e-mail du compte qui « publie » ; sinon l'e-mail du propriétaire (app_config.owner_email)
//  YT_AUTHOR_NAME   = (facultatif) nom affiché sur le post ; sinon « YouTube »
//  YT_MAX_PER_RUN   = (facultatif) nombre max de posts par passage (3 par défaut)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const UA = "Mozilla/5.0 (compatible; EnglishClassesBot/1.0)";
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

async function channelId(): Promise<string> {
  const direct = (Deno.env.get("YT_CHANNEL_ID") || "").trim();
  if (/^UC[\w-]{22}$/.test(direct)) return direct;
  const handle = (Deno.env.get("YT_HANDLE") || "").trim().replace(/^@?/, "@");
  if (handle.length < 2) throw new Error("YT_HANDLE ou YT_CHANNEL_ID manquant");
  const r = await fetch(`https://www.youtube.com/${handle}`, {
    headers: { "user-agent": UA, "accept-language": "en", cookie: "CONSENT=YES+1; SOCS=CAI" },
  });
  const html = await r.text();
  const m = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
    html.match(/"channelId":"(UC[\w-]{22})"/) || html.match(/"externalId":"(UC[\w-]{22})"/);
  if (!m) throw new Error("Identifiant de chaîne introuvable : définissez YT_CHANNEL_ID");
  return m[1];
}

type Vid = { id: string; title: string; published: string; desc: string };
function parseFeed(xml: string): { author: string; vids: Vid[] } {
  const author = decode((xml.match(/<author>\s*<name>([^<]*)<\/name>/) || [, ""])[1] || "");
  const vids: Vid[] = [];
  for (const e of xml.split("<entry>").slice(1)) {
    const id = (e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
    if (!id) continue;
    vids.push({
      id,
      title: decode((e.match(/<title>([^<]*)<\/title>/) || [, ""])[1] || ""),
      published: (e.match(/<published>([^<]*)<\/published>/) || [, ""])[1] || "",
      desc: decode((e.match(/<media:description>([^<]*)<\/media:description>/) || [, ""])[1] || ""),
    });
  }
  return { author, vids };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("YT_SYNC_SECRET") || "";
  if (!secret || req.headers.get("x-sync-secret") !== secret) return new Response("forbidden", { status: 403 });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const cid = await channelId();
    const fr = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`, { headers: { "user-agent": UA } });
    if (!fr.ok) throw new Error("Flux YouTube indisponible (" + fr.status + ")");
    const { author: chName, vids } = parseFeed(await fr.text());
    if (!vids.length) return Response.json({ ok: true, posted: 0, note: "aucune vidéo dans le flux" });

    const ids = vids.map((v) => v.id);
    const { data: seenRows } = await sb.from("yt_seen").select("video_id").in("video_id", ids);
    const seen = new Set((seenRows || []).map((r) => r.video_id));
    const { count } = await sb.from("yt_seen").select("video_id", { count: "exact", head: true }).eq("channel", cid);

    // 1er passage : on note les vidéos existantes sans les publier (pour ne pas inonder « Posts »).
    if (!count) {
      await sb.from("yt_seen").upsert(ids.map((id) => ({ video_id: id, channel: cid })), { onConflict: "video_id" });
      return Response.json({ ok: true, posted: 0, note: "première synchronisation : " + ids.length + " vidéos existantes ignorées" });
    }

    const fresh = vids.filter((v) => !seen.has(v.id)).reverse(); // de la plus ancienne à la plus récente
    if (!fresh.length) return Response.json({ ok: true, posted: 0 });

    // compte qui « publie »
    let email = (Deno.env.get("YT_AUTHOR_EMAIL") || "").trim().toLowerCase();
    if (!email) {
      const { data } = await sb.from("app_config").select("value").eq("key", "owner_email").maybeSingle();
      email = String(data?.value || "").trim().toLowerCase();
    }
    let uid = "";
    for (let page = 1; page <= 10 && !uid; page++) {
      const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      uid = data.users.find((u) => (u.email || "").toLowerCase() === email)?.id || "";
    }
    if (!uid) throw new Error("Compte introuvable pour " + email + " : définissez YT_AUTHOR_EMAIL");

    const name = (Deno.env.get("YT_AUTHOR_NAME") || chName || "YouTube").slice(0, 60);
    const max = Math.max(1, Math.min(10, +(Deno.env.get("YT_MAX_PER_RUN") || 3)));
    let posted = 0;
    for (const v of fresh) {
      if (posted >= max) break; // les autres seront publiées au prochain passage
      const body = `🎬 New video: ${v.title}\nhttps://www.youtube.com/watch?v=${v.id}`.slice(0, 4000);
      const { data: post, error } = await sb.from("posts")
        .insert({ author: uid, who: { name, role: "teacher" }, body, media: null,
                  created_at: v.published || new Date().toISOString() })
        .select("id").single();
      if (error) throw new Error("Publication impossible : " + error.message);
      await sb.from("yt_seen").upsert({ video_id: v.id, channel: cid, post_id: post.id }, { onConflict: "video_id" });
      posted++;
    }
    return Response.json({ ok: true, posted, waiting: fresh.length - posted });
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error).message || e) }, { status: 500 });
  }
});
