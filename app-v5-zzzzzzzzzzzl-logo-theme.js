/* Le logo prend la couleur du thème choisi (en haut à gauche). Le logo est indigo à l'origine ;
   une rotation de teinte, calculée pour que le logo tombe sur la couleur d'accent de chaque thème. */
(function () {
  var HUE = {
    aurora: -83, violet: 23, sakura: 81, foret: -101,
    soleil: 128, lavande: 9, ardoise: 124, glacier: -56
  };
  var css = "";
  Object.keys(HUE).forEach(function (k) {
    var sel = ':root[data-skin="' + k + '"] .logo.lg3d img,:root[data-skin="' + k + '"] header.top .logo img';
    css += sel + "{filter:hue-rotate(" + HUE[k] + "deg) saturate(1.05)}";
  });
  var st = document.createElement("style");
  st.id = "zzLogoTheme";
  st.textContent = css;
  document.head.appendChild(st);
})();
