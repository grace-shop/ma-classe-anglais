/* =====================================================================
   v5 · Voice messages, like WhatsApp
   - Hold the microphone to record; slide it up to lock (hands free).
   - While recording you can pause and resume.
   - When you stop, the message is kept as a preview: listen to it,
     throw it away, or send it.
   ===================================================================== */
(function () {
  var hold = null; // { y0, locked, releasedEarly } while the finger is on the mic
  var MIME = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

  function elapsed(r) { return r.acc + (r.paused ? 0 : Date.now() - r.t0); }

  function micStart(kind, target) {
    if (V4.rec || !target) return;
    hold = hold || {};
    hold.locked = false; hold.releasedEarly = false;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (stream) {
        var mime = MIME.find(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || "";
        var mr;
        try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : undefined); }
        catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); toast("Voice recording is not possible on this device.", "x"); return; }
        var chunks = [];
        V4.prev = null; V4.panel = null;
        var r = { kind: kind, target: target, mr: mr, stream: stream, chunks: chunks, acc: 0, t0: Date.now(), paused: false, locked: !!hold.locked, cancel: false, sec: 0 };
        V4.rec = r;
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          clearInterval(r.timer);
          V4.rec = null;
          if (r.cancel) { render(); return; }
          var ms = elapsed(r);
          if (ms < 800) { toast("Hold the microphone to record a voice message.", "x"); render(); return; }
          var type = String(mr.mimeType || mime || "audio/webm").split(";")[0];
          var blob = new Blob(chunks, { type: type });
          V4.prev = { kind: kind, target: target, blob: blob, ext: (EXT[type] || "webm"), sec: Math.max(1, Math.round(ms / 1000)), url: URL.createObjectURL(blob), audio: null, playing: false };
          render();
        };
        mr.start(250);
        r.timer = setInterval(function () {
          r.sec = Math.round(elapsed(r) / 1000);
          var el = document.getElementById("zzRecT");
          if (el) el.textContent = fmtDur(r.sec);
          if (r.sec >= 180) micStop(false);
        }, 400);
        if (hold.releasedEarly && !hold.locked) micStop(false);
        render();
      })
      .catch(function (e) {
        toast(e && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Allow the microphone to send a voice message (phone Settings → Apps → English Classes → Permissions → Microphone)."
          : "Microphone not available on this device.", "x");
      });
  }

  function micStop(cancel) {
    var r = V4.rec;
    if (!r) return;
    r.cancel = !!cancel;
    try { r.mr.stop(); } catch (e) { V4.rec = null; render(); }
  }

  function pauseToggle() {
    var r = V4.rec;
    if (!r) return;
    try {
      if (r.paused) { r.mr.resume(); r.t0 = Date.now(); r.paused = false; }
      else { r.mr.pause(); r.acc += Date.now() - r.t0; r.paused = true; }
    } catch (e) {}
    render();
  }

  function discardPreview() {
    var p = V4.prev;
    if (!p) return;
    try { if (p.audio) p.audio.pause(); URL.revokeObjectURL(p.url); } catch (e) {}
    V4.prev = null;
    render();
  }

  function sendPreview() {
    var p = V4.prev;
    if (!p) return;
    V4.prev = null;
    try { if (p.audio) p.audio.pause(); } catch (e) {}
    v4SendFile(p.kind, p.target, p.blob, "voice." + p.ext, "voice", p.sec);
    render();
  }

  function playPreview() {
    var p = V4.prev;
    if (!p) return;
    if (!p.audio) {
      p.audio = new Audio(p.url);
      p.audio.onended = function () { p.playing = false; render(); };
    }
    if (p.playing) { p.audio.pause(); p.playing = false; }
    else { p.audio.play().catch(function () {}); p.playing = true; }
    render();
  }

  // ---------- the bars ----------
  var _bar = v4Bar;
  v4Bar = function (kind, target, ph) {
    var r = V4.rec && V4.rec.kind === kind ? V4.rec : null;
    if (r) {
      var wave = '<span class="v4wave" aria-hidden="true">' + "<i></i>".repeat(18) + "</span>";
      if (!r.locked) {
        return '<div class="zz-rec hold" role="status"><span class="v4rec-dot" aria-hidden="true"></span><b id="zzRecT">' + fmtDur(r.sec) + '</b>' + wave +
          '<span class="zz-slide">' + ic("lock") + ' Slide up to lock</span></div>';
      }
      return '<div class="zz-rec" role="status"><button type="button" class="iconbtn" data-zz="recTrash" aria-label="Cancel the voice message">' + ic("trash") + '</button>' +
        '<span class="v4rec-dot" aria-hidden="true"></span><b id="zzRecT">' + fmtDur(r.sec) + '</b>' + wave +
        '<button type="button" class="iconbtn" data-zz="recPause" aria-label="' + (r.paused ? "Resume" : "Pause") + '">' + ic(r.paused ? "play" : "pause") + '</button>' +
        '<button type="button" class="btn sm" data-zz="recStop" aria-label="Stop and listen">' + ic("check") + 'Stop</button></div>';
    }
    var p = V4.prev && V4.prev.kind === kind ? V4.prev : null;
    if (p) {
      return '<div class="zz-prev" role="group" aria-label="Voice message preview">' +
        '<button type="button" class="iconbtn" data-zz="prevDel" aria-label="Delete the voice message">' + ic("trash") + '</button>' +
        '<button type="button" class="iconbtn" data-zz="prevPlay" aria-label="' + (p.playing ? "Pause" : "Listen") + '">' + ic(p.playing ? "pause" : "play") + '</button>' +
        '<span class="v4wave" aria-hidden="true">' + "<i></i>".repeat(18) + '</span>' +
        '<b>' + fmtDur(p.sec) + '</b>' +
        '<button type="button" class="btn" data-zz="prevSend" aria-label="Send the voice message">' + ic("send") + 'Send</button></div>';
    }
    return _bar(kind, target, ph);
  };

  // ---------- gestures on the microphone ----------
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest && e.target.closest('[data-v4="rec"]');
    if (!b || e.button > 0) return;
    e.preventDefault();
    hold = { y0: e.clientY, locked: false, releasedEarly: false, down: true };
    micStart(b.dataset.k, v4Target(b.dataset.k));
  }, true);

  window.addEventListener("pointermove", function (e) {
    if (!hold || !hold.down || hold.locked) return;
    if (hold.y0 - e.clientY > 60) {
      hold.locked = true;
      if (V4.rec) { V4.rec.locked = true; render(); }
    }
  }, true);

  function release() {
    if (!hold || !hold.down) return;
    hold.down = false;
    if (hold.locked) return;
    if (V4.rec) micStop(false);
    else hold.releasedEarly = true;
  }
  window.addEventListener("pointerup", release, true);
  window.addEventListener("pointercancel", release, true);

  // ---------- buttons ----------
  window.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-v4="rec"]')) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    var b = e.target.closest("[data-zz]");
    if (!b) return;
    var a = b.dataset.zz;
    if (a === "recTrash") micStop(true);
    else if (a === "recPause") pauseToggle();
    else if (a === "recStop") micStop(false);
    else if (a === "prevDel") discardPreview();
    else if (a === "prevPlay") playPreview();
    else if (a === "prevSend") sendPreview();
    else return;
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzwVoice";
  st.textContent = `
[data-v4="rec"]{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.zz-rec,.zz-prev{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);box-sizing:border-box}
.zz-rec b,.zz-prev b{font-variant-numeric:tabular-nums;min-width:40px}
.zz-rec .v4wave,.zz-prev .v4wave{flex:1}
.zz-rec.hold{justify-content:flex-start}
.zz-slide{margin-left:auto;display:inline-flex;align-items:center;gap:4px;opacity:.75;font-size:.85rem;white-space:nowrap}
.zz-slide .i{width:16px;height:16px}
.zz-prev .btn{flex:none}
`;
  document.head.appendChild(st);
})();
