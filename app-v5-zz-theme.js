/* =====================================================================
   v5 · theme finish (loads last): a futuristic, calm, polished look for
   the dark "nuit" skin, with cleaner bars, glowing controls, glass cards,
   a floating bottom dock, and gentle motion. Only styles are added here:
   no markup or data changes. Reduced motion is respected.
   ===================================================================== */
{const st=document.createElement("style");st.id="zzthemecss";st.textContent=`
/* ---------- everywhere: calm focus, smooth taps, safe top ---------- */
:focus-visible{outline:2px solid #5EEAD4;outline-offset:3px;border-radius:12px}
button,a,[role="button"]{-webkit-tap-highlight-color:transparent}
header.top{padding-top:calc(env(safe-area-inset-top,0px) + 6px)}

/* ---------- nuit: the space look ---------- */
:root[data-skin="nuit"]{--zz-glow:rgba(94,234,212,.55);--zz-violet:#818CF8;--zz-rim:linear-gradient(135deg,rgba(94,234,212,.55),rgba(129,140,248,.2) 45%,rgba(244,114,182,.35))}
:root[data-skin="nuit"] body{background:radial-gradient(120% 70% at 50% -12%,#1C2358 0%,#0C0F22 48%,#070913 100%) fixed!important}

/* top bar: one glass strip, controls in a row with equal height */
:root[data-skin="nuit"] header.top{background:linear-gradient(180deg,rgba(12,15,34,.92),rgba(12,15,34,.62));backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);border-bottom:1px solid transparent;background-clip:padding-box;position:relative}
:root[data-skin="nuit"] header.top::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(94,234,212,.7),rgba(129,140,248,.7),transparent);opacity:.8}
:root[data-skin="nuit"] header.top .iconbtn,:root[data-skin="nuit"] header.top button{transition:transform .2s,box-shadow .25s,background .25s}
:root[data-skin="nuit"] header.top button:hover{transform:translateY(-1px);box-shadow:0 0 0 1px rgba(94,234,212,.35),0 8px 22px -10px rgba(94,234,212,.7)}
:root[data-skin="nuit"] header.top button:active{transform:scale(.94)}

/* bottom dock: a floating glass capsule with a glowing active pill */
@media (max-width:760px){
  :root[data-skin="nuit"] nav.tabs{left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom,0px));border-radius:26px;padding:8px 8px;background:linear-gradient(180deg,rgba(24,29,64,.82),rgba(10,12,28,.92));backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);border:1px solid rgba(160,172,255,.16);box-shadow:0 24px 50px -16px rgba(0,0,0,.85),0 0 0 1px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.08)}
  :root[data-skin="nuit"] nav.tabs button{border-radius:18px;padding:8px 2px 7px;color:#9AA3C7;transition:color .25s,background .3s,transform .2s}
  :root[data-skin="nuit"] nav.tabs button svg{filter:drop-shadow(0 0 0 transparent);transition:filter .3s,transform .3s}
  :root[data-skin="nuit"] nav.tabs button[aria-current="true"]{color:#06201C;background:linear-gradient(135deg,#8EF6E4,#5EEAD4 40%,#818CF8);box-shadow:0 10px 24px -8px rgba(94,234,212,.85),inset 0 1px 0 rgba(255,255,255,.55)}
  :root[data-skin="nuit"] nav.tabs button[aria-current="true"] svg{transform:translateY(-1px) scale(1.08);filter:drop-shadow(0 2px 4px rgba(6,32,28,.35))}
  :root[data-skin="nuit"] nav.tabs button:active{transform:scale(.94)}
}

/* cards: glass with a light rim, a little lift on hover */
:root[data-skin="nuit"] .card,:root[data-skin="nuit"] .glass,:root[data-skin="nuit"] .fcard,:root[data-skin="nuit"] .sn-card{background:linear-gradient(180deg,rgba(201,211,255,.07),rgba(201,211,255,.01) 40%),rgba(18,22,48,.72);border:1px solid rgba(160,172,255,.14);box-shadow:0 18px 40px -22px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .3s}
:root[data-skin="nuit"] .fcard:hover,:root[data-skin="nuit"] .sn-card:hover{border-color:rgba(94,234,212,.32);transform:translateY(-2px);box-shadow:0 24px 50px -22px rgba(0,0,0,.9),0 0 0 1px rgba(94,234,212,.12)}

/* buttons: one gradient for the main action, glass for the rest */
:root[data-skin="nuit"] .btn:not(.ghost):not(:disabled){background:linear-gradient(120deg,#5EEAD4 0%,#B8FFF2 35%,#818CF8 80%);color:#06201C;font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 14px 28px -14px rgba(94,234,212,.9);border:0;transition:transform .2s,box-shadow .3s,filter .3s}
:root[data-skin="nuit"] .btn:not(.ghost):not(:disabled):hover{transform:translateY(-1px);filter:saturate(1.1) brightness(1.04)}
:root[data-skin="nuit"] .btn:not(.ghost):not(:disabled):active{transform:translateY(1px) scale(.99)}
:root[data-skin="nuit"] .btn.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(160,172,255,.2);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}

/* the "Community" heading block reads as a hero */
:root[data-skin="nuit"] .eyebrow,:root[data-skin="nuit"] .sn-eyebrow{letter-spacing:.22em;color:#9FB4FF}
:root[data-skin="nuit"] h1,:root[data-skin="nuit"] h2{text-shadow:0 2px 24px rgba(129,140,248,.18)}

/* motion: views settle in softly */
@keyframes zzRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
:root[data-skin="nuit"] main>section,:root[data-skin="nuit"] .view{animation:zzRise .5s cubic-bezier(.2,.8,.2,1) backwards}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;document.head.appendChild(st)}
