/* Liste des camarades / amis : taper le ROND d'un camarade
   - il a mis une story (dans les 24 h) : la story s'ouvre directement
   - sinon : seule la photo de profil s'ouvre en grand (on n'entre pas sur son profil)
   Le reste de la ligne ouvre la discussion comme avant. */
(function () {
  function hasStory(id) {
    var now = Date.now();
    return (F.stories || []).some(function (s) {
      return s.author === id && !s.deleted_at && now - new Date(s.created_at).getTime() < 864e5;
    });
  }
  function decide(id, img) {
    if (hasStory(id)) { fOpenStory(id); return; }
    if (img && img.src && typeof pzOpen === "function") pzOpen(img.src);
  }
  // window + capture : passe avant tous les autres gestionnaires, donc rien d'autre ne réagit à ce tap
  window.addEventListener("click", function (e) {
    var av = e.target.closest && e.target.closest(".av");
    var row = av && av.closest('[data-a="openPeer"][data-id]');
    if (!row || !S.uid) return;
    var id = row.dataset.id, img = av.querySelector("img");
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    // les stories doivent être chargées pour savoir si elle existe
    if (!F.loaded && !F.loading && typeof feedLoad === "function") {
      Promise.resolve(feedLoad()).then(function () { decide(id, img); }).catch(function () { decide(id, img); });
    } else decide(id, img);
  }, true);
})();
