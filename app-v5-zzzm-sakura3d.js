/* =====================================================================
   v5 · Sakura en 3D : une jeune fille kawaii avec des volumes, des
   reflets dans les yeux et les cheveux, des ombres douces et une
   lumière venant de haut à gauche. Mêmes classes que l'ancien dessin,
   donc les humeurs (joie, tristesse, bonne réponse) continuent de marcher.
   ===================================================================== */
masSVG=function(){
  const g="s3"+Math.floor(Math.random()*1e6);
  return `<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${g}halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FDE68A" stop-opacity=".5"/><stop offset=".6" stop-color="#F9A8D4" stop-opacity=".18"/><stop offset="1" stop-color="#F472B6" stop-opacity="0"/></radialGradient>
    <radialGradient id="${g}skin" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#FFF8F2"/><stop offset=".55" stop-color="#FBE0CF"/><stop offset="1" stop-color="#E9AE95"/></radialGradient>
    <linearGradient id="${g}hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3170"/><stop offset=".5" stop-color="#1C1747"/><stop offset="1" stop-color="#0B0A22"/></linearGradient>
    <linearGradient id="${g}sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${g}iris" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6D5BD0"/><stop offset=".6" stop-color="#2B2170"/><stop offset="1" stop-color="#0D0A2A"/></radialGradient>
    <linearGradient id="${g}uni" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A5B4FC"/><stop offset=".5" stop-color="#6366F1"/><stop offset="1" stop-color="#312E81"/></linearGradient>
    <linearGradient id="${g}ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBCFE8"/><stop offset="1" stop-color="#DB2777"/></linearGradient>
    <linearGradient id="${g}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FB7185"/><stop offset="1" stop-color="#9F1239"/></linearGradient>
    <radialGradient id="${g}blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FB7185" stop-opacity=".75"/><stop offset="1" stop-color="#FB7185" stop-opacity="0"/></radialGradient>
    <filter id="${g}soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="${g}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <ellipse cx="60" cy="72" rx="58" ry="68" fill="url(#${g}halo)"/>
  <ellipse cx="60" cy="144" rx="34" ry="5" fill="#000" opacity=".35" filter="url(#${g}blur)"/>
  <path d="M25 74c-5-34 10-58 35-58s40 24 35 58c2 30 7 46 11 62H14c4-16 9-32 11-62z" fill="url(#${g}hair)"/>
  <path d="M34 98c6 14 14 22 26 22s20-8 26-22" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="5" filter="url(#${g}soft)"/>
  <path d="M51 88h18v14q-9 5-18 0z" fill="url(#${g}skin)"/>
  <path d="M38 104q22-10 44 0l9 42H29z" fill="url(#${g}uni)" class="uni"/>
  <path d="M46 104l14 16 14-16v-4q-14-5-28 0z" fill="#fff"/>
  <path d="M46 104l14 16 14-16" fill="none" stroke="#C7D2FE" stroke-width="1.2" opacity=".8"/>
  <path d="M60 116l-7-4v8zM60 116l7-4v8z" fill="url(#${g}ribbon)"/>
  <path d="M60 117q-9 4-13 0 4 7 13 4zM60 117q9 4 13 0-4 7-13 4z" fill="#F472B6"/>
  <path d="M38 110v32M82 110v32" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>
  <g class="arms" fill="none" stroke="url(#${g}skin)" stroke-width="7" stroke-linecap="round"><path d="M42 108q-14-8-16-36"/><path d="M78 108q14-8 16-36"/></g>
  <ellipse cx="60" cy="68" rx="29" ry="31" fill="url(#${g}skin)"/>
  <ellipse cx="60" cy="98" rx="20" ry="8" fill="#E9AE95" opacity=".28" filter="url(#${g}soft)"/>
  <ellipse cx="40" cy="80" rx="7" ry="4.2" fill="url(#${g}blush)"/><ellipse cx="80" cy="80" rx="7" ry="4.2" fill="url(#${g}blush)"/>
  <path d="M30 64C27 84 27 98 32 110c3-16 4-32 6-46z" fill="url(#${g}hair)"/>
  <path d="M90 64C93 84 93 98 88 110c-3-16-4-32-6-46z" fill="url(#${g}hair)"/>
  <path d="M31 60c-2-20 9-34 29-34 14 0 25 8 30 22-7-6-17-9-27-8-10 1-21 5-32 20z" fill="url(#${g}hair)"/>
  <path d="M60 30c-12 0-20 4-26 12M54 27c14-2 26 4 31 14" fill="none" stroke="url(#${g}sheen)" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
  <path d="M40 40c4-4 9-6 13-6" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M74 34c6 2 10 6 12 12" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <g transform="translate(86 38)"><circle r="4.2" cx="0" cy="-4" fill="#FBCFE8"/><circle r="4.2" cx="4" cy="0" fill="#F9A8D4"/><circle r="4.2" cx="2.5" cy="4.5" fill="#FBCFE8"/><circle r="4.2" cx="-2.5" cy="4.5" fill="#F9A8D4"/><circle r="4.2" cx="-4" cy="0" fill="#FBCFE8"/><circle r="1.8" fill="#FDE68A"/></g>
  <g class="ey-o"><ellipse cx="49" cy="68" rx="5" ry="6.6" fill="url(#${g}iris)"/><ellipse cx="71" cy="68" rx="5" ry="6.6" fill="url(#${g}iris)"/><circle cx="50.8" cy="65.4" r="2.1" fill="#fff"/><circle cx="72.8" cy="65.4" r="2.1" fill="#fff"/><circle cx="47.6" cy="70.6" r="1" fill="#A5F3FC"/><circle cx="69.6" cy="70.6" r="1" fill="#A5F3FC"/><path d="M43.8 64.2q5.2-4.6 10.4 0M65.8 64.2q5.2-4.6 10.4 0" stroke="#14183A" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>
  <g class="ey-h" stroke="#1B1A3D" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M44 69q5-6 10 0"/><path d="M66 69q5-6 10 0"/></g>
  <path d="M59 76q1.4 1.8 0 3" stroke="#B7715A" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path class="mo-s" d="M54 82q6 4.5 12 0" stroke="${"#9F1239"}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="mo-h" d="M52 81h16q-1 9-8 9t-8-9z" fill="url(#${g}k)"/>
  <path class="mo-f" d="M54 86q6-5 12 0" stroke="#9F1239" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="drop" d="M92 46q-5 8-5 12a5 5 0 0 0 10 0q0-4-5-12z" fill="#7DD3FC"/>
  <g class="spk"><path d="M12 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FBBF24"/><path d="M106 22l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#F472B6"/><path d="M110 72l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#A5F3FC"/></g>
</svg>`};
