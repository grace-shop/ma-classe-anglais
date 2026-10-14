/* =====================================================================
   v5 · Les vidéos YouTube publiées automatiquement dans « Posts »
   (voir supabase/functions/youtube-sync). Un post dont le texte contient un lien
   YouTube affiche la miniature de la vidéo ; un appui la lit ici, dans l'application
   (lecteur intégré, sans quitter l'application).
   ===================================================================== */
const YT_RE=/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^\s&]*&)*v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})[^\s]*/;
{const _fp=fPostHTML;
  fPostHTML=function(p){
    if(!p||p.deleted_at)return _fp(p);
    const m=String(p.body||"").match(YT_RE);
    if(!m)return _fp(p);
    const id=m[1];
    /* le lien brut n'est pas affiché : seule la vidéo l'est */
    const h=_fp(Object.assign({},p,{body:String(p.body).replace(new RegExp(YT_RE.source,"g"),"").trim()}));
    const card=`<button type="button" class="yt-card" data-yt="${id}" aria-label="Play this video"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="yt-play" aria-hidden="true"></span></button>`;
    return h.replace('<div class="fcount">',card+'<div class="fcount">')}}
document.addEventListener("click",e=>{
  const b=e.target&&e.target.closest&&e.target.closest("button.yt-card[data-yt]");if(!b)return;
  e.preventDefault();e.stopPropagation();
  const id=b.dataset.yt;if(!/^[\w-]{11}$/.test(id))return;
  const box=document.createElement("div");box.className="yt-card yt-on";
  box.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  b.replaceWith(box)},true);
{const st=document.createElement("style");st.id="zzziyoutube";st.textContent=`
.yt-card{position:relative;display:block;width:100%;max-width:100%;box-sizing:border-box;aspect-ratio:16/9;margin:8px 0;padding:0;border:0;border-radius:14px;overflow:hidden;background:#000;cursor:pointer}
.yt-card img{width:100%;height:100%;object-fit:cover;display:block}
.yt-card iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.yt-card.yt-on{cursor:auto}
.yt-play{position:absolute;left:50%;top:50%;width:64px;height:44px;margin:-22px 0 0 -32px;border-radius:12px;background:#E11D48;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.yt-play::after{content:"";position:absolute;left:26px;top:13px;border-left:16px solid #fff;border-top:9px solid transparent;border-bottom:9px solid transparent}
`;document.head.appendChild(st)}
