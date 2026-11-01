/* ---- Economy mode ("lite"): stops the expensive decoration so the app stays smooth on slow phones.
   Blur (backdrop-filter), looping animations and transitions are paused; the screens keep their
   colours, borders and layout. It turns on by itself on phones with little memory or few cores,
   and can be switched in Settings. The choice is remembered on this phone. ---- */
(function () {
  var KEY = "mca_lite";
  var css = "html.lite *,html.lite *::before,html.lite *::after{" +
    "backdrop-filter:none!important;-webkit-backdrop-filter:none!important;" +
    "text-shadow:none!important;transition:none!important;scroll-behavior:auto!important}" +
    "html.lite *{animation-play-state:paused!important}" +
    "html.lite .glass{background:var(--lite-bg,var(--glass-bg,rgba(20,24,40,.92)))!important}";

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function autoLow() {
    var mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
    // light by default: blur and looping animations are what make Android WebViews stutter; only strong phones keep them
    return !(mem >= 8 && cores >= 8);
  }
  function isLite() { var s = stored(); return s === null ? true : s === "1"; }
  function apply() { document.documentElement.classList.toggle("lite", isLite()); }

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  apply();

  window.mcaLite = {
    on: isLite,
    set: function (v) {
      try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
      apply();
      if (typeof render === "function") render();
    }
  };

  // Settings card with the switch, at the top of "Settings & security"
  if (typeof secView !== "function") return;
  var _sec = secView;
  secView = function () {
    var on = isLite();
    var card = '<div class="glass card sec lite-top"><h3>Economy mode</h3>' +
      '<p class="small muted" style="margin:0">Turns off blur and animations so the app runs smoothly on a slow phone. Colours and layout stay the same.</p>' +
      '<button class="btn" data-lite="' + (on ? "0" : "1") + '" style="margin-top:10px">' +
      (on ? "Turn economy mode off" : "Turn economy mode on") + '</button></div>';
    return card + _sec();
  };
  document.addEventListener("click", function (e) {
    // only the economy-mode button: <html data-lite="1"> also matches and would cancel every click in the app
    var b = e.target.closest && e.target.closest("button[data-lite]");
    if (!b) return;
    e.preventDefault();
    window.mcaLite.set(b.getAttribute("data-lite") === "1");
  }, true);
})();
