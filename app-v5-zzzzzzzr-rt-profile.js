/* ---- Ringtones on the profile page: same fold button as in Settings (its own saved state). ---- */
(function () {
  if (typeof profileView !== "function" || typeof rtPickersHTML !== "function" || typeof window.rtFoldHead !== "function") return;
  var _pf = profileView;
  profileView = function () {
    var h = _pf();
    var open = window.rtFoldOpen("p");
    var card = '<div class="glass card rt-profile">' + window.rtFoldHead("p", "Ringtones", open) +
      (open ? '<p class="small muted" style="margin:6px 0 8px">The default is marked. Tap “Preview” to hear it.</p>' + rtPickersHTML() : "") +
      "</div>";
    var i = h.indexOf('<div class="section"', 10);
    return i > 0 ? h.slice(0, i) + card + h.slice(i) : card + h;
  };
})();
