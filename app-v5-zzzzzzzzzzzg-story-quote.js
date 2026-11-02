/* =====================================================================
   v5 · Taper sur la citation d'un statut (dans une messagerie).
   - Le statut est encore en ligne (moins de 24 h, non supprimé) : il s'ouvre.
   - Le statut n'existe plus (expiré ou supprimé) : rien ne s'ouvre. Pas de copie,
     pas de photo de remplacement, pas de message.
   ===================================================================== */
openQuotedStory = async function (sid, w) {
  if (!sid) return;
  var DAY = 86400000;
  // Older quotes kept only the first 40 characters of the id, so also accept a prefix match.
  var live = function (x) {
    return !!x && !x.deleted_at && (Date.now() - new Date(x.created_at).getTime()) < DAY;
  };
  var find = function () {
    return (F.stories || []).find(function (x) {
      return live(x) && (x.id === sid || (sid.length >= 8 && String(x.id).indexOf(sid) === 0));
    });
  };
  var s = find();
  if (!s) {
    try {
      var st = await window.__feed.stories();                 // the stories of the last 24 hours, fresh from the server
      if (Array.isArray(st)) F.stories = st;
    } catch (e) { return; }
    s = find();
  }
  if (!s) return;                                             // expired or deleted: nothing opens
  var G = fGroups(), gi = G.findIndex(function (x) { return x.uid === (s.author || w); });
  if (gi < 0) return;
  var si = Math.max(0, G[gi].list.findIndex(function (x) { return x.id === s.id; }));
  F.sv = { G: G, gi: gi, si: si, t0: Date.now(), views: false };
  fShow();
};
