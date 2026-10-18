/* =====================================================================
   v5 · The classmates list refreshes quietly.
   The inbox is checked every few seconds. A redraw happened on every
   check, so the screen blinked even when nothing had changed. Now the
   screen is only redrawn when a message, a read mark, a reaction or
   the classmates list really changed.
   ===================================================================== */
(function () {
  function signature() {
    try {
      return JSON.stringify([
        PR.inbox.map(function (x) { return [x.id, x.read_at, x.deleted_at, x.opened_at, JSON.stringify(x.react || {}), x.body, x.att && x.att.k]; }),
        PR.dir && PR.dir.map ? JSON.stringify(PR.dir, function (k, v) { return k === "last_active" ? undefined : v; }) : "",
        PR.err, PR.loaded
      ]);
    } catch (e) { return ""; }
  }

  async function peerRefreshQuiet() {
    if (!peerOn()) return;
    var before = signature();
    try {
      var both = await Promise.all([window.__peer.dir(), window.__peer.inbox()]);
      var d = both[0], i = both[1];
      PR.dir = d;
      if (!i.length && PR.inbox.length) { PR.loaded = true; PR.err = ""; }
      else {
        var have = new Set(i.map(function (x) { return x.id; })), cut = Date.now() - 10 * 60000;
        var keep = PR.inbox.filter(function (x) { return !have.has(x.id) && (String(x.id).indexOf("tmp") === 0 || +new Date(x.created_at) > cut); });
        PR.inbox = keep.concat(i).sort(function (a, b) { return +new Date(b.created_at) - +new Date(a.created_at); });
        PR.loaded = true; PR.err = "";
      }
    } catch (e) {
      PR.loaded = true;
      PR.err = navigator.onLine ? "Cannot load messages right now." : "No network: your messages will arrive as soon as you are connected.";
    }
    var changed = signature() !== before;
    // the friends list is refreshed too; it redraws only when it changed
    var fb = typeof FR !== "undefined" ? JSON.stringify(FR.list) : "";
    try { if (typeof frRefresh === "function") await frRefresh(); } catch (e) {}
    var fa = typeof FR !== "undefined" ? JSON.stringify(FR.list) : "";
    if (changed || fa !== fb) render();
  }
  peerRefresh = peerRefreshQuiet;
})();
