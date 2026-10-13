/* =====================================================================
   v5 · 3D icons, drawn in the app (no emoji images).

   Every emoji that used to show as a 3D picture is now a glossy, floating
   3D icon drawn in SVG (gradient orb, light sheen, soft shadow). Emojis
   without a match get a neutral sparkle orb, so no emoji picture remains.
   Ids are fixed per icon, so a redraw never changes the page HTML.
   ===================================================================== */
const ICO3_PATH={
  star:`<path d="M24 7.5l4.6 10.3 11.2 1-8.5 7.4 2.6 11-9.9-5.8-9.9 5.8 2.6-11-8.5-7.4 11.2-1z" fill="url(#G)"/>`,
  sparkle:`<path d="M24 8.5L27.4 20.6 39.5 24 27.4 27.4 24 39.5 20.6 27.4 8.5 24 20.6 20.6z" fill="url(#G)"/>`,
  bolt:`<path d="M27.5 6.5L12.5 27h9.6l-2.8 14.5L35.5 20h-9.8z" fill="url(#G)"/>`,
  fire:`<path d="M24 8.5c3.6 6 11.5 9.2 9.6 20.2-.9 5.3-4.8 8.8-9.6 8.8-6 0-10.6-4.3-10.1-10.2.4-4.6 3.3-6.8 4.6-11.4 2.6 2.7 3.1 5 3.4 7.2 2.2-3.8 2.3-8.3 2.1-14.6z" fill="url(#G)"/>`,
  heart:`<path d="M24 38.5C10 29.5 7.5 22.8 7.5 18.2 7.5 12.8 11.5 9 16.3 9c3.2 0 5.9 1.7 7.7 4.4C25.8 10.7 28.5 9 31.7 9c4.8 0 8.8 3.8 8.8 9.2 0 4.6-2.5 11.3-16.5 20.3z" fill="url(#P)"/>`,
  brain:`<g fill="url(#G)"><circle cx="18" cy="21" r="8.5"/><circle cx="30" cy="21" r="8.5"/><circle cx="24" cy="16" r="7.5"/><rect x="16" y="23" width="16" height="11" rx="5"/></g><path d="M24 17v14M18 21h2M28 25h2" stroke="#0B1030" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  bubble:`<rect x="10" y="12" width="28" height="19" rx="8" fill="url(#G)"/><path d="M17 30l-3.5 8.5L26 30z" fill="url(#G)"/><circle cx="18" cy="21.5" r="2" fill="#0B1030" opacity=".45"/><circle cx="24" cy="21.5" r="2" fill="#0B1030" opacity=".45"/><circle cx="30" cy="21.5" r="2" fill="#0B1030" opacity=".45"/>`,
  camera:`<rect x="11" y="16" width="26" height="19" rx="6" fill="url(#G)"/><rect x="18" y="12" width="12" height="6" rx="2.5" fill="url(#G)"/><circle cx="24" cy="25.5" r="6.5" fill="#0B1030"/><circle cx="24" cy="25.5" r="4.6" fill="url(#L)"/><ellipse cx="22.4" cy="23.9" rx="1.4" ry=".8" fill="#fff" opacity=".9"/>`,
  book:`<path d="M9.5 14c5-2.4 10-1.6 14.5 2v20.5c-4.5-3.2-9.5-3.9-14.5-1.5zM38.5 14c-5-2.4-10-1.6-14.5 2v20.5c4.5-3.2 9.5-3.9 14.5-1.5z" fill="url(#G)"/><path d="M24 16v20.5" stroke="#0B1030" stroke-opacity=".3" stroke-width="1.4"/>`,
  pencil:`<path d="M30.5 9.5l8 8L19.8 36.2l-9.6 1.6 1.6-9.6z" fill="url(#G)"/><path d="M28 12l8 8" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`,
  mic:`<rect x="18" y="8.5" width="12" height="21" rx="6" fill="url(#G)"/><path d="M12.5 22.5c0 7 5 11.5 11.5 11.5s11.5-4.5 11.5-11.5" stroke="url(#G)" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M24 34v5.5M18 40h12" stroke="url(#G)" stroke-width="2.6" stroke-linecap="round"/>`,
  headphones:`<path d="M11 27v-3c0-7.2 5.8-13 13-13s13 5.8 13 13v3" stroke="url(#G)" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="8.5" y="25" width="7" height="12" rx="3.5" fill="url(#G)"/><rect x="32.5" y="25" width="7" height="12" rx="3.5" fill="url(#G)"/>`,
  music:`<circle cx="18" cy="33" r="6" fill="url(#G)"/><circle cx="32" cy="29" r="6" fill="url(#G)"/><path d="M23.5 33V14l14-3.5v19" stroke="url(#G)" stroke-width="3" fill="none" stroke-linejoin="round"/>`,
  trophy:`<path d="M15 10.5h18v9c0 6.5-4 11-9 11.8-5-.8-9-5.3-9-11.8z" fill="url(#G)"/><path d="M15 13H10c0 5 2.3 8 6 8.5M33 13h5c0 5-2.3 8-6 8.5" stroke="url(#G)" stroke-width="2.6" fill="none"/><rect x="22" y="31" width="4" height="5" fill="url(#G)"/><rect x="15" y="36" width="18" height="4.5" rx="2" fill="url(#G)"/>`,
  medal:`<path d="M16 8.5l4.5 11.5L24 17l3.5 3L32 8.5z" fill="url(#P)"/><circle cx="24" cy="29" r="10" fill="url(#G)"/><circle cx="24" cy="29" r="5.2" fill="#0B1030" opacity=".22"/>`,
  target:`<circle cx="24" cy="24" r="15" fill="none" stroke="url(#G)" stroke-width="3.5"/><circle cx="24" cy="24" r="8.5" fill="none" stroke="url(#G)" stroke-width="3.5"/><circle cx="24" cy="24" r="3.2" fill="url(#G)"/>`,
  globe:`<circle cx="24" cy="24" r="14.5" fill="none" stroke="url(#G)" stroke-width="3"/><ellipse cx="24" cy="24" rx="6" ry="14.5" fill="none" stroke="url(#G)" stroke-width="2.4"/><path d="M9.5 24h29" stroke="url(#G)" stroke-width="2.4"/>`,
  rocket:`<path d="M24 7.5c6.5 4.5 8.5 12 6.5 22.5L24 37.5l-6.5-7.5C15.5 19.5 17.5 12 24 7.5z" fill="url(#G)"/><circle cx="24" cy="21" r="3.6" fill="#0B1030" opacity=".5"/><path d="M17.5 27.5l-5 5.5 6-1.5zM30.5 27.5l5 5.5-6-1.5z" fill="url(#P)"/>`,
  check:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><path d="M16.5 24.5l5 5 10-10.5" stroke="#0B1030" stroke-opacity=".75" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  clock:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><circle cx="24" cy="24" r="11.5" fill="#0B1030" opacity=".22"/><path d="M24 16v8.5l5.5 3.5" stroke="#0B1030" stroke-opacity=".75" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  calendar:`<rect x="10" y="12" width="28" height="25" rx="6" fill="url(#G)"/><rect x="10" y="12" width="28" height="8" rx="4" fill="#0B1030" opacity=".22"/><path d="M17 9v6M31 9v6" stroke="url(#G)" stroke-width="2.8" stroke-linecap="round"/>`,
  gift:`<rect x="11" y="20" width="26" height="17" rx="4" fill="url(#G)"/><rect x="9" y="15" width="30" height="6" rx="3" fill="url(#P)"/><rect x="22" y="15" width="4" height="22" fill="#fff" opacity=".7"/>`,
  crown:`<path d="M10.5 33.5L8 16l10 7 6-10 6 10 10-7-2.5 17.5z" fill="url(#G)"/><rect x="10.5" y="33" width="27" height="5" rx="2.5" fill="url(#P)"/>`,
  flag:`<path d="M13 40V9" stroke="url(#G)" stroke-width="3" stroke-linecap="round"/><path d="M15 10c6-4 10 4 17 0v16c-7 4-11-4-17 0z" fill="url(#G)"/>`,
  orb:`<circle cx="24" cy="24" r="14" fill="url(#G)"/><circle cx="19" cy="18.5" r="4" fill="#fff" opacity=".6"/>`
};
/* emoji → 3D icon */
const ICO3_MAP={"⭐":"star","🌟":"star","✨":"sparkle","💫":"sparkle","🪄":"sparkle","⚡":"bolt","🔥":"fire","❤":"heart","💖":"heart","💗":"heart","🧠":"brain","💬":"bubble","🗨":"bubble","💭":"bubble","📷":"camera","📸":"camera","🎥":"camera","📹":"camera","📖":"book","📚":"book","📝":"pencil","✏":"pencil","🖊":"pencil","🎤":"mic","🎙":"mic","🎧":"headphones","🎵":"music","🎶":"music","🏆":"trophy","🥇":"medal","🏅":"medal","🎯":"target","🌍":"globe","🌎":"globe","🌏":"globe","🚀":"rocket","✅":"check","✔":"check","👍":"check","⏰":"clock","🕒":"clock","📅":"calendar","🗓":"calendar","🎁":"gift","👑":"crown","🚩":"flag","🏁":"flag","🃏":"sparkle","🎉":"sparkle","🎓":"medal","🔊":"bubble","🗣":"bubble"};
function ico3Svg(k){const n="i3-"+k;
  const defs=`<defs><linearGradient id="${n}-G" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#A9B8FF"/><stop offset="1" stop-color="#4A5FD0"/></linearGradient>
  <linearGradient id="${n}-P" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#818CF8"/></linearGradient>
  <radialGradient id="${n}-L" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#9FFBEF"/><stop offset=".35" stop-color="#2D3E95"/><stop offset="1" stop-color="#060A1E"/></radialGradient></defs>`;
  const body=(ICO3_PATH[k]||ICO3_PATH.orb).replace(/url\(#G\)/g,`url(#${n}-G)`).replace(/url\(#P\)/g,`url(#${n}-P)`).replace(/url\(#L\)/g,`url(#${n}-L)`);
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${defs}<g filter="url(#i3shadow)">${body}</g></svg>`}
/* one shared shadow filter, defined once in the page */
{const d=document.createElement("div");d.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="i3shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#0B1030" flood-opacity=".5"/></filter></defs></svg>`;document.body.appendChild(d.firstChild)}
/* the emoji renderer: 3D icons, never emoji pictures */
function E(str,cls=""){return segG(String(str||"")).map(g=>{const base=g.replace(/️/g,"");
  const key=ICO3_MAP[g]||ICO3_MAP[base]||ICO3_MAP[base.charAt(0)];
  if(!/\p{Extended_Pictographic}/u.test(g))return esc(g);
  return `<span class="ico3d ${cls}" data-i3="${key||"orb"}" role="img" aria-label="${esc(g)}">${ico3Svg(key||"orb")}</span>`}).join("")}
/* a small 3D sheet of the icons, used by the showcase */
window.ICO3_SHEET=()=>Object.keys(ICO3_PATH).map(k=>`<figure class="i3sheet-f"><span class="ico3d big">${ico3Svg(k)}</span><figcaption>${k}</figcaption></figure>`).join("");
{const st=document.createElement("style");st.id="zzicons3d";st.textContent=`
.ico3d{display:inline-block;width:1.25em;height:1.25em;vertical-align:-.28em;position:relative;animation:i3float 4.2s ease-in-out infinite;will-change:transform}
.ico3d svg{width:100%;height:100%;overflow:visible;display:block}
.ico3d.big{width:84px;height:84px}
.ico3d:nth-child(2n){animation-delay:-1.4s}.ico3d:nth-child(3n){animation-delay:-2.6s}
@keyframes i3float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-3deg)}}
.i3sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:16px}
.i3sheet-f{margin:0;display:grid;justify-items:center;gap:8px;padding:16px 8px;border-radius:20px;background:linear-gradient(170deg,rgba(40,48,110,.55),rgba(12,15,36,.85));border:1px solid rgba(160,172,255,.18)}
.i3sheet-f figcaption{font:600 .78rem system-ui,sans-serif;color:#C4CAE4;text-transform:uppercase;letter-spacing:.08em}
@media (prefers-reduced-motion:reduce){.ico3d{animation:none!important}}
`;document.head.appendChild(st)}
