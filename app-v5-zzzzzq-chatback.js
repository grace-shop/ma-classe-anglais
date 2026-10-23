/* v5 · « Back » sur la liste des discussions : ramène à l'accueil.
   Écouté sur window (avant le retour par historique) ; les autres pages gardent leur retour. */
(function () {
  window.addEventListener("click", function (e) {
    if (!e.isTrusted || typeof S === "undefined" || typeof render !== "function") return;
    var b = e.target && e.target.closest && e.target.closest(".back, [data-a='back']");
    if (!b) return;
    if (S.tab !== "msgs" || S.view) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    S.tab = "home";
    S.animate = true;
    render();
    window.scrollTo(0, 0);
  }, true);
})();
