/* =====================================================================
   v5 · Taper sur la citation d'un statut (dans une messagerie) : le statut s'ouvre.
   Avant, on regardait seulement la liste déjà chargée ; si elle n'était pas à jour
   (chargement en cours, ou pas encore chargée), le message « statut expiré » s'affichait à tort.
   Maintenant on demande la liste à jour, et « expiré » n'apparaît que si le statut n'y est plus.
   ===================================================================== */
openQuotedStory = async function (sid, w) {
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
  if (!s) { toast("This status has expired", "x"); return; }
  var G = fGroups(), gi = G.findIndex(function (x) { return x.uid === (s.author || w); });
  if (gi < 0) { toast("This status has expired", "x"); return; }
  var si = Math.max(0, G[gi].list.findIndex(function (x) { return x.id === sid; }));
  F.sv = { G: G, gi: gi, si: si, t0: Date.now(), views: false };
  fShow();
};
