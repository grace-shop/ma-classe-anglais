/* =====================================================================
   v5 · Leaving a story is normal: swipe down (like Instagram), the phone's
   back button, or Escape. The cross at the top still works.
   ===================================================================== */
(function () {
  var sx = 0, sy = 0, active = false, moved = false, swiped = false;

  document.addEventListener("pointerdown", function (e) {
    if (!(typeof F !== "undefined" && F.sv) || !e.target.closest || !e.target.closest(".fsv")) return;
    if (e.target.closest("button,a,input,textarea,select,video[controls]")) return;
    sx = e.clientX; sy = e.clientY; active = true; moved = false; swiped = false;
  }, true);

  document.addEventListener("pointermove", function (e) {
    if (!active) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dy) > 8 || Math.abs(dx) > 8) moved = true;
    if (!swiped && dy > 110 && Math.abs(dx) < 70) {
      swiped = true; active = false;
      try { fCloseStory(); } catch (err) {}
    }
  }, true);

  document.addEventListener("pointerup", function () { active = false; }, true);
  document.addEventListener("pointercancel", function () { active = false; }, true);

  // a swipe must not also count as a tap (which would jump to the next story)
  document.addEventListener("click", function (e) {
    if (swiped) { swiped = false; e.stopPropagation(); e.preventDefault(); }
  }, true);
})();
