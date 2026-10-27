/* ---- Tapping a game-invitation notification opens the Games menu of Battle Royale, where the invitation waits. ---- */
(function () {
  function plugin() {
    var C = window.Capacitor;
    return C && C.Plugins && C.Plugins.PushNotifications ? C.Plugins.PushNotifications : null;
  }
  var tries = 0;
  var wait = setInterval(function () {
    var P = plugin();
    if (P && P.addListener) {
      clearInterval(wait);
      P.addListener("pushNotificationActionPerformed", function (ev) {
        var data = (ev && ev.notification && ev.notification.data) || {};
        if (data.kind !== "game") return;
        try {
          if (window.ZGUI && typeof window.ZGUI.menu === "function") window.ZGUI.menu("battle");
        } catch (e) {}
      });
    } else if (++tries > 300) clearInterval(wait);
  }, 200);
})();
