/* =====================================================================
   v5 · future look, whole app (loads after the feature files, before
   the nuit theme): a slow aurora behind every screen, depth and a soft
   3D tilt on cards when a mouse hovers, light sheen across buttons,
   glowing icon buttons, gentle entrances, and a shimmer on gradient
   titles. Only CSS is added: no markup or data changes. Motion stops
   for people who ask for reduced motion.
   ===================================================================== */
{const st=document.createElement("style");st.id="zzfuturecss";st.textContent=`
@property --zf-a{syntax:'<angle>';inherits:false;initial-value:0deg}

/* ---------- ambient aurora behind every screen ---------- */
body::before{content:"";position:fixed;inset:-20%;z-index:-1;pointer-events:none;
  background:
    radial-gradient(38% 32% at 18% 22%,rgba(94,234,212,.20),transparent 70%),
    radial-gradient(36% 30% at 84% 68%,rgba(129,140,248,.22),transparent 70%),
    radial-gradient(28% 24% at 62% 8%,rgba(244,114,182,.13),transparent 70%);
  filter:blur(12px);animation:zfDrift 24s ease-in-out infinite alternate}
@keyframes zfDrift{from{transform:translate3d(-2%,-1%,0) scale(1)}to{transform:translate3d(2%,2%,0) scale(1.07) rotate(2deg)}}

/* ---------- glass cards with depth and a 3D tilt on hover ---------- */
.glass.card,.card{transform-style:preserve-3d;transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s,border-color .45s}
@media (hover:hover){
  .glass.card:hover,.card:hover{transform:perspective(900px) rotateX(2.2deg) rotateY(-1.4deg) translateY(-3px);
    box-shadow:0 28px 50px -24px rgba(0,0,0,.45),0 0 0 1px rgba(94,234,212,.16),inset 0 1px 0 rgba(255,255,255,.14)}
}
.glass.card:active,.card:active{transform:scale(.99)}

/* ---------- buttons: a sheen sweeps across on press and hover ---------- */
.btn{position:relative;overflow:hidden;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .35s,filter .3s}
.btn::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.38) 50%,transparent 65%);
  transform:translateX(-120%);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
@media (hover:hover){.btn:not(:disabled):hover::after{transform:translateX(120%)}}
.btn:not(:disabled):active{transform:translateY(1px) scale(.97)}
.btn:not(:disabled):hover{box-shadow:0 14px 30px -14px rgba(94,234,212,.7)}

/* ---------- icon buttons glow a little when touched ---------- */
.iconbtn{transition:transform .2s,box-shadow .3s,background .3s}
.iconbtn:active{transform:scale(.9)}
@media (hover:hover){.iconbtn:hover{box-shadow:0 0 0 1px rgba(94,234,212,.35),0 10px 24px -12px rgba(94,234,212,.8)}}

/* ---------- chips and stats float softly ---------- */
.chip{backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.glass.kpi{transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
@media (hover:hover){.glass.kpi:hover{transform:translateY(-2px) scale(1.01)}}

/* ---------- gradient titles shimmer ---------- */
@keyframes zfShine{from{background-position:0% 50%}to{background-position:200% 50%}}
.gradtext{background-size:200% auto;animation:zfShine 9s linear infinite}

/* ---------- entrances: sections rise in one after another ---------- */
@keyframes zfRise{from{opacity:0;transform:translateY(12px) scale(.99)}to{opacity:1;transform:none}}
.section,.glass.list,.glass.kpi{animation:zfRise .55s cubic-bezier(.2,.8,.2,1) both}
.section:nth-of-type(2){animation-delay:.05s}.section:nth-of-type(3){animation-delay:.1s}.section:nth-of-type(4){animation-delay:.15s}

/* ---------- bottom dock: the tapped tab presses in ---------- */
nav.tabs button{transition:transform .2s,color .25s,background .3s}
nav.tabs button:active{transform:scale(.9)}

/* ---------- arena and battles share the same depth ---------- */
#arena .ar-mode,#arena .ar-opt,#arena .ar-card{transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s}
#arena .ar-mode:active,#arena .ar-opt:active{transform:scale(.97)}

@media (prefers-reduced-motion:reduce){
  body::before,.gradtext,.section,.glass.list,.glass.kpi{animation:none!important}
  .glass.card,.card,.btn,.iconbtn,.glass.kpi,nav.tabs button{transition:none!important}
  .glass.card:hover,.card:hover,.glass.kpi:hover{transform:none!important}
}
`;document.head.appendChild(st)}
