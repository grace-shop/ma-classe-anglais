/* =====================================================================
   v5 · Call history in the chat, and a call you can minimise.
   - One-to-one calls leave a line in the chat of both people:
       "Missed voice call" / "Missed video call" when nobody answered,
       "Voice call · 3 min 12 s" / "Video call · 3 min 12 s" when it was answered.
   - While in a call, the call screen can be minimised to a small pill
     that stays on top of the app; tap the pill to open the call again.
   ===================================================================== */
(function () {
  function dur(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + " min " + r + " s" : r + " s";
  }

  // one line per call, written once. The line is sent to the server only:
  // no temporary copy is added to the inbox (a temporary copy is never removed
  // by the refresh, so every call used to show "Missed call" several times).
  var WRITTEN = {};
  function logLine(text, callId) {
    var key = String(callId || "") + "|" + text;
    if (callId && WRITTEN[key]) return;
    if (callId) WRITTEN[key] = true;
    var to = (CALL.logTo || []).filter(Boolean);
    to.forEach(function (u) {
      try { window.__peer.send(u, text, null, null).catch(function () {}); } catch (e) {}
    });
  }

  // remember who we called, for the history line
  var _cs = callStart;
  callStart = async function (kind, uids) {
    CALL.logTo = (uids || []).filter(function (u) { return u && u !== S.uid; });
    CALL.logKind = kind;
    CALL.connAt = null;
    return _cs.apply(this, arguments);
  };

  // the moment someone picks up
  var _st = callScreenStatus;
  callScreenStatus = function () {
    try {
      if (!CALL.connAt && Object.values(CALL.peers).some(function (P) { return P.state === "connected"; })) CALL.connAt = Date.now();
    } catch (e) {}
    var r = _st.apply(this, arguments);
    try {
      var pill = document.querySelector("#callScr .zz-pill");
      if (pill) {
        pill.querySelector(".zz-who").textContent = (document.getElementById("csTitle") || {}).textContent || "Call";
        pill.querySelector(".zz-t").textContent = (document.getElementById("csStatus") || {}).textContent || "";
      }
    } catch (e) {}
    return r;
  };

  // when the call ends (the host writes the line)
  var _cl = callLeave;
  callLeave = async function () {
    try {
      if (CALL.id && CALL.host === S.uid && CALL.logKind === "duo" && !CALL.group && (CALL.logTo || []).length) {
        var v = !!CALL.video;
        if (CALL.connAt) logLine((v ? "Video call" : "Voice call") + " · " + dur(Math.max(1, Math.round((Date.now() - CALL.connAt) / 1000))), CALL.id);
        else logLine(v ? "Missed video call" : "Missed voice call", CALL.id);
      }
    } catch (e) {}
    return _cl.apply(this, arguments);
  };

  // minimise to a pill
  var _sh = callScreenShow;
  callScreenShow = function () {
    _sh.apply(this, arguments);
    var el = document.getElementById("callScr");
    if (!el) return;
    el.classList.remove("zz-mini");
    if (!el.querySelector(".zz-min")) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "zz-min"; b.title = "Minimise"; b.setAttribute("aria-label", "Minimise the call");
      b.textContent = "↙";
      // a stage holds the minimise bar just above the tiles
      var grid = document.getElementById("csGrid");
      if (grid && !grid.parentNode.classList.contains("zz-stage")) {
        var stage = document.createElement("div"); stage.className = "zz-stage";
        var bar = document.createElement("div"); bar.className = "zz-bar";
        grid.parentNode.insertBefore(stage, grid);
        stage.appendChild(bar); stage.appendChild(grid);
      }
      var where = el.querySelector(".zz-bar") || el;
      where.appendChild(b);
      var p = document.createElement("div");
      p.className = "zz-pill";
      p.innerHTML = '<span class="zz-dot"></span><b class="zz-who"></b><small class="zz-t"></small><span class="zz-open">Open</span>';
      el.appendChild(p);
    }
  };
  document.addEventListener("click", function (e) {
    var el = document.getElementById("callScr");
    if (!el || el.hidden || !e.target.closest) return;
    if (e.target.closest("#callScr .zz-min")) { el.classList.add("zz-mini"); e.stopPropagation(); e.preventDefault(); return; }
    if (el.classList.contains("zz-mini") && e.target.closest("#callScr .zz-pill")) el.classList.remove("zz-mini");
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzrCallLog";
  st.textContent = `
#callScr .zz-stage{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center}
#callScr .zz-bar{display:flex;justify-content:flex-end;padding:0 4px 6px;flex:none}
#callScr .zz-min{position:relative;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.2);color:#fff;font-size:1.15rem;font-weight:700;cursor:pointer;box-shadow:0 6px 16px -6px rgba(0,0,0,.6)}
#callScr .zz-pill{display:none;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(12,15,30,.94);color:#fff;border:1px solid rgba(120,230,195,.5);box-shadow:0 0 22px -4px rgba(110,231,193,.6);font:600 .8rem/1.1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
#callScr .zz-pill small{color:#9FF5DA;font-weight:600}
#callScr .zz-dot{width:8px;height:8px;border-radius:50%;background:#6EE7C1;box-shadow:0 0 10px #6EE7C1;animation:zzDotPulse 1.4s ease-in-out infinite}
@keyframes zzDotPulse{50%{opacity:.35}}
#callScr .zz-open{color:#0B0D18;background:#6EE7C1;border-radius:999px;padding:4px 9px;font-weight:800}
#callScr.zz-mini{position:fixed!important;inset:auto 12px calc(96px + env(safe-area-inset-bottom,0px)) auto!important;width:auto!important;height:auto!important;background:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;pointer-events:none;z-index:9990}
#callScr.zz-mini>*{display:none!important}
#callScr.zz-mini>.zz-pill{display:flex!important;pointer-events:auto}
`;
  document.head.appendChild(st);
})();
