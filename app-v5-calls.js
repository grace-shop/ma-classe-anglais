/* =====================================================================
   v5 calls: voice and video calls, one to one, in a group, or add people
   - Audio and video travel directly between phones (WebRTC, "mesh": everyone
     connects to everyone; up to 8 people)
   - The phones exchange setup messages through the database table call_signals
     (see supabase/appels.sql): each person only receives the messages sent to them
   - Ring: the other person gets a call screen; accept (voice or video) or decline
   ===================================================================== */
const CALL_ICE=(()=>{const ice=[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}];
  /* TURN relay (config.js): used when the network blocks direct connections between phones */
  const c=window.APP_CONFIG||{},urls=String(c.turnUrls||"").split(",").map(x=>x.trim()).filter(Boolean);
  if(urls.length&&c.turnUser&&c.turnPass)ice.push({urls,username:c.turnUser,credential:c.turnPass});
  return ice})();
const CALL={shares:{},id:null,host:null,kind:"duo",video:false,group:null,others:[],peers:{},local:null,screen:null,joined:false,micOn:true,camOn:false,ring:null,ringT:null,timer:null,clock:null,t0:0,pick:new Set(),cands:null};
const CALL_TEST=()=>!!window.__callBus;   /* automated tests replace the database with a local bus */
let CALL_UID=null;

/* ---- styles ---- */
{const st=document.createElement("style");st.id="callcss";st.textContent=`
.call-scr{position:fixed;inset:0;z-index:9000;background:radial-gradient(120% 90% at 50% 0%,#1B1F4A,#05060F 70%);color:#fff;display:flex;flex-direction:column;padding:14px 12px 18px;gap:10px;box-sizing:border-box}
.call-scr[hidden],.call-in[hidden]{display:none!important}
.call-top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 6px 0;font-weight:700}
.call-top small{opacity:.75;font-weight:600;display:block}
.call-grid{flex:1;display:grid;gap:8px;grid-template-columns:1fr;align-content:center;min-height:0}
.call-grid.n2,.call-grid.n3,.call-grid.n4{grid-template-columns:1fr 1fr}
.call-grid.n5,.call-grid.n6,.call-grid.n7,.call-grid.n8,.call-grid.n9{grid-template-columns:1fr 1fr 1fr}
.call-tile{position:relative;border-radius:22px;overflow:hidden;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);aspect-ratio:3/4;display:grid;place-items:center;min-height:0}
.call-tile video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .3s}
.call-tile.zz-shared video{object-fit:contain;background:#000}
.call-tile.zz-shared{aspect-ratio:auto;min-height:50vh;grid-column:1/-1;background:#000}
.call-tile.on video{opacity:1}
.call-av{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-size:1.5rem;font-weight:800;background:linear-gradient(120deg,#5EEAD4,#818CF8);color:#06201C}
.call-tile.on .call-av{display:none}
.call-nm{position:absolute;left:8px;bottom:8px;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:999px;font-size:.8rem;font-weight:700}
.call-btns{display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap}
.call-btns button{width:56px;height:56px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}
.call-btns button.off{background:#fff;color:#111}
.call-btns button.end{background:#EF4444;width:64px;height:64px}
.call-btns button.share-on{background:#5EEAD4;color:#06201C}
.call-btns button.end svg{transform:rotate(135deg)}
.call-btns svg,.call-entry svg,.call-in svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.call-add{background:rgba(255,255,255,.08);border-radius:18px;padding:10px;max-height:38vh;overflow:auto;display:grid;gap:4px}
.call-add button{display:flex;width:100%;justify-content:space-between;align-items:center;padding:10px 12px;border:0;background:transparent;color:#fff;border-radius:12px;font:inherit;cursor:pointer;text-align:left}
.call-add button.on{background:rgba(94,234,212,.2)}
.call-add .go{background:#5EEAD4;color:#06201C;justify-content:center;font-weight:800;margin-top:6px}
.call-in{position:fixed;inset:0;z-index:9100;background:rgba(5,6,15,.95);color:#fff;display:grid;place-items:center;padding:24px;text-align:center;box-sizing:border-box}
.call-in .big{font-size:1.4rem;font-weight:800}
.call-in .acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}
.call-in .acts button{border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;display:inline-flex;gap:8px;align-items:center}
.call-in .acts button.go{background:#22C55E;color:#06201C}
.call-in .acts button.no{background:#EF4444}
.call-entry{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.call-entry button{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg);font:inherit;font-weight:700;cursor:pointer}
.call-entry svg{width:16px;height:16px}
`;document.head.appendChild(st)}
ICONS.phone=ICONS.phone||'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>';
ICONS.screen=ICONS.screen||'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M9 10l3 3 3-3"/>';
ICONS.camoff=ICONS.camoff||'<path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2M22 8l-6 4 6 4V8zM2 2l20 20"/>';

/* ---- helpers ---- */
const callMyName=()=>(S.me&&S.me.name)||(S.who&&S.who.email)||"Classmate";
/* the video sent to the others: my shared screen when I share it, otherwise my camera */
function callVideoOut(){if(CALL.screen){const t=CALL.screen.getVideoTracks()[0];if(t&&t.readyState==="live")return t}return (CALL.local&&CALL.local.getVideoTracks()[0])||null}
function callSendVideo(){for(const P of Object.values(CALL.peers))if(P.tv)P.tv.sender.replaceTrack(callVideoOut()).catch(()=>{});for(const u of Object.keys(CALL.peers))callSendTo(CALL.id,u,"screen",{on:!!CALL.screen})}
function callName(uid){const m=Object.values(GR.mem||{}).flat().find(x=>x.uid===uid);return dispName(uid,(m&&m.who&&m.who.name)||(CALL.names&&CALL.names[uid])||"Classmate")}
function callErr(e){return (e&&e.message)||"The call could not start"}
function callRpc(fn,args){
  if(CALL_TEST())return Promise.resolve(window.__callTestRpc?window.__callTestRpc(fn,args):null);
  if(!window.__sb)return Promise.reject(new Error("Calls need internet"));
  return window.__sb.rpc(fn,args).then(r=>{if(r.error)throw new Error(callErr(r.error));return r.data})
}
function callSendTo(cid,to,kind,payload){
  const body={call_id:cid,from_uid:S.uid,to_uid:to,kind,payload:payload||{}};
  if(CALL_TEST())return window.__callBus.send(body);
  if(!window.__sb)return;
  window.__sb.from("call_signals").insert(body).then(r=>{if(r.error)console.warn("call signal",r.error.message)});
}

/* ---- receiving: one live channel per logged-in person ---- */
function callListen(){
  CALL_UID=S.uid;
  if(CALL_TEST()){window.__callBus.on(body=>{if(body.to_uid===S.uid)onCallSignal(body)});return}
  try{window.__sb.channel("calls-"+S.uid+"-"+Math.random().toString(36).slice(2,7))
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"call_signals",filter:"to_uid=eq."+S.uid},p=>{try{onCallSignal(p.new)}catch(e){console.warn(e)}})
    .subscribe()}catch(e){}
}
setInterval(()=>{if(S&&S.uid&&S.uid!==CALL_UID&&(CALL_TEST()||window.__sb))callListen()},1500);

function onCallSignal(r){
  const kind=r.kind,from=r.from_uid,cid=r.call_id,p=r.payload||{};
  if(!from||from===S.uid)return;
  if(kind==="ring"){
    if(CALL.id){if(cid!==CALL.id)callSendTo(cid,from,"decline",{busy:1});return}
    if(CALL.ring&&CALL.ring.id===cid)return;
    CALL.ring={id:cid,from,video:!!p.video,kind:p.kind||"duo",group:p.group||null,others:p.members||[],name:p.name||""};
    CALL.names={...(CALL.names||{}),[from]:p.name||""};
    callShowIncoming();callRing(true);
    setTimeout(()=>{if(CALL.ring&&CALL.ring.id===cid&&!CALL.id)callDeclineRing()},45000);
    return;
  }
  if(cid!==CALL.id)return;
  switch(kind){
    case"join":
      if(!CALL.joined)return;
      if(!CALL.others.includes(from))CALL.others.push(from);
      callPeer(from);callOffer(from);callScreenSync();return;
    case"offer":callOnOffer(from,p.sdp);return;
    case"screen":CALL.shares[from]=!!p.on;callScreenSync();return;
    case"answer":callOnAnswer(from,p.sdp);return;
    case"ice":callOnIce(from,p.c);return;
    case"leave":
      callDropPeer(from);
      if(!Object.keys(CALL.peers).length&&!CALL.others.length){toast("The call has ended","mute");callLeave();return}
      callScreenSync();return;
    case"decline":
      CALL.others=CALL.others.filter(x=>x!==from);
      toast(callName(from)+" declined","mute");
      if(!Object.keys(CALL.peers).length&&!CALL.others.length)callLeave();else callScreenSync();return;
    case"end":toast("The call has ended","mute");callCleanup();return;
  }
}

/* ---- one connection per other person ---- */
function callPeer(uid,answering){
  if(CALL.peers[uid])return CALL.peers[uid];
  const pc=new RTCPeerConnection({iceServers:CALL_ICE});
  const P={uid,pc,rd:false,pend:[],stream:null,state:"new"};
  CALL.peers[uid]=P;
  /* the person who calls creates the channels; the person who answers takes the ones from the offer */
  if(!answering){
    P.ta=pc.addTransceiver("audio",{direction:"sendrecv"});
    P.tv=pc.addTransceiver("video",{direction:"sendrecv"});
    callAttachLocal(P);
  }
  pc.onicecandidate=e=>{if(e.candidate)callSendTo(CALL.id,uid,"ice",{c:e.candidate.toJSON()})};
  pc.ontrack=e=>{
    if(e.streams&&e.streams[0])P.stream=e.streams[0];
    else{P.stream=P.stream||new MediaStream();P.stream.addTrack(e.track)}
    const again=()=>callScreenSync();
    e.track.onmute=again;e.track.onunmute=again;e.track.onended=again;
    if(e.track.kind==="audio")callRemoteAudio(uid,P.stream);
    callScreenSync();
  };
  pc.onconnectionstatechange=()=>{P.state=pc.connectionState;if(P.state==="failed")toast("The connection with "+callName(uid)+" was lost","x");callScreenSync()};
  return P;
}
function callAttachLocal(P){
  if(!CALL.local)return;
  if(!P.ta||!P.tv)return;
  const a=CALL.local.getAudioTracks()[0]||null,v=callVideoOut();
  P.ta.sender.replaceTrack(a).catch(()=>{});
  P.tv.sender.replaceTrack(v).catch(()=>{});
}
function callDropPeer(uid){const P=CALL.peers[uid];callRemoteAudioEnd(uid);if(P){try{P.pc.close()}catch(e){}}delete CALL.peers[uid];CALL.others=CALL.others.filter(x=>x!==uid);callScreenSync()}
async function callOffer(uid){
  if(CALL.screen)callSendTo(CALL.id,uid,"screen",{on:true});
  const P=callPeer(uid);
  try{const off=await P.pc.createOffer();await P.pc.setLocalDescription(off);callSendTo(CALL.id,uid,"offer",{sdp:P.pc.localDescription.sdp})}catch(e){console.warn(e)}
}
async function callOnOffer(from,sdp){
  const P=callPeer(from,true);
  try{await P.pc.setRemoteDescription({type:"offer",sdp});P.rd=true;await callFlush(P);
    if(!P.ta){
      P.ta=P.pc.getTransceivers().find(t=>t.receiver.track.kind==="audio");
      P.tv=P.pc.getTransceivers().find(t=>t.receiver.track.kind==="video");
      if(P.ta)P.ta.direction="sendrecv";
      if(P.tv)P.tv.direction="sendrecv";
      callAttachLocal(P);
    }
    const ans=await P.pc.createAnswer();await P.pc.setLocalDescription(ans);callSendTo(CALL.id,from,"answer",{sdp:P.pc.localDescription.sdp})}catch(e){console.warn(e)}
}
async function callOnAnswer(from,sdp){
  const P=CALL.peers[from];if(!P)return;
  try{await P.pc.setRemoteDescription({type:"answer",sdp});P.rd=true;await callFlush(P)}catch(e){console.warn(e)}
}
async function callFlush(P){const q=P.pend.splice(0);for(const c of q){try{await P.pc.addIceCandidate(c)}catch(e){}}}
function callOnIce(from,c){
  const P=CALL.peers[from];if(!P||!c)return;
  if(!P.rd)P.pend.push(c);else P.pc.addIceCandidate(c).catch(()=>{});
}

/* ---- my microphone and camera ---- */
async function callMedia(video){
  let st=null;
  try{st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:video?{facingMode:"user",width:{ideal:640},height:{ideal:480}}:false})}
  catch(e){
    if(!video)throw new Error("The microphone is blocked. Allow it in your browser or phone settings.");
    try{st=await navigator.mediaDevices.getUserMedia({audio:true,video:false});toast("No camera: voice only","mute")}catch(e2){throw new Error("The microphone is blocked. Allow it in your browser or phone settings.")}
  }
  return st;
}
function callSetLocal(st){
  CALL.local=st;CALL.micOn=true;CALL.camOn=st.getVideoTracks().length>0;
  // people who came before the microphone was ready get it now (otherwise they hear nothing from this phone)
  Object.values(CALL.peers).forEach(function(P){callAttachLocal(P)});
}
// the other person's voice plays through its own audio element (a video tile can be blocked from playing sound)
function callRemoteAudio(uid,stream){
  let a=document.getElementById("callAud-"+uid);
  if(!a){a=document.createElement("audio");a.id="callAud-"+uid;a.autoplay=true;a.setAttribute("playsinline","");a.style.display="none";document.body.appendChild(a)}
  if(a.srcObject!==stream)a.srcObject=stream;
  a.play().catch(function(){});
  if(!a.dataset.zz){a.dataset.zz="1";document.addEventListener("pointerdown",function(){if(a.isConnected&&a.paused&&a.srcObject)a.play().catch(function(){})},true)}
}
function callRemoteAudioEnd(uid){const a=document.getElementById("callAud-"+uid);if(a){try{a.pause();a.srcObject=null}catch(e){}a.remove()}}
async function callToggleMic(){
  if(!CALL.local)return;
  CALL.micOn=!CALL.micOn;CALL.local.getAudioTracks().forEach(t=>t.enabled=CALL.micOn);callScreenSync();
}
async function callToggleCam(){
  if(!CALL.local)return;
  if(CALL.camOn){
    CALL.local.getVideoTracks().forEach(t=>{t.stop();CALL.local.removeTrack(t)});
    CALL.camOn=false;
    callSendVideo();
  }else{
    try{
      const v=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}});
      const t=v.getVideoTracks()[0];CALL.local.addTrack(t);CALL.camOn=true;
      callSendVideo();
    }catch(e){toast("The camera is not available","x")}
  }
  callScreenSync();
}

/* ---- starting, accepting, leaving ---- */
async function callStart(kind,uids,video,group){
  if(CALL.id){toast("You are already in a call","x");return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast("Calls are not available in this browser","x");return}
  if(!CALL_TEST()&&!navigator.onLine){toast("You need internet to call","x");return}
  uids=[...new Set(uids)].filter(u=>u&&u!==S.uid);
  let st;try{st=await callMedia(!!video)}catch(e){toast(e.message,"x");return}
  let id;
  try{id=await callRpc("start_call",{p_kind:kind,p_group:group||null,p_video:!!video,p_uids:uids})}
  catch(e){st.getTracks().forEach(t=>t.stop());toast(callErr(e),"x");return}
  CALL.id=id;CALL.host=S.uid;CALL.kind=kind;CALL.video=!!video;CALL.group=group||null;CALL.others=uids.slice();CALL.joined=true;CALL.t0=Date.now();
  callSetLocal(st);
  for(const u of uids)callSendTo(id,u,"ring",{video:!!video,kind,group:group||null,members:[S.uid,...uids].filter(x=>x!==u),name:callMyName()});
  CALL.timer=setTimeout(()=>{if(CALL.id===id&&CALL.host===S.uid&&!Object.keys(CALL.peers).length){toast("No answer","mute");callLeave()}},45000);
  callScreenShow();
}
async function callAccept(video){
  const R=CALL.ring;if(!R)return;
  callRing(false);CALL.ring=null;callHideIncoming();
  let st;try{st=await callMedia(!!video)}catch(e){toast(e.message,"x");callSendTo(R.id,R.from,"decline",{});return}
  CALL.id=R.id;CALL.host=R.from;CALL.kind=R.kind;CALL.video=!!video;CALL.group=R.group;CALL.joined=true;CALL.t0=Date.now();
  CALL.others=(R.others||[]).filter(x=>x&&x!==S.uid);
  if(!CALL.others.includes(R.from))CALL.others.push(R.from);
  callSetLocal(st);
  callScreenShow();
  for(const u of CALL.others)callSendTo(R.id,u,"join",{name:callMyName()});
}
function callDeclineRing(){
  const R=CALL.ring;if(!R)return;
  callRing(false);CALL.ring=null;callHideIncoming();
  callSendTo(R.id,R.from,"decline",{});
}
async function callLeave(){
  const id=CALL.id;if(!id){callCleanup();return}
  const host=CALL.host===S.uid;
  const targets=[...new Set([...CALL.others,...Object.keys(CALL.peers)])].filter(x=>x&&x!==S.uid);
  for(const u of targets)callSendTo(id,u,host?"end":"leave",{});
  try{await callRpc("end_call",{p_call:id,p_leave:!host})}catch(e){}
  callCleanup();
}
function callCleanup(){
  clearTimeout(CALL.timer);
  for(const u of Object.keys(CALL.peers)){callRemoteAudioEnd(u);try{CALL.peers[u].pc.close()}catch(e){}}
  CALL.peers={};
  if(CALL.local)CALL.local.getTracks().forEach(t=>{try{t.stop()}catch(e){}});
  if(CALL.screen)CALL.screen.getTracks().forEach(t=>{try{t.stop()}catch(e){}});
  CALL.screen=null;
  CALL.local=null;CALL.id=null;CALL.joined=false;CALL.others=[];CALL.host=null;CALL.pick=new Set();CALL.cands=null;
  callScreenHide();
}

/* ---- adding people to a call that is running ---- */
async function callCandidates(){
  if(CALL.cands)return CALL.cands;
  let list=[];
  if(CALL.group){
    list=(GR.mem&&GR.mem[CALL.group]||[]).map(m=>({uid:m.uid,name:callName(m.uid)}));
  }else{
    try{const rows=await callRpc("peer_directory",{});list=(rows||[]).map(r=>({uid:r.uid,name:r.name||"Classmate"}))}catch(e){list=[]}
  }
  list=list.filter(x=>x.uid!==S.uid&&!CALL.others.includes(x.uid)&&!CALL.peers[x.uid]);
  CALL.cands=list;return list;
}
async function callAddGo(){
  const uids=[...CALL.pick];if(!uids.length||!CALL.id)return;
  try{
    const added=await callRpc("call_add",{p_call:CALL.id,p_uids:uids});
    const news=(added&&added.length?added:uids).filter(u=>!CALL.others.includes(u));
    CALL.kind="group";
    for(const u of news)CALL.others.push(u);
    const all=[S.uid,...CALL.others];
    for(const u of news)callSendTo(CALL.id,u,"ring",{video:CALL.video,kind:"group",group:CALL.group,members:all.filter(x=>x!==u),name:callMyName()});
    CALL.pick=new Set();CALL.cands=null;CALL.adding=false;
    toast("Invitation sent","check");callScreenSync();
  }catch(e){toast(callErr(e),"x")}
}

/* ---- sharing my screen with the others in the call ---- */
async function callToggleScreen(){
  if(!CALL.id||!CALL.local)return;
  if(CALL.screen){callStopScreen();return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){toast("Screen sharing is not available on this phone","x");return}
  let st;
  try{st=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false})}
  catch(e){toast("Screen sharing was not started","mute");return}
  const t=st.getVideoTracks()[0];if(!t){st.getTracks().forEach(x=>x.stop());return}
  try{t.contentHint="detail"}catch(e){}
  CALL.screen=st;
  t.onended=()=>{if(CALL.screen===st)callStopScreen()};
  callSendVideo();callScreenSync();
  toast("You are sharing your screen","check");
}
function callStopScreen(){
  const st=CALL.screen;CALL.screen=null;
  if(st)st.getTracks().forEach(t=>{try{t.stop()}catch(e){}});
  callSendVideo();callScreenSync();
}

/* ---- the call screen (lives outside the app, so it stays open while you browse) ---- */
function callScreenShow(){
  let el=document.getElementById("callScr");
  if(!el){
    el=document.createElement("div");el.id="callScr";el.className="call-scr";
    el.innerHTML=`<div class="call-top"><div><span id="csTitle"></span><small id="csStatus"></small></div></div>
      <div class="call-grid" id="csGrid"></div><div class="call-add" id="csAdd" hidden></div>
      <div class="call-btns" id="csBtns"></div>`;
    document.body.appendChild(el);
  }
  el.hidden=false;
  clearInterval(CALL.clock);CALL.clock=setInterval(callScreenStatus,1000);
  callScreenSync();
}
function callScreenHide(){const el=document.getElementById("callScr");if(el)el.hidden=true;clearInterval(CALL.clock);CALL.clock=null}
/* a video that has a picture but stays paused (the browser can stop autoplay when its stream arrives late) is started again */
function callNudgeVideo(){
  document.querySelectorAll("#csGrid video").forEach(v=>{if(v.paused&&v.srcObject){const p=v.play();if(p&&p.catch)p.catch(()=>{})}});
}
function callScreenStatus(){
  callNudgeVideo();
  const s=document.getElementById("csStatus");if(!s)return;
  const n=Object.values(CALL.peers).filter(P=>P.state==="connected").length;
  const t=Math.floor((Date.now()-CALL.t0)/1000);
  s.textContent=(n?"Connected · "+String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0"):"Calling…")+(CALL.video?" · video":"");
}
function callTileEl(grid,key,label){
  let t=grid.querySelector(`[data-u="${key}"]`);
  if(!t){
    t=document.createElement("div");t.className="call-tile";t.dataset.u=key;
    const ini=(label||"?").trim().charAt(0).toUpperCase()||"?";
    t.innerHTML=`<video autoplay playsinline muted></video><div class="call-av">${ini}</div><span class="call-nm"></span>`;
    grid.appendChild(t);
  }
  t.querySelector(".call-nm").textContent=key==="me"?"You":label;
  return t;
}
function callScreenSync(){
  const el=document.getElementById("callScr");if(!el||el.hidden)return;
  const grid=document.getElementById("csGrid");
  const title=document.getElementById("csTitle");
  const keep=new Set(["me"]);
  const people=[...new Set([...CALL.others,...Object.keys(CALL.peers)])].filter(x=>x&&x!==S.uid);
  if(title)title.textContent=CALL.kind==="group"||people.length>1?(CALL.group?"Group call":"Group call · "+people.length+" people"):"Call with "+callName(people[0]||CALL.host||"");
  const localKey=(CALL.local?CALL.local.getTracks().map(t=>t.id).join(","):"");
  const me=callTileEl(grid,"me",callMyName());
  me.classList.toggle("on",CALL.camOn||!!CALL.screen);
  me.classList.toggle("zz-shared",!!CALL.screen);
  const mv=me.querySelector("video");
  const myKey=localKey+"|"+(CALL.screen?CALL.screen.id:"");
  if((CALL.local||CALL.screen)&&mv.dataset.k!==myKey){mv.srcObject=new MediaStream(CALL.screen?CALL.screen.getVideoTracks():CALL.local.getTracks());mv.dataset.k=myKey}
  for(const u of people){
    keep.add(u);
    const P=CALL.peers[u];
    const t=callTileEl(grid,u,callName(u));
    const v=t.querySelector("video");
    const live=P&&P.stream&&P.stream.getVideoTracks().some(x=>x.readyState==="live"&&!x.muted);
    t.classList.toggle("on",!!live);
    t.classList.toggle("zz-shared",!!CALL.shares[u]);
    const sig=P&&P.stream?P.stream.id:"";
    if(P&&P.stream&&v.dataset.k!==sig){v.srcObject=P.stream;v.dataset.k=sig;v.play&&v.play().catch(()=>{})}
    if(!P){t.querySelector(".call-nm").textContent=callName(u)+" · calling…"}
    else if(P.state==="connected"){t.querySelector(".call-nm").textContent=callName(u)}
    else{t.querySelector(".call-nm").textContent=callName(u)+" · connecting…"}
  }
  [...grid.children].forEach(c=>{if(!keep.has(c.dataset.u))c.remove()});
  grid.className="call-grid n"+Math.min(keep.size,9);
  callScreenStatus();
  const b=document.getElementById("csBtns");
  b.innerHTML=`<button type="button" data-call="mic" class="${CALL.micOn?"":"off"}" aria-label="${CALL.micOn?"Mute microphone":"Unmute microphone"}">${ic(CALL.micOn?"mic":"mute")}</button>
    <button type="button" data-call="cam" class="${CALL.camOn?"":"off"}" aria-label="${CALL.camOn?"Turn camera off":"Turn camera on"}">${ic(CALL.camOn?"camera":"camoff")}</button>
    <button type="button" data-call="screen" class="${CALL.screen?"share-on":""}" aria-label="${CALL.screen?"Stop sharing my screen":"Share my screen"}">${ic("screen")}</button>
    <button type="button" data-call="add" aria-label="Add someone to the call">${ic("plus")}</button>
    <button type="button" data-call="end" class="end" aria-label="End call">${ic("phone")}</button>`;
  const add=document.getElementById("csAdd");
  if(CALL.adding){
    add.hidden=false;
    if(!CALL.cands){add.innerHTML='<p style="margin:6px;opacity:.8">Loading…</p>';callCandidates().then(()=>callScreenSync())}
    else{
      add.innerHTML=(CALL.cands.length?CALL.cands.map(c=>`<button type="button" data-call="pick" data-uid="${esc(c.uid)}" class="${CALL.pick.has(c.uid)?"on":""}"><span>${esc(c.name)}</span><span>${CALL.pick.has(c.uid)?"✓":""}</span></button>`).join(""):'<p style="margin:6px;opacity:.8">Nobody else is available to add.</p>')+(CALL.pick.size?`<button type="button" class="go" data-call="addgo">Invite ${CALL.pick.size}</button>`:"");
    }
  }else add.hidden=true;
}
function callShowIncoming(){
  let el=document.getElementById("callIn");
  if(!el){el=document.createElement("div");el.id="callIn";el.className="call-in";document.body.appendChild(el)}
  const R=CALL.ring;if(!R)return;
  const who=callName(R.from)||"A classmate";
  el.innerHTML=`<div><div class="big">${esc(who)}</div><p style="opacity:.8;margin:6px 0 0">${R.kind==="group"?"is calling the group":"is calling you"}${R.video?" · video":" · voice"}</p>
    <div class="acts"><button type="button" class="go" data-call="acc" data-v="0">${ic("mic")}Voice</button>${R.video?`<button type="button" class="go" data-call="acc" data-v="1">${ic("camera")}Video</button>`:""}<button type="button" class="no" data-call="dec">${ic("phone")}Decline</button></div></div>`;
  el.hidden=false;
}
function callHideIncoming(){const el=document.getElementById("callIn");if(el)el.hidden=true}
function callRing(on){
  clearInterval(CALL.ringT);CALL.ringT=null;
  if(!on)return;
  callTone();CALL.ringT=setInterval(callTone,rtCallPeriod());
}
let CALL_AC=null;
function callTone(){
  /* the ring uses the app's shared audio context: it was unlocked by the first tap. A new context created while a call
     arrives (no tap) stays silent on Android, which is why the ring could not be heard. */
  try{
    const shared=typeof nAudio==="function"?nAudio():null;
    CALL_AC=shared||CALL_AC||new (window.AudioContext||window.webkitAudioContext)();
    if(CALL_AC.state==="suspended")CALL_AC.resume();
    rtCallPlay(CALL_AC,CALL_AC.currentTime+0.02)}catch(e){}
}

/* ---- buttons: one listener for every call button ---- */
document.addEventListener("click",e=>{
  const t=e.target.closest&&e.target.closest("[data-call]");if(!t)return;
  e.preventDefault();e.stopPropagation();
  callAct(t.dataset.call,t);
},true);
function callAct(a,el){
  if(a==="go"){
    const video=el.dataset.v==="1";const id=el.dataset.id;
    if(el.dataset.k==="group"){
      const uids=(GR.mem&&GR.mem[id]||[]).map(m=>m.uid).filter(u=>u!==S.uid);
      if(!uids.length){toast("Nobody else is in this group yet","x");return}
      callStart("group",uids,video,id);
    }else callStart("duo",[id],video,null);
    return;
  }
  if(a==="acc"){callAccept(el.dataset.v==="1");return}
  if(a==="dec"){callDeclineRing();return}
  if(a==="mic"){callToggleMic();return}
  if(a==="cam"){callToggleCam();return}
  if(a==="screen"){callToggleScreen();return}
  if(a==="end"){callLeave();return}
  if(a==="add"){CALL.adding=!CALL.adding;CALL.cands=null;CALL.pick=new Set();callScreenSync();return}
  if(a==="pick"){const u=el.dataset.uid;if(CALL.pick.has(u))CALL.pick.delete(u);else CALL.pick.add(u);callScreenSync();return}
  if(a==="addgo"){callAddGo();return}
}

/* ---- the call buttons at the top of a private or group chat ---- */
function callBarHTML(kind,id){
  if(!CALL_TEST()&&!window.__sb)return"";
  return`<div class="call-entry"><button type="button" data-call="go" data-k="${kind}" data-id="${esc(id)}" data-v="0">${ic("phone")}Voice call</button><button type="button" data-call="go" data-k="${kind}" data-id="${esc(id)}" data-v="1">${ic("camera")}Video call</button></div>`;
}
{const _pcv=peerChatView;peerChatView=function(){const id=S.view&&S.view.id;return(id?callBarHTML("duo",id):"")+_pcv()}}
{const _gcv=grChatView;grChatView=function(){const id=S.view&&S.view.id;return(id&&grMember(id)&&GR.mem[id]&&GR.mem[id].length>1?callBarHTML("group",id):"")+_gcv()}}
