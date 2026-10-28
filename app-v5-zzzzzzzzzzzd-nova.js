/* =====================================================================
   v5 · Nova (the ✦ button, bottom right) opens at the first tap, and closes properly.
   - The button sits clearly above the bottom bar, and no blue tap square appears on it.
   - Opening is taken care of first, so nothing above it can take the tap.
   The Android back button closing Nova is in app-v5-zzzo-nav.js.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.textContent = [
    "#aiFab,#aiPanel button,#aiPanel a{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none}",
    "#aiFab:focus{outline:none}",
    "#aiFab:focus-visible{outline:2px solid #EBD7A8;outline-offset:3px}",
    "@media (max-width:760px){#aiFab{bottom:calc(100px + env(safe-area-inset-bottom,0px))!important;right:14px!important;min-width:56px;min-height:56px;justify-content:center}}"
  ].join("");
  document.head.appendChild(st);

  // the open button: handled first, so a tap always opens Nova
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#aiFab");
    if (!b || b.hidden) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof aiOpen === "function") aiOpen();
  }, true);
})();
