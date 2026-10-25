/* ---- the ringtones are at the top of "Settings & security": the call ringtone and the notification sound,
   each with its default marked, and a preview for every one ---- */
(function () {
  if (typeof secView !== "function" || typeof rtPickersHTML !== "function") return;
  var _sec = secView;
  secView = function () {
    var h = _sec();
    var card = '<div class="glass card sec rt-top"><h3>Ringtones</h3><p class="small muted" style="margin:0">Choose the ringtone for calls and the sound for messages. The default is marked. Tap “Preview” to hear it.</p>' + rtPickersHTML() + '</div>';
    return card + h;
  };
})();
