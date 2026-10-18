/* =====================================================================
   v5 · Talk freely with Nova, like a voice assistant (Gemini, Siri…):
   no need to tap the mic each time. Nova listens, answers out loud, and
   listens again by itself. If you speak while Nova is talking, Nova stops
   and listens to you. Tap "End" to stop.
   ===================================================================== */
(function () {
  var L = null; // live session state

  function SRclass() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
  function native() { try { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechRecognition || null; } catch (e) { return null; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function waitUntil(fn) { return new Promise(function (res) { (function tick() { if (!L || !L.on || !fn()) { if (!L || !L.on) return res(); return setTimeout(tick, 150); } res(); })(); }); }

  function setPhase(p, text) {
    if (!L) return;
    L.phase = p;
    var el = document.getElementById("novaLive");
    if (!el) return;
    el.dataset.phase = p;
    el.querySelector(".nl-status").textContent = text;
  }
  function heard(text) {
    var el = document.querySelector("#novaLive .nl-heard");
    if (el) el.textContent = "“" + text + "”";
  }

  // Web speech: one recognizer stays open for the whole conversation and is
  // restarted by itself when the browser stops it. Words are kept as they
  // arrive, so nothing said between two turns is lost, and the text you are
  // saying shows on screen while you speak.
  function showHeard() {
    if (!L) return;
    heard(((L.buf || "") + " " + (L.interim || "")).trim());
  }
  function webStart() {
    var R = SRclass();
    if (!R || !L || !L.on || L.fatal) return;
    var r = new R();
    r.lang = "en-US"; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    r.onresult = function (ev) {
      if (!L) return;
      var fin = "", inter = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var t = (ev.results[i][0] && ev.results[i][0].transcript) || "";
        if (ev.results[i].isFinal) fin += t + " "; else inter += t + " ";
      }
      if (fin.trim()) L.buf = (L.buf + " " + fin).trim();
      L.interim = inter.trim();
      if (fin.trim() || inter.trim()) L.last = Date.now();
      showHeard();
    };
    r.onerror = function (ev) {
      if (ev && (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture")) { if (L) L.fatal = true; }
    };
    r.onend = function () {
      if (L && L.rec === r) L.rec = null;
      if (L && L.on && !L.fatal) setTimeout(webStart, 150);
    };
    L.rec = r;
    try { r.start(); } catch (e) { L.rec = null; setTimeout(webStart, 500); }
  }
  // resolves once the person has paused for PAUSE_MS after speaking
  function takeUtterance() {
    return new Promise(function (res) {
      (function tick() {
        if (!L || !L.on || L.fatal) return res("");
        if (L.buf && Date.now() - (L.last || 0) >= PAUSE_MS) {
          var t = L.buf;
          L.buf = ""; L.interim = "";
          showHeard();
          return res(t);
        }
        setTimeout(tick, 100);
      })();
    });
  }

  // one utterance: resolves with the text, or "" when nothing was said
  function listenOnce() {
    if (SRclass()) return takeUtterance();
    return new Promise(function (res) {
      var P = native();
      if (!SRclass() && P) {
        L.stopper = function () { try { P.stop(); } catch (e) {} };
        P.start({ language: "en-US", maxResults: 1, prompt: "", partialResults: false, popup: false })
          .then(function (r) { L.stopper = null; res(((r && r.matches) || [])[0] || ""); })
          .catch(function (e) { L.stopper = null; if (e && /denied|permission/i.test(String(e.message || e))) L.fatal = true; res(""); });
        return;
      }
      var R = SRclass();
      if (!R) { L.fatal = true; res(""); return; }
      var r = new R();
      r.lang = "en-US"; r.interimResults = false; r.continuous = false; r.maxAlternatives = 1;
      var got = "";
      r.onresult = function (ev) { try { got = ev.results[0][0].transcript || ""; } catch (e) {} };
      r.onerror = function (ev) { if (ev && (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture")) L.fatal = true; };
      r.onend = function () { L.rec = null; L.stopper = null; res(got); };
      L.rec = r;
      L.stopper = function () { try { r.abort(); } catch (e) {} };
      try { r.start(); } catch (e) { L.rec = null; res(""); }
    });
  }

  // keeps one listening session open; it is reused while Nova talks
  function startListen() {
    if (!L.pending) L.pending = listenOnce().then(function (t) { L.pending = null; return t; });
    return L.pending;
  }

  function speechDone() {
    return new Promise(function (res) {
      (function tick() {
        if (!L || !L.on) return res();
        if (!(window.speechSynthesis && speechSynthesis.speaking)) return setTimeout(res, 250);
        setTimeout(tick, 150);
      })();
    });
  }

  function looksLikeEcho(text, reply) {
    if (!reply) return false;
    var said = String(text).toLowerCase().split(/\W+/).filter(Boolean);
    if (!said.length) return false;
    var R = " " + String(reply).toLowerCase().replace(/[^a-z\s]/g, " ") + " ";
    var hit = said.filter(function (w) { return R.indexOf(" " + w + " ") !== -1; }).length;
    return hit / said.length >= 0.6;
  }

  function lastAi() {
    var T = S.talk;
    if (!T) return "";
    for (var i = T.turns.length - 1; i >= 0; i--) if (T.turns[i].role === "ai") return T.turns[i].text || "";
    return "";
  }

  // Wait for a short silence before answering, so a pause in the middle
  // of a sentence does not cut the person off. Speech that keeps coming
  // within the window is added to the same message.
  var PAUSE_MS = 1400;
  async function settle(first) {
    var acc = String(first || "").trim();
    if (SRclass()) return acc; // web: takeUtterance already waited for the pause
    while (L && L.on && !L.fatal) {
      var got = await Promise.race([startListen(), sleep(PAUSE_MS).then(function () { return null; })]);
      if (got === null) break;                    // silence: the person is done
      if (got && got.trim()) acc = (acc + " " + got.trim()).trim();
    }
    return acc;
  }

  async function loop() {
    var queued = null;
    while (L && L.on) {
      if (S.tab !== "talk" || !S.talk) break;
      var text;
      if (queued !== null) { text = queued; queued = null; }
      else { setPhase("listen", "Listening… speak in English"); text = await startListen(); }
      if (!L || !L.on) break;
      if (L.fatal) { toast("Allow the microphone to talk with Nova.", "x"); break; }
      if (!text || !text.trim()) continue;
      // Nova is talking: an echo of her own voice is ignored
      if (looksLikeEcho(text, L.reply)) continue;
      text = await settle(text);
      if (!L || !L.on) break;
      if (!text) continue;
      if (window.speechSynthesis && speechSynthesis.speaking) speechSynthesis.cancel(); // you spoke: Nova stops
      heard(text);
      setPhase("think", "Nova is thinking…");
      talkSend(text);
      startListen();                               // keep listening while Nova thinks
      await waitUntil(function () { return !S.talk || !S.talk.busy; });
      if (!L || !L.on || !S.talk) break;
      L.reply = lastAi();
      if (!TALK_VOICE && L.reply) speak(L.reply, "en");
      setPhase("speak", "Nova is speaking… just talk to interrupt");
      var r = await Promise.race([speechDone().then(function () { return null; }), startListen()]);
      if (typeof r === "string" && r.trim()) queued = r;
    }
    stopLive();
  }

  function startLive() {
    if (L) return;
    if (!S.talk || !SRclass() && !native()) { toast("Talking to Nova needs the microphone on this device.", "x"); return; }
    L = { on: true, phase: "listen", pending: null, rec: null, stopper: null, fatal: false, reply: "", buf: "", interim: "", last: 0 };
    var box = document.createElement("div");
    box.id = "novaLive";
    box.dataset.phase = "listen";
    box.innerHTML = '<div class="nl-orb" aria-hidden="true"></div><div class="nl-status">Starting…</div><div class="nl-heard"></div>' +
      '<button type="button" class="btn ghost" data-zz="liveEnd">End conversation</button>';
    document.body.appendChild(box);
    if (SRclass()) webStart();
    loop();
  }

  function stopLive() {
    if (!L) return;
    L.on = false;
    try { if (L.rec) L.rec.abort(); } catch (e) {}
    try { if (L.stopper) L.stopper(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    L = null;
    var el = document.getElementById("novaLive");
    if (el) el.remove();
    if (S.tab === "talk") render();
  }

  // the button under the talk, above the typing bar
  var _tv = talkView;
  talkView = function () {
    var html = _tv.apply(this, arguments);
    if (!S.talk || S.talk.summary || L) return html;
    var btn = '<div class="nl-start"><button type="button" class="btn" data-zz="liveStart">' + ic("mic") + 'Talk freely with Nova</button></div>';
    return html.replace('<form class="talk-comp glass"', btn + '<form class="talk-comp glass"');
  };

  window.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-zz]");
    if (!b) return;
    if (b.dataset.zz === "liveStart") { startLive(); e.stopImmediatePropagation(); e.preventDefault(); }
    else if (b.dataset.zz === "liveEnd") { stopLive(); e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzxNovaLive";
  st.textContent = `
.nl-start{display:flex;justify-content:center;margin:6px 0}
#novaLive{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;background:radial-gradient(120% 90% at 50% 20%,#1B1F4A,#05060F 75%);color:#fff}
#novaLive .nl-orb{width:180px;height:180px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#E0E7FF,#818CF8 45%,#4F46E5 80%);box-shadow:0 0 60px -10px rgba(129,140,248,.8);animation:nlBreath 2.4s ease-in-out infinite}
#novaLive[data-phase="listen"] .nl-orb{animation:nlBreath 1.6s ease-in-out infinite}
#novaLive[data-phase="think"] .nl-orb{background:radial-gradient(circle at 35% 30%,#FDE68A,#F59E0B 50%,#B45309 85%);animation:nlSpin 1.2s linear infinite}
#novaLive[data-phase="speak"] .nl-orb{background:radial-gradient(circle at 35% 30%,#A7F3D0,#34D399 45%,#047857 85%);animation:nlPulse .5s ease-in-out infinite alternate}
#novaLive .nl-status{font:600 1.1rem/1.3 system-ui,sans-serif}
#novaLive .nl-heard{min-height:1.4em;font:500 .95rem/1.4 system-ui,sans-serif;color:#C4B5FD;max-width:32ch}
@keyframes nlBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes nlPulse{from{transform:scale(.96)}to{transform:scale(1.08)}}
@keyframes nlSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#novaLive .nl-orb{animation:none!important}}
`;
  document.head.appendChild(st);
})();
