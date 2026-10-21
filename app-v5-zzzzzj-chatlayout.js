/* =====================================================================
   v5 · In a classmate chat, the name stays still when the keyboard opens.
   The frame follows the space that is left above the keyboard, so the
   name row stays at the top and the message box stays above the keyboard.
   ===================================================================== */
(function () {
  function size() {
    var f = document.querySelector(".glass.chat.zz-framed");
    if (!f || !f.parentElement) return;
    var bar = f.parentElement.querySelector("form.v4bar");
    var bh = bar && !f.contains(bar) ? bar.getBoundingClientRect().height : 0;
    var vh = window.visualViewport ? visualViewport.height : window.innerHeight;
    var top = f.getBoundingClientRect().top;
    f.style.height = Math.max(200, Math.round(vh - top - bh - 14)) + "px";
    f.dataset.zzw = String(window.innerWidth);
  }
  var raf = 0;
  function later() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; try { size(); } catch (e) {} }); }
  if (window.visualViewport) visualViewport.addEventListener("resize", later);
  document.addEventListener("focusin", function (e) { if (e.target && e.target.closest && e.target.closest(".glass.chat")) setTimeout(later, 60); }, true);
  document.addEventListener("focusout", function () { setTimeout(later, 300); }, true);
})();
