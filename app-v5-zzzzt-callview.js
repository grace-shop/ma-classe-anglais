/* =====================================================================
   v5 · Video call layout, like WhatsApp:
   - in a two-person video call, the other person is shown full screen
     and you are in a small corner; tap the small picture to swap them.
   - each tile shows the person's profile photo as its background.
   ===================================================================== */
(function () {
  var bigKey = null; // the tile shown full screen, chosen by a tap

  function photoOf(key) {
    try {
      var p = typeof personOf === "function" ? personOf(key) : null;
      var url = (p && p.photo) || (key === "me" && S.me && S.me.photo) || "";
      return /^https:\/\/[^/]+\/storage\/v1\/object\/public\/avatars\//.test(url) ? url : "";
    } catch (e) { return ""; }
  }

  function layout() {
    var grid = document.getElementById("csGrid");
    if (!grid) return;
    var tiles = [].slice.call(grid.querySelectorAll(":scope > .call-tile"));
    var swap = !!CALL.video && tiles.length === 2;
    grid.classList.toggle("zz-swap", swap);

    var big = null;
    var shared = tiles.filter(function (t) { return t.classList.contains("zz-shared"); })[0];
    if (swap) {
      var keys = tiles.map(function (t) { return t.dataset.u; });
      if (shared) big = shared.dataset.u;
      else if (bigKey && keys.indexOf(bigKey) !== -1) big = bigKey;
      else big = keys.filter(function (k) { return k !== "me"; })[0] || keys[0];
    }
    tiles.forEach(function (t) {
      var u = t.dataset.u;
      t.classList.toggle("zz-big", swap && u === big);
      t.classList.toggle("zz-pip", swap && u !== big);
      var url = photoOf(u);
      if (url) {
        if (t.dataset.zzp !== url) {
          t.dataset.zzp = url;
          t.style.backgroundImage = 'url("' + url + '")';
        }
        t.classList.add("zz-ph");
      } else if (t.dataset.zzp) {
        t.dataset.zzp = ""; t.style.backgroundImage = ""; t.classList.remove("zz-ph");
      }
    });
  }

  // tap a small picture to make it the big one
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var tile = e.target.closest("#csGrid.zz-swap > .call-tile");
    if (!tile) return;
    bigKey = tile.dataset.u;
    layout();
  }, true);

  var _sync = callScreenSync;
  callScreenSync = function () {
    var r = _sync.apply(this, arguments);
    try { layout(); } catch (e) {}
    return r;
  };

  var st = document.createElement("style");
  st.id = "zzzztCallView";
  st.textContent = `
#callScr .call-grid.zz-swap{flex:1 1 auto;min-height:0;position:relative;display:block}
#callScr .call-grid.zz-swap .call-tile{position:absolute;transition:all .25s ease;cursor:pointer;aspect-ratio:auto}
#callScr .call-grid.zz-swap .call-tile.zz-big{inset:0;width:auto;height:auto;border-radius:22px}
#callScr .call-grid.zz-swap .call-tile.zz-pip{top:10px;right:10px;width:112px;height:162px;z-index:3;box-shadow:0 8px 22px -6px rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.35)}
#callScr .call-tile.zz-ph{background-color:#0b0e1c;background-size:cover;background-position:center}
#callScr .call-tile.zz-ph .call-av{display:none}
`;
  document.head.appendChild(st);
})();
