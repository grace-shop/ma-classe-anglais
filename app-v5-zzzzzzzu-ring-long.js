/* ---- Call ringtones last longer: each built-in call tone is repeated for about 8 seconds, then pauses
   for a moment before it starts again. Your own music is already played in full (up to 30 s). ---- */
(function () {
  if (typeof RT_CALL === "undefined") return;
  var TOTAL = 8, PAUSE = 1.5;
  RT_CALL.forEach(function (t) {
    if (t.id === "custom" || t.__long) return;
    var play0 = t.play, p0 = t.period || 2;
    var reps = Math.max(1, Math.floor(TOTAL / p0));
    t.__long = true;
    t.play = function (c, at) {
      for (var k = 0; k < reps; k++) play0(c, at + k * p0);
    };
    t.period = reps * p0 + PAUSE;
  });
})();
