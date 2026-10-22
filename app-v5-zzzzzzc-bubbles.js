/* =====================================================================
   v5 · Bulles d'emojis et barre de la photo à envoyer.
   - Une bulle qui contient des emojis prend la largeur de son texte (au
     lieu de se resserrer et d'empiler les emojis en colonne).
   - La barre au-dessus de la photo à envoyer : fermer, télécharger,
     HD, rogner, sticker, texte, crayon.
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzzzzzcBub";
  st.textContent = `
/* the bubble rule ".msg span" (time stamp) also caught each emoji: they were
   block-level, small and faded, one per line */
.msg .emo-nat{display:inline-block;font-size:inherit;opacity:1;margin:0}
.msg:has(.emo-nat){width:max-content;max-width:78%}
.v4pre-tools{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 2px 10px;flex-wrap:wrap}
.v4pt{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 10px;border-radius:999px;border:0;background:rgba(255,255,255,.12);color:inherit;text-decoration:none;font:700 .95rem system-ui,sans-serif;cursor:pointer}
.v4pt.v4hd.on{background:#A78BFA;color:#0B0D18}
.v4aa{font-size:1rem;font-weight:800}
`;
  document.head.appendChild(st);
})();
