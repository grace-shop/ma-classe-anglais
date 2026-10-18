/* =====================================================================
   v5 · Sign-in look: black surround with a white card, a green light
   that travels round the card edge, red and one shake on a wrong try.
   Also the new-password screen gets the eye toggle.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzzzoAuthLook";
  st.textContent = `
/* black surround, white centre (sign-in twin card) */
#authGate.cream{background:#000!important}
#authGate.cream .tw{background:#FFFFFF!important;box-shadow:0 0 0 1px rgba(255,255,255,.06),0 40px 90px -24px rgba(0,0,0,.95)!important}
#authGate.cream .tw-p,#authGate.cream .tw-info-p{background:#FFFFFF!important}
#authGate.cream h3,#authGate.cream .tw-p h3{color:#0B0F1A}
/* text sitting on the black surround is white */
#authGate.cream .cr-title{color:#FFFFFF!important;text-shadow:0 0 22px rgba(160,190,255,.35)}
#authGate.cream .lg-brand{color:#FFFFFF!important;opacity:.85}

/* green contour that travels round the card (red on a wrong try) */
#authGate .tw,#authGate .ot-card{position:relative;isolation:isolate;--zzc:#22E37A;--zzc2:#A6FFCB}
#authGate .tw::before,#authGate .ot-card::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:3px;pointer-events:none;z-index:9;
  background:conic-gradient(from var(--zzang),transparent 0deg,var(--zzc) 36deg,var(--zzc2) 58deg,var(--zzc) 80deg,transparent 125deg,transparent 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  animation:zzEdge 3.2s linear infinite;filter:drop-shadow(0 0 6px var(--zzc))}

/* wrong try: the edge turns red and the card shakes once */
#authGate .tw:has(.msg.err),#authGate .ot-card:has(.msg.err){--zzc:#FF2D55;--zzc2:#FFB3C1;animation:zzVib .6s cubic-bezier(.36,.07,.19,.97) 1}
@keyframes zzVib{0%,100%{transform:translateX(0)}12%{transform:translateX(-11px)}26%{transform:translateX(10px)}40%{transform:translateX(-8px)}56%{transform:translateX(6px)}72%{transform:translateX(-3px)}88%{transform:translateX(2px)}}

/* eye on the new-password field */
#authGate .ot-field input{padding-right:52px!important}
#authGate .ot-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:40px;height:40px;padding:0;border:0;background:none;color:#8A90A8;display:grid;place-items:center;cursor:pointer;border-radius:12px}
#authGate .ot-eye.on{color:#22E37A}

/* sign-in page stays still: no sweeping shapes, no floating logo, no scrolling */
#authGate.cream{overflow:hidden!important;justify-content:center!important;touch-action:none}
#authGate.cream .tw::after,#authGate.cream .tw-p::before,#authGate.cream .tw-p::after,#authGate.cream .tw-info-p::before,#authGate.cream .tw-info-p::after{animation:none!important;transition:none!important}
#authGate .lg-logo,#authGate .lg-logo *,#authGate .cr-top *{animation:none!important}
@media (prefers-reduced-motion:reduce){
  #authGate .tw::before,#authGate .ot-card::before,#authGate .tw:has(.msg.err),#authGate .ot-card:has(.msg.err){animation:none!important}
}
`;
  document.head.appendChild(st);
})();
