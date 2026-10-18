/* =====================================================================
   v5 · Voice messages, like WhatsApp
   - Hold the microphone: the composer turns into the recording bar, a
     padlock rises above the mic as you slide up.
   - Slide up far enough to lock: recording continues hands free, with
     pause / resume and stop.
   - Stop: the recording is kept as a preview. Listen, delete or send.
   - "1" makes it a view once message: it can be listened to one time.
   ===================================================================== */
(function () {
  var hold = null;   // { y0, down, locked, released, pending, rect } while the finger is on the mic
  var MIME = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  var LOCK_PX = 60;

  function elapsed(r) { return r.acc + (r.paused ? 0 : Date.now() - r.t0); }

  // While a voice message is being recorded, the chat is not redrawn: a redraw
  // from the background (new messages, sync) would make the screen blink.
  var _render = render;
  render = function () {
    if (V4.rec && !V4.rec.cancel) return;
    return _render.apply(this, arguments);
  };

  // ---------- the recording bar (drawn over the composer, the chat is not redrawn) ----------
  var ov = null, lockEl = null, ovMode = "";
  function panel() {
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "zzRecOv"; ov.setAttribute("role", "status");
      lockEl = document.createElement("div"); lockEl.id = "zzLock";
      lockEl.innerHTML = ic("lock");
      document.body.appendChild(ov); document.body.appendChild(lockEl);
    }
    return ov;
  }
  function placePanel() {
    if (!hold || !hold.rect) return;
    var el = panel(), rc = hold.rect;
    el.style.left = rc.left + "px"; el.style.top = rc.top + "px";
    el.style.width = rc.width + "px"; el.style.height = rc.height + "px";
    lockEl.style.left = (rc.right - 46 + 23 - 17) + "px";
    lockEl.style.top = (rc.top - 52) + "px";
  }
  function drawPanel() {
    var r = V4.rec;
    var holding = !!(hold && (hold.down || hold.pending));
    if (!r && !holding) { if (ov) ov.style.display = "none"; if (lockEl) lockEl.style.display = "none"; ovMode = ""; return; }
    var el = panel();
    el.style.display = "flex";
    placePanel();
    var locked = !!(r ? r.locked : (hold && hold.locked));
    var mode = locked ? "locked" : "hold";
    if (mode !== ovMode) {
      ovMode = mode;
      if (mode === "hold") {
        el.innerHTML = '<span class="zz-dot"></span><b class="zz-t" id="zzRecT">0:00</b>' +
          '<span class="zz-wave" aria-hidden="true">' + "<i></i>".repeat(16) + '</span>' +
          '<span class="zz-slide">' + ic("left") + ' Slide to cancel</span>' +
          '<span class="zz-spacer"></span>';
      } else {
        el.innerHTML = '<button type="button" class="zz-ib zz-trash" data-zz="recTrash" aria-label="Cancel the voice message">' + ic("trash") + '</button>' +
          '<span class="zz-dot"></span><b class="zz-t" id="zzRecT">0:00</b>' +
          '<span class="zz-wave" aria-hidden="true">' + "<i></i>".repeat(16) + '</span>' +
          '<button type="button" class="zz-pause" data-zz="recPause" id="zzPause"></button>' +
          '<button type="button" class="zz-go" data-zz="recStop" aria-label="Stop and listen">' + ic("check") + '</button>';
      }
    }
    var t = document.getElementById("zzRecT");
    if (t) t.textContent = fmtDur(r ? r.sec : 0);
    var pb = document.getElementById("zzPause");
    if (pb && r) { pb.innerHTML = ic(r.paused ? "play" : "pause") + (r.paused ? "<span>Resume</span>" : "<span>Pause</span>"); }
    el.classList.toggle("zz-paused", !!(r && r.paused));
    lockEl.style.display = locked ? "flex" : "none";
    lockEl.classList.toggle("zz-closed", locked);
  }

  // the padlock rises with the finger; it closes when the recording is locked
  function moveLock(dy) {
    if (!lockEl || !hold || !hold.rect) return;
    var up = Math.min(0, dy);
    lockEl.style.display = "flex";
    lockEl.style.transform = "translateY(" + Math.max(-40, up * 0.6) + "px)";
    lockEl.style.opacity = String(Math.min(1, 0.4 + (-up / LOCK_PX) * 0.6));
  }
  function resetLock() { if (lockEl) { lockEl.style.transform = ""; lockEl.style.opacity = ""; } }

  function micStart(kind, target) {
    if (V4.rec || !target) return;
    if (hold) hold.pending = true;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (stream) {
        if (hold) hold.pending = false;
        var mime = MIME.find(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || "";
        var mr;
        try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : undefined); }
        catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); toast("Voice recording is not possible on this device.", "x"); drawPanel(); return; }
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
          if (lockEl) lockEl.style.display = "none";
          if (r.cancel) { render(); return; }
          var ms = elapsed(r);
          if (ms < 800) { toast("Hold the microphone to record a voice message.", "x"); render(); return; }
          var type = String(mr.mimeType || mime || "audio/webm").split(";")[0];
          var blob = new Blob(chunks, { type: type });
          V4.prev = { kind: kind, target: target, blob: blob, ext: (EXT[type] || "webm"), sec: Math.max(1, Math.round(ms / 1000)), url: URL.createObjectURL(blob), audio: null, playing: false, once: false };
          render();
        };
        mr.start(250);
        r.timer = setInterval(function () {
          r.sec = Math.round(elapsed(r) / 1000);
          drawPanel();
          if (r.sec >= 180) micStop(false);
        }, 300);
        if (hold && !hold.down && !hold.locked) micStop(false);   // the finger was already released
        drawPanel();
      })
      .catch(function (e) {
        if (hold) hold.pending = false;
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
    v4SendFile(p.kind, p.target, p.blob, "voice." + p.ext, "voice", p.sec, { once: !!p.once });
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

  function toggleOnce() {
    var p = V4.prev;
    if (!p) return;
    p.once = !p.once;
    render();
  }

  // ---------- the composer while there is a preview ----------
  var _bar = v4Bar;
  v4Bar = function (kind, target, ph) {
    var r = V4.rec && V4.rec.kind === kind ? V4.rec : null;
    if (r || (hold && hold.down)) return _bar(kind, target, ph);   // the recording bar is drawn on top
    var p = V4.prev && V4.prev.kind === kind ? V4.prev : null;
    if (p) {
      return '<div class="zz-prev" role="group" aria-label="Voice message preview">' +
        '<button type="button" class="iconbtn" data-zz="prevDel" aria-label="Delete the voice message">' + ic("trash") + '</button>' +
        '<button type="button" class="iconbtn" data-zz="prevPlay" aria-label="' + (p.playing ? "Pause" : "Listen") + '">' + ic(p.playing ? "pause" : "play") + '</button>' +
        '<span class="v4wave" aria-hidden="true">' + "<i></i>".repeat(18) + '</span>' +
        '<b>' + fmtDur(p.sec) + '</b>' +
        '<button type="button" class="zz-onceb' + (p.once ? " on" : "") + '" data-zz="prevOnce" aria-pressed="' + !!p.once + '" title="View once" aria-label="View once"><i class="v4one">1</i></button>' +
        '<button type="button" class="btn" data-zz="prevSend" aria-label="Send the voice message">' + ic("send") + 'Send</button></div>';
    }
    return _bar(kind, target, ph);
  };

  // ---------- gestures on the microphone ----------
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest && e.target.closest('[data-v4="rec"]');
    if (!b || e.button > 0) return;
    e.preventDefault();
    var form = b.closest("form") || b.parentElement;
    hold = { y0: e.clientY, down: true, locked: false, released: false, pending: false, rect: form.getBoundingClientRect() };
    drawPanel();
    micStart(b.dataset.k, v4Target(b.dataset.k));
  }, true);

  window.addEventListener("pointermove", function (e) {
    if (!hold || !hold.down || hold.locked) return;
    var dy = e.clientY - hold.y0;
    moveLock(dy);
    if (-dy >= LOCK_PX) {
      hold.locked = true;
      if (V4.rec) V4.rec.locked = true;
      resetLock();
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (x) {}
      drawPanel();
    }
  }, true);

  function release() {
    if (!hold || !hold.down) return;
    hold.down = false;
    resetLock();
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
    else if (a === "prevOnce") toggleOnce();
    else if (a === "prevSend") sendPreview();
    else return;
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzwVoice";
  st.textContent = `
[data-v4="rec"]{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.zz-prev{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);box-sizing:border-box}
.zz-prev b{font-variant-numeric:tabular-nums;min-width:38px}
.zz-prev .v4wave{flex:1}
.zz-prev .btn{flex:none}
.zz-onceb{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:transparent;display:grid;place-items:center;flex:none;cursor:pointer;color:inherit}
.zz-onceb.on{background:#C084FC;border-color:transparent;color:#1A1033}
#zzRecOv{position:fixed;z-index:9400;display:none;align-items:center;gap:8px;padding:0 6px 0 12px;border-radius:999px;background:var(--surface,#1B1B2E);border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 24px -12px rgba(0,0,0,.7);color:inherit;box-sizing:border-box;overflow:hidden}
#zzRecOv .zz-dot{width:10px;height:10px;border-radius:50%;background:#E5484D;flex:none;animation:zzBlink 1s ease-in-out infinite}
#zzRecOv.zz-paused .zz-dot{animation:none;background:#F5B942}
#zzRecOv .zz-t{font-variant-numeric:tabular-nums;font-size:.95rem;min-width:40px}
#zzRecOv .zz-wave{flex:1;display:flex;align-items:center;gap:3px;height:22px;min-width:30px;overflow:hidden}
#zzRecOv .zz-wave i{width:3px;border-radius:3px;background:#F9A8D4;height:30%;animation:zzBar 1s ease-in-out infinite;flex:none}
#zzRecOv .zz-wave i:nth-child(3n){animation-delay:.2s;height:70%}
#zzRecOv .zz-wave i:nth-child(3n+1){animation-delay:.45s;height:45%}
#zzRecOv.zz-paused .zz-wave i{animation:none;height:30%}
#zzRecOv .zz-slide{display:inline-flex;align-items:center;gap:2px;opacity:.75;font-size:.82rem;white-space:nowrap}
#zzRecOv .zz-spacer{width:52px;flex:none}
#zzRecOv .zz-trash{width:36px;height:36px;border-radius:50%;border:0;background:rgba(229,72,77,.18);color:#FF6B6B;display:grid;place-items:center;flex:none;cursor:pointer}
#zzRecOv .zz-pause{height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:inherit;display:inline-flex;align-items:center;gap:6px;padding:0 12px;font-size:.85rem;flex:none;cursor:pointer}
#zzRecOv .zz-go{width:42px;height:42px;border-radius:50%;border:0;background:#C084FC;color:#1A1033;display:grid;place-items:center;flex:none;margin-left:auto;cursor:pointer}
#zzLock{position:fixed;z-index:9501;width:34px;height:34px;border-radius:50%;display:none;align-items:center;justify-content:center;background:rgba(27,27,46,.92);color:#fff;border:1px solid rgba(255,255,255,.2);box-shadow:0 6px 16px -6px rgba(0,0,0,.6);pointer-events:none;transition:background .2s}
#zzLock.zz-closed{background:#C084FC;color:#1A1033}
@keyframes zzBlink{50%{opacity:.3}}
@keyframes zzBar{50%{height:95%}}
`;
  document.head.appendChild(st);
})();
