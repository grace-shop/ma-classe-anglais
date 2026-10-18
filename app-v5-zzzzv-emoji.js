/* =====================================================================
   v5 · Message reactions use the real emoji (the phone's own emoji font),
   not the 3D picture icons.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzzzvEmoji";
  st.textContent = `
.v4emo{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif;font-style:normal;line-height:1;display:inline-block;font-size:1.35em;vertical-align:middle}
.v4rx .v4emo{font-size:1.05em}
`;
  document.head.appendChild(st);
})();
