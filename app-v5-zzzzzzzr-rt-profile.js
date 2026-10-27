/* ---- Ringtones on the profile page too: the call ringtone and the notification sound, each with its
   default marked, with a preview. Same choice as in Settings (it is one setting). ---- */
(function () {
  if (typeof profileView !== "function" || typeof rtPickersHTML !== "function") return;
  var _pf = profileView;
  profileView = function () {
    var h = _pf();
    var card = '<div class="glass card rt-profile"><h3 style="margin:0 0 6px">Ringtones</h3>' +
      '<p class="small muted" style="margin:0 0 8px">The default is marked. Tap “Preview” to hear it.</p>' +
      rtPickersHTML() + "</div>";
    var i = h.indexOf('<div class="section"', 10);
    return i > 0 ? h.slice(0, i) + card + h.slice(i) : card + h;
  };
})();
