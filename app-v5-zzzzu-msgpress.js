/* =====================================================================
   v5 · Hold a message to open its options, like WhatsApp
   (Delete for me · Delete for everyone · Reply · Copy · React).
   A quick tap still works as before.
   ===================================================================== */
(function () {
  var timer = null, sx = 0, sy = 0, el = null;

  function clear() { clearTimeout(timer); timer = null; el = null; }

  document.addEventListener("pointerdown", function (e) {
    if (e.button > 0 || !e.target.closest) return;
    var m = e.target.closest(".msg[data-mid]");
    if (!m || e.target.closest("button,a,input,textarea,audio,video,label,.v4quote")) return;
    if (String(m.dataset.mid).indexOf("tmp") === 0) return;
    el = m; sx = e.clientX; sy = e.clientY;
    timer = setTimeout(function () {
      var target = el; clear();
      if (!target || !document.body.contains(target)) return;
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) {}
      try { v4MsgTap({ target: target, preventDefault: function () {} }); } catch (x) {}
    }, 450);
  }, true);

  document.addEventListener("pointermove", function (e) {
    if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) clear();
  }, true);
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
    document.addEventListener(ev, clear, true);
  });
})();
