/* =====================================================================
   v5 · Screen sharing in the Android app.
   - The Android app has its own ScreenShare plugin (android-extras/screenshare): it captures
     the screen and sends pictures, which are drawn on a canvas. The canvas is sent to the others
     exactly like a camera.
   - In a browser (no plugin) the normal screen sharing of the browser is used.
   ===================================================================== */
(function () {
  function plugin() {
    var C = window.Capacitor;
    return (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.ScreenShare) || null;
  }

  var NS = null; // { cv, ctx, stream, listeners }
  window.__screenNative = function () { return NS; };

  function drawFrame(data) {
    var n = NS;
    if (!n || !data) return;
    var img = new Image();
    img.onload = function () {
      if (NS !== n) return;
      if (n.cv.width !== img.width || n.cv.height !== img.height) { n.cv.width = img.width; n.cv.height = img.height; }
      n.ctx.drawImage(img, 0, 0);
    };
    img.src = "data:image/jpeg;base64," + data;
  }

  async function nativeStop() {
    var n = NS;
    if (!n) return;
    NS = null;
    n.listeners.forEach(function (l) { try { l.remove(); } catch (e) {} });
    try { await plugin().stop(); } catch (e) {}
  }

  var _toggle = callToggleScreen;
  var _stop = callStopScreen;
  var _cleanup = callCleanup;

  callToggleScreen = async function () {
    var P = plugin();
    if (!P) return _toggle.apply(this, arguments);
    if (!CALL.id || !CALL.local) return;
    if (CALL.screen) { callStopScreen(); return; }

    var cv = document.createElement("canvas");
    cv.width = 2; cv.height = 2;
    var ctx = cv.getContext("2d");
    var stream = cv.captureStream(4);
    var listeners = [];
    try {
      listeners.push(await P.addListener("frame", function (e) { drawFrame(e && e.data); }));
      listeners.push(await P.addListener("stopped", function () { if (CALL.screen === stream) callStopScreen(); }));
      await P.start({});
    } catch (e) {
      listeners.forEach(function (l) { try { l.remove(); } catch (x) {} });
      toast((e && e.message) || "Screen sharing was not started", "mute");
      return;
    }
    NS = { cv: cv, ctx: ctx, stream: stream, listeners: listeners };
    CALL.screen = stream;
    try { stream.getVideoTracks()[0].contentHint = "detail"; } catch (e) {}
    callSendVideo();
    callScreenSync();
    toast("You are sharing your screen", "check");
  };

  callStopScreen = function () {
    if (NS) nativeStop();
    return _stop.apply(this, arguments);
  };

  // when the call ends, the native capture ends too
  callCleanup = function () {
    if (NS) nativeStop();
    return _cleanup.apply(this, arguments);
  };
})();
