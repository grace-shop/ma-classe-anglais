/* =====================================================================
   v5 · Sakura, a kawaii mascot who cheers each right answer.
   She pops up in the corner with a short English cheer, then slides away.
   She is drawn in the app (SVG), so she is always sharp and light.
   Detection: any "Correct!" shown by the Arena, the battles, the quiz…
   She hops and shows happy eyes; with "less motion" on, she only shows.
   ===================================================================== */
const MAS={last:0,off:false,t:null};
const MAS_LINES=["Yes! You got it! 🎉","Perfect, keep going!","Sugoi! You're on fire!","Nice work, superstar! ⭐","That's right! Well done! 🌸","You did it! Keep it up!"];
const masPick=()=>MAS_LINES[Math.floor(Math.random()*MAS_LINES.length)];
function masSVG(){return `<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">
  <path d="M30 66c-4-26 12-44 30-44s34 18 30 44c0 14 3 26 8 36-10-2-16-8-18-16H40c-2 8-8 14-18 16 5-10 8-22 8-36z" fill="#1B1F3B"/>
  <path d="M26 102c4 28 14 44 34 44s30-16 34-44z" fill="#1B1F3B" opacity=".25"/>
  <ellipse cx="60" cy="66" rx="28" ry="29" fill="#FCE4D6"/>
  <path d="M31 60c3-16 14-25 29-25 11 0 20 6 24 16-8-4-17-3-24 2-7-3-16-2-29 7z" fill="#1B1F3B"/>
  <path d="M48 36c3 3 6 4 12 4" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g class="ey-o"><ellipse cx="49" cy="68" rx="4.6" ry="6" fill="#1B1F3B"/><ellipse cx="71" cy="68" rx="4.6" ry="6" fill="#1B1F3B"/><circle cx="50.8" cy="66" r="1.9" fill="#fff"/><circle cx="72.8" cy="66" r="1.9" fill="#fff"/></g>
  <g class="ey-h" stroke="#1B1F3B" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M44 69q5-6 10 0"/><path d="M66 69q5-6 10 0"/></g>
  <ellipse cx="41" cy="79" rx="5" ry="3" fill="#F9A8D4" opacity=".75"/><ellipse cx="79" cy="79" rx="5" ry="3" fill="#F9A8D4" opacity=".75"/>
  <path class="mo-s" d="M54 80q6 5 12 0" stroke="#B4233F" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="mo-h" d="M52 79h16q-1 9-8 9t-8-9z" fill="#E11D48"/>
  <path class="mo-f" d="M54 84q6-5 12 0" stroke="#B4233F" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path class="drop" d="M90 46q-5 8-5 12a5 5 0 0 0 10 0q0-4-5-12z" fill="#7DD3FC"/>
  <path class="uni" d="M42 99q18-8 36 0l6 40H36z" fill="#6366F1"/>
  <path d="M48 99l12 13 12-13" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/>
  <path d="M60 104l-8-4v9zM60 104l8-4v9z" fill="#F472B6"/>
  <g class="arms" fill="none" stroke="#FCE4D6" stroke-width="7" stroke-linecap="round"><path d="M42 106q-14-8-16-36"/><path d="M78 106q14-8 16-36"/></g>
  <g class="spk" fill="#FBBF24"><path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M104 24l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#F472B6"/><path d="M108 70l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/></g>
</svg>`}
const MAS_BAD=["Almost! Try again, you can do it! 💪","Not quite, but you are learning!","Good try! Look at the answer and go again.","No problem, every mistake helps you learn!"];
const MAS_LOOKS=["","look-2","look-3"];
function masLook(){try{return +(localStorage.getItem("ec_mas_look")||0)%MAS_LOOKS.length}catch(e){return 0}}
function masApplyLook(box){box.classList.remove("look-2","look-3");const c=MAS_LOOKS[masLook()];if(c)box.classList.add(c)}
function masShow(text,mood){if(document.documentElement.getAttribute("data-lite")==="1")return;
  if(MAS.off||Date.now()-MAS.last<2500)return;MAS.last=Date.now();
  let box=document.getElementById("mas");
  if(!box){box=document.createElement("div");box.id="mas";box.className="mas";
    box.innerHTML=`<div class="mas-bub" role="status" aria-live="polite"></div><div class="mas-girl">${masSVG()}</div><button type="button" class="mas-x" aria-label="Hide Sakura">×</button>`;
    document.body.appendChild(box);
    box.querySelector(".mas-x").onclick=()=>{MAS.off=true;box.remove()};
    box.querySelector(".mas-girl").onclick=()=>{try{localStorage.setItem("ec_mas_look",String(masLook()+1))}catch(e){}masApplyLook(box);masShow("New look! Do you like it? 💖","happy")};
    masApplyLook(box)}
  box.querySelector(".mas-bub").textContent=text;
  box.classList.toggle("sad",mood==="bad");
  box.classList.remove("in");void box.offsetWidth;box.classList.add("in");
  clearTimeout(MAS.t);MAS.t=setTimeout(()=>box.classList.remove("in"),3800);
}
/* spot the "Correct!" feedback wherever it appears */
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;
  const hit=(n.matches&&n.matches(".ar-note.good"))||(n.querySelector&&n.querySelector(".ar-note.good"));
  const txt=(n.textContent||"").trim();
  const bad=(n.matches&&n.matches(".ar-note.bad"))||(n.querySelector&&n.querySelector(".ar-note.bad"));
  if(bad&&/^(Not quite|Time's up)/.test(txt)){masShow(MAS_BAD[Math.floor(Math.random()*MAS_BAD.length)],"bad");continue}
  if(hit||(n.matches&&n.matches("p,div,span,b,h2")&&/^Correct!/.test(txt)&&txt.length<60))masShow(masPick(),"happy");
}}).observe(document.body,{childList:true,subtree:true});

{const st=document.createElement("style");st.id="zzzdmascot";st.textContent=`
.mas{position:fixed;right:8px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:70;width:96px;pointer-events:none;transform:translateY(24px) scale(.6);opacity:0;transition:transform .45s cubic-bezier(.2,1.4,.4,1),opacity .3s}
.mas.in{transform:none;opacity:1}
.mas-girl{pointer-events:auto;cursor:pointer;display:block}
.mas-girl svg{width:96px;height:auto;display:block;filter:drop-shadow(0 10px 14px rgba(0,0,0,.4))}
.mas .mo-f,.mas .drop{display:none}
.mas.look-2 .uni{fill:#EC4899}.mas.look-3 .uni{fill:#10B981}
.mas.sad.in .mo-s{display:none}.mas.sad.in .mo-f{display:inline}.mas.sad.in .mo-h{display:none}
.mas.sad.in .ey-h{display:none}.mas.sad.in .ey-o{display:inline}.mas.sad.in .arms{display:none}
.mas.sad.in .spk{display:none}.mas.sad.in .drop{display:inline}
.mas.sad.in .mas-girl{animation:masSlump .7s ease-out 1 both}
@keyframes masSlump{0%{transform:translateY(0)}50%{transform:translateY(4px) rotate(-3deg)}100%{transform:translateY(2px)}}
.mas .ey-h{display:none}.mas .mo-h{display:none}.mas .arms{display:none}.mas .spk{opacity:0}
.mas.in .ey-h{display:inline}.mas.in .ey-o{display:none}
.mas.in .mo-h{display:inline}.mas.in .mo-s{display:none}
.mas.in .arms{display:inline}
.mas.in .spk{opacity:1;animation:masTw 1s ease-in-out infinite alternate}
.mas.in .mas-girl{animation:masHop .6s ease-out 2}
.mas.sad .mas-bub{background:#FFE4E6;color:#7F1D1D}
.mas-bub{position:absolute;right:100px;bottom:74px;width:max-content;max-width:190px;background:#fff;color:#1B1F3B;border-radius:16px 16px 4px 16px;padding:9px 12px;font:700 .9rem/1.25 system-ui,sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.mas-x{position:absolute;top:-6px;left:-4px;pointer-events:auto;width:24px;height:24px;border-radius:50%;border:0;background:#1B1F3B;color:#fff;font-size:16px;line-height:1;cursor:pointer;opacity:.85}
@keyframes masHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}
@keyframes masTw{from{opacity:.4}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.mas,.mas-girl,.mas .spk{animation:none!important;transition:none}}
`;document.head.appendChild(st)}
