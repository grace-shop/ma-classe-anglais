/* =====================================================================
   v5 · Écran de victoire en 3D, boutons Arena et Battles plus beaux,
   bouton retour transparent. Tout est sobre en économie d'énergie.
   ===================================================================== */
AR_I.crown='<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/><path d="M5 19h14"/>';

/* le trophée 3D et l'écran de victoire, partagés par l'Arena et les battles */
function vicHTML(o){
  const g="vt"+Math.floor(Math.random()*1e6),stars=Math.max(0,Math.min(3,o.stars||0));
  const conf=stars>=2?`<div class="ar-confetti vic-conf">${Array.from({length:40},(_,k)=>`<i style="left:${(k*37)%100}%;animation-delay:${((k%7)*0.18).toFixed(2)}s;background:${["#5EEAD4","#818CF8","#F472B6","#FBBF24","#FFFFFF"][k%5]}"></i>`).join("")}</div>`:"";
  const trophy=`<svg class="vic-trophy" viewBox="0 0 160 160" aria-hidden="true">
    <defs>
      <linearGradient id="${g}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D1"/><stop offset=".4" stop-color="#FBBF24"/><stop offset=".8" stop-color="#D97706"/><stop offset="1" stop-color="#78350F"/></linearGradient>
      <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#92400E"/></linearGradient>
      <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F8F"/><stop offset="1" stop-color="#0B0E2A"/></linearGradient>
      <radialGradient id="${g}d" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="${g}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
    </defs>
    <ellipse cx="80" cy="151" rx="48" ry="6" fill="#000" opacity=".4" filter="url(#${g}f)"/>
    <path d="M42 22c-24 0-32 14-32 26 0 16 12 26 36 30" fill="none" stroke="url(#${g}b)" stroke-width="8" stroke-linecap="round"/>
    <path d="M118 22c24 0 32 14 32 26 0 16-12 26-36 30" fill="none" stroke="url(#${g}b)" stroke-width="8" stroke-linecap="round"/>
    <path d="M40 24h80v36c0 34-18 56-40 56s-40-22-40-56z" fill="url(#${g}a)"/>
    <path d="M40 24h80v10H40z" fill="url(#${g}b)" opacity=".7"/>
    <path d="M60 40v30c0 16 6 30 14 36" stroke="#fff" stroke-opacity=".8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M104 44c0 14-2 26-8 36" stroke="#78350F" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="66" cy="50" rx="10" ry="6" fill="url(#${g}d)"/>
    <rect x="71" y="118" width="18" height="22" fill="url(#${g}b)"/>
    <path d="M50 138h60l8 14H42z" fill="url(#${g}c)"/>
    <rect x="42" y="146" width="76" height="9" rx="3" fill="url(#${g}c)"/>
    <path d="M80 54l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L80 77.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="#FFF7D1" opacity=".85"/>
  </svg>`;
  const sparks=Array.from({length:8},(_,k)=>`<i class="vic-spark" style="--a:${k*45}deg;animation-delay:${(k*0.3).toFixed(1)}s"></i>`).join("");
  return `<div class="vic ${o.mood||""}">${conf}
    <div class="vic-stage"><div class="vic-aura"></div><div class="vic-ring r1"></div><div class="vic-ring r2"></div>${sparks}${trophy}</div>
    <p class="vic-kicker">${arEsc(o.kicker||"Battle over")}</p>
    <h2 class="vic-title">${arEsc(o.title||"")}</h2>
    <div class="vic-score"><b>${o.score}</b><small>${arEsc(o.label||"points")}</small></div>
    <div class="vic-stars" aria-label="${stars} stars">${[1,2,3].map(n=>`<span class="${n<=stars?"on":""}" style="animation-delay:${(n*0.15).toFixed(2)}s">★</span>`).join("")}</div>
    ${o.sub?`<p class="vic-sub">${arEsc(o.sub)}</p>`:""}
  </div>`}

/* fin d'une partie de l'Arena : même écran, nouveau décor */
function arEnd(mode,score,max,msg){arStopT();AR.mode=null;
  const prev=AR.best[mode];if(prev==null||score>prev){AR.best[mode]=score;try{localStorage.setItem("ar_best",JSON.stringify(AR.best))}catch(e){}}
  arSubmit(mode,score);AR.boardMode=mode;
  const f=max?score/max:1;const stars=f>=0.85?3:f>=0.5?2:1;
  const names={quiz:"Quiz Blitz",guess:"Guess the Word",fill:"Fill the Gap",order:"Word Order",cards:"Flashcards",clock:"Beat the Clock",odd:"Odd One Out",traps:"Grammar Traps"};
  const label=mode==="cards"?"cards learned":mode==="clock"?"correct answers":"points";
  arSet(arTop(names[mode]||"Arena","")+vicHTML({title:stars===3?"Brilliant!":stars===2?"Well done!":"Keep going!",
      kicker:names[mode]||"Arena",score:score,label:label,stars:stars,mood:stars>=2?"win":"end",sub:msg||`Best: ${AR.best[mode]}`})+
    `<div class="ar-inrow vic-actions">
        <button class="ar-go vic-go" data-ar="start" data-m="${mode}">Play again</button>
        <button class="ar-go ghost" data-ar="board">Class board</button>
        <button class="ar-go ghost" data-ar="home">Arena</button></div>`)}

/* ---------- habillage ---------- */
{const st=document.createElement("style");st.id="zzznvic";st.textContent=`
.vic{position:relative;text-align:center;padding:10px 6px 6px;isolation:isolate;overflow:hidden}
.vic-stage{position:relative;width:184px;height:184px;margin:6px auto 22px;transform-style:preserve-3d;animation:vicFloat 4.2s ease-in-out infinite}
.vic-trophy{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 16px 22px rgba(251,191,36,.35)) drop-shadow(0 4px 6px rgba(0,0,0,.45));transform:rotateY(-10deg) rotateX(4deg);transition:transform .6s}
.vic:hover .vic-trophy{transform:rotateY(8deg) rotateX(-3deg)}
.vic-aura{position:absolute;inset:-26px;border-radius:50%;background:radial-gradient(circle,rgba(251,191,36,.42),rgba(244,114,182,.22) 42%,transparent 70%);filter:blur(8px);animation:vicPulse 3s ease-in-out infinite}
.vic.end .vic-aura{background:radial-gradient(circle,rgba(94,234,212,.4),rgba(129,140,248,.2) 42%,transparent 70%)}
.vic.end .vic-trophy{filter:hue-rotate(150deg) saturate(.8) drop-shadow(0 16px 22px rgba(94,234,212,.3))}
.vic-ring{position:absolute;inset:-6px;border-radius:50%;border:1.5px solid transparent;border-top-color:rgba(142,246,228,.85);border-right-color:rgba(129,140,248,.55);animation:vicSpin 6s linear infinite}
.vic-ring.r2{inset:-18px;border-top-color:rgba(244,114,182,.7);border-left-color:rgba(251,191,36,.45);animation-duration:9s;animation-direction:reverse}
.vic-spark{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:#FDE68A;box-shadow:0 0 12px #FBBF24;transform:rotate(var(--a)) translateY(-104px);animation:vicTwinkle 2.4s ease-in-out infinite}
.vic-kicker{margin:6px 0 0;font-size:.72rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#A5B4FC}
.vic-title{margin:6px 0 0;font-size:clamp(2rem,8vw,2.6rem);line-height:1.05;font-family:"Instrument Serif",Georgia,serif;font-weight:400;background:linear-gradient(120deg,#FFF7D1,#FBBF24 45%,#F472B6);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 14px rgba(251,191,36,.25))}
.vic.end .vic-title{background:linear-gradient(120deg,#CCFBF1,#5EEAD4 45%,#818CF8);-webkit-background-clip:text;background-clip:text}
.vic-score{display:flex;flex-direction:column;align-items:center;margin:8px 0 0}
.vic-score b{font-size:4.4rem;line-height:1;font-weight:900;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#fff,#A5B4FC 60%,#6366F1);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 12px 30px rgba(99,102,241,.35)}
.vic-score small{margin-top:4px;font-size:.72rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#94A3D8}
.vic-stars{display:flex;justify-content:center;gap:10px;margin:14px 0 4px;font-size:2rem;line-height:1}
.vic-stars span{color:rgba(148,163,216,.35);transition:transform .4s}
.vic-stars span.on{color:#FBBF24;text-shadow:0 0 16px rgba(251,191,36,.8),0 3px 0 #92400E;animation:vicStar .6s cubic-bezier(.2,1.6,.4,1) both}
.vic-sub{margin:8px 0 0;color:#B8C2E6;font-size:.95rem}
.vic-actions{justify-content:center;flex-wrap:wrap;margin-top:18px}
.vic-go{box-shadow:0 0 0 1px rgba(255,255,255,.4) inset,0 12px 28px -8px rgba(94,234,212,.7)}
@keyframes vicFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes vicPulse{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes vicSpin{to{transform:rotate(360deg)}}
@keyframes vicTwinkle{0%,100%{opacity:.2;scale:.6}50%{opacity:1;scale:1.2}}
@keyframes vicStar{from{transform:scale(.2) rotate(-40deg);opacity:0}to{transform:none;opacity:1}}

/* Arena : cartes et bouton flottant plus travaillés */
.ar-mode,.bt-entry{position:relative;overflow:hidden;border:1px solid rgba(165,180,252,.22)!important;background:linear-gradient(160deg,rgba(40,44,110,.72),rgba(12,14,38,.85))!important;box-shadow:0 18px 40px -18px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12)!important;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s}
.ar-mode:hover,.ar-mode:focus-visible{transform:translateY(-4px) rotateX(3deg);border-color:rgba(142,246,228,.6)!important;box-shadow:0 26px 50px -20px rgba(94,234,212,.35),inset 0 1px 0 rgba(255,255,255,.2)!important}
.ar-mode::after{content:"";position:absolute;inset:auto -20% -60% -20%;height:70%;background:radial-gradient(ellipse,rgba(94,234,212,.22),transparent 70%);pointer-events:none}
.ar-mode .ar-badge{position:relative;background:radial-gradient(circle at 30% 25%,#FFFFFF 0,#8EF6E4 22%,#5EEAD4 45%,#4F46E5 100%)!important;box-shadow:0 10px 24px -6px rgba(94,234,212,.7),inset 0 -6px 12px rgba(30,27,75,.35),inset 0 2px 4px rgba(255,255,255,.7)!important}
.ar-mode .ar-badge .ar-ic{stroke:#0B1030;stroke-width:2.2;filter:drop-shadow(0 1px 0 rgba(255,255,255,.6))}
.ar-mode b{font-size:1.02rem;letter-spacing:.01em}
.bt-entry{border-radius:22px!important;padding:16px 18px!important;font-weight:900!important;letter-spacing:.02em;background:linear-gradient(120deg,#5EEAD4 0%,#A7F3D0 35%,#818CF8 100%)!important;color:#0B1030!important;box-shadow:0 18px 40px -12px rgba(94,234,212,.65),inset 0 2px 0 rgba(255,255,255,.7),inset 0 -4px 0 rgba(30,27,75,.18)!important;text-shadow:0 1px 0 rgba(255,255,255,.4)}
.bt-entry:active{transform:scale(.98)}
.ar-fab{background:linear-gradient(160deg,rgba(30,34,90,.92),rgba(10,12,34,.92))!important;border:1px solid rgba(165,180,252,.35)!important;box-shadow:0 14px 30px -10px rgba(0,0,0,.8),0 0 0 4px rgba(94,234,212,.08),inset 0 1px 0 rgba(255,255,255,.18)!important;backdrop-filter:blur(12px)}
.ar-fab .ar-badge{background:radial-gradient(circle at 30% 25%,#FFF7D1,#FBBF24 45%,#B45309)!important;box-shadow:0 0 18px rgba(251,191,36,.7),inset 0 2px 3px rgba(255,255,255,.7)!important}
.ar-fab .ar-badge .ar-ic{stroke:#3B1D05}

/* bouton retour : transparent, en verre, avec un liseré lumineux */
.back,.ar-glass{background:rgba(255,255,255,.06)!important;backdrop-filter:blur(12px) saturate(1.3);-webkit-backdrop-filter:blur(12px) saturate(1.3);border:1px solid rgba(255,255,255,.22)!important;box-shadow:0 8px 22px -10px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.25)!important;color:#EEF2FF!important;transition:transform .2s,background .2s,box-shadow .2s}
.back:hover,.ar-glass:hover{background:rgba(94,234,212,.12)!important;box-shadow:0 0 0 3px rgba(94,234,212,.15),0 10px 26px -10px rgba(94,234,212,.5)!important}
.back:active,.ar-glass:active{transform:scale(.92)}
.back{border-radius:999px;padding:8px 16px 8px 12px;display:inline-flex;align-items:center;gap:6px;font-weight:700}
.back svg{width:18px;height:18px}

/* économie d'énergie : aucune animation */
:root[data-lite="1"] .vic-stage,:root[data-lite="1"] .vic-aura,:root[data-lite="1"] .vic-ring,:root[data-lite="1"] .vic-spark,:root[data-lite="1"] .vic-stars span{animation:none!important}
@media (prefers-reduced-motion:reduce){.vic-stage,.vic-aura,.vic-ring,.vic-spark,.vic-stars span{animation:none!important}}
`;document.head.appendChild(st)}
