/* =====================================================================
   v5 · Taper sur la citation d'un statut (dans une messagerie) : le statut s'ouvre.
   Avant, on regardait seulement la liste déjà chargée ; si elle n'était pas à jour
   (chargement en cours, ou pas encore chargée), le message « statut expiré » s'affichait à tort.
   Maintenant on demande la liste à jour, et « expiré » n'apparaît que si le statut n'y est plus.
   ===================================================================== */
openQuotedStory = async function (sid, w, snap) {
  if (!sid) return;
  var find = function () { return (F.stories || []).find(function (x) { return x.id === sid; }); };
  var s = find();
  if (!s) {
    try {
      var st = await window.__feed.stories();                 // the stories of the last 24 hours, fresh from the server
      if (Array.isArray(st)) F.stories = st;
    } catch (e) { toast("Could not open this status. Try again.", "x"); return; }
    s = find();
  }
  // Diagnostic: say exactly why the status is not shown (no guessing).
  var why = function (step) {
    var n = (F.stories || []).length;
    return "Status not shown (" + step + "). Loaded: " + n + ". Id: " + String(sid).slice(0, 8);
  };
  if (!s && snap && snap.t != null) {
    // Fallback: the server did not return the status, but the reply kept a copy of it.
    var mt = snap.mt || "";
    if (snap.p && !mt) {                                   // old replies have no type: read it from the stored file
      try { var bl = await srcBlob({ k: "m", id: snap.p, t: "" }); mt = (bl && bl.type) || ""; } catch (e) {}
    }
    var copy = { id: sid, author: w, who: { name: snap.n || "Student" }, created_at: new Date().toISOString(),
                 body: snap.t, media: snap.p ? { p: snap.p, t: mt || "image/jpeg" } : null, bg: snap.bg || null, snapshot: true };
    F.sv = { G: [{ uid: w, who: copy.who, list: [copy] }], gi: 0, si: 0, t0: Date.now(), views: false };
    fShow();
    return;
  }
  if (!s) { toast(why("not in the 24 h list"), "x"); return; }
  var G = fGroups(), gi = G.findIndex(function (x) { return x.uid === (s.author || w); });
  if (gi < 0) { toast(why("author group missing"), "x"); return; }
  var si = Math.max(0, G[gi].list.findIndex(function (x) { return x.id === sid; }));
  F.sv = { G: G, gi: gi, si: si, t0: Date.now(), views: false };
  fShow();
};
