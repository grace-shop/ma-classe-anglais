/* =====================================================================
   v5 · Stickers animés : une petite image carrée de 5 secondes, lue toute seule,
   en boucle, sans son, sans barre ni bouton. Elle ne joue que lorsqu'elle est à l'écran
   (ça allège le téléphone quand il y a beaucoup de stickers dans une conversation).
   ===================================================================== */
(function () {
  var SEL = "video.zz-stkv, video[data-zzp]";

  // natives controls (progress bar, play button, time) are hidden in the sticker
  var st = document.createElement("style");
  st.id = "zzStkQuiet";
  st.textContent =
    "video.zz-stkv,video[data-stk]{pointer-events:auto}" +
    "video[data-stk]::-webkit-media-controls,video[data-stk]::-webkit-media-controls-enclosure," +
    "video[data-stk]::-webkit-media-controls-panel,video[data-stk]::-webkit-media-controls-start-playback-button," +
    "video[data-stk]::-webkit-media-controls-play-button,video[data-stk]::-webkit-media-controls-timeline," +
    "video[data-stk]::-webkit-media-controls-overlay-play-button{display:none!important;-webkit-appearance:none}";
  document.head.appendChild(st);

  function tidy(v) {
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.controls = false; v.removeAttribute("controls"); v.setAttribute("disablepictureinpicture", "");
    v.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
    v.dataset.stk = "1";
  }
  function playIt(v) { if (!v.isConnected || v.dataset.stkon === "0") return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) { v.dataset.stkon = "1"; playIt(v); }
      else { v.dataset.stkon = "0"; try { v.pause(); } catch (e) {} }
    });
  }, { rootMargin: "80px" }) : null;

  function arm() {
    document.querySelectorAll(SEL).forEach(function (v) {
      if (v.dataset.stkArmed) return;
      v.dataset.stkArmed = "1";
      tidy(v);
      if (io) io.observe(v); else playIt(v);
    });
  }
  // a sticker gets its picture later (loadeddata): start it then, if it is on screen
  document.addEventListener("loadeddata", function (e) {
    var v = e.target;
    if (v && v.tagName === "VIDEO" && v.dataset.stk && v.dataset.stkon !== "0") playIt(v);
  }, true);

  // the page changes often: look for new stickers once per frame at most (the observers are already coalesced)
  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; arm(); });
  }).observe(document.body, { childList: true, subtree: true });
  arm();
})();
