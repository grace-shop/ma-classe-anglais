/* =====================================================================
   v5 · Les vidéos YouTube publiées automatiquement dans « Posts »
   (voir supabase/functions/youtube-sync). Un post dont le texte contient un lien
   YouTube affiche la miniature de la vidéo ; un appui ouvre la vidéo sur YouTube.
   ===================================================================== */
{const _fp=fPostHTML;
  fPostHTML=function(p){const h=_fp(p);
    if(!p||p.deleted_at)return h;
    const m=String(p.body||"").match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^\s&]*&)*v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if(!m)return h;
    const id=m[1];
    const card=`<a class="yt-card" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer" aria-label="Watch this video on YouTube"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="yt-play" aria-hidden="true"></span><span class="yt-label">Watch on YouTube</span></a>`;
    return h.replace('<div class="fcount">',card+'<div class="fcount">')}}
{const st=document.createElement("style");st.id="zzziyoutube";st.textContent=`
.yt-card{position:relative;display:block;width:100%;max-width:100%;box-sizing:border-box;aspect-ratio:16/9;margin:8px 0;border-radius:14px;overflow:hidden;background:#000;text-decoration:none}
.yt-card img{width:100%;height:100%;object-fit:cover;display:block}
.yt-play{position:absolute;left:50%;top:50%;width:64px;height:44px;margin:-22px 0 0 -32px;border-radius:12px;background:#E11D48;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.yt-play::after{content:"";position:absolute;left:26px;top:13px;border-left:16px solid #fff;border-top:9px solid transparent;border-bottom:9px solid transparent}
.yt-label{position:absolute;left:10px;bottom:8px;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font:700 .78rem/1.3 system-ui,sans-serif}
`;document.head.appendChild(st)}
