/* =====================================================================
   v5 · Keep a call going when the person leaves the app (Android).
   The app asks the native CallKeeper service to run while a call is
   connected, and stops it when the call ends. On the web nothing happens.
   ===================================================================== */
(function () {
  function keeper() {
    try {
      var P = window.Capacitor && window.Capacitor.Plugins;
      return P && P.CallKeeper ? P.CallKeeper : null;
    } catch (e) { return null; }
  }

  var _st = callScreenStatus;
  callScreenStatus = function () {
    var r = _st.apply(this, arguments);
    try {
      var k = keeper();
      if (k && CALL.connAt && !CALL.keeping) {
        CALL.keeping = true;
        k.start({ title: "English Classes", video: !!CALL.video }).catch(function () {});
      }
    } catch (e) {}
    return r;
  };

  var _cc = callCleanup;
  callCleanup = function () {
    try {
      var k = keeper();
      if (k && CALL.keeping) k.stop().catch(function () {});
      CALL.keeping = false;
    } catch (e) {}
    return _cc.apply(this, arguments);
  };
})();
