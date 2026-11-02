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

/* Anneau autour du rond d'un camarade qui a mis une story (24 h) :
   coloré si une story n'est pas encore vue, gris si toutes sont vues. Liste et fiche profil. */
(function () {
  var st = document.createElement("style");
  // box-shadow (et non ::before) : .av.photo a overflow:hidden, un pseudo-élément hors du rond serait coupé
  st.textContent = ".av.zz-ring{box-shadow:0 0 0 2px var(--bg),0 0 0 4.5px #8EA0FF}" +
    ".av.zz-ring.zz-seen{box-shadow:0 0 0 2px var(--bg),0 0 0 4.5px #6b7280}";
  document.head.appendChild(st);
  function storiesOf(id) {
    var now = Date.now();
    return (F.stories || []).filter(function (s) {
      return s.author === id && !s.deleted_at && now - new Date(s.created_at).getTime() < 864e5;
    });
  }
  function ringOn(av, id) {
    var list = storiesOf(id);
    if (!list.length) { av.classList.remove("zz-ring", "zz-seen"); return; }
    av.classList.add("zz-ring");
    av.classList.toggle("zz-seen", list.every(function (s) { return F.seen.has(s.id); }));
  }
  function zzRings() {
    document.querySelectorAll('[data-a="openPeer"][data-id]').forEach(function (row) {
      var av = row.querySelector(".av");
      if (av) ringOn(av, row.dataset.id);
    });
    var stage = document.querySelector(".av3-stage .av");
    if (stage && S.view && S.view.type === "person") ringOn(stage, S.view.id);
  }
  var _rr = render;
  render = function () { var o = _rr.apply(this, arguments); try { zzRings(); } catch (e) {} return o; };
})();
