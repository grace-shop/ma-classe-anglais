// Publie dans « Posts » les nouvelles vidéos d'une chaîne YouTube.
// Appelée toutes les 30 min par .github/workflows/youtube.yml.
// Secrets à définir (Edge Functions → Secrets) :
//  YT_HANDLE        = @iliass1                  (ou YT_CHANNEL_ID = UC… si vous le connaissez)
//  YT_SYNC_SECRET   = une longue phrase au hasard (la même que dans GitHub → Secrets)
//  YT_AUTHOR_EMAIL  = (facultatif) e-mail du compte qui « publie » ; sinon l'e-mail du propriétaire (app_config.owner_email)
//  YT_AUTHOR_NAME   = (facultatif) nom affiché sur le post ; sinon « YouTube »
//  YT_MAX_PER_RUN   = (facultatif) nombre max de posts par passage (3 par défaut)
//  YT_BACKFILL      = (facultatif, pour tester) publier les N plus récentes vidéos au 1er passage (1 à 5)
//  YT_API_KEY       = (pour importer TOUTES les vidéos) clé « YouTube Data API v3 » de Google Cloud
//  YT_IMPORT_ALL    = 1 pour importer toute la chaîne (nécessite YT_API_KEY) ; à retirer ensuite
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

// Toutes les vidéos de la chaîne (playlist « Mises en ligne », 50 par page) via l'API YouTube Data.
async function allVideos(cid: string, key: string): Promise<Vid[]> {
  const out: Vid[] = [];
  let token = "";
  for (let i = 0; i < 40; i++) { // 40 pages x 50 = 2000 vidéos au maximum
    const u = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    u.searchParams.set("part", "snippet,contentDetails");
    u.searchParams.set("playlistId", "UU" + cid.slice(2));
    u.searchParams.set("maxResults", "50");
    u.searchParams.set("key", key);
    if (token) u.searchParams.set("pageToken", token);
    const r = await fetch(u);
    const j = await r.json();
    if (!r.ok) throw new Error("API YouTube : " + (j?.error?.message || r.status));
    for (const it of j.items || []) {
      const id = it?.contentDetails?.videoId || it?.snippet?.resourceId?.videoId;
      const title = String(it?.snippet?.title || "");
      if (!id || /^(Private|Deleted) video$/i.test(title)) continue;
      out.push({ id, title, published: it?.contentDetails?.videoPublishedAt || it?.snippet?.publishedAt || "", desc: "" });
    }
    token = j.nextPageToken || "";
    if (!token) break;
  }
  return out; // de la plus récente à la plus ancienne
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("YT_SYNC_SECRET") || "";
  if (!secret || req.headers.get("x-sync-secret") !== secret) return new Response("forbidden", { status: 403 });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const cid = await channelId();
    const importAll = Deno.env.get("YT_IMPORT_ALL") === "1";
    const apiKey = (Deno.env.get("YT_API_KEY") || "").trim();
    if (importAll && !apiKey) throw new Error("YT_IMPORT_ALL demande YT_API_KEY (clé YouTube Data API)");
    let chName = "";
    let vids: Vid[];
    if (apiKey) {
      vids = await allVideos(cid, apiKey);
      if (!importAll) vids = vids.slice(0, 15); // fonctionnement normal : seulement les plus récentes
    } else {
      const fr = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`, { headers: { "user-agent": UA } });
      if (!fr.ok) throw new Error("Flux YouTube indisponible (" + fr.status + ")");
      const parsed = parseFeed(await fr.text());
      chName = parsed.author;
      vids = parsed.vids;
    }
    if (!vids.length) return Response.json({ ok: true, posted: 0, note: "aucune vidéo trouvée" });

    const ids = vids.map((v) => v.id);
    const seen = new Set<string>();
    for (let i = 0; i < ids.length; i += 100) {
      const { data: rows } = await sb.from("yt_seen").select("video_id").in("video_id", ids.slice(i, i + 100));
      for (const r of rows || []) seen.add(r.video_id);
    }
    const { count } = await sb.from("yt_seen").select("video_id", { count: "exact", head: true }).eq("channel", cid);

    let fresh = vids.filter((v) => !seen.has(v.id)).reverse(); // de la plus ancienne à la plus récente
    // 1er passage : on note les vidéos existantes sans les publier (pour ne pas inonder « Posts »),
    // sauf les N plus récentes si le secret YT_BACKFILL = N (test : 1 à 5).
    if (!count && !importAll) {
      const back = Math.max(0, Math.min(5, Math.floor(+(Deno.env.get("YT_BACKFILL") || 0)) || 0));
      const old = vids.slice(back).map((v) => ({ video_id: v.id, channel: cid }));
      if (old.length) await sb.from("yt_seen").upsert(old, { onConflict: "video_id" });
      fresh = vids.slice(0, back).filter((v) => !seen.has(v.id)).reverse();
      if (!fresh.length) {
        return Response.json({ ok: true, posted: 0, note: "première synchronisation : " + vids.length + " vidéos existantes ignorées" });
      }
    }
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
    const max = Math.max(1, Math.min(importAll ? 100 : 10, +(Deno.env.get("YT_MAX_PER_RUN") || (importAll ? 40 : 3))));
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
