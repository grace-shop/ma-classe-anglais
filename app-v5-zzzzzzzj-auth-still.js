/* ---- sign-in and sign-up screens: sky-blue background, and the panels stay still when the keyboard opens ----
   The screen has a fixed height that does not follow the keyboard; its panels keep their natural height and the
   screen scrolls, so the field being typed in is scrolled into view instead of the layout being squeezed. */
(function () {
  var st = document.createElement("style");
  st.textContent = [
    "#authGate,#authGate.cream,#authGate.otpv{top:0!important;bottom:auto!important;height:100vh!important;height:100lvh!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:radial-gradient(120% 60% at 50% -5%,#B9E6FA 0%,#7CCBF2 42%,#4FB3E6 100%)!important;color:#0B2A47!important}",
    "#authGate>*,#authGate .lg,#authGate .lg-sheet,#authGate .ag2,#authGate .ag2-info,#authGate .ag2-form{flex-shrink:0!important}",
    "#authGate .ag2{overflow:visible!important;min-height:0!important}",
    "#authGate .lg-brand,#authGate.cream .lg-brand{color:#0B2A47!important}",
    "#authGate .cr-title,#authGate .lg-title,#authGate.cream .cr-title,#authGate .ag2-info h2{color:#0B2A47!important;text-shadow:0 1px 0 rgba(255,255,255,.35)}",
    "#authGate .lg-sub,#authGate .ag2-info p{color:#15395C!important}",
    "#authGate .lg-top .lg-logo img,#authGate .lg-logo img{filter:drop-shadow(0 6px 14px rgba(11,42,71,.25))}",
    "#authGate .lg-sheet{box-shadow:0 -18px 46px rgba(11,42,71,.22)!important}",
    "#authGate input:focus{scroll-margin-top:24px;scroll-margin-bottom:120px}"
  ].join("");
  document.head.appendChild(st);
})();
