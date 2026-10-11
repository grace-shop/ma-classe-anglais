/* =====================================================================
   v5 themes: seven new themes (light and dark), added to the theme list
   - The default theme is the first one: Night (dark, starry)
   - Everyone starts on the default theme once; then each person keeps their choice
   - Dark themes keep the 3D starry background
   ===================================================================== */
const TH_NEW=[
 {k:"aurora",l:"Aurora",d:"Northern lights: teal and violet on deep blue",dark:1,
  bg:"#0B1020",surface:"#141A33",surface2:"#1A2242",line:"#263057",line2:"#34407A",fg:"#EEF4FF",muted:"#A9B8E0",ink:"#5EEAD4",inkSoft:"#13303A",onInk:"#06201C",inkHover:"#99F6E4",sky:"#38BDF8",skyS:"#0C2A3D",gold:"#FBBF24",goldS:"#3A2E0C",rose:"#F472B6",roseS:"#3D1A2E",grad:"linear-gradient(120deg,#5EEAD4 0%,#818CF8 100%)",gradtext:"linear-gradient(100deg,#5EEAD4 0%,#818CF8 55%,#F472B6 100%)"},
 {k:"sakura",l:"Sakura",d:"Soft cherry blossom: pink and white",dark:0,
  bg:"#FDF2F5",surface:"#FFFFFF",surface2:"#FCE9EF",line:"#F3D3DE",line2:"#E9B8C8",fg:"#3B1F2B",muted:"#8A5C6E",ink:"#B83A6B",inkSoft:"#FBE3EC",onInk:"#FFFFFF",inkHover:"#962E56",sky:"#7C6BD6",skyS:"#ECE9FB",gold:"#C98B2B",goldS:"#FBF0DC",rose:"#E0557F",roseS:"#FCE3EB",grad:"linear-gradient(120deg,#E0557F 0%,#B83A6B 100%)",gradtext:"linear-gradient(100deg,#E0557F 0%,#B83A6B 55%,#C98B2B 100%)"},
 {k:"foret",l:"Forest",d:"Deep green forest with emerald and gold",dark:1,
  bg:"#0C1A14",surface:"#132A20",surface2:"#183327",line:"#22473A",line2:"#2F5C4C",fg:"#EAF7F0",muted:"#A7CDBB",ink:"#6EE7B7",inkSoft:"#173B2D",onInk:"#05261A",inkHover:"#A7F3D0",sky:"#5EC9A0",skyS:"#123A2C",gold:"#E9C46A",goldS:"#3A3218",rose:"#F4A261",roseS:"#3D2A1B",grad:"linear-gradient(120deg,#34D399 0%,#10B981 100%)",gradtext:"linear-gradient(100deg,#6EE7B7 0%,#E9C46A 60%,#F4A261 100%)"},
 {k:"soleil",l:"Soleil",d:"Warm sunset: orange, amber and coral",dark:0,
  bg:"#FFF7EE",surface:"#FFFFFF",surface2:"#FFF0E0",line:"#F7DCC2",line2:"#EDC39C",fg:"#3A2412",muted:"#866247",ink:"#E2622B",inkSoft:"#FDE5D6",onInk:"#FFFFFF",inkHover:"#C24E1C",sky:"#2F80ED",skyS:"#E3EEFD",gold:"#E8A317",goldS:"#FDF1D3",rose:"#D6336C",roseS:"#FBE3EB",grad:"linear-gradient(120deg,#F59E0B 0%,#E2622B 100%)",gradtext:"linear-gradient(100deg,#E2622B 0%,#F59E0B 55%,#D6336C 100%)"},
 {k:"lavande",l:"Lavender",d:"Calm lavender and violet, light and airy",dark:0,
  bg:"#F5F3FF",surface:"#FFFFFF",surface2:"#F1EEFD",line:"#E2DCFA",line2:"#CBC2F2",fg:"#241D47",muted:"#6B63A0",ink:"#6D4AE0",inkSoft:"#ECE6FF",onInk:"#FFFFFF",inkHover:"#5734C2",sky:"#3B82F6",skyS:"#E4EEFF",gold:"#D69E2E",goldS:"#FBF3DD",rose:"#E95C9B",roseS:"#FCE6F1",grad:"linear-gradient(120deg,#8B5CF6 0%,#6366F1 100%)",gradtext:"linear-gradient(100deg,#6D4AE0 0%,#9B6BFF 55%,#E95C9B 100%)"},
 {k:"ardoise",l:"Slate & Coral",d:"Dark slate with a coral glow",dark:1,
  bg:"#111418",surface:"#1B2026",surface2:"#222831",line:"#2D3540",line2:"#3D4856",fg:"#F3F4F6",muted:"#A7B0BD",ink:"#FF8A65",inkSoft:"#3A241E",onInk:"#1A0E08",inkHover:"#FFAB91",sky:"#60A5FA",skyS:"#1B2A3D",gold:"#FCD34D",goldS:"#3A3212",rose:"#F87171",roseS:"#3D1F1F",grad:"linear-gradient(120deg,#FF8A65 0%,#F472B6 100%)",gradtext:"linear-gradient(100deg,#FFAB91 0%,#FCD34D 60%,#F87171 100%)"},
 {k:"glacier",l:"Glacier",d:"Icy clear blue, fresh and clean",dark:0,
  bg:"#EEF7FB",surface:"#FFFFFF",surface2:"#E8F3F9",line:"#D3E7F1",line2:"#B5D5E6",fg:"#0F2A3A",muted:"#5A7A8C",ink:"#0A7EA4",inkSoft:"#DDF1F8",onInk:"#FFFFFF",inkHover:"#076584",sky:"#0A7EA4",skyS:"#DDF1F8",gold:"#D39B2A",goldS:"#FBF0D6",rose:"#E06C75",roseS:"#FBE4E6",grad:"linear-gradient(120deg,#22B8CF 0%,#0A7EA4 100%)",gradtext:"linear-gradient(100deg,#0A7EA4 0%,#22B8CF 55%,#8BE9FD 100%)"}
];
const TH_RGBA=(hex,a)=>{const h=hex.replace("#","");const n=parseInt(h.length===3?h.split("").map(c=>c+c).join(""):h,16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
function thCSS(t){const dk=!!t.dark;
  return`:root[data-skin="${t.k}"]{--bg:${t.bg};--surface:${t.surface};--surface2:${t.surface2};--line:${t.line};--line2:${t.line2};--fg:${t.fg};--muted:${t.muted};--ink:${t.ink};--ink-soft:${t.inkSoft};--on-ink:${t.onInk};--ink-hover:${t.inkHover};--sky:${t.sky};--sky-soft:${t.skyS};--gold:${t.gold};--gold-soft:${t.goldS};--rose:${t.rose};--rose-soft:${t.roseS};--grad:${t.grad};--gradtext:${t.gradtext};--glass-bg:${TH_RGBA(t.surface,dk?.72:.88)};--header-bg:${TH_RGBA(t.bg,.8)};--nav-bg:${TH_RGBA(t.surface,.9)};--hero-bg:linear-gradient(135deg,${TH_RGBA(t.surface,.96)},${TH_RGBA(t.surface2,.9)});--empty-bg:${TH_RGBA(t.surface,.6)};--flash-front:linear-gradient(160deg,${t.surface},${t.surface2});--overlay:${dk?"rgba(0,0,0,.55)":TH_RGBA(t.fg,.35)}}
:root[data-skin="${t.k}"] body{background:${t.bg};color:var(--fg)}
:root[data-skin="${t.k}"] .glass{background:var(--glass-bg)}`}
{const st=document.createElement("style");st.id="th5css";st.textContent=TH_NEW.map(thCSS).join("\n")+`
.skins{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.skin .sw i{box-shadow:inset 0 -6px 12px rgba(0,0,0,.08)}
`;document.head.appendChild(st)}
/* add the new themes to the theme list (after the five existing ones) */
for(const t of TH_NEW){if(!SKINS.some(x=>x[0]===t.k))SKINS.push([t.k,t.l,t.d,[t.bg,t.ink,t.gold]])}
const TH_DARK=new Set(TH_NEW.filter(t=>t.dark).map(t=>t.k));
{const _dk=isDarkSkin;isDarkSkin=function(){if(TH_DARK.has(SKIN))return true;return _dk()}}
/* the 3D starry background follows the dark themes */
if(typeof window.__bgSkin==="function")window.__bgSkin(isDarkSkin());
