/* =====================================================================
   v5 · Le logo 3D prend toujours la couleur du thème choisi.
   Avant, il était décalé de teinte par thème (une approximation, qui tombait
   souvent à côté). Maintenant une couche du dégradé du thème est posée sur le logo
   en mode « couleur » : la couleur vient du thème, le relief du logo est gardé.
   La couche suit la forme du logo (son masque), donc rien ne déborde.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzLogoDuo";
  st.textContent = `
header.top .logo.lg3d img,.logo.lg3d img{filter:none!important}
.logo.lg3d{background:none!important;isolation:isolate;position:relative}
.logo.lg3d::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:var(--grad);mix-blend-mode:color;
  -webkit-mask:url(icons/logo-3d.png) center/contain no-repeat;mask:url(icons/logo-3d.png) center/contain no-repeat}
`;
  document.head.appendChild(st);
})();
