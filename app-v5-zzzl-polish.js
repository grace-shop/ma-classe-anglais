/* =====================================================================
   v5 · Finition : en-tête sans chevauchement, Sakura plus belle,
   effets magiques discrets (étoiles, éclat sur les boutons).
   Tout est désactivé en économie d'énergie.
   ===================================================================== */
function masSVG(){
  const g="zz"+Math.floor(Math.random()*1e6);
  return `<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${g}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FDE68A" stop-opacity=".55"/><stop offset="1" stop-color="#F472B6" stop-opacity="0"/></radialGradient>
    <linearGradient id="${g}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F7A"/><stop offset="1" stop-color="#14183A"/></linearGradient>
    <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1E6"/><stop offset="1" stop-color="#F7CDB4"/></linearGradient>
    <linearGradient id="${g}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#818CF8"/><stop offset="1" stop-color="#4338CA"/></linearGradient>
    <linearGradient id="${g}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#E11D48"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="72" rx="58" ry="66" fill="url(#${g}h)"/>
  <ellipse cx="60" cy="146" rx="30" ry="4" fill="#000" opacity=".25"/>
  <path d="M28 66c-5-28 12-48 32-48s37 20 32 48c0 16 4 28 9 38-11-2-17-9-19-17H38c-2 8-8 15-19 17 5-10 9-22 9-38z" fill="url(#${g}r)"/>
  <path d="M34 60c-2-16 8-30 26-30 6 0 12 2 16 5" stroke="#fff" stroke-opacity=".28" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M26 102c4 28 14 44 34 44s30-16 34-44z" fill="#14183A" opacity=".35"/>
  <ellipse cx="60" cy="66" rx="28" ry="29" fill="url(#${g}s)"/>
  <path d="M31 60c3-17 15-26 30-26 11 0 20 6 24 16-8-4-17-3-24 2-7-3-16-2-30 8z" fill="url(#${g}r)"/>
  <path d="M46 40c4 3 7 4 13 4" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g class="ey-o"><ellipse cx="49" cy="68" rx="4.6" ry="6" fill="#14183A"/><ellipse cx="71" cy="68" rx="4.6" ry="6" fill="#14183A"/><circle cx="50.8" cy="66" r="2" fill="#fff"/><circle cx="72.8" cy="66" r="2" fill="#fff"/><circle cx="48" cy="70" r=".9" fill="#A5F3FC"/><circle cx="70" cy="70" r=".9" fill="#A5F3FC"/></g>
  <g class="ey-h" stroke="#14183A" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M44 69q5-6 10 0"/><path d="M66 69q5-6 10 0"/></g>
  <ellipse cx="40" cy="80" rx="5.5" ry="3.2" fill="#F9A8D4" opacity=".8"/><ellipse cx="80" cy="80" rx="5.5" ry="3.2" fill="#F9A8D4" opacity=".8"/>
  <path class="mo-s" d="M54 80q6 5 12 0" stroke="#9F1239" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="mo-h" d="M52 79h16q-1 9-8 9t-8-9z" fill="url(#${g}k)"/>
  <path class="mo-f" d="M54 84q6-5 12 0" stroke="#9F1239" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="drop" d="M92 44q-5 8-5 12a5 5 0 0 0 10 0q0-4-5-12z" fill="#7DD3FC"/>
  <path class="uni" d="M41 99q19-9 38 0l7 41H34z" fill="url(#${g}d)"/>
  <path d="M48 99l12 13 12-13" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/>
  <path d="M60 104l-8-4v9zM60 104l8-4v9z" fill="#F472B6"/>
  <g class="arms" fill="none" stroke="url(#${g}s)" stroke-width="7" stroke-linecap="round"><path d="M42 106q-14-8-16-36"/><path d="M78 106q14-8 16-36"/></g>
  <g class="spk"><path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FBBF24"/><path d="M104 24l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#F472B6"/><path d="M108 70l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#A5F3FC"/></g>
</svg>`}
/* une Sakura déjà affichée garde son ancien dessin : on la rafraîchit au prochain affichage */
{const _ms=masShow;masShow=function(text,mood){const b=document.getElementById("mas");if(b&&!b.dataset.v2){const g=b.querySelector(".mas-girl");if(g)g.innerHTML=masSVG();b.dataset.v2="1"}return _ms.apply(this,arguments)}}

{const st=document.createElement("style");st.id="zzzlpolish";st.textContent=`
/* en-tête : le logo garde sa place, les boutons défilent à droite au lieu de passer dessus */
@media (max-width:480px){
  header.top{display:flex!important;align-items:center;gap:8px;flex-wrap:nowrap}
  .brand{flex:0 0 auto}
  .hdr-right{flex:1 1 0!important;min-width:0!important;flex-wrap:nowrap!important;justify-content:flex-start!important;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:4px 2px;margin-left:4px}
  .hdr-right::-webkit-scrollbar{display:none}
  .hdr-right>*{flex:none}
}
/* effets magiques discrets */
.mg-star{position:fixed;pointer-events:none;z-index:1;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(165,243,252,.8);animation:mgTw var(--d,6s) ease-in-out infinite;animation-delay:var(--dl,0s);opacity:0}
@keyframes mgTw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:.9;transform:scale(1)}}
.logo{position:relative;overflow:hidden}
.logo::after{content:"";position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.45) 50%,transparent 60%);transform:translateX(-100%);animation:mgShine 5.5s ease-in-out infinite}
@keyframes mgShine{0%,60%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.btn:not(.ghost):not(:disabled){box-shadow:0 8px 22px -8px rgba(94,234,212,.55)}
.btn:not(.ghost):not(:disabled):hover{box-shadow:0 12px 28px -8px rgba(94,234,212,.75)}
:root[data-lite="1"] .mg-star,:root[data-lite="1"] .logo::after{display:none!important;animation:none!important}
`;document.head.appendChild(st)}

/* quelques étoiles qui scintillent en fond (pas en économie d'énergie) */
{const addStars=()=>{
  if(document.documentElement.getAttribute("data-lite")==="1"||document.querySelector(".mg-star")) return;
  if(matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for(let i=0;i<14;i++){const s=document.createElement("i");s.className="mg-star";
    s.style.left=(Math.random()*100)+"vw";s.style.top=(Math.random()*100)+"vh";
    s.style.setProperty("--d",(4+Math.random()*5)+"s");s.style.setProperty("--dl",(-Math.random()*6)+"s");
    document.body.appendChild(s)}
};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",addStars); else addStars();
}
