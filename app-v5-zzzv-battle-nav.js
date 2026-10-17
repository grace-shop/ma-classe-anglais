/* =====================================================================
   v5 · Battles: navigation, codes and the Back button.
   - "‹ Back" on every Arena page (English only, as the reference screen).
   - Battles hub -> one page per kind (Duel, Group battle, Battle Royale,
     Daily challenge). Each page has its own create / join / code area.
   - Leaving a room (Back, or after a challenge) goes back to the page of
     that kind (Battle Royale stays Battle Royale), never to the Arena home.
   - The battle code stays visible on every screen of the room.
   This file loads last, so it replaces the matching functions of
   app-v5-arena.js and app-v5-battle.js without editing them.
   ===================================================================== */
const BTNAV={view:null,kind:null};

function btKindOf(){return (BT.st&&BT.st.kind)||(BT.room&&BT.room.kind)||BTNAV.kind||"battle"}

(function btNavStyle(){
  if(document.getElementById("btNavCss"))return;
  const s=document.createElement("style");s.id="btNavCss";
  s.textContent=`
#arena .ar-back{font-size:19px!important;font-weight:700!important;gap:4px}
#arena .ar-back svg{width:24px!important;height:24px!important}
.bt-codechip{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:10px 14px;border-radius:16px;background:rgba(94,234,212,.10);border:1px solid rgba(94,234,212,.35);color:#EEF2FF;font-size:14px}
.bt-codechip b{font-family:ui-monospace,monospace;font-size:18px;letter-spacing:.2em;color:#5EEAD4}
.bt-kpage{max-width:100%;min-width:0;overflow-x:hidden;box-sizing:border-box}
.bt-kpage>*,.bt-kpage .ar-card,.bt-kpage .ar-go,.bt-kpage .ar-hint{min-width:0;max-width:100%;box-sizing:border-box}
.bt-kpage .ar-kicker{letter-spacing:.14em;white-space:normal;overflow-wrap:anywhere;line-height:1.5}
.bt-kpage .ar-hero{padding:0}
.bt-kpage .ar-hero h1{font-size:clamp(1.8rem,8vw,2.4rem);line-height:1.1;margin:4px 0 0;overflow-wrap:anywhere}
.bt-kpage .ar-card{padding:16px;gap:10px}
.bt-kpage .ar-hint{margin:0}
.bt-kpage .bt-code{font-size:clamp(1.25rem,7vw,2rem);letter-spacing:.12em;white-space:normal;overflow-wrap:anywhere;padding:8px 0 4px;margin:6px 0 10px;text-align:center}
.bt-kpage .ar-go+.ar-go{margin-top:10px}
`;document.head.appendChild(s)})();

/* 1 · the back button: "‹ Back" */
function arTop(title,right){return`<div class="ar-top"><button class="ar-back" data-ar="home" aria-label="Back">${arIc("back")}<span>Back</span></button><b>${arEsc(title)}</b><span>${arEsc(right||"")}</span></div>`}

/* 2 · the join box (used on the hub and on each kind page) */
function btJoinBox(){return `<div class="ar-card"><p class="ar-kicker">Join a battle with a code</p>
  <div class="bt-join"><input id="btCode" class="bt-in" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="CODE" value="${arEsc(BT.joinCode)}">
  <button class="ar-go" data-ar="bt-join">Join</button></div></div>`}

/* 3 · the hub: four cards, each opens its own page */
function btHub(){btStop();BT.on=false;BT.inHub=true;BT.key="";BTNAV.view="hub";BTNAV.kind=null;
  const live=BT.room&&BT.st&&!btFinished(BT.st);
  const cards=["duel","battle","royale","challenge"].map((k,i)=>{const K=BT_KINDS[k];
    return `<button class="ar-mode bt-glow" style="--d:${(i*0.07).toFixed(2)}s" data-ar="bt-page" data-m="${k}">
      <span class="ar-badge" style="width:48px;height:48px;border-radius:16px">${arIc(K.ic)}</span>
      <b>${arEsc(K.t)}</b><small>${arEsc(K.d)}</small></button>`}).join("");
  arSet(arTop("Battles","")+`<div class="ar-hero"><p class="ar-kicker">Compete · Win · Climb</p><h1>Battles</h1>
      <p>Play live with your classmates. Pick a battle type, or join with a code.</p></div>
    ${live?`<button class="ar-go bt-entry" data-ar="bt-back">Back to my battle</button>`:""}
    <div class="ar-grid">${cards}</div>
    ${btJoinBox()}${btErr()}`);
  BT.err=""}

/* 4 · one page per kind: its code, its create / join actions, its difficulty */
function btKindPage(k){const K=BT_KINDS[k]||BT_KINDS.battle;
  btStop();BT.on=false;BT.inHub=true;BT.key="";BTNAV.view="kind";BTNAV.kind=k;
  const live=BT.room&&(!BT.st||!btFinished(BT.st))&&btKindOf()===k;
  const dif=`<div class="ar-seg bt-diff" role="group" aria-label="Difficulty">${["easy","medium","hard"].map(l=>`<button class="${(BT.diff||"hard")===l?"on":""}" data-ar="bt-diff" data-l="${l}" aria-pressed="${(BT.diff||"hard")===l}">${l[0].toUpperCase()+l.slice(1)}</button>`).join("")}</div>`;
  let body;
  if(k==="challenge"){
    body=`<div class="ar-card bt-glow"><p class="ar-kicker">Today's challenge code</p><div class="bt-code">${arEsc(btDayCode())}</div>
      <p class="ar-hint">Everyone who plays today gets the same questions.</p>
      <button class="ar-go" data-ar="bt-kind" data-m="challenge" style="width:100%">Play today's challenge</button></div>`;
  }else{
    body=`${k!=="royale"?dif:""}
      <div class="ar-card bt-glow"><p class="ar-kicker">${arEsc(btNeed(k))}</p>
        <button class="ar-go" data-ar="bt-kind" data-m="${k}" style="width:100%">Start a ${arEsc(K.t)} and get a code</button></div>
      ${btJoinBox()}`;
  }
  arSet(arTop(K.t,"")+`<div class="bt-kpage"><div class="ar-hero"><p class="ar-kicker">${arEsc(K.d)}</p><h1>${arEsc(K.t)}</h1></div>
    ${live?`<button class="ar-go bt-entry" data-ar="bt-back" style="width:100%">Back to my battle</button>`:""}
    ${body}${btErr()}</div>`);
  BT.err=""}

/* 5 · creating or joining: errors stay on the page of the kind */
async function btKind(k){if(BT.busy)return;const K=BT_KINDS[k];if(!K)return;
  if(!window.__sb){BT.err="Battles need internet.";return btKindPage(k)}
  BT.busy=true;
  try{
    if(k==="challenge"){const code=btDayCode();const r=await btRpc("arena_challenge",{p_code:code,p_qs:btQs(K.n,btRng(code))});
      BT.room={id:r.id,code:r.code,kind:"challenge"}}
    else{const r=await btRpc("arena_create",{p_kind:k,p_mode:"quiz",p_qs:btQs(K.n,Math.random,k==="royale"?AR_LV.hard:AR_LV[BT.diff||"hard"])});
      BT.room={id:r.id,code:r.code,kind:k}}
    BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.err="";
    btPoll()}
  catch(e){BT.err=btMsg(e);btKindPage(k)}
  finally{BT.busy=false}}

async function btJoin(){const code=String((document.getElementById("btCode")||{}).value||"").trim().toUpperCase();
  BT.joinCode=code;
  const back=()=>BTNAV.kind?btKindPage(BTNAV.kind):btHub();
  if(code.length!==6){BT.err="Enter the 6-letter code.";return back()}
  if(BT.busy)return;BT.busy=true;
  try{const id=await btRpc("arena_join",{p_code:code});
    BT.room={id:id,code:code,kind:null};BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.err="";
    btPoll()}
  catch(e){BT.err=btMsg(e);back()}
  finally{BT.busy=false}}

/* 6 · a room knows where it lives: the page of its kind */
const _btPoll=btPoll;
btPoll=function(){BTNAV.view="room";BTNAV.kind=btKindOf();return _btPoll()};

function btLeave(silent){const k=btKindOf();const id=BT.room&&BT.room.id,lobby=BT.st&&BT.st.status==="lobby"&&!btFinished(BT.st);
  btStop();BT.on=false;BT.room=null;BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.key="";
  if(id&&lobby&&window.__sb)btRpc("arena_leave",{p_room:id}).catch(()=>{});
  if(!silent){BT.err="";btKindPage(k)}}

/* 7 · the code stays on screen during the battle */
function btChip(){const b=document.getElementById("arBody");if(!b)return;
  const old=b.querySelector(".bt-codechip");if(old)old.remove();
  if(!BT.on||!BT.room||!BT.room.code)return;
  const chip=document.createElement("div");chip.className="bt-codechip";
  chip.innerHTML=`<span>Battle code</span><b>${arEsc(BT.room.code)}</b>`;
  const top=b.querySelector(".ar-top");
  if(top)top.insertAdjacentElement("afterend",chip);else b.prepend(chip)}
const _btDraw=btDraw;
btDraw=function(){_btDraw();btChip()};

/* 8 · clicks: the hub cards and the difficulty go to the new pages */
const _btClick=btClick;
btClick=function(b){const a=b.dataset.ar;
  if(a==="bt-page")return btKindPage(b.dataset.m);
  if(a==="bt-diff"){BT.diff=b.dataset.l;return BTNAV.view==="kind"?btKindPage(BTNAV.kind):btHub()}
  return _btClick(b)};

/* 9 · Back: room -> its kind page, kind page -> hub, hub -> Arena home */
const _btArHome=arHome;
arHome=function(){
  if(BTNAV.view==="room"){const k=btKindOf();btStop();BT.on=false;
    if(BT.st&&btFinished(BT.st))btLeave(true);
    return btKindPage(k)}
  if(BTNAV.view==="kind")return btHub();
  BT.inHub=true;BTNAV.view=null;return _btArHome()};

/* 10 · closing the Arena forgets the battle screens (the room stays resumable) */
const _btArClose=arClose;
arClose=function(){BTNAV.view=null;return _btArClose()};
