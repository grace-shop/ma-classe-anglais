/* =====================================================================
   v5 · Video call layout, full screen:
   - two people: the other person fills the screen, you are a small picture in a corner.
     Drag the small picture wherever you want (the place is kept). Tap it to swap the two.
   - a shared screen is shown big and whole, as soon as someone shares.
   - while the call is ringing, your own camera fills the screen.
   - the buttons and the name fade out after a few seconds; tap the screen to show or hide them.
     The timer and the pictures stay.
   ===================================================================== */
(function () {
  var bigKey = null;               // the tile shown full screen, chosen by a tap
  var POS_KEY = "mca_pip_pos";
  var pipPos = null;
  try { pipPos = JSON.parse(localStorage.getItem(POS_KEY) || "null"); } catch (e) { pipPos = null; }
  var dragEnd = 0, hideT = null;

  function photoOf(key) {
    try {
      var p = typeof personOf === "function" ? personOf(key) : null;
      var url = (p && p.photo) || (key === "me" && S.me && S.me.photo) || "";
      return /^https:\/\/[^/]+\/storage\/v1\/object\/public\/avatars\//.test(url) ? url : "";
    } catch (e) { return ""; }
  }
  function stage() { return document.getElementById("callScr"); }

  function layout() {
    var grid = document.getElementById("csGrid");
    if (!grid) return;
    var el = stage();
    var tiles = [].slice.call(grid.querySelectorAll(":scope > .call-tile"));
    var n = tiles.length;
    var video = !!CALL.video;
    var swap = video && n >= 1 && n <= 2;
    grid.classList.toggle("zz-swap", swap);
    if (el) el.classList.toggle("cs-video", video);

    var keys = tiles.map(function (t) { return t.dataset.u; });
    var shared = keys.filter(function (k) { var t = grid.querySelector('[data-u="' + k + '"]'); return t && t.classList.contains("zz-shared"); })[0];
    // the other person is shown big once their picture arrives; until then (ringing) your own camera fills the screen
    var others = keys.filter(function (k) { if (k === "me") return false; var t = grid.querySelector('[data-u="' + k + '"]'); return t && t.classList.contains("on"); });
    var big = null, pip = null;
    if (swap) {
      if (shared) big = shared;
      else if (others.length) big = bigKey && others.indexOf(bigKey) !== -1 ? bigKey : others[0];
      else big = "me";
      if (bigKey === "me" && !shared && others.length) big = "me";
      pip = keys.filter(function (k) { return k !== big && (k === "me" || others.indexOf(k) !== -1 || k === shared); })[0] || null;
    }
    tiles.forEach(function (t) {
      var u = t.dataset.u;
      var isBig = swap && u === big, isPip = swap && u === pip;
      t.classList.toggle("zz-big", isBig);
      t.classList.toggle("zz-pip", isPip);
      t.classList.toggle("zz-off", swap && !isBig && !isPip);
      if (isPip && pipPos) { t.style.left = pipPos.x + "px"; t.style.top = pipPos.y + "px"; t.style.right = "auto"; t.style.bottom = "auto"; }
      else { t.style.left = ""; t.style.top = ""; t.style.right = ""; t.style.bottom = ""; }
      var url = photoOf(u);
      if (url) {
        if (t.dataset.zzp !== url) { t.dataset.zzp = url; t.style.backgroundImage = 'url("' + url + '")'; }
        t.classList.add("zz-ph");
      } else if (t.dataset.zzp) {
        t.dataset.zzp = ""; t.style.backgroundImage = ""; t.classList.remove("zz-ph");
      }
    });
  }

  /* ---- the small picture can be moved ---- */
  var drag = null;
  function clampPip(x, y, w, h) {
    var W = window.innerWidth, H = window.innerHeight;
    return { x: Math.max(8, Math.min(x, W - w - 8)), y: Math.max(8, Math.min(y, H - h - 8)) };
  }
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest("#csGrid.zz-swap > .zz-pip");
    if (!t || e.button > 0) return;
    var r = t.getBoundingClientRect();
    drag = { el: t, sx: e.clientX, sy: e.clientY, x: r.left, y: r.top, w: r.width, h: r.height, moved: false };
  }, true);
  document.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
    drag.moved = true;
    var p = clampPip(drag.x + dx, drag.y + dy, drag.w, drag.h);
    drag.el.style.left = p.x + "px"; drag.el.style.top = p.y + "px";
    drag.el.style.right = "auto"; drag.el.style.bottom = "auto";
    drag.last = p;
  }, true);
  function endDrag() {
    if (!drag) return;
    if (drag.moved && drag.last) {
      pipPos = drag.last;
      try { localStorage.setItem(POS_KEY, JSON.stringify(pipPos)); } catch (e) {}
      dragEnd = Date.now();
    }
    drag = null;
  }
  document.addEventListener("pointerup", endDrag, true);
  document.addEventListener("pointercancel", endDrag, true);

  /* ---- tap to swap, tap the screen to show or hide the controls ---- */
  function uiShow() {
    var el = stage();
    if (!el) return;
    el.classList.remove("cs-hidden");
    clearTimeout(hideT);
    if (CALL.video) hideT = setTimeout(uiHide, 3500);
  }
  function uiHide() {
    var el = stage();
    if (!el || !CALL.video) return;
    var add = document.getElementById("csAdd");
    if (add && !add.hidden) return;   // the list of people stays open while it is used
    el.classList.add("cs-hidden");
  }
  document.addEventListener("click", function (e) {
    var el = stage();
    if (!el || el.hidden || !e.target.closest) return;
    if (Date.now() - dragEnd < 400) { e.stopPropagation(); e.preventDefault(); return; }
    var tile = e.target.closest("#csGrid.zz-swap > .call-tile");
    if (tile && tile.classList.contains("zz-pip")) { bigKey = tile.dataset.u; layout(); return; }
    if (e.target.closest("#callScr .call-btns, #callScr .call-add, #callScr .zz-min, #callScr .zz-pill")) { uiShow(); return; }
    if (!CALL.video) return;
    if (el.classList.contains("cs-hidden")) uiShow(); else uiHide();
  }, true);
  // a touch on the screen keeps the controls up while they are shown (a tap while hidden is handled by click)
  document.addEventListener("pointerdown", function (e) {
    var el = stage();
    if (!el || !CALL.video || el.classList.contains("cs-hidden") || !(e.target.closest && e.target.closest("#callScr"))) return;
    clearTimeout(hideT); hideT = setTimeout(uiHide, 3500);
  }, true);

  var _sync = callScreenSync;
  callScreenSync = function () {
    var r = _sync.apply(this, arguments);
    try { layout(); } catch (e) {}
    return r;
  };
  var _show = callScreenShow;
  callScreenShow = function () {
    var r = _show.apply(this, arguments);
    try { uiShow(); } catch (e) {}
    return r;
  };

  var st = document.createElement("style");
  st.id = "zzzztCallView";
  st.textContent = `
#callScr.cs-video{padding:0!important;gap:0!important}
#callScr.cs-video .zz-stage{position:absolute;inset:0;z-index:1;display:block}
#callScr.cs-video .zz-bar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;padding:0;z-index:8}
#callScr.cs-video .call-top{position:absolute;top:0;left:0;right:0;z-index:7;display:block;padding:calc(env(safe-area-inset-top,0px) + 16px) 64px 28px;text-align:center;pointer-events:none;background:linear-gradient(rgba(5,6,15,.6),rgba(5,6,15,0));transition:opacity .25s}
#callScr.cs-video .call-top>div{width:100%}
#callScr.cs-video #csTitle{display:block;font-size:1.2rem;font-weight:800;text-shadow:0 2px 12px rgba(0,0,0,.7);transition:opacity .25s}
#callScr.cs-video .call-top small{text-shadow:0 2px 10px rgba(0,0,0,.7);font-size:.95rem}
#callScr.cs-video .call-grid.zz-swap{position:absolute!important;inset:0;display:block;min-height:0}
#callScr.cs-video .call-grid.zz-swap .call-tile{position:absolute;aspect-ratio:auto;border:0;border-radius:0;cursor:pointer}
#callScr.cs-video .call-grid.zz-swap .call-tile.zz-big{inset:0;width:100%;height:100%}
#callScr.cs-video .call-grid.zz-swap .call-tile.zz-pip{top:96px;right:12px;width:116px;height:172px;border-radius:18px;z-index:4;box-shadow:0 10px 26px -8px rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.35);touch-action:none;cursor:grab}
#callScr.cs-video .call-grid:not(.zz-swap){position:absolute;inset:0;padding:96px 12px 130px;box-sizing:border-box;height:100%;align-content:center}
#callScr.cs-video .call-tile.zz-big .call-nm{display:none}
#callScr.cs-video .call-tile.zz-off{display:none}
#callScr.cs-video .call-tile video{object-fit:cover}
#callScr.cs-video .call-tile.zz-shared video{object-fit:contain;background:#000}
#callScr.cs-video .call-btns{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);z-index:8;width:max-content;max-width:calc(100% - 20px);flex-wrap:nowrap;gap:10px;padding:10px 12px;border-radius:999px;background:rgba(14,17,33,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 10px 30px -10px rgba(0,0,0,.7);transition:opacity .25s}
#callScr.cs-video .call-add{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 104px);z-index:9}
#callScr.cs-video.cs-hidden #csTitle,#callScr.cs-video.cs-hidden .call-btns,#callScr.cs-video.cs-hidden .zz-min,#callScr.cs-video.cs-hidden .call-tile.zz-big .call-nm{opacity:0;pointer-events:none}
#callScr.cs-video.cs-hidden .call-top{background:none}
#callScr.cs-video.cs-hidden .call-btns{pointer-events:none}
`;
  document.head.appendChild(st);
})();
