/* =====================================================================
   v5 profiles: Snapchat-style avatar (with gestures), bio for every learner
   - Avatar builder: skin, hair, eyes, mouth, outfit, background
   - Gestures: the avatar performs its gestures one after the other (wave, peace, cheer)
   - Bio: up to 150 characters, shown on the profile and in the chat header
   - Stored in students/<uid> (fields avt, bio); read by others through profiles_min / get_profile
   - Cached on the phone so the avatar still shows offline
   Server: supabase/profils.sql
   ===================================================================== */
const AV={
  skin:["#F6D2B5","#E8B48F","#C98B62","#9A6240","#6B4128"],
  hair:["#1A1412","#3B2A22","#7A4B2A","#D9A441","#E36F8F"],
  outfit:["#4A5FD0","#E5484D","#25D366","#F5A524","#9A7CFF"],
  bg:["#DDE6FF","#FFE3D3","#D9F7E8","#EADBFF","#FFF3C4"],
  hairStyles:["None","Short","Long","Curly","Bun"],
  eyeStyles:["Dots","Happy","Big"],
  mouthStyles:["Smile","Open","Grin"],
  gestures:["wave","peace","cheer"],
  draft:null, cache:{}, load:{}
};
const AV_DEF={skin:1,hair:1,hairCol:0,eyes:1,mouth:0,outfit:0,bg:0};
const avtOf=d=>({...AV_DEF,...((d&&typeof d==="object")?d:{})});

/* ---- drawing: a 3D-looking figure built from gradients and soft shadows ---- */
function avtSVG(raw,gest,size){
  const a=avtOf(raw),sk=AV.skin[a.skin%AV.skin.length],hc=AV.hair[a.hairCol%AV.hair.length],oc=AV.outfit[a.outfit%AV.outfit.length],bg=AV.bg[a.bg%AV.bg.length];
  const hs=a.hair;
  const hairBack=hs===2?`<path d="M34 50 Q30 92 40 100 L80 100 Q90 92 86 50 Q60 22 34 50Z" fill="url(#hr${a.hairCol})"/>`:hs===4?`<circle cx="60" cy="22" r="13" fill="url(#hr${a.hairCol})"/>`:"";
  const hairFront=hs===1?`<path d="M35 52 Q34 24 60 22 Q88 24 85 52 Q76 36 60 37 Q44 36 35 52Z" fill="url(#hr${a.hairCol})"/>`
    :hs===2?`<path d="M36 50 Q38 26 60 25 Q84 26 84 50 Q72 38 60 39 Q46 38 36 50Z" fill="url(#hr${a.hairCol})"/>`
    :hs===3?`${[[40,36],[52,28],[66,28],[80,36],[36,50],[84,50],[60,30]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="url(#hr${a.hairCol})"/>`).join("")}`
    :hs===4?`<path d="M36 48 Q38 30 60 30 Q82 30 84 48 Q70 38 60 39 Q50 38 36 48Z" fill="url(#hr${a.hairCol})"/>`:"";
  const eyes=a.eyes===1?`<path d="M44 58 Q49 52 54 58" stroke="#1A1412" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M66 58 Q71 52 76 58" stroke="#1A1412" stroke-width="3" fill="none" stroke-linecap="round"/>`
    :a.eyes===2?`<ellipse cx="49" cy="58" rx="5.5" ry="6.5" fill="#1A1412"/><ellipse cx="71" cy="58" rx="5.5" ry="6.5" fill="#1A1412"/><circle cx="51" cy="55.5" r="2" fill="#fff"/><circle cx="73" cy="55.5" r="2" fill="#fff"/>`
    :`<circle cx="49" cy="58" r="3.6" fill="#1A1412"/><circle cx="71" cy="58" r="3.6" fill="#1A1412"/>`;
  const mouth=a.mouth===1?`<ellipse cx="60" cy="76" rx="6" ry="5" fill="#7A2E2E"/>`
    :a.mouth===2?`<path d="M50 72 Q60 86 70 72Z" fill="#fff" stroke="#7A2E2E" stroke-width="2.4" stroke-linejoin="round"/>`
    :`<path d="M51 73 Q60 83 69 73" stroke="#7A2E2E" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const g=gest||"";
  const armR=g==="wave"?`<g class="av3-arm av3-wave" style="transform-origin:86px 92px"><path d="M84 92 Q96 70 92 52" stroke="url(#sk${a.skin})" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="92" cy="48" r="7" fill="url(#sk${a.skin})"/></g>`
    :g==="peace"?`<g class="av3-arm av3-peace" style="transform-origin:86px 92px"><path d="M84 92 Q100 80 98 62" stroke="url(#sk${a.skin})" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M96 56 L94 40 M101 56 L104 41" stroke="url(#sk${a.skin})" stroke-width="5" stroke-linecap="round"/></g>`
    :g==="cheer"?`<g class="av3-arm av3-cheer" style="transform-origin:86px 92px"><path d="M84 92 Q98 78 92 46" stroke="url(#sk${a.skin})" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="91" cy="42" r="7" fill="url(#sk${a.skin})"/></g>`
    :`<path d="M84 92 Q92 102 90 110" stroke="url(#sk${a.skin})" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  return`<svg viewBox="0 0 120 120" width="${size||120}" height="${size||120}" role="img" aria-label="Avatar" xmlns="http://www.w3.org/2000/svg">
<defs>
 <radialGradient id="bg${a.bg}" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${bg}"/></radialGradient>
 <linearGradient id="sk${a.skin}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sk}" stop-opacity="1"/><stop offset="1" stop-color="${sk}" stop-opacity=".78"/></linearGradient>
 <linearGradient id="hr${a.hairCol}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hc}"/><stop offset="1" stop-color="${hc}" stop-opacity=".82"/></linearGradient>
 <linearGradient id="oc${a.outfit}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${oc}"/><stop offset="1" stop-color="${oc}" stop-opacity=".7"/></linearGradient>
 <radialGradient id="hl" cx="35%" cy="25%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="60" cy="60" r="58" fill="url(#bg${a.bg})"/>
<ellipse cx="60" cy="112" rx="34" ry="6" fill="#000" opacity=".12"/>
${hairBack}
<path d="M24 120 Q24 88 60 84 Q96 88 96 120Z" fill="url(#oc${a.outfit})"/>
${armR}
<rect x="52" y="80" width="16" height="12" rx="5" fill="url(#sk${a.skin})"/>
<ellipse cx="60" cy="54" rx="26" ry="29" fill="url(#sk${a.skin})"/>
<ellipse cx="60" cy="54" rx="26" ry="29" fill="url(#hl)"/>
${hairFront}
${eyes}
<ellipse cx="41" cy="70" rx="5" ry="3" fill="#FF8A8A" opacity=".45"/><ellipse cx="79" cy="70" rx="5" ry="3" fill="#FF8A8A" opacity=".45"/>
${mouth}
</svg>`;
}
/* the figure performs its gestures one after the other */
function avtHTML(raw,size,animated){
  const a=avtOf(raw);
  const g=animated?AV.gestures[Math.floor(Date.now()/2500)%AV.gestures.length]:"";
  return`<span class="av3d-avt" data-avt-anim="${animated?1:0}" style="display:inline-block;width:${size||48}px;height:${size||48}px">${avtSVG(a,g,size||48)}</span>`;
}
/* the avatar of someone else, loaded once and kept on the phone */
function avtLoadOf(uid){
  if(!uid||!window.__sb)return;
  const c=(AV.cache[uid]!==undefined)?AV.cache[uid]:(()=>{try{return JSON.parse(localStorage.getItem("ec_pf_"+uid)||"null")}catch(e){return null}})();
  if(c!==undefined&&c!==null&&!AV.load[uid])AV.cache[uid]=c;
  if(AV.load[uid]||(AV.cache[uid]&&Date.now()-(AV.cache[uid].at||0)<3600e3))return;
  AV.load[uid]=1;
  window.__sb.rpc("get_profile",{p_uid:uid}).then(r=>{
    const d=r&&r.data;if(!d){AV.load[uid]=0;return}
    const p={...d,at:Date.now()};AV.cache[uid]=p;
    try{localStorage.setItem("ec_pf_"+uid,JSON.stringify(p))}catch(e){}
    AV.load[uid]=0;render()
  }).catch(()=>{AV.load[uid]=0});
}
const avtFor=uid=>{const p=AV.cache[uid]||(()=>{try{return JSON.parse(localStorage.getItem("ec_pf_"+uid)||"null")}catch(e){return null}})();return p&&p.avt?p:null};

/* ---- builder screen ---- */
function avtView(){
  const me=S.me||{};
  const d=AV.draft||(AV.draft={...avtOf(me.avt),bio:me.bio||""});
  const part=(k,list,label)=>`<div class="av3-row"><b class="small muted">${label}</b><div class="av3-chips">${list.map((x,i)=>{
      const v=typeof x==="string"&&x[0]==="#"?`<i style="background:${x}"></i>`:esc(String(x));
      return`<button type="button" class="av3-chip ${d[k]===i?"on":""}" data-v4="avPart" data-k="${k}" data-n="${i}" aria-pressed="${d[k]===i}" aria-label="${label} ${i+1}">${v}</button>`}).join("")}</div></div>`;
  return`<div class="section av3-wrap" style="max-width:720px;margin-inline:auto">
  <button class="back" data-v4="avBack">${ic("left")}Back</button>
  <div class="av3-stage" id="avStage">${avtHTML(d,180,true)}<span class="av3-gest small muted">Gestures: wave · peace · cheer</span></div>
  <div class="glass card av3-form">
    <span class="eyebrow">Your avatar</span><h2>Create your avatar</h2>
    <p class="sub">Like Snapchat: your avatar appears in your chats and on your profile.</p>
    ${part("skin",AV.skin,"Skin")}${part("hair",AV.hairStyles,"Hair style")}${part("hairCol",AV.hair,"Hair colour")}
    ${part("eyes",AV.eyeStyles,"Eyes")}${part("mouth",AV.mouthStyles,"Mouth")}${part("outfit",AV.outfit,"Outfit")}${part("bg",AV.bg,"Background")}
    <div class="av3-row"><label class="small muted" for="avBio">Bio (150 characters max)</label>
      <textarea id="avBio" maxlength="150" rows="3" placeholder="Say something about you…" aria-label="Bio">${esc(d.bio||"")}</textarea></div>
    <button class="btn" type="button" data-v4="avSave">${ic("check")}Save my avatar and bio</button>
  </div></div>`;
}
/* ---- wiring ---- */
{const _sv=studentView;studentView=function(){if(S.view&&S.view.type==="avt")return avtView();return _sv()}}
{const _pv=peersView;peersView=function(){const h=_pv();const me=S.me&&S.me.avt?avtHTML(S.me.avt,36,false):"";
  return h.replace('<div class="section" style="max-width:720px;margin-inline:auto">',`<div class="section" style="max-width:720px;margin-inline:auto"><button class="av3-mine" type="button" data-v4="avOpen">${me||ic("user")}<span><b>My avatar and bio</b><small class="muted">Your avatar is shown in your chats</small></span></button>`)}}
{const _pc=peerChatView;peerChatView=function(){const h=_pc();const id=S.view&&S.view.id;if(!id)return h;avtLoadOf(id);
  const p=avtFor(id);const bio=p&&p.bio?`<div class="av3-bio small"><b>${esc(p.name||"")}</b> · ${esc(p.bio)}</div>`:"";
  return h.replace('<div class="glass chat">',`${bio}<div class="glass chat">`)}}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;
  const k=el.dataset.v4;if(!/^av(Part|Save|Open|Back)$/.test(k))return;
  if(k==="avOpen"){AV.draft=null;S.view={type:"avt"};S.animate=true;scrollTo(0,0);render();return}
  if(k==="avBack"){AV.draft=null;S.view=null;S.animate=true;render();return}
  if(k==="avPart"){const bio=document.getElementById("avBio");if(AV.draft&&bio)AV.draft.bio=bio.value;
    AV.draft[el.dataset.k]=+el.dataset.n;render();return}
  if(k==="avSave"){const bio=document.getElementById("avBio");const d=AV.draft||{};const avt=avtOf(d);const b=String((bio&&bio.value)||d.bio||"").slice(0,150);
    if(!S.uid||S.mode!=="student"){toast("Only students can save an avatar.","x");return}
    const ps=(({skin,hair,hairCol,eyes,mouth,outfit,bg})=>({skin,hair,hairCol,eyes,mouth,outfit,bg}))(avt);
    S.me={...(S.me||{}),avt:ps,bio:b};
    write(()=>S.db.doc("students/"+S.uid).update({avt:ps,bio:b})).then(()=>{toast("Avatar and bio saved","check")}).catch(()=>toast("Saved on this phone: it will be sent when you are online.","check"));
    AV.draft=null;S.view=null;S.animate=true;render();return}
},true);
/* gestures: the avatar moves to the next gesture every 2.5 s, without re-rendering the page */
setInterval(()=>{const st=document.getElementById("avStage");if(!st)return;const sv=st.querySelector(".av3d-avt");if(!sv||sv.dataset.avtAnim!=="1")return;
  const g=AV.gestures[Math.floor(Date.now()/2500)%AV.gestures.length];const d=AV.draft||avtOf(S.me&&S.me.avt);
  sv.innerHTML=avtSVG(d,g,180)},2500);
{const st=document.createElement("style");st.textContent=`
.av3-wrap{display:grid;gap:14px}.av3-stage{display:grid;justify-items:center;gap:8px;padding:18px;border-radius:28px;background:radial-gradient(120% 90% at 50% 0%,#EEF2FF,#fff 60%);box-shadow:0 24px 60px -24px rgba(60,80,200,.45),inset 0 1px 0 #fff}
.av3-stage .av3d-avt svg{filter:drop-shadow(0 14px 18px rgba(60,70,160,.28))}
.av3-arm{animation:av3wave 1.1s ease-in-out infinite}
@keyframes av3wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}
.av3-peace{animation:av3pop 1.4s ease-in-out infinite}
@keyframes av3pop{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.av3-cheer{animation:av3cheer .9s ease-in-out infinite}
@keyframes av3cheer{0%,100%{transform:rotate(0)}50%{transform:rotate(-38deg)}}
.av3-form{display:grid;gap:12px}.av3-row{display:grid;gap:6px}.av3-chips{display:flex;flex-wrap:wrap;gap:8px}
.av3-chip{min-width:40px;height:40px;padding:0 10px;border-radius:14px;border:1px solid var(--line);background:var(--surface2,#fff);font:inherit;cursor:pointer;display:grid;place-items:center;transition:transform .15s,box-shadow .15s}
.av3-chip:hover{transform:translateY(-2px)}.av3-chip.on{border-color:#6C80FF;box-shadow:0 0 0 3px rgba(108,128,255,.25),0 8px 18px -8px rgba(108,128,255,.7)}
.av3-chip i{display:block;width:26px;height:26px;border-radius:9px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.12)}
#avBio{width:100%;border-radius:14px;padding:10px 12px;border:1px solid var(--line);font:inherit;resize:vertical}
.av3-mine{display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;margin-bottom:10px;border-radius:18px;border:1px solid var(--line);background:linear-gradient(120deg,#fff,#F1F4FF);font:inherit;color:inherit;cursor:pointer;text-align:left}
.av3-mine span{display:grid;gap:2px}
.av3-bio{margin:6px 0 10px;padding:8px 12px;border-radius:14px;background:var(--surface2,#f5f6fb)}
`;document.head.appendChild(st)}
