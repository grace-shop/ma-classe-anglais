/* =====================================================================
   v5 · Battles, inside the Arena: duels (2 students), group battles
   (2 to 8), Battle Royale (up to 12, one wrong answer and you are out)
   and the daily challenge (same questions for everyone, played alone).
   Students join with a 6-letter code. Every question lasts 12 seconds
   and everyone gets it at the same moment: the server gives the time.
   Needs supabase/arena.sql and supabase/battle.sql.
   ===================================================================== */
{const st=document.createElement("style");st.id="btcss";st.textContent=`
.bt-entry{width:100%;margin:0 0 14px;display:flex;align-items:center;justify-content:center;gap:10px;text-align:center}
.bt-glow{position:relative;overflow:hidden}
.bt-glow::before{content:"";position:absolute;inset:-45%;background:conic-gradient(from 0deg,transparent 0deg,rgba(94,234,212,.22) 40deg,transparent 90deg);animation:btSpin 7s linear infinite;pointer-events:none}
.bt-glow>*{position:relative}
@keyframes btSpin{to{transform:rotate(360deg)}}
.bt-code{font-size:2.6rem;font-weight:900;letter-spacing:.32em;text-align:center;padding:12px 0 6px;background:linear-gradient(120deg,#8EF6E4,#818CF8 55%,#F472B6);-webkit-background-clip:text;background-clip:text;color:transparent;font-variant-numeric:tabular-nums}
.bt-in{flex:1;min-width:0;padding:14px 16px;border-radius:16px;border:1px solid rgba(160,172,255,.3);background:rgba(8,10,28,.7);color:#fff;font:inherit;font-weight:900;letter-spacing:.25em;text-transform:uppercase;text-align:center;outline:none}
.bt-in:focus{border-color:#5EEAD4;box-shadow:0 0 0 3px rgba(94,234,212,.2)}
.bt-sb{display:grid;gap:8px;margin-bottom:6px}
.bt-sb .ar-row{padding:9px 12px}
.bt-out{opacity:.45}
.bt-out b{text-decoration:line-through}
.bt-tag{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:rgba(94,234,212,.15);color:#8EF6E4;white-space:nowrap}
.bt-tag.host{background:rgba(251,191,36,.18);color:#FDE68A}
.bt-wait{text-align:center;color:#C9D2F2;margin:6px 0 0}
.bt-out-card{border-color:rgba(244,63,94,.55)!important;background:linear-gradient(180deg,rgba(244,63,94,.2),rgba(12,15,34,.8))!important}
.bt-win{font-size:2.6rem;text-align:center;color:#FDE68A;text-shadow:0 0 26px rgba(251,191,36,.7)}
.bt-join{display:flex;gap:10px;align-items:center}
`;document.head.appendChild(st)}

const BT={room:null,st:null,off:0,iv:null,clk:null,on:false,busy:false,syncing:false,res:{},ci:null,cur:null,err:"",key:"",joinCode:""};
const BT_KINDS={
 duel:{t:"Duel",d:"Two students, the same questions. Best score wins.",n:8,ic:"bolt"},
 battle:{t:"Group battle",d:"2 to 8 students. Live ranking on every question.",n:10,ic:"trophy"},
 royale:{t:"Battle Royale",d:"Up to 12 students. One wrong answer and you are out.",n:12,ic:"search"},
 challenge:{t:"Daily challenge",d:"The same questions for everyone today. Play alone, then see the board.",n:8,ic:"pen"}};

/* ---------- server calls ---------- */
function btMsg(e){const m=String((e&&(e.message||e.details))||e||"");
  const map=[["No battle with this code","No battle with this code."],["already started","This battle has already started."],["is full","This battle is full."],
    ["at least 2","You need at least 2 players."],["Only the host","Only the host can start."],["You are out","You are out of the royale."],
    ["Too late","Too late for this question."],["not running","This battle is not running."],["Not started","The battle has not started yet."],
    ["not in this battle","You are not in this battle any more."],["Sign in","Please sign in again."]];
  for(const [k,v] of map)if(m.indexOf(k)>=0)return v;
  return "Something went wrong. Try again."}
async function btRpc(fn,args){const sb=window.__sb;if(!sb)throw new Error("Battles need internet.");
  const r=await sb.rpc(fn,args);if(r.error)throw r.error;return r.data}

/* ---------- questions: shuffled options, same set for everyone in a challenge ---------- */
function btRng(str){let h=2166136261;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return function(){h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function btPrep(it,rnd){const ix=it.o.map((_,i)=>i);
  for(let i=ix.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[ix[i],ix[j]]=[ix[j],ix[i]]}
  return {q:it.q,e:it.e,o:ix.map(i=>it.o[i]),a:ix.indexOf(it.a)}}
function btQs(n,rnd){const L=arLv();let p=AR_Q.filter(x=>(x.lv||1)===L);if(p.length<n)p=AR_Q.filter(x=>(x.lv||1)<=L);
  p=p.slice();for(let i=p.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
  return p.slice(0,n).map(it=>btPrep(it,rnd))}
function btDayCode(){const d=new Date();const ymd=d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");
  return "DAY"+ymd+String(AR.level||"easy")[0].toUpperCase()}
function btCap(k){return k==="duel"?2:k==="battle"?8:12}
function btNeed(k){return k==="duel"?"2 players":k==="battle"?"2 to 8 players":"2 to 12 players"}

/* ---------- clock: the server's time, corrected for this device ---------- */
function btNow(){return Date.now()+BT.off}
function btFirstOpen(st){for(let i=0;i<st.qs.length;i++)if(!st.answered.includes(i))return i;return st.qs.length}
function btFinished(st){return st.status==="done"||(st.kind==="challenge"&&st.answered.length>=st.qs.length)}

/* ---------- polling ---------- */
function btStop(){if(BT.iv){clearInterval(BT.iv);BT.iv=null}if(BT.clk){clearInterval(BT.clk);BT.clk=null}}
function btPoll(){btStop();BT.on=true;BT.key="";const ar=document.getElementById("arena");if(ar)ar.scrollTop=0;BT.iv=setInterval(btSync,1500);BT.clk=setInterval(btClock,250);btSync()}
async function btSync(){if(!BT.room||BT.syncing)return;BT.syncing=true;
  try{const st=await btRpc("arena_state",{p_room:BT.room.id});
    BT.off=st.now-Date.now();BT.st=st;BT.room.kind=st.kind;BT.room.code=st.code;
    if(st.kind==="challenge"&&BT.ci==null)BT.ci=btFirstOpen(st);
    btDraw()}
  catch(e){if(/not in this battle|Sign in/i.test(String(e&&e.message))){btLeave(true);BT.err=btMsg(e);if(BT.on===false)btHub()}}
  finally{BT.syncing=false}}
/* the ring and the countdown move without redrawing the screen */
function btClock(){if(!BT.on||!BT.st)return;const st=BT.st;
  if(st.status!=="playing"||st.kind==="challenge")return;
  const ms=st.slot*1000,el=btNow()-st.started,cur=el<0?-1:Math.floor(el/ms);
  if(cur!==BT.cur)return btDraw();
  if(cur>=st.qs.length)return;
  const pre=el<0,rem=pre?-el:ms-(el%ms);
  const num=document.getElementById("arNum"),arc=document.getElementById("arRing");
  if(num)num.textContent=String(Math.ceil(rem/1000));
  if(arc)arc.style.strokeDashoffset=pre?"0":(138.2*(1-rem/ms)).toFixed(1)}

/* ---------- painting: redraw only when something visible changed ---------- */
function btErr(){return BT.err?`<p class="ar-hint">${arEsc(BT.err)}</p>`:""}
function btPaint(key,html){const k=key+"|"+BT.err;if(k===BT.key)return;BT.key=k;
  const b=document.getElementById("arBody"),r=document.getElementById("arena");const y=r?r.scrollTop:0;
  if(b)b.innerHTML=html;if(r)r.scrollTop=y}
function btDraw(){if(!BT.on||!BT.st)return;const st=BT.st;
  if(btFinished(st))return btResults(st);
  if(st.status==="lobby")return btLobby(st);
  if(st.kind==="challenge")return btSolo(st);
  return btLive(st)}

/* ---------- hub ---------- */
function btHub(){btStop();BT.on=false;BT.key="";
  const live=BT.room&&BT.st&&!btFinished(BT.st);
  const cards=["duel","battle","royale","challenge"].map((k,i)=>{const K=BT_KINDS[k];
    return `<button class="ar-mode bt-glow" style="--d:${(i*0.07).toFixed(2)}s" data-ar="bt-kind" data-m="${k}">
      <span class="ar-badge" style="width:48px;height:48px;border-radius:16px">${arIc(K.ic)}</span>
      <b>${arEsc(K.t)}</b><small>${arEsc(K.d)}</small></button>`}).join("");
  arSet(arTop("Battles","")+`<div class="ar-hero"><p class="ar-kicker">Compete · Win · Climb</p><h1>Battles</h1>
      <p>Play live with your classmates. Start one, or join with the code.</p></div>
    ${live?`<button class="ar-go bt-entry" data-ar="bt-back">Back to my battle</button>`:""}
    <div class="ar-grid">${cards}</div>
    <div class="ar-card"><p class="ar-kicker">Join a battle</p>
      <div class="bt-join"><input id="btCode" class="bt-in" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="CODE" value="${arEsc(BT.joinCode)}">
      <button class="ar-go" data-ar="bt-join">Join</button></div>
      ${btErr()}</div>`);
  BT.err=""}

/* ---------- starting: create, join, or the daily challenge ---------- */
async function btKind(k){if(BT.busy)return;const K=BT_KINDS[k];if(!K)return;
  if(!window.__sb){BT.err="Battles need internet.";return btHub()}
  BT.busy=true;
  try{
    if(k==="challenge"){const code=btDayCode();const r=await btRpc("arena_challenge",{p_code:code,p_qs:btQs(K.n,btRng(code))});
      BT.room={id:r.id,code:r.code,kind:"challenge"}}
    else{const r=await btRpc("arena_create",{p_kind:k,p_mode:"quiz",p_qs:btQs(K.n,Math.random)});
      BT.room={id:r.id,code:r.code,kind:k}}
    BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.err="";
    btPoll()}
  catch(e){BT.err=btMsg(e);btHub()}
  finally{BT.busy=false}}
async function btJoin(){const code=String((document.getElementById("btCode")||{}).value||"").trim().toUpperCase();
  BT.joinCode=code;
  if(code.length!==6){BT.err="Enter the 6-letter code.";return btHub()}
  if(BT.busy)return;BT.busy=true;
  try{const id=await btRpc("arena_join",{p_code:code});
    BT.room={id:id,code:code,kind:null};BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.err="";
    btPoll()}
  catch(e){BT.err=btMsg(e);btHub()}
  finally{BT.busy=false}}
async function btStart(){if(!BT.room||BT.busy)return;BT.busy=true;
  try{await btRpc("arena_start",{p_room:BT.room.id});BT.err="";BT.key="";await btSync()}
  catch(e){BT.err=btMsg(e);BT.key="";btDraw()}
  finally{BT.busy=false}}
function btLeave(silent){const id=BT.room&&BT.room.id,lobby=BT.st&&BT.st.status==="lobby"&&!btFinished(BT.st);
  btStop();BT.on=false;BT.room=null;BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.key="";
  if(id&&lobby&&window.__sb)btRpc("arena_leave",{p_room:id}).catch(()=>{});
  if(!silent){BT.err="";btHub()}}

/* ---------- screens ---------- */
function btLobby(st){const K=BT_KINDS[st.kind]||BT_KINDS.battle,host=st.host===st.me,n=st.players.length;
  const rows=st.players.map((p,i)=>`<div class="ar-row ${p.uid===st.me?"me":""}"><span class="ar-rank">${i+1}</span><b>${arEsc(p.name)}</b>
    <span class="bt-tag ${p.uid===st.host?"host":""}">${p.uid===st.host?"Host":p.uid===st.me?"You":"Ready"}</span></div>`).join("");
  btPaint(JSON.stringify(["L",st.code,st.players.map(p=>p.uid+p.name)]),
    arTop(K.t,"Lobby")+`<div class="ar-card bt-glow"><p class="ar-kicker">Battle code</p><div class="bt-code">${arEsc(st.code)}</div>
      <p class="bt-wait">Share this code · ${btNeed(st.kind)}</p></div>
    <p class="ar-kicker">Players · ${n} / ${btCap(st.kind)}</p><div class="bt-sb">${rows}</div>
    ${btErr()}
    ${host?`<button class="ar-go" data-ar="bt-start" style="width:100%" ${n<2?"disabled":""}>Start the battle</button>
      <p class="ar-hint">The first question appears 5 seconds after you start.</p>`
      :`<p class="bt-wait">Waiting for the host to start…</p>`}
    <button class="ar-go ghost" data-ar="bt-leave" style="width:100%;margin-top:10px">Leave</button>`)}

/* one question card with its four options; locked once answered */
function btQCard(q,res,locked,cur,next){
  const opts=q.o.map((t,k)=>{let c="ar-opt";if(res&&k===q.a)c+=" ok";else if(res&&k===res.k&&!res.ok)c+=" bad";
    return `<button class="${c}" data-ar="bt-ans" data-k="${k}" ${locked||res?"disabled":""}>${arEsc(t)}</button>`}).join("");
  const fb=res?`<div class="ar-note ${res.ok?"good":"bad"} bt-fb"><b>${res.ok?"Correct!"+(res.pts?" +"+res.pts:""):"Not quite."}</b> ${arEsc(q.e)}</div>`:"";
  const nx=res&&next?`<div style="height:12px"></div><button class="ar-go" data-ar="bt-next" style="width:100%">${cur+1>=next?"See the board":"Next →"}</button>`:"";
  return `<div class="ar-card"><p class="ar-kicker">Question ${cur+1}</p><h2>${arEsc(q.q)}</h2></div><div class="ar-opts">${opts}</div>${fb}${nx}`}

/* battles and royale: everyone sees the same question at the same moment */
function btLive(st){const K=BT_KINDS[st.kind]||BT_KINDS.battle,n=st.qs.length,ms=st.slot*1000,el=btNow()-st.started;
  const pre=el<0,cur=pre?-1:Math.floor(el/ms);BT.cur=cur;
  const me=st.players.find(p=>p.uid===st.me)||{alive:true};
  const roy=st.kind==="royale",out=roy&&!me.alive,alive=st.players.filter(p=>p.alive).length;
  const board=st.players.map((p,i)=>`<div class="ar-row ${p.uid===st.me?"me":""} ${roy&&!p.alive?"bt-out":""}">
    <span class="ar-rank ${i<3?"r"+(i+1):""}">${i+1}</span><b>${arEsc(p.name)}</b><span class="ar-rs">${p.score}</span></div>`).join("");
  let main,ring="",bar="";
  if(pre)main=`<div class="ar-card bt-glow"><p class="ar-kicker">Get ready</p><p class="bt-wait">The first question is coming.</p></div>`;
  else if(cur>=n)main=`<div class="ar-card"><p class="bt-wait">That was the last question. Calculating the results…</p></div>`;
  else if(out)main=`<div class="ar-card bt-out-card"><p class="ar-kicker">Eliminated</p><h2>You are out</h2><p class="bt-wait">Watch the rest of the battle.</p></div>`;
  else{main=btQCard(st.qs[cur],BT.res[cur],st.answered.includes(cur),cur,0);ring=`<div class="ar-ring-wrap">${arRing()}</div>`;bar=arBar(cur/n)}
  if(pre)ring=`<div class="ar-ring-wrap">${arRing()}</div>`;
  btPaint(JSON.stringify(["P",cur,!!BT.res[cur],st.answered.includes(cur),out,alive,st.players.map(p=>[p.uid,p.score,p.alive])]),
    arTop(K.t,pre?"Starting":`${Math.min(cur+1,n)} / ${n}`)+bar+ring+main+
    `<p class="ar-kicker">Live ranking${roy?` · ${alive} still in`:""}</p><div class="bt-sb">${board}</div>${btErr()}`)}

/* the daily challenge: each student goes at their own pace */
function btSolo(st){const K=BT_KINDS.challenge,n=st.qs.length;
  const cur=BT.ci==null?btFirstOpen(st):BT.ci;
  const score=Object.values(BT.res).reduce((s,r)=>s+(r.pts||0),0);
  const main=cur<n?btQCard(st.qs[cur],BT.res[cur],st.answered.includes(cur),cur,n):`<div class="ar-card"><p class="bt-wait">All done. Calculating the board…</p></div>`;
  btPaint(JSON.stringify(["S",cur,!!BT.res[cur],score]),
    arTop(K.t,`${Math.min(cur+1,n)} / ${n}`)+arBar(cur/n)+main+`<p class="ar-hint">Your score: ${score}</p>${btErr()}`)}

/* results and the board */
function btResults(st){const K=BT_KINDS[st.kind]||BT_KINDS.battle,roy=st.kind==="royale";
  const ps=st.players.slice().sort((a,b)=>(roy?((b.alive?1:0)-(a.alive?1:0)):0)||b.score-a.score);
  const mi=ps.findIndex(p=>p.uid===st.me),w=ps[0]||{},won=w.uid===st.me;
  const head=st.kind==="challenge"?"Today's board":(won?"You won!":`${w.name||"Someone"} wins`);
  const mine=st.players.find(p=>p.uid===st.me)||{score:0};
  const rows=ps.map((p,i)=>`<div class="ar-row ${p.uid===st.me?"me":""} ${roy&&!p.alive?"bt-out":""}">
    <span class="ar-rank ${i<3?"r"+(i+1):""}">${i+1}</span><b>${arEsc(p.name)}</b><span class="ar-rs">${p.score}</span></div>`).join("");
  btPaint("R"+st.status+st.answered.length,
    arTop(K.t,"Results")+`<div class="ar-card bt-glow"><div class="bt-win">★</div><h2>${arEsc(head)}</h2>
      <p class="bt-wait">You scored ${mine.score} points · rank ${mi+1} of ${ps.length}</p></div>
    <p class="ar-kicker">Final ranking</p><div class="bt-sb">${rows}</div>
    <div class="ar-inrow" style="justify-content:center;flex-wrap:wrap;margin-top:14px">
      ${st.kind==="challenge"?"":`<button class="ar-go" data-ar="bt-kind" data-m="${st.kind}">Play again</button>`}
      <button class="ar-go ghost" data-ar="bt-leave">Battles</button></div>`)}

/* ---------- answers ---------- */
async function btAnswer(k){const st=BT.st;if(!st||!BT.on)return;
  const solo=st.kind==="challenge",cur=solo?BT.ci:BT.cur;
  if(cur==null||cur<0||cur>=st.qs.length||BT.res[cur]||st.answered.includes(cur))return;
  const q=st.qs[cur],ok=k===q.a,ms=st.slot*1000;
  const rem=solo?0:Math.max(0,ms-((btNow()-st.started)%ms));
  const pts=ok?(solo?10:Math.min(30,10+Math.round(rem/1000))):0;
  BT.res[cur]={k:k,ok:ok,pts:pts};BT.err="";st.answered=st.answered.concat([cur]);BT.key="";btDraw();
  try{await btRpc("arena_answer",{p_room:st.id,p_idx:cur,p_ok:ok,p_pts:pts})}
  catch(e){BT.err=btMsg(e);BT.key=""}
  btSync()}
function btNext(){BT.ci=(BT.ci==null?0:BT.ci)+1;BT.key="";btDraw()}

/* clicks from the Arena (arClick hands every "bt-" action here) */
function btClick(b){const a=b.dataset.ar;
  if(a==="bt-hub")return btHub();
  if(a==="bt-kind")return btKind(b.dataset.m);
  if(a==="bt-join")return btJoin();
  if(a==="bt-back"){BT.err="";return btPoll()}
  if(a==="bt-start")return btStart();
  if(a==="bt-leave")return btLeave();
  if(a==="bt-ans")return btAnswer(+b.dataset.k);
  if(a==="bt-next")return btNext()}

/* leaving the Arena stops the polling; the battle stays resumable */
{const _c=arClose;arClose=function(){btStop();BT.on=false;return _c()}}
{const _h=arHome;arHome=function(){btStop();BT.on=false;return _h()}}
