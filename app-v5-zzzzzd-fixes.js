/* =====================================================================
   v5 · Top bar at the top, call screen under the status bar, and a
   lighter screen while you are in a chat (the 3D background stops and
   blur is off). The chat backgrounds are in app-v5-zzzzzf-chatbg.js.
   ===================================================================== */
(function () {
  // ---- lighter screen while in a chat: the 3D background stops and the
  // (LITE) switch is used only while the chat is open; it is put back after
  var perfOn = false, prevLite = false;
  function setPerf(on) {
    if (on === perfOn) return;
    perfOn = on;
    try {
      if (on) {
        prevLite = !!LITE;
        LITE = true;
        var c = document.getElementById("bg3d"); if (c) c.style.display = "none";
      } else {
        LITE = prevLite;
        var c2 = document.getElementById("bg3d"); if (c2) c2.style.display = "";
        if (!LITE && typeof window.__bgResume === "function") window.__bgResume();
      }
    } catch (e) {}
  }
  function decorate() { setPerf(!!document.querySelector(".glass.chat")); }

  var _r = render;
  render = function () {
    var out = _r.apply(this, arguments);
    try { decorate(); } catch (e) {}
    return out;
  };
  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { decorate(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzdFixes";
  st.textContent = `
/* top bar: sits at the very top, so the call buttons under it stay visible */
html body header.top{position:sticky!important;top:0!important;margin-top:0!important}

/* call screen: starts below the status bar, so the top row is never hidden */
#callScr:not(.zz-mini){padding-top:calc(env(safe-area-inset-top,0px) + 30px)!important}

/* chat: lighter drawing (no blur, no 3D background, no bubble animations) */
body:has(.glass.chat) .glass,body:has(.glass.chat) header.top,body:has(.glass.chat) nav.tabs{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
body:has(.glass.chat) .mg-p{display:none!important}
body:has(.glass.chat) .msgs *,body:has(.glass.chat) .msg{animation:none!important;transition:none!important}
`;
  document.head.appendChild(st);
  try { decorate(); } catch (e) {}
})();
