/* =====================================================================
   v5 · camera icon in 3D (replaces the selfie icon everywhere) and the
   chat layout fix. Loads last, so its function declarations win.

   • camIcon3D(): a glossy 3D camera drawn in SVG (gradients, lens with
     a highlight, soft shadow). Used by every selfie button.
   • v4ChatLayout(): the old version decided on every page change whether
     the chat fills the screen, from heights that move as the page
     changes. So the chat jumped between full screen and normal layout.
     Now it decides once when a chat opens and keeps that mode until the
     chat closes or the screen gets wide. The chat's top edge follows the
     header and the blocks above it.
   ===================================================================== */

/* ---------- 3D camera icon ---------- */
let CAM3D_N=0;
function camIcon3D(cls){const g="cam3d"+(++CAM3D_N);
  return `<svg class="cam3d ${cls||""}" viewBox="0 0 48 48" aria-hidden="true"><defs>
    <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".42" stop-color="#C9D3FF"/><stop offset="1" stop-color="#5A67C4"/></linearGradient>
    <linearGradient id="${g}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EEF2FF"/><stop offset="1" stop-color="#7786DD"/></linearGradient>
    <radialGradient id="${g}l" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#9FFBEF"/><stop offset=".3" stop-color="#2D3E95"/><stop offset="1" stop-color="#060A1E"/></radialGradient>
    <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
    <filter id="${g}f" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#0B1030" flood-opacity=".5"/></filter>
  </defs>
  <g filter="url(#${g}f)">
    <path d="M16.5 13.5h9l2.3 3.2H34a4 4 0 0 1 4 4V33a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V20.7a4 4 0 0 1 4-4h2.5z" fill="url(#${g}t)"/>
    <rect x="8" y="16" width="32" height="22" rx="6" fill="url(#${g}b)"/>
    <circle cx="24" cy="27" r="8.6" fill="#0B1030"/>
    <circle cx="24" cy="27" r="7" fill="url(#${g}l)"/>
    <ellipse cx="21.1" cy="23.9" rx="2.3" ry="1.3" fill="#FFFFFF" opacity=".9" transform="rotate(-28 21.1 23.9)"/>
    <circle cx="34" cy="20.6" r="1.7" fill="#FDE68A"/>
  </g>
  <path d="M10.5 18.2h27" stroke="url(#${g}s)" stroke-width="1.5" stroke-linecap="round"/>
</svg>`}

/* ---------- chat layout: decided once per opened chat, not on every page change ---------- */
function v4ChatLayout(){const c=document.querySelector(".glass.chat"),B=document.body;
  const on=!!c&&innerWidth<=900&&!document.getElementById("docv");
  const was=B.classList.contains("v4chat");
  if(on){
    if(!was&&scrollY>0)scrollTo(0,0);
    const hd=document.querySelector("header.top"),hb=hd?hd.getBoundingClientRect().bottom:0;
    const vh=window.visualViewport?visualViewport.height:innerHeight;
    let b=hb;for(const el of c.parentElement.children){if(el===c)break;const r=el.getBoundingClientRect();if(r.height)b=Math.max(b,r.bottom)}
    V4.maxVH=Math.max(V4.maxVH||0,vh);
    const kb=B.classList.contains("v4kb")&&vh<V4.maxVH*0.8;
    const top=kb?hb+4:Math.min(b+8,vh*0.42);
    document.documentElement.style.setProperty("--v4ct",Math.round(top)+"px");
    if(!was){const cs=document.getElementById("chatScroll");if(cs)cs.scrollTop=cs.scrollHeight}
  }
  B.classList.toggle("v4chat",on)}

/* ---------- styles ---------- */
{const st=document.createElement("style");st.id="zzcamchat";st.textContent=`
/* the 3D camera sits well in every button and orb */
.cam3d{display:block;width:1.2em;height:1.2em;margin:auto;flex:none;overflow:visible}
.iconbtn .cam3d{width:26px;height:26px}
.md-tool .cam3d{width:24px;height:24px;margin:0 auto 2px}
.zt-orb .cam3d,.zc-orb .cam3d,.sx-tool-ic .cam3d{width:58%;height:58%}
.sx-tool-ic{display:grid;place-items:center}

/* the 3D backdrop is hidden while a conversation is open: the header and the messages stay clean */
body.v4chat #bg3d{display:none}
body.v4chat .ar-fab{display:none!important}
`;document.head.appendChild(st)}
