/* =====================================================================
   v5 · Voice messages, like WhatsApp
   - Hold the microphone to record; slide it up to lock (hands free).
   - While recording you can pause and resume.
   - When you stop, the message is kept as a preview: listen to it,
     throw it away, or send it.
   ===================================================================== */
(function () {
  var hold = null;   // { y0, down, locked, released } while the finger is on the mic
  var MIME = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  var LOCK_PX = 60;

  function elapsed(r) { return r.acc + (r.paused ? 0 : Date.now() - r.t0); }

  // ---------- the recording panel (its own layer: the chat is not redrawn) ----------
  var ov = null, knob = null, ovMode = "";
  function panel() {
    if (!ov) { ov = document.createElement("div"); ov.id = "zzRecOv"; ov.setAttribute("role", "status"); document.body.appendChild(ov); }
    return ov;
  }
  function drawPanel() {
    var r = V4.rec;
    var holding = !!(hold && (hold.down || hold.pending));
    if (!r && !holding) { if (ov) ov.style.display = "none"; ovMode = ""; return; }
    var el = panel();
    el.style.display = "flex";
    var mode = (r && r.locked) ? "locked" : "hold";
    if (mode !== ovMode) {
      ovMode = mode;
      if (mode === "hold") {
        el.innerHTML = '<span class="zz-dot"></span><b class="zz-t" id="zzRecT">0:00</b>' +
          '<span class="zz-wave" aria-hidden="true">' + "<i></i>".repeat(18) + '</span>' +
          '<span class="zz-slide">' + ic("lock") + ' Slide up to lock</span>';
      } else {
        el.innerHTML = '<button type="button" class="zz-ib" data-zz="recTrash" aria-label="Cancel the voice message">' + ic("trash") + '</button>' +
          '<span class="zz-dot"></span><b class="zz-t" id="zzRecT">0:00</b>' +
          '<span class="zz-wave" aria-hidden="true">' + "<i></i>".repeat(18) + '</span>' +
          '<button type="button" class="zz-ib" data-zz="recPause" id="zzPause" aria-label="Pause">' + ic("pause") + '</button>' +
          '<button type="button" class="zz-ib zz-go" data-zz="recStop" aria-label="Stop and listen">' + ic("check") + '</button>';
      }
    }
    var t = document.getElementById("zzRecT");
    if (t) t.textContent = fmtDur(r ? r.sec : 0);
    var pb = document.getElementById("zzPause");
    if (pb && r) { pb.innerHTML = ic(r.paused ? "play" : "pause"); pb.setAttribute("aria-label", r.paused ? "Resume" : "Pause"); }
    el.classList.toggle("zz-paused", !!(r && r.paused));
  }

  // the mic follows the finger; it locks when dragged up
  function knobEl() {
    if (!knob) { knob = document.createElement("div"); knob.id = "zzKnob"; knob.innerHTML = ic("mic") + '<i class="zz-lk">' + ic("lock") + '</i>'; document.body.appendChild(knob); }
    return knob;
  }
  function showKnob(x, y) {
    var k = knobEl(); k.style.display = "flex"; k.classList.remove("zz-lock");
    k.style.left = (x - 32) + "px"; k.style.top = (y - 32) + "px"; k.style.transform = "";
  }
  function moveKnob(dy) {
    var k = knobEl();
    var up = Math.min(0, dy);
    k.style.transform = "translateY(" + up + "px) scale(" + (1 + Math.min(0.25, -up / 400)) + ")";
    k.classList.toggle("zz-lock", -up >= LOCK_PX * 0.6);
  }
  function hideKnob() { if (knob) { knob.style.display = "none"; knob.classList.remove("zz-lock"); } }

  function micStart(kind, target) {
    if (V4.rec || !target) return;
    if (hold) hold.pending = true;          // the panel stays up while the mic starts
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (stream) {
        if (hold) hold.pending = false;
        var mime = MIME.find(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || "";
        var mr;
        try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : undefined); }
        catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); toast("Voice recording is not possible on this device.", "x"); return; }
        var chunks = [];
        V4.prev = null; V4.panel = null;
        var r = { kind: kind, target: target, mr: mr, stream: stream, chunks: chunks, acc: 0, t0: Date.now(), paused: false, locked: !!(hold && hold.locked), cancel: false, sec: 0 };
        V4.rec = r;
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          clearInterval(r.timer);
          V4.rec = null; ovMode = "";
          if (ov) ov.style.display = "none";
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
          drawPanel();
          if (r.sec >= 180) micStop(false);
        }, 300);
        // the finger was already released: stop as soon as it starts
        if (hold && !hold.down && !hold.locked) micStop(false);
        drawPanel();
      })
      .catch(function (e) {
        if (hold) hold.pending = false;
        hideKnob();
        drawPanel();
        toast(e && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Allow the microphone to send a voice message (phone Settings → Apps → English Classes → Permissions → Microphone)."
          : "Microphone not available on this device.", "x");
      });
  }

  function micStop(cancel) {
    var r = V4.rec;
    if (!r) return;
    r.cancel = !!cancel;
    try { r.mr.stop(); } catch (e) { V4.rec = null; drawPanel(); render(); }
  }

  function pauseToggle() {
    var r = V4.rec;
    if (!r) return;
    try {
      if (r.paused) { r.mr.resume(); r.t0 = Date.now(); r.paused = false; }
      else { r.mr.pause(); r.acc += Date.now() - r.t0; r.paused = true; }
    } catch (e) {}
    drawPanel();
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
    if (r || (hold && hold.down)) return _bar(kind, target, ph);   // the panel is drawn on top
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
    var rc = b.getBoundingClientRect();
    hold = { y0: e.clientY, down: true, locked: false, released: false };
    showKnob(rc.left + rc.width / 2, rc.top + rc.height / 2);
    drawPanel();
    micStart(b.dataset.k, v4Target(b.dataset.k));
  }, true);

  window.addEventListener("pointermove", function (e) {
    if (!hold || !hold.down) return;
    var dy = e.clientY - hold.y0;
    if (hold.locked) return;
    moveKnob(dy);
    if (-dy >= LOCK_PX) {
      hold.locked = true;
      hideKnob();
      if (V4.rec) V4.rec.locked = true;
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (x) {}
      drawPanel();
    }
  }, true);

  function release() {
    if (!hold || !hold.down) return;
    hold.down = false;
    hideKnob();
    if (hold.locked) { drawPanel(); return; }   // locked: keeps recording until Stop
    if (V4.rec) micStop(false);
    else hold.released = true;
    drawPanel();
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
.zz-prev{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);box-sizing:border-box}
.zz-prev b{font-variant-numeric:tabular-nums;min-width:40px}
.zz-prev .v4wave{flex:1}
.zz-prev .btn{flex:none}
#zzRecOv{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:9400;display:none;align-items:center;gap:10px;padding:10px 12px;border-radius:999px;background:rgba(14,12,34,.96);border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 30px -10px rgba(0,0,0,.7);color:#fff;box-sizing:border-box;touch-action:none}
#zzRecOv .zz-dot{width:12px;height:12px;border-radius:50%;background:#E5484D;flex:none;animation:zzBlink 1s ease-in-out infinite}
#zzRecOv.zz-paused .zz-dot{animation:none;background:#F5B942}
#zzRecOv .zz-t{font-variant-numeric:tabular-nums;min-width:42px;font-size:.95rem}
#zzRecOv .zz-wave{flex:1;display:flex;align-items:center;gap:3px;height:22px;min-width:40px}
#zzRecOv .zz-wave i{width:3px;border-radius:3px;background:#F9A8D4;height:30%;animation:zzBar 1s ease-in-out infinite}
#zzRecOv .zz-wave i:nth-child(3n){animation-delay:.2s;height:70%}
#zzRecOv .zz-wave i:nth-child(3n+1){animation-delay:.45s;height:45%}
#zzRecOv.zz-paused .zz-wave i{animation:none;height:30%}
#zzRecOv .zz-slide{display:inline-flex;align-items:center;gap:4px;opacity:.8;font-size:.85rem;white-space:nowrap}
#zzRecOv .zz-ib{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;flex:none;cursor:pointer}
#zzRecOv .zz-ib.zz-go{background:#C084FC;color:#1A1033;border-color:transparent}
#zzKnob{position:fixed;width:64px;height:64px;border-radius:50%;z-index:9500;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#F5D0FE,#C084FC 55%,#7C3AED);color:#1A1033;box-shadow:0 10px 26px -6px rgba(124,58,237,.8);pointer-events:none;transition:transform .05s linear,background .2s}
#zzKnob.zz-lock{background:radial-gradient(circle at 35% 30%,#A7F3D0,#34D399 55%,#047857)}
#zzKnob .zz-lk{position:absolute;top:-44px;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:rgba(14,12,34,.9);display:grid;place-items:center;color:#fff;opacity:.9}
@keyframes zzBlink{50%{opacity:.3}}
@keyframes zzBar{50%{height:95%}}
`;
  document.head.appendChild(st);
})();
