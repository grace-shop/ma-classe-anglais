/* =====================================================================
   v5 · Voice in calls.
   - The other person's voice plays through its own sound element. Android
     blocks sound that starts on its own, so the first tap in the call
     starts it (the call video tile is muted: no double sound).
   - A "Haut-parleur" button switches the speaker on and off (Android app).
   ===================================================================== */
(function () {
  var spk = null;   // speaker state, set when the call starts

  function audioFor(uid, P) {
    var id = "zzA_" + uid;
    var a = document.getElementById(id);
    if (!a) {
      a = document.createElement("audio");
      a.id = id;
      a.autoplay = true;
      a.setAttribute("playsinline", "");
      document.body.appendChild(a);
    }
    if (P && P.stream && a.srcObject !== P.stream) a.srcObject = P.stream;
    return a;
  }

  function playAll() {
    document.querySelectorAll("audio[id^='zzA_']").forEach(function (a) {
      if (a.srcObject && a.paused) a.play().catch(function () {});
    });
  }

  function keeper() {
    return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.CallKeeper;
  }

  function toggleSpeaker() {
    spk = !spk;
    var K = keeper();
    if (K && K.speaker) K.speaker({ on: spk }).catch(function () {});
    else toast("Haut-parleur : disponible dans l'application Android.", "x");
    paintSpeaker();
  }

  function paintSpeaker() {
    var b = document.querySelector("#csBtns .zz-spk");
    if (!b) return;
    b.classList.toggle("on", !!spk);
    b.setAttribute("aria-pressed", spk ? "true" : "false");
    b.textContent = spk ? "🔊 Haut-parleur : on" : "🔈 Haut-parleur";
  }

  function ensureSpeakerButton() {
    var bar = document.getElementById("csBtns");
    if (!bar || bar.querySelector(".zz-spk")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "zz-spk";
    b.addEventListener("click", function (e) { e.preventDefault(); toggleSpeaker(); });
    bar.appendChild(b);
    if (spk === null) spk = !!(window.CALL && CALL.video);
    paintSpeaker();
  }

  // the call screen redraws: keep the remote sound, mute the video tiles of others
  var _cs = callScreenSync;
  callScreenSync = function () {
    var r = _cs.apply(this, arguments);
    try {
      var keep = {};
      Object.keys(CALL.peers || {}).forEach(function (u) {
        var P = CALL.peers[u];
        keep["zzA_" + u] = true;
        var a = audioFor(u, P);
        if (a.srcObject && a.paused) a.play().catch(function () {});
      });
      document.querySelectorAll("audio[id^='zzA_']").forEach(function (a) {
        if (!keep[a.id]) a.remove();
      });
      document.querySelectorAll("#callScr .call-tile").forEach(function (t) {
        var v = t.querySelector("video");
        if (v && t.dataset.u !== "me") v.muted = true;
      });
      ensureSpeakerButton();
    } catch (e) {}
    return r;
  };

  // a tap in the call starts the voices if the phone blocked them
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("#callScr")) playAll();
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzzvVoice";
  st.textContent = `
#csBtns .zz-spk{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:10px 16px;font:700 .85rem system-ui,sans-serif;cursor:pointer;white-space:nowrap}
#csBtns .zz-spk.on{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
`;
  document.head.appendChild(st);
})();
