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
  cards:`<rect x="13" y="10" width="20" height="26" rx="4" fill="url(#P)" opacity=".7" transform="rotate(-10 23 23)"/><rect x="14" y="11" width="20" height="26" rx="4" fill="url(#G)"/>`,
  bag:`<path d="M15 17h18l2 19H13z" fill="url(#G)"/><path d="M19 17v-3a5 5 0 0 1 10 0v3" stroke="url(#G)" stroke-width="2.6" fill="none"/>`,
  mega:`<path d="M10 20h7l16-8v24l-16-8h-7z" fill="url(#G)"/><rect x="12" y="26" width="6" height="10" rx="2.5" fill="url(#P)"/>`,
  users:`<circle cx="18" cy="19" r="5.5" fill="url(#G)"/><circle cx="31" cy="19" r="5.5" fill="url(#P)"/><path d="M8.5 37c.8-6 4.6-9 9.5-9s8.7 3 9.5 9zM25 37c.6-5 3.8-8 7.5-8 4.5 0 7.6 3 8 8z" fill="url(#G)"/>`,
  shield:`<path d="M24 7.5l13.5 5v10.5c0 8.5-5.6 14.5-13.5 17.5-7.9-3-13.5-9-13.5-17.5V12.5z" fill="url(#G)"/><path d="M18.5 24l4 4 7.5-8" stroke="#0B1030" stroke-opacity=".7" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  chart:`<rect x="10" y="26" width="6" height="12" rx="2" fill="url(#G)"/><rect x="21" y="19" width="6" height="19" rx="2" fill="url(#P)"/><rect x="32" y="11" width="6" height="27" rx="2" fill="url(#G)"/>`,
  lock:`<rect x="12" y="22" width="24" height="16" rx="5" fill="url(#G)"/><path d="M17 22v-4a7 7 0 0 1 14 0v4" stroke="url(#G)" stroke-width="3" fill="none"/><circle cx="24" cy="30" r="2.6" fill="#0B1030" opacity=".5"/>`,
  snow:`<path d="M24 8v32M10.5 16l27 16M37.5 16l-27 16" stroke="url(#G)" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="24" r="3.5" fill="url(#P)"/>`,
  device:`<rect x="15" y="8" width="18" height="32" rx="5" fill="url(#G)"/><rect x="18" y="12" width="12" height="20" rx="2" fill="#0B1030" opacity=".3"/><circle cx="24" cy="36" r="1.8" fill="#0B1030" opacity=".5"/>`,
  mobile:`<rect x="15" y="8" width="18" height="32" rx="5" fill="url(#G)"/><rect x="18" y="12" width="12" height="20" rx="2" fill="#0B1030" opacity=".3"/><circle cx="24" cy="36" r="1.8" fill="#0B1030" opacity=".5"/>`,
  link:`<rect x="8" y="18" width="18" height="12" rx="6" fill="none" stroke="url(#G)" stroke-width="3.4"/><rect x="22" y="18" width="18" height="12" rx="6" fill="none" stroke="url(#P)" stroke-width="3.4"/>`,
  speaker:`<path d="M9 19h7l9-7v24l-9-7H9z" fill="url(#G)"/><path d="M31 18.5c2.4 2.2 2.4 8.8 0 11M35 14.5c4.4 4.4 4.4 14.6 0 19" stroke="url(#G)" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  cross:`<path d="M19.5 9h9v10.5H39v9H28.5V39h-9V28.5H9v-9h10.5z" fill="url(#G)"/>`,
  cap:`<path d="M24 11L42 19 24 27 6 19z" fill="url(#G)"/><path d="M14 23v8c0 3 4.5 6 10 6s10-3 10-6v-8l-10 4.5z" fill="url(#P)"/><path d="M39 20v9" stroke="url(#G)" stroke-width="2"/>`,
  clipboard:`<rect x="11" y="10" width="26" height="31" rx="5" fill="url(#G)"/><rect x="18" y="6.5" width="12" height="7" rx="3" fill="url(#P)"/><path d="M17 23h14M17 29h14M17 35h9" stroke="#0B1030" stroke-opacity=".4" stroke-width="2.2" stroke-linecap="round"/>`,
  file:`<path d="M14 8h14l8 8v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="url(#G)"/><path d="M28 8v8h8" fill="url(#P)"/><path d="M16 26h16M16 32h11" stroke="#0B1030" stroke-opacity=".4" stroke-width="2.2" stroke-linecap="round"/>`,
  soccer:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><path d="M24 17.5l5 3.6-1.9 5.9h-6.2L19 21.1z" fill="#0B1030" opacity=".6"/><path d="M24 9v8.5M33.5 17.5l-3 4M36 27l-6.5 1.2M30 38l-1-5M18 38l1-5M12 27l6.5 1.2M14.5 17.5l3 4" stroke="#0B1030" stroke-opacity=".35" stroke-width="1.4"/>`,
  plane:`<path d="M24 7.5c2 0 3 2 3 4.5v7l14 8v4l-14-4v7l4.5 3v3l-7.5-2-7.5 2v-3l4.5-3v-7l-14 4v-4l14-8v-7c0-2.5 1-4.5 3-4.5z" fill="url(#G)"/>`,
  pot:`<path d="M10 22h28v8c0 6-5 10-14 10s-14-4-14-10z" fill="url(#G)"/><path d="M16 17c0-3 2-4 2-7M24 17c0-3 2-4 2-7M32 17c0-3 2-4 2-7" stroke="url(#P)" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="7" y="20" width="34" height="4" rx="2" fill="url(#P)"/>`,
  school:`<path d="M24 8l16 9H8z" fill="url(#P)"/><rect x="11" y="17" width="26" height="22" rx="2" fill="url(#G)"/><rect x="20" y="28" width="8" height="11" rx="1.5" fill="#0B1030" opacity=".45"/><rect x="15" y="22" width="4" height="4" rx="1" fill="#0B1030" opacity=".35"/><rect x="29" y="22" width="4" height="4" rx="1" fill="#0B1030" opacity=".35"/>`,
  briefcase:`<rect x="8" y="17" width="32" height="22" rx="5" fill="url(#G)"/><path d="M18 17v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" stroke="url(#P)" stroke-width="2.8" fill="none"/><path d="M8 26h32" stroke="#0B1030" stroke-opacity=".3" stroke-width="2"/>`,
  phone:`<path d="M13 9.5l6-1.5 3.5 8-3.5 3c1.8 4 4.5 6.7 8.5 8.5l3-3.5 8 3.5-1.5 6c-.5 2-2 3-4 3C21.5 36.5 11.5 26.5 10 13.5c0-2 1-3.5 3-4z" fill="url(#G)"/>`,
  antenna:`<circle cx="24" cy="30" r="4" fill="url(#P)"/><path d="M16.5 22.5a10.5 10.5 0 0 0 0 15M31.5 22.5a10.5 10.5 0 0 1 0 15M10.5 17.5a18 18 0 0 0 0 25M37.5 17.5a18 18 0 0 1 0 25" stroke="url(#G)" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  map:`<path d="M8 13l10-4 12 4 10-4v26l-10 4-12-4-10 4z" fill="url(#G)"/><path d="M18 9v26M30 13v26" stroke="#0B1030" stroke-opacity=".3" stroke-width="2"/>`,
  person:`<circle cx="24" cy="17" r="8" fill="url(#G)"/><path d="M9 40c.8-9 6.5-13 15-13s14.2 4 15 13z" fill="url(#P)"/>`,
  cart:`<path d="M8 12h6l4.5 17h17l4-12H16" stroke="url(#G)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 20h19l-3.5 8H19.5z" fill="url(#G)"/><circle cx="20" cy="36.5" r="3" fill="url(#P)"/><circle cx="32" cy="36.5" r="3" fill="url(#P)"/>`,
  wand:`<path d="M12 38L32 18" stroke="url(#G)" stroke-width="4" stroke-linecap="round"/><path d="M33 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM40 26l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="url(#P)"/>`,
  house:`<path d="M24 8l16 13v17H8V21z" fill="url(#G)"/><rect x="20" y="28" width="8" height="10" rx="1.5" fill="#0B1030" opacity=".4"/>`,
  sun:`<circle cx="24" cy="24" r="8.5" fill="url(#G)"/><path d="M24 7v5M24 36v5M7 24h5M36 24h5M12.5 12.5l3.5 3.5M32 32l3.5 3.5M12.5 35.5l3.5-3.5M32 16l3.5-3.5" stroke="url(#P)" stroke-width="2.8" stroke-linecap="round"/>`,
  smile:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><circle cx="18.5" cy="20.5" r="2.2" fill="#0B1030" opacity=".7"/><circle cx="29.5" cy="20.5" r="2.2" fill="#0B1030" opacity=".7"/><path d="M16.5 27.5c1.8 3 4.6 4.5 7.5 4.5s5.7-1.5 7.5-4.5" stroke="#0B1030" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  laugh:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><path d="M15.5 21.5q2.7-3.2 5.4 0M27.1 21.5q2.7-3.2 5.4 0" stroke="#0B1030" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M15.5 26.5h17c0 5-3.8 8.2-8.5 8.2s-8.5-3.2-8.5-8.2z" fill="#0B1030" opacity=".7"/><path d="M19.5 30.5h9" stroke="url(#P)" stroke-width="2" stroke-linecap="round"/>`,
  hearteyes:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><g transform="translate(18.5 20.8) scale(1.05)"><path d="M0 4.2C-4 1.6-5 0-5-1.6c0-1.6 1.2-2.6 2.6-2.6 1 0 1.8.5 2.4 1.5.6-1 1.4-1.5 2.4-1.5 1.4 0 2.6 1 2.6 2.6C5 0 4 1.6 0 4.2z" fill="url(#P)"/></g><g transform="translate(29.5 20.8) scale(1.05)"><path d="M0 4.2C-4 1.6-5 0-5-1.6c0-1.6 1.2-2.6 2.6-2.6 1 0 1.8.5 2.4 1.5.6-1 1.4-1.5 2.4-1.5 1.4 0 2.6 1 2.6 2.6C5 0 4 1.6 0 4.2z" fill="url(#P)"/></g><path d="M16.5 28.5c1.8 3 4.6 4.5 7.5 4.5s5.7-1.5 7.5-4.5" stroke="#0B1030" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  wow:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><circle cx="18.5" cy="20.5" r="2.4" fill="#0B1030" opacity=".75"/><circle cx="29.5" cy="20.5" r="2.4" fill="#0B1030" opacity=".75"/><ellipse cx="24" cy="31" rx="3.4" ry="4.2" fill="#0B1030" opacity=".7"/>`,
  sad:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><path d="M14.5 15.5l6 1.5M33.5 15.5l-6 1.5" stroke="#0B1030" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/><circle cx="18.5" cy="21" r="2" fill="#0B1030" opacity=".75"/><circle cx="29.5" cy="21" r="2" fill="#0B1030" opacity=".75"/><path d="M17 33c2-2.5 4.5-3.5 7-3.5s5 1 7 3.5" stroke="#0B1030" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M15.5 25c-.8 1.5-1.2 2.3-1.2 3 0 .9.6 1.6 1.4 1.6s1.4-.7 1.4-1.6c0-.7-.4-1.5-1.6-3z" fill="#7DD3FC"/>`,
  angry:`<circle cx="24" cy="24" r="15" fill="url(#G)"/><path d="M13.5 15l8 3.5M34.5 15l-8 3.5" stroke="#0B1030" stroke-opacity=".8" stroke-width="2.8" stroke-linecap="round"/><circle cx="18.5" cy="22.5" r="2.2" fill="#0B1030" opacity=".75"/><circle cx="29.5" cy="22.5" r="2.2" fill="#0B1030" opacity=".75"/><path d="M17 33.5c2-2.4 4.5-3.4 7-3.4s5 1 7 3.4" stroke="#0B1030" stroke-opacity=".8" stroke-width="2.8" stroke-linecap="round" fill="none"/>`,
  clap:`<g fill="url(#G)"><rect x="9" y="18" width="14" height="17" rx="6" transform="rotate(-28 16 26)"/><rect x="25" y="18" width="14" height="17" rx="6" transform="rotate(28 32 26)"/></g><path d="M24 6.5v4M11 8.5l2.6 3.2M37 8.5l-2.6 3.2M6.5 18l4 1.4M41.5 18l-4 1.4" stroke="url(#P)" stroke-width="2.6" stroke-linecap="round"/>`,
  thumb:`<path d="M13.5 22h-3.4a2.4 2.4 0 0 0-2.4 2.4v9.2a2.4 2.4 0 0 0 2.4 2.4h3.4z" fill="url(#P)"/><path d="M13.5 22l5-11.2c.8-1.8 3.2-2.2 4.4-.9 1 1.1.9 2.6.5 4L22.5 19H34c2.3 0 3.9 2.1 3.3 4.3l-2.8 9.9c-.4 1.5-1.8 2.5-3.4 2.5H13.5z" fill="url(#G)"/>`,
  party:`<path d="M9 39L16 14l17 17z" fill="url(#G)"/><path d="M15.5 22.5l7 7" stroke="#0B1030" stroke-opacity=".3" stroke-width="2"/><circle cx="34" cy="11" r="2.6" fill="url(#P)"/><circle cx="40" cy="22" r="2" fill="url(#G)"/><circle cx="31" cy="7" r="1.8" fill="url(#G)"/><path d="M37 34l3-2M29 16l2.5-2.5M41 13l-2-1" stroke="url(#P)" stroke-width="2" stroke-linecap="round"/>`,
  hands:`<path d="M24 6.5c-4.6 5.2-8.6 12-8.6 20.2 0 4.6 1.4 8.2 3.4 10.8h10.4c2-2.6 3.4-6.2 3.4-10.8 0-8.2-4-15-8.6-20.2z" fill="url(#G)"/><path d="M24 9.5v27.5" stroke="#0B1030" stroke-opacity=".3" stroke-width="1.6"/><path d="M19.5 17.5c1.6 2.2 2.6 4.6 2.6 7M28.5 17.5c-1.6 2.2-2.6 4.6-2.6 7" stroke="url(#P)" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  orb:`<circle cx="24" cy="24" r="14" fill="url(#G)"/><circle cx="19" cy="18.5" r="4" fill="#fff" opacity=".6"/>`
};
/* emoji → 3D icon */
const ICO3_MAP={"⚽":"soccer","✈":"plane","🍲":"pot","🥘":"pot","🍜":"pot","🎓":"cap","🏠":"house","🏡":"house","🏫":"school","🏥":"cross","💼":"briefcase","📄":"file","📋":"clipboard","📞":"phone","☎":"phone","📡":"antenna","📱":"mobile","🗣":"bubble","🗺":"map","🙋":"person","🧍":"person","🛒":"cart","🧚":"wand","🩺":"cross","🛍":"bag","📣":"mega","📢":"mega","⏱":"clock","👥":"users","🛡":"shield","📊":"chart","🔒":"lock","🔐":"lock","❄":"snow","🔗":"link","🔊":"speaker","🔈":"speaker","🗓":"calendar","🏅":"medal","🃏":"cards","🎙":"mic","🪪":"file","👋":"person","💡":"sparkle","🚗":"plane","🚌":"plane","🌴":"sparkle","🏖":"sun","☀":"sun","🌞":"sun","⭐":"star","🌟":"star","✨":"sparkle","💫":"sparkle","🪄":"sparkle","⚡":"bolt","🔥":"fire","❤":"heart","💖":"heart","💗":"heart","🧠":"brain","💬":"bubble","🗨":"bubble","💭":"bubble","📷":"camera","📸":"camera","🎥":"camera","📹":"camera","📖":"book","📚":"book","📝":"pencil","✏":"pencil","🖊":"pencil","🎤":"mic","🎙":"mic","🎧":"headphones","🎵":"music","🎶":"music","🏆":"trophy","🥇":"medal","🏅":"medal","🎯":"target","🌍":"globe","🌎":"globe","🌏":"globe","🚀":"rocket","✅":"check","✔":"check","👍":"thumb","👏":"clap","🙏":"hands","😀":"smile","😃":"smile","😄":"smile","😊":"smile","🙂":"smile","😁":"smile","😎":"smile","😂":"laugh","🤣":"laugh","😆":"laugh","😍":"hearteyes","🥰":"hearteyes","😘":"hearteyes","🤩":"hearteyes","😮":"wow","😯":"wow","😲":"wow","😢":"sad","😭":"sad","😞":"sad","😡":"angry","😠":"angry","🥳":"party","🎊":"party","💕":"heart","💞":"heart","🤍":"heart","⏰":"clock","🕒":"clock","📅":"calendar","🗓":"calendar","🎁":"gift","👑":"crown","🚩":"flag","🏁":"flag","🃏":"sparkle","🎉":"sparkle","🎓":"medal","🔊":"bubble","🗣":"bubble"};
function ico3Svg(k){const n="i3-"+k;
  const defs=`<defs><linearGradient id="${n}-G" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#A9B8FF"/><stop offset="1" stop-color="#4A5FD0"/></linearGradient>
  <linearGradient id="${n}-P" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#818CF8"/></linearGradient>
  <radialGradient id="${n}-L" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#9FFBEF"/><stop offset=".35" stop-color="#2D3E95"/><stop offset="1" stop-color="#060A1E"/></radialGradient></defs>`;
  const body=(ICO3_PATH[k]||ICO3_PATH.sparkle).replace(/url\(#G\)/g,`url(#${n}-G)`).replace(/url\(#P\)/g,`url(#${n}-P)`).replace(/url\(#L\)/g,`url(#${n}-L)`);
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${defs}<g filter="url(#i3shadow)">${body}</g><path d="M12.5 15.5c3.2-4.6 9.8-6.4 15.5-4.2" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`}
/* the card icons (book, bolt, brain…) use the same set */
const IC3K={book:"book",bolt:"bolt",cards:"cards",pen:"pencil",file:"file",trophy:"trophy",target:"target",star:"star",flame:"fire",chat:"bubble",camera:"camera",brain:"brain",gift:"gift",bag:"bag",mega:"mega",timer:"clock",users:"users",shield:"shield",chart:"chart",live:"antenna",grade:"clipboard",roll:"clipboard",award:"medal",rocket:"rocket",spark:"sparkle",clock:"clock",check:"check",lock:"lock",mic:"mic",snow:"snow",device:"mobile",link:"link",home:"house",grad:"cap",speaker:"speaker",family:"house",plus:"cross",calendar:"calendar",globe:"globe"};
function upgradeIcons(root){if(!root)return;try{root.querySelectorAll(".ic>svg[data-n],.medal>svg[data-n],.medal3d>svg[data-n]").forEach(sv=>{const k=IC3K[sv.dataset.n];if(!k)return;const sp=document.createElement("span");sp.className="ico3d ic3d";sp.innerHTML=ico3Svg(k);sv.parentNode.classList.add("has3d");sv.replaceWith(sp)})}catch(e){}}
/* one shared shadow filter, defined once in the page */
{const d=document.createElement("div");d.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="i3shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#0B1030" flood-opacity=".5"/></filter></defs></svg>`;document.body.appendChild(d.firstChild)}
/* the emoji renderer: 3D icons, never emoji pictures */
function E(str,cls=""){return segG(String(str||"")).map(g=>{const base=g.replace(/️/g,"");
  const key=ICO3_MAP[g]||ICO3_MAP[base]||ICO3_MAP[base.charAt(0)]||"sparkle";
  if(!/\p{Extended_Pictographic}/u.test(g))return esc(g);
  return `<span class="ico3d e3d ${cls}" data-i3="${key||"sparkle"}" role="img" aria-label="${esc(g)}">${ico3Svg(key||"sparkle")}</span>`}).join("")}
/* a small 3D sheet of the icons, used by the showcase */
window.ICO3_SHEET=()=>Object.keys(ICO3_PATH).map(k=>`<figure class="i3sheet-f"><span class="ico3d big">${ico3Svg(k)}</span><figcaption>${k}</figcaption></figure>`).join("");
{const st=document.createElement("style");st.id="zzicons3d";st.textContent=`
.ico3d{display:inline-block;position:relative;animation:i3float 4.2s ease-in-out infinite;will-change:transform}
/* only icons without their own size (the page's .e3d sizes win everywhere else) */
.ico3d:not(.e3d){width:1.25em;height:1.25em;vertical-align:-.28em}
/* the icon drawing fills its box; the page's small "svg" sizes must not shrink it */
.ico3d>svg{width:100%!important;height:100%!important;overflow:visible;display:block}
/* home and scenario cards: a big 3D icon */
.card .ic.has3d{width:76px;height:76px;border-radius:24px}
.card .ic.has3d .ic3d{width:118%;height:118%}
.factions .e3d{width:26px;height:26px}
.fpick .e3d{width:34px;height:34px}
.ico3d.big{width:84px;height:84px}
.ico3d:nth-child(2n){animation-delay:-1.4s}.ico3d:nth-child(3n){animation-delay:-2.6s}
@keyframes i3float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-3deg)}}
.i3sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:16px}
.i3sheet-f{margin:0;display:grid;justify-items:center;gap:8px;padding:16px 8px;border-radius:20px;background:linear-gradient(170deg,rgba(40,48,110,.55),rgba(12,15,36,.85));border:1px solid rgba(160,172,255,.18)}
.i3sheet-f figcaption{font:600 .78rem system-ui,sans-serif;color:#C4CAE4;text-transform:uppercase;letter-spacing:.08em}
@media (prefers-reduced-motion:reduce){.ico3d{animation:none!important}}
`;document.head.appendChild(st)}
