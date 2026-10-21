/* =====================================================================
   v5 · A story keeps playing where it was.
   Opening "Seen by" (or any panel) redraws the story. The video used to
   start again from the beginning. Now the new video picks up at the same
   second, keeps its paused or playing state and its end-of-video handler.
   ===================================================================== */
(function () {
  var _fs = feedSync;
  feedSync = function () {
    var old = document.getElementById("fsvVid");
    var keep = null;
    if (old) {
      try {
        keep = { src: old.getAttribute("src"), t: old.currentTime, paused: old.paused,
                 onended: old.onended, muted: old.muted, vol: old.volume };
      } catch (e) { keep = null; }
    }
    var r = _fs.apply(this, arguments);
    if (keep) {
      try {
        var nv = document.getElementById("fsvVid");
        if (nv && nv !== old && nv.getAttribute("src") === keep.src) {
          nv._ok = 1;
          nv.onended = keep.onended;
          nv.muted = keep.muted;
          nv.volume = keep.vol;
          var seek = function () { try { if (keep.t > 0.05) nv.currentTime = keep.t; } catch (e) {} };
          if (nv.readyState >= 1) seek(); else nv.addEventListener("loadedmetadata", seek, { once: true });
          if (keep.paused) nv.pause();
          else nv.play().catch(function () {});
        }
      } catch (e) {}
    }
    return r;
  };
})();
