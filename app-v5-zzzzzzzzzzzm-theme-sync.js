/* =====================================================================
   v5 · Les couleurs de l'entraînement et de la Discussion suivent le thème.
   Avant, les boutons (Télécharger les leçons, Revoir mes erreurs) et le panneau
   Discussion avaient des couleurs fixes : sur un thème clair le texte devenait
   presque invisible. Ici tout passe par les couleurs du thème choisi.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzThemeSync";
  st.textContent = `
.pg-dl{border:1px solid var(--line2)!important;background:var(--surface2)!important;color:var(--fg)!important;box-shadow:none!important}
.pg-review{background:var(--grad)!important;color:var(--on-ink)!important;box-shadow:0 12px 28px -14px var(--ink)!important}
.pg-review span{background:rgba(0,0,0,.14)!important;color:inherit!important}
.pg-review:disabled{opacity:.45!important}
.pg-goal small{color:var(--muted)!important}
.pg-goal b{color:var(--fg)!important}
#zzBc .zz-bct{background:var(--surface)!important;color:var(--ink)!important;border-color:var(--ink)!important;box-shadow:0 8px 20px -10px var(--ink)!important}
#zzBc .zz-bcbox{background:var(--surface)!important;border-color:var(--line2)!important;color:var(--fg)!important}
#zzBc .zz-bcto{color:var(--muted)!important;opacity:1!important}
#zzBc .zz-bcto-btn{background:var(--surface2)!important;border-color:var(--line2)!important;color:var(--fg)!important}
#zzBc .zz-bcto-btn span{color:var(--ink)!important}
#zzBc .zz-bcto-btn i{color:var(--muted)!important}
#zzBc .zz-bcl{color:var(--fg)!important}
#zzBc .zz-bcm{background:var(--surface2)!important;color:var(--fg)!important}
#zzBc .zz-bcm.mine{background:var(--ink-soft)!important}
#zzBc .zz-bcm small{color:var(--ink)!important}
#zzBc .zz-bce{color:var(--muted)!important;opacity:1!important}
#zzBc .zz-bcf input{background:var(--surface2)!important;border-color:var(--line2)!important;color:var(--fg)!important}
#zzBc .zz-bcf input::placeholder{color:var(--muted)!important;opacity:1!important}
#zzBc .zz-bcf button{background:var(--ink)!important;color:var(--on-ink)!important}
#zzRcp .zz-rcs{background:var(--surface)!important;color:var(--fg)!important}
#zzRcp .zz-rch,#zzRcp .zz-rcn{color:var(--fg)!important}
#zzRcp .zz-rcq{background:var(--surface2)!important;border-color:var(--line2)!important}
#zzRcp .zz-rcq input{color:var(--fg)!important}
#zzRcp .zz-rcq input::placeholder{color:var(--muted)!important;opacity:1!important}
#zzRcp .zz-rcg{color:var(--ink)!important}
#zzRcp .zz-rci.on{background:var(--ink-soft)!important;border-color:var(--ink)!important}
#zzRcp .zz-rcc{border-color:var(--line2)!important}
#zzRcp .zz-rci.on .zz-rcc{background:var(--ink)!important;border-color:var(--ink)!important}
#zzRcp .zz-rci.on .zz-rcc::after{border-color:var(--on-ink)!important}
#zzRcp .zz-rca{background:var(--grad)!important;color:var(--on-ink)!important}
#zzRcp .zz-rcok{background:var(--grad)!important;color:var(--on-ink)!important}
`;
  document.head.appendChild(st);
})();
