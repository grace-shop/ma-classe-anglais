/* =====================================================================
   v5 · Polish: phone tab bar without empty boxes, story viewer
   (hold to pause, release to resume, tap back restarts), and
   "last seen" time in the classmates list.
   ===================================================================== */
/* ---- 1. phone tab bar: no empty square on the buttons ---- */
(function () {
  var st = document.createElement("style");
  st.id = "zzzznNav";
  st.textContent = `
@media (max-width:1099px){
  body nav.tabs button,body nav.tabs button:focus,body nav.tabs button:active,body nav.tabs button:focus-visible{outline:0!important;border:0!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important;-webkit-appearance:none!important;appearance:none!important}
  body nav.tabs button[aria-current="true"]{box-shadow:none!important}
  body nav.tabs button::-moz-focus-inner{border:0!important}
}
nav.tabs button:focus:not(:focus-visible){outline:none}
`;
  document.head.appendChild(st);
})();

/* ---- 2. story viewer: hold to pause, release to continue ---- */
(function () {
  var HOLD = 160, hold = null, suppress = false;
  var st = document.createElement("style");
  st.id = "zzzznStory";
  st.textContent = `.fsv.zz-held .fsv-bars i::after{animation-play-state:paused!important}`;
  document.head.appendChild(st);

  function vid() { return document.getElementById("fsvVid"); }
  function markHeld(on) { var h = document.querySelector(".fsv"); if (h) h.classList.toggle("zz-held", !!on); }
  function pauseStory() {
    if (!F.sv || F.sv.paused || !fCur()) return;
    var dur = fSdur(fCur().s) * 1000;
    F.sv.rem = Math.max(300, dur - (Date.now() - F.sv.t0));
    F.sv.paused = true;
    clearTimeout(F.svT);
    markHeld(true);
    var v = vid(); if (v) try { v.pause(); } catch (e) {}
  }
  function resumeStory() {
    if (!F.sv || !F.sv.paused) return;
    F.sv.paused = false;
    markHeld(false);
    var v = vid(); if (v) try { v.play(); } catch (e) {}
    if (F.sv.views || F.sv.typing || F.share || !fCur()) return;
    clearTimeout(F.svT);
    F.svT = setTimeout(function () { fStep(1); }, F.sv.rem || 1000);
  }
  // keep the held state when the story host is redrawn
  var _fs = feedSync;
  feedSync = function () { var r = _fs.apply(this, arguments); if (F.sv && F.sv.paused) markHeld(true); return r; };

  document.addEventListener("pointerdown", function (e) {
    if (!F.sv || !e.target || !e.target.closest) return;
    if (!e.target.closest(".fsv")) return;
    if (e.target.closest("input,textarea,form,.fsv-views,.fsv-bot button,.fsv-top button,.fsv-snd")) return;
    if (hold) clearTimeout(hold.timer);
    hold = { x: e.clientX, y: e.clientY, timer: setTimeout(function () { if (hold) pauseStory(); }, HOLD) };
  }, true);
  document.addEventListener("pointermove", function (e) {
    if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 14) { clearTimeout(hold.timer); hold = null; }
  }, true);
  function end() {
    if (!hold) return;
    clearTimeout(hold.timer);
    var wasHeld = F.sv && F.sv.paused;
    hold = null;
    if (wasHeld) { suppress = true; setTimeout(function () { suppress = false; }, 350); resumeStory(); }
  }
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", end, true);
  document.addEventListener("click", function (e) {
    if (suppress && e.target.closest && e.target.closest(".fsv")) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  // tap back on the very first story: play it again from the start
  var _step = fStep;
  fStep = function (d) {
    var v = F.sv;
    if (v && d < 0 && v.gi === 0 && v.si === 0) {
      v.paused = false;
      var h = document.getElementById("fsvhost"); if (h) h._h = null;
      fShow();
      var vv = vid(); if (vv) { try { vv.currentTime = 0; vv.play(); } catch (e) {} }
      return;
    }
    return _step(d);
  };
})();

/* ---- 3. classmates list: online now, or how long ago they left ---- */
(function () {
  function seenLine() {
    if (!S.view || S.view.type !== "peers" || !PR.loaded) return;
    document.querySelectorAll(".pv-list .it[data-id]").forEach(function (row) {
      var u = row.dataset.id, txt = row.querySelector(".txt");
      if (!txt) return;
      var d = (PR.dir || []).find(function (x) { return x.uid === u; });
      var on = !!S.peers[u];
      var t = d && Number(d.last_active || 0);
      var label = on ? "Online now" : (t ? "Last seen " + ago(t) : "");
      var el = txt.querySelector(".zz-seen");
      if (!label) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement("small"); el.className = "zz-seen"; txt.insertBefore(el, txt.querySelector("span")); }
      el.textContent = label;
      el.classList.toggle("on", on);
    });
  }
  var st = document.createElement("style");
  st.id = "zzzznSeen";
  st.textContent = `
.pv-list .zz-seen{display:block;font-size:.72rem;color:var(--muted,#8E98C4);font-weight:600;margin:1px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-list .zz-seen.on{color:#7DF7D2}
.pv-list .zz-seen.on::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#7DF7D2;margin-right:6px;vertical-align:middle;box-shadow:0 0 8px #7DF7D2}
`;
  document.head.appendChild(st);
  var _r = render;
  render = function () { var o = _r.apply(this, arguments); try { seenLine(); } catch (e) {} return o; };
  setInterval(function () { try { seenLine(); } catch (e) {} }, 30000);
})();
