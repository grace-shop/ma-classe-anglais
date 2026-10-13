/* =====================================================================
   v5 · Magic touches: small, fun moments that make the app feel alive.
   - A sparkle burst where you tap a button or a card.
   - Hearts float up from the Like button when you like a post.
   - Confetti when a post, a challenge or a story is shared.
   - A warm welcome, once a day.
   All of it is off when the phone asks for less motion (reduced motion).
   ===================================================================== */
const MG={calm:()=>matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches};
const MG_COLORS=["#5EEAD4","#818CF8","#F472B6","#FBBF24","#A7F3D0","#93C5FD"];

function mgBurst(x,y,n,glyphs,spread){if(MG.calm())return;
  const max=60;const k=Math.min(n,max);
  for(let i=0;i<k;i++){
    const el=document.createElement("span");el.className="mg-p";
    const g=glyphs?glyphs[i%glyphs.length]:null;
    if(g){el.textContent=g}else{el.style.background=MG_COLORS[i%MG_COLORS.length];el.style.width="8px";el.style.height="12px";el.style.borderRadius="2px"}
    document.body.appendChild(el);
    const a=Math.random()*Math.PI*2,d=(spread||90)*(0.4+Math.random()*0.8),dx=Math.cos(a)*d,dy=Math.sin(a)*d-(glyphs?40:0);
    const rot=(Math.random()*720-360);
    const anim=el.animate([
      {transform:`translate(${x}px,${y}px) rotate(0deg) scale(.4)`,opacity:1},
      {transform:`translate(${x+dx}px,${y+dy}px) rotate(${rot/2}deg) scale(1)`,opacity:1,offset:.7},
      {transform:`translate(${x+dx*1.1}px,${y+dy+(glyphs?-30:120)}px) rotate(${rot}deg) scale(.8)`,opacity:0}
    ],{duration:900+Math.random()*700,easing:"cubic-bezier(.2,.7,.3,1)",fill:"forwards"});
    anim.onfinish=()=>el.remove();
  }}
function mgAt(el){const r=el&&el.getBoundingClientRect?el.getBoundingClientRect():null;return r?{x:r.left+r.width/2,y:r.top+r.height/2}:{x:innerWidth/2,y:innerHeight/2}}

/* 1 · a sparkle where you tap a button or a card */
document.addEventListener("pointerdown",e=>{const t=e.target.closest&&e.target.closest(".btn,.card,.factions button,.fpick button,.fvid,.pcard,.role");
  if(!t||MG.calm())return;mgBurst(e.clientX,e.clientY,8,["✦","✧","⋆"],46)},{passive:true});

/* 2 · hearts float up from the Like button */
{const _fl=fLike;fLike=function(id,e){const before=(F.likes[id]||[]).some(l=>l.uid===S.uid);
  const r=_fl.apply(this,arguments);
  if(!before){const btn=document.querySelector(`[data-v4="fLike"][data-id="${CSS.escape(String(id))}"]`);const p=mgAt(btn);
    mgBurst(p.x,p.y,10,["❤️","💖","✨","😍"],70)}
  return r}}

/* 3 · confetti when something is shared */
function mgConfetti(){mgBurst(innerWidth/2,innerHeight*0.55,60,null,260)}
{const _c=window.__feed.create;window.__feed.create=async function(){const id=await _c.apply(this,arguments);mgConfetti();return id}}
{const _ch=window.__feed.challenge;window.__feed.challenge=async function(){const id=await _ch.apply(this,arguments);mgConfetti();return id}}

/* 4 · a warm welcome, once a day */
setTimeout(function hello(){try{
  if(!S.uid||!S.me||S.mode!=="student"){setTimeout(hello,3000);return}
  const k="ec_hello_"+S.uid;const today=new Date().toISOString().slice(0,10);
  if(localStorage.getItem(k)===today)return;
  localStorage.setItem(k,today);
  const first=String((S.me&&S.me.name)||"").split(" ")[0]||"friend";
  setTimeout(()=>{try{toast(`✨ Welcome, ${first}! Let's learn something new today.`,"rocket")}catch(e){}},1200);
}catch(e){}},4000);

{const st=document.createElement("style");st.id="zzzcmagic";st.textContent=`
.mg-p{position:fixed;left:0;top:0;z-index:9990;pointer-events:none;font-size:16px;line-height:1;will-change:transform,opacity;display:block}
.fcnt{display:inline-block;min-width:1.25em;padding:0 6px;margin-left:2px;border-radius:999px;background:var(--surface2,rgba(255,255,255,.12));font-size:.72rem;font-weight:700;line-height:1.5;text-align:center;vertical-align:1px}
.factions button{white-space:nowrap}
.factions button .fcnt{font-size:.7rem}
`;document.head.appendChild(st)}
