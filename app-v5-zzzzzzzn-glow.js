/* ---- Luminous lines on the glass screens. Off in economy mode (no blur, no glow) so slow phones stay smooth. ---- */
(function () {
  var css = [
    "html:not(.lite) .glass{border:1px solid rgba(140,225,255,.38)!important;" +
      "box-shadow:0 0 0 1px rgba(140,225,255,.10) inset,0 0 22px rgba(80,200,255,.22),0 10px 30px rgba(0,0,0,.35)!important}",
    "html:not(.lite) .card{border:1px solid rgba(140,225,255,.28);" +
      "box-shadow:0 0 16px rgba(80,200,255,.16),inset 0 1px 0 rgba(255,255,255,.14)}",
    "html:not(.lite) .btn,html:not(.lite) button.primary{border:1px solid rgba(160,235,255,.55);" +
      "box-shadow:0 0 14px rgba(80,200,255,.35),inset 0 1px 0 rgba(255,255,255,.25)}",
    "html:not(.lite) .btn:active{box-shadow:0 0 22px rgba(80,200,255,.6)}"
  ].join("");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
})();
