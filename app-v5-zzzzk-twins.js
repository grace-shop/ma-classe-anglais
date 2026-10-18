/* =====================================================================
   v5 · Sign-in card, a twin of the reference video.
   Proportions and sizes are set relative to the card width (cqi), so the
   same design appears at every size. In portrait the two panels stack.
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzktwins")) return;
  var st = document.createElement("style");
  st.id = "zzzzktwins";
  st.textContent = `
#authGate.cream{background:#F0EFEA!important;display:flex!important;flex-direction:column;align-items:center;justify-content:safe center;padding:max(18px,env(safe-area-inset-top,0px)) 14px 22px!important;overflow:auto;box-sizing:border-box;font-family:Montserrat,Manrope,system-ui,sans-serif;color:#1F2430}
#authGate.cream .lg{width:min(660px,100%);display:grid;gap:14px;justify-items:center;padding:0;margin:0}
#authGate.cream .cr-top{display:grid;justify-items:center;gap:6px;text-align:center}
#authGate.cream .lg-logo{width:52px;height:52px;border-radius:16px;overflow:hidden;display:grid;place-items:center;box-shadow:5px 5px 12px #cdcac0,-5px -5px 12px #fff}
#authGate.cream .lg-brand{font:700 .7rem/1 Montserrat,Manrope,system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#7C7A72}
#authGate.cream .cr-title{margin:6px 0 0;font:italic 400 2.6rem/1.05 "Instrument Serif",Georgia,serif;color:#1E1E1E}

/* the card: same ratio and proportions as the reference */
#authGate.cream .tw{position:relative;width:100%;aspect-ratio:1.68;container-type:inline-size;display:grid;grid-template-columns:1fr 1fr;border-radius:4.2cqi;background:#F0EFEA;box-shadow:1.4cqi 1.4cqi 3.4cqi #CBC8BD,-1.4cqi -1.4cqi 3.4cqi #FFFFFF;overflow:hidden;box-sizing:border-box}
#authGate.cream .tw-p{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;padding:6cqi 7cqi;box-sizing:border-box;overflow:hidden;background:#F0EFEA}
#authGate.cream .tw-form-p{background:#F0EFEA}
#authGate.cream .tw-info-p{background:#F0EFEA}
#authGate.cream .tw-info-p::before{content:"";position:absolute;width:54cqi;height:54cqi;border-radius:50%;right:-18cqi;top:-26cqi;background:#F0EFEA;box-shadow:inset 1.1cqi 1.1cqi 2.4cqi #D3D0C5,inset -1.1cqi -1.1cqi 2.4cqi #FFFFFF}
#authGate.cream .tw-info-p::after{content:"";position:absolute;width:56cqi;height:56cqi;border-radius:50%;left:-26cqi;bottom:-30cqi;background:#F0EFEA;box-shadow:inset 1.1cqi 1.1cqi 2.4cqi #D3D0C5,inset -1.1cqi -1.1cqi 2.4cqi #FFFFFF}
#authGate.cream .tw-form-p>*,#authGate.cream .tw-info-p>*{position:relative;z-index:1}
#authGate.cream .tw h3,#authGate.cream .tw h2{margin:0 0 3.2cqi;font:800 3.6cqi/1.1 Montserrat,Manrope,system-ui,sans-serif;color:#1E2430;letter-spacing:-.005em}
#authGate.cream .tw-info-p h2{margin-bottom:2.4cqi}
#authGate.cream .tw p{margin:0 0 4cqi;max-width:64%;font:500 1.55cqi/1.55 Montserrat,Manrope,system-ui,sans-serif;color:#4A4F5C}
#authGate.cream .tw-form{display:grid;justify-items:center;gap:2.6cqi;width:100%;margin:0}
#authGate.cream .tw input{width:72%;box-sizing:border-box;height:6.2cqi;padding:0 3.4cqi;margin:0;border:0;border-radius:3.2cqi;background:#F0EFEA;font:500 1.6cqi Montserrat,Manrope,system-ui,sans-serif;color:#1F2430;box-shadow:inset .6cqi .6cqi 1.4cqi #D0CDC2,inset -.6cqi -.6cqi 1.4cqi #FFFFFF}
#authGate.cream .tw input::placeholder{color:#9A978D;font-weight:500}
#authGate.cream .tw input:focus{outline:none;box-shadow:inset .6cqi .6cqi 1.4cqi #D0CDC2,inset -.6cqi -.6cqi 1.4cqi #FFFFFF,0 0 0 .3cqi rgba(31,36,48,.35)}
#authGate.cream .tw .tw-pw{position:relative;display:block;width:72%}
#authGate.cream .tw .tw-pw input{width:100%;padding-right:7cqi}
#authGate.cream .tw .tw-eye{position:absolute;right:1.6cqi;top:50%;transform:translateY(-50%);width:4.4cqi;height:4.4cqi;border:0;background:none;padding:0;color:#7C7A72;display:grid;place-items:center;cursor:pointer}
#authGate.cream .tw .tw-btn{width:auto;min-width:30%;height:5.4cqi;padding:0 6cqi;margin:0;border:0;border-radius:999px;background:#1F2634;color:#FFFFFF;font:700 1.45cqi Montserrat,Manrope,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;box-shadow:0 1.2cqi 2.4cqi -1cqi rgba(20,26,40,.55)}
#authGate.cream .tw .tw-btn:hover{background:#2B3446}
#authGate.cream .tw .tw-btn:active{transform:scale(.97)}
#authGate.cream .tw .tw-link{width:auto;border:0;background:none;padding:0;margin:-.6cqi 0 0;font:600 1.35cqi Montserrat,Manrope,system-ui,sans-serif;color:#5A5F6C;cursor:pointer}
#authGate.cream .tw .tw-link:hover{color:#1F2430}
#authGate.cream .tw .lg-idsw{margin-top:1.4cqi;width:auto;border:0;background:none;padding:0;font:600 1.35cqi Montserrat,Manrope,system-ui,sans-serif;color:#5A5F6C;cursor:pointer}
#authGate.cream .tw.flip .tw-info-p{order:-1}
#authGate.cream .tw .tw-msg{width:72%;font-size:1.35cqi;border-radius:2.6cqi;padding:1.2cqi 2cqi;box-sizing:border-box;text-align:left}
#authGate.cream .cr-foot,#authGate.cream .lg>.lg-soc{display:none!important}
#authGate.cream .tw .lg-soc{display:none!important}

/* 3D depth: a soft light sweep across the card */
#authGate.cream .tw::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.55) 50%,transparent 58%);transform:translateX(-100%);animation:zzTwinSweep 6s ease-in-out 1.2s infinite}
@keyframes zzTwinSweep{0%{transform:translateX(-100%)}30%,100%{transform:translateX(100%)}}

/* portrait: the two panels stack, same design */
@media (max-width:720px){
  #authGate.cream .tw{aspect-ratio:auto;grid-template-columns:1fr;border-radius:26px;container-type:normal}
  #authGate.cream .tw-p{padding:30px 22px;min-height:0}
  #authGate.cream .tw h3,#authGate.cream .tw h2{font-size:1.45rem;margin-bottom:18px}
  #authGate.cream .tw p{font-size:.86rem;max-width:90%;margin-bottom:20px}
  #authGate.cream .tw input{width:100%;height:50px;padding:0 20px;font-size:.92rem;border-radius:25px}
  #authGate.cream .tw .tw-pw{width:100%}
  #authGate.cream .tw .tw-btn{font-size:.78rem;height:46px;min-width:46%}
  #authGate.cream .tw .tw-link,#authGate.cream .tw .lg-idsw{font-size:.82rem}
  #authGate.cream .tw .tw-msg{width:100%;font-size:.84rem;border-radius:16px;padding:10px 14px}
  #authGate.cream .tw-form{gap:14px}
  #authGate.cream .tw-info-p::before{width:200px;height:200px;right:-90px;top:-100px}
  #authGate.cream .tw-info-p::after{width:200px;height:200px;left:-100px;bottom:-110px}
  #authGate.cream .cr-title{font-size:2.2rem}
}
`;
  document.head.appendChild(st);
})();
