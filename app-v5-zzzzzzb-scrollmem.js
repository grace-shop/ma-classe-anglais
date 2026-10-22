/* =====================================================================
   v5 · Position mémorisée : quand on ouvre une sous-page puis qu'on
   revient, la page précédente se rouvre à l'endroit où l'on était (et
   non tout en haut). Chaque page garde sa position de défilement.
   ===================================================================== */
{
  const MEM = {};          // page key -> scroll position (px)
  let cur = null;          // key of the page on screen
  const keyNow = () => {
    try {
      return JSON.stringify([S.mode, S.tab, S.view, S.run ? (S.run.quizId || "run") : null, !!S.deck, !!S.srs, !!S.talk, !!S.liveOn]);
    } catch (e) { return "?"; }
  };
  const y = () => window.pageYOffset || document.documentElement.scrollTop || 0;

  // remember the position of the page on screen (scroll events come after the
  // page has already changed, so the old page keeps its last position)
  window.addEventListener("scroll", () => { if (cur !== null) MEM[cur] = y(); }, { passive: true });

  const _r = render;
  render = function () {
    const o = _r.apply(this, arguments);
    try {
      const k = keyNow();
      if (k !== cur) {
        cur = k;
        const want = MEM[k];
        if (typeof want === "number" && want > 0) {
          // applied now, and again after the frame (a later scroll-to-top
          // in the same tick must not win; images may still be loading)
          const go = () => { if (cur === k) window.scrollTo(0, want); };
          go();
          requestAnimationFrame(go);
          setTimeout(go, 60);
        }
      }
    } catch (e) {}
    return o;
  };
}
