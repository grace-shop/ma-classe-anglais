/* =====================================================================
   v5 · Glass interface with glowing edges and 3D motion.
   - Cards are frosted glass; a slow light ring travels round every edge.
   - Cards tilt in 3D under the pointer (desktop) and lift on hover.
   - Background: slow aurora plus a 3D perspective grid under the content.
   - Buttons and the active tab glow. Everything respects reduced motion.
   Works with every theme: colours come from the theme variables.
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzlglass")) return;
  var st = document.createElement("style");
  st.id = "zzzzlglass";
  st.textContent = `
@property --zzang{syntax:'<angle>';initial-value:0deg;inherits:false}
@property --zzx{syntax:'<percentage>';initial-value:50%;inherits:false}

/* ---- glass cards with a glowing, travelling edge ---- */
.glass{position:relative;isolation:isolate;background:linear-gradient(150deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 55%,rgba(255,255,255,.08)),var(--glass-bg)!important;backdrop-filter:blur(24px) saturate(170%)!important;-webkit-backdrop-filter:blur(24px) saturate(170%)!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(255,255,255,.04),0 28px 60px -26px rgba(4,6,20,.65)!important;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s ease,border-color .45s ease}
.glass::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;background:conic-gradient(from var(--zzang),transparent 0deg,#7DF7D2 40deg,#5BD2FF 85deg,#9A7CFF 130deg,#FF9AE6 170deg,transparent 215deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);pointer-events:none;z-index:-1;opacity:.85;animation:zzEdge 7s linear infinite}
.glass::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;background:radial-gradient(160px 120px at var(--zzx,50%) 0%,rgba(255,255,255,.22),transparent 70%);opacity:0;transition:opacity .4s ease}
.glass:hover{border-color:rgba(160,190,255,.42)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 0 0 1px rgba(140,170,255,.18),0 0 38px -6px rgba(110,140,255,.55),0 34px 70px -28px rgba(4,6,20,.7)!important}
.glass:hover::after{opacity:1}
.glass.zz-tilt{transform:perspective(1000px) rotateX(var(--zzrx,0deg)) rotateY(var(--zzry,0deg)) translateZ(0)}
@keyframes zzEdge{to{--zzang:360deg}}

/* ---- glowing buttons ---- */
.btn{position:relative;overflow:hidden;transition:transform .25s ease,box-shadow .35s ease,filter .25s ease!important}
.btn:hover{box-shadow:0 0 0 1px rgba(160,190,255,.35),0 10px 30px -8px rgba(110,140,255,.7)!important;transform:translateY(-1px)}
.btn::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);pointer-events:none}
.btn:hover::after{animation:zzShine .9s ease}
@keyframes zzShine{to{left:130%}}

/* ---- navigation: glowing active item ---- */
nav.tabs button[aria-current="true"]{box-shadow:0 0 0 1px rgba(170,200,255,.4),0 0 22px -4px rgba(120,150,255,.8)!important}

/* ---- aurora background and a 3D perspective floor ---- */
body::before{content:"";position:fixed;inset:-20%;z-index:-2;pointer-events:none;background:radial-gradient(40% 30% at 20% 20%,rgba(110,128,255,.22),transparent 70%),radial-gradient(35% 28% at 85% 30%,rgba(91,210,255,.18),transparent 70%),radial-gradient(45% 35% at 60% 90%,rgba(255,154,230,.14),transparent 70%);filter:blur(30px);animation:zzAurora 26s ease-in-out infinite alternate}
@keyframes zzAurora{to{transform:translate3d(4%,-3%,0) scale(1.06) rotate(2deg)}}
body::after{content:"";position:fixed;left:-30%;right:-30%;bottom:-8%;height:46vh;z-index:-1;pointer-events:none;background-image:linear-gradient(rgba(140,160,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(140,160,255,.22) 1px,transparent 1px);background-size:56px 56px;transform:perspective(520px) rotateX(64deg);transform-origin:50% 100%;-webkit-mask-image:linear-gradient(transparent,#000 60%);mask-image:linear-gradient(transparent,#000 60%);opacity:.5;animation:zzGrid 16s linear infinite}
@keyframes zzGrid{to{background-position:0 56px,56px 0}}

/* ---- headers and bars: glass with a light edge ---- */
header.top,nav.tabs{backdrop-filter:blur(24px) saturate(170%)!important;-webkit-backdrop-filter:blur(24px) saturate(170%)!important;border-color:rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 20px 50px -22px rgba(4,6,20,.7)!important}

@media (prefers-reduced-motion:reduce){
  .glass::before,body::before,body::after,.btn:hover::after{animation:none!important}
  .glass,.glass.zz-tilt{transform:none!important;transition:none!important}
}
@media (hover:none){.glass.zz-tilt{transform:none!important}}
`;
  document.head.appendChild(st);

  // 3D tilt under the pointer (fine pointers only); the light follows the pointer.
  var fine = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fine && !reduce) {
    var cur = null;
    document.addEventListener("pointermove", function (e) {
      var el = e.target && e.target.closest && e.target.closest(".glass");
      if (cur && cur !== el) { cur.classList.remove("zz-tilt"); cur.style.removeProperty("--zzrx"); cur.style.removeProperty("--zzry"); }
      if (!el) { cur = null; return; }
      cur = el;
      el.classList.add("zz-tilt");
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--zzrx", ((0.5 - py) * 7).toFixed(2) + "deg");
      el.style.setProperty("--zzry", ((px - 0.5) * 9).toFixed(2) + "deg");
      el.style.setProperty("--zzx", (px * 100).toFixed(1) + "%");
    }, { passive: true });
    document.addEventListener("pointerleave", function () {
      if (cur) { cur.classList.remove("zz-tilt"); cur = null; }
    }, true);
  }
})();
