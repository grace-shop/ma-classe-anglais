/* Liste des camarades / amis (comme WhatsApp) : taper la photo ouvre le PROFIL, même si la personne a mis une story.
   La story ne s'ouvre que depuis l'anneau de story (bulles en haut de l'accueil). Taper le reste de la ligne ouvre la discussion. */
(function () {
  document.addEventListener("click", function (e) {
    var av = e.target.closest && e.target.closest(".av");
    var row = av && av.closest('[data-a="openPeer"][data-id]');
    if (!row || !S.uid) return;
    var id = row.dataset.id;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    // ferme un visionneur de story déjà ouvert par un autre écouteur sur ce même tap
    if (F.sv) { clearTimeout(F.svT); F.sv = null; }
    S.view = { type: "person", id: id }; S.animate = true; scrollTo(0, 0);
    render();
    // au cas où un autre gestionnaire ouvre la story pendant ce tap
    setTimeout(function () { if (F.sv && F.sv.gi >= 0) { clearTimeout(F.svT); F.sv = null; feedSync(); render(); } }, 0);
  }, true);
})();
