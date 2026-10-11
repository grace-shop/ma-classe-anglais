/* =====================================================================
   v5 groups: group chats (like WhatsApp / Facebook / Snapchat groups)
   - Classmates screen: "Groups" section (pinned first, archived hidden, mute)
   - New group: photo (gallery or generated gradient + emoji), name, description, members
   - Group chat: same composer and bubbles as the other chats (voice, photos, view once,
     files, stickers, emojis, replies, reactions, delete for me / everyone, Nova correction)
   - Group info: photo, name, description (admins edit), members, admins, add / remove,
     mute, pin, archive, leave, report
   - Teachers: every group from Messages → Between students (moderation, read-only)
   - Realtime + polling, cache for offline reading, offline queue for text messages
   Server: supabase/groupes.sql
   ===================================================================== */
const GR={list:[],loaded:false,err:"",msgs:{},mem:{},info:{},names:{},rt:"",ch:null,uid:null,started:false,at:0,pick:new Set(),np:null,sheet:null,queue:[],busy:false,
  mod:null,modLoading:false,arch:{},showArch:false,edit:null,lastAct:null,readT:{},loadingMsgs:{},lp:null};
const GR_GRAD=[["#6C80FF","#9A7CFF"],["#FF7EB3","#FF758C"],["#22D3A6","#38BDF8"],["#FA709A","#FEC163"],["#30CFD0","#5B3CC4"],["#F6A15B","#F5576C"],["#5EE7DF","#8E7CF5"],["#667EEA","#B24592"],["#FF9A9E","#F6416C"],["#00C6FB","#005BEA"],["#F093FB","#7B5CFF"],["#0BA360","#3CBA92"]];
const GR_EMO=["🚀","📚","⚽","🎵","🔥","🌍","💡","🎮","🏆","😎","🌟","🇹🇬","🦁","🎨","💬","🤝"];
const GR_COL=["#E5484D","#D97706","#059669","#2563EB","#9333EA","#DB2777","#0D9488","#EA580C"];
if(!ICONS.pin)ICONS.pin='<path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6zM12 15v6"/>';
if(!ICONS.archive)ICONS.archive='<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>';
if(!ICONS.bellOff)ICONS.bellOff='<path d="M9.5 19a2.5 2.5 0 0 0 5 0M6 8a6 6 0 0 1 9.6-4.8M18 9.5c.2 3.6 1.4 5.5 2 6.5H8M4 4l16 16M6 8c0 4-1.2 6.4-2 8h4"/>';
if(!ICONS.bell2)ICONS.bell2='<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M9.5 19a2.5 2.5 0 0 0 5 0"/>';
if(!ICONS.edit)ICONS.edit='<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>';
if(!ICONS.logout)ICONS.logout='<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>';
if(!ICONS.userplus)ICONS.userplus='<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>';
if(!ICONS.flag)ICONS.flag='<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>';

const grStaff=()=>S.mode==="teacher"&&!!(S.isOwner||S.isStaff);
const grOn=()=>!!window.__sb&&!!S.uid&&(grStaff()||(typeof peerOn==="function"&&peerOn()));
const grSB=()=>window.__sb;
const grErr=(e,def)=>{const m=String((e&&e.message)||"");return new Error(/my_groups|create_group|send_group_message|group_|chat_groups|schema cache/i.test(m)&&/function|relation|schema cache|does not exist/i.test(m)?"The teacher must first run the file supabase/groupes.sql in Supabase.":(m||def||"Something went wrong"))};
const grHash=s=>{let h=0;for(const c of String(s||""))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const grG=id=>GR.list.find(x=>x.id===id)||GR.info[id]||(GR.mod||[]).find(x=>x.id===id)||null;
const grMember=id=>!!GR.list.find(x=>x.id===id);
const grAdmin=id=>(GR.list.find(x=>x.id===id)||{}).role==="admin";
const grMuted=id=>convHas("group:"+id,"mute");
const grRow=r=>{if(r&&r.sender!==undefined)r.from=r.sender;return r};
const grFirst=n=>String(n||"").trim().split(/\s+/)[0]||"Someone";
function grMeWho(){const me=S.mode==="student"?S.me:null;return me?{name:me.name||"Me",photo:me.photo,ava:me.ava,role:"student"}:{name:((S.staff||[]).find(x=>x.id===S.uid)||{}).name||"Teacher",role:"teacher"}}
function grWho(gid,uid,who){if(who&&who.name)return who;const m=(GR.mem[gid]||[]).find(x=>x.uid===uid);if(m&&m.who)return m.who;const d=(PR.dir||[]).find(x=>x.uid===uid);return d?{name:d.name}:{name:"Member"}}
function grName(gid,uid,who){if(uid===S.uid)return"You";return dispName(uid,grWho(gid,uid,who).name)}
function grWhen(t){if(!t)return"";const d=new Date(t),n=new Date();if(d.toDateString()===n.toDateString())return d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  const y=new Date(n);y.setDate(n.getDate()-1);if(d.toDateString()===y.toDateString())return"Yesterday";if(n-d<6*864e5)return d.toLocaleDateString("en-GB",{weekday:"short"});return d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
function grAva(g,size,cls){g=g||{};const ph=String(g.photo||""),z=size||48;let inner,i;
  const m=/^g:(\d{1,2}):(.+)$/.exec(ph);i=m?(+m[1])%GR_GRAD.length:grHash(g.id||g.name)%GR_GRAD.length;const[c1,c2]=GR_GRAD[i];
  if(/^https:\/\/[^/]+\/storage\/v1\/object\/public\/avatars\//.test(ph)||/^blob:/.test(ph))inner=`<img src="${esc(ph)}" alt="" loading="lazy" draggable="false" onerror="this.remove()">`;
  else inner=m?E(m[2]):`<b>${esc(initials(g.name||"G"))}</b>`;
  return`<span class="grava${cls?" "+cls:""}" style="--s:${z}px;--g1:${c1};--g2:${c2}" aria-hidden="true"><span class="grava-in">${inner}</span></span>`}
function grPreview(g){const l=g.last;if(!l)return g.bio?esc(g.bio):"Tap to start chatting";
  if(l.meta&&l.meta.sys)return esc(l.body||"");
  const who=l.sender===S.uid?"You":grFirst(dispName(l.sender,(l.who||{}).name));
  const t=l.deleted_at?"⊘ Message deleted":(l.att&&l.att.o)?"📷 Photo · view once":(v4Plain(l.body)||attLabel(l.att)||"");
  return`<b class="grwho">${esc(who)}:</b> ${E(String(t).slice(0,70))}`}

/* ---------------- cache (offline) ---------------- */
const grKey=()=>"ec_gr_"+(S.uid||"x");
function grSave(){clearTimeout(grSave._t);grSave._t=setTimeout(()=>{try{const msgs={};for(const g of GR.list.slice(0,40))if(GR.msgs[g.id])msgs[g.id]=GR.msgs[g.id].slice(-60);
  const mem={};for(const g of GR.list.slice(0,40))if(GR.mem[g.id])mem[g.id]=GR.mem[g.id];
  localStorage.setItem(grKey(),JSON.stringify({list:GR.list,msgs,mem,queue:GR.queue,names:GR.names}))}catch(e){}},400)}
function grRestore(){try{const c=JSON.parse(localStorage.getItem(grKey())||"null");if(!c)return;GR.list=c.list||[];GR.msgs=c.msgs||{};GR.mem=c.mem||{};GR.queue=c.queue||[];GR.names=c.names||{};if(GR.list.length)GR.loaded=true}catch(e){}}

/* ---------------- loading + realtime ---------------- */
async function grLoad(){if(!grOn())return;GR.at=Date.now();
  try{const{data,error}=await grSB().rpc("my_groups");if(error)throw grErr(error);GR.list=(data||[]).map(g=>({...g,last:g.last?grRow(g.last):null}));GR.loaded=true;GR.err="";for(const g of GR.list)GR.names[g.id]=g.name;grSave()}
  catch(e){GR.loaded=true;GR.err=navigator.onLine?(e.message||"Cannot load groups."):"You are offline: groups saved on this phone are shown."}
  render()}
async function grLoadMsgs(gid){if(!navigator.onLine||GR.loadingMsgs[gid])return;GR.loadingMsgs[gid]=1;
  try{const{data,error}=await grSB().from("group_messages").select("*").eq("group_id",gid).order("created_at",{ascending:false}).limit(200);if(error)throw error;
    const pend=(GR.msgs[gid]||[]).filter(m=>m.pending);GR.msgs[gid]=(data||[]).map(grRow).reverse().concat(pend.filter(p=>!(data||[]).some(d=>d.id===p.id)));grSave()}catch(e){}
  GR.loadingMsgs[gid]=0;render()}
async function grLoadMem(gid){if(!navigator.onLine)return;try{const{data,error}=await grSB().from("group_members").select("*").eq("group_id",gid);if(error)throw error;GR.mem[gid]=(data||[]).sort((a,b)=>(a.role==="admin"?0:1)-(b.role==="admin"?0:1)||String(a.joined_at).localeCompare(String(b.joined_at)));grSave();render()}catch(e){}}
async function grLoadInfo(gid){if(grMember(gid)||!navigator.onLine)return;try{const{data}=await grSB().from("chat_groups").select("*").eq("id",gid).limit(1);if(data&&data[0]){GR.info[gid]=data[0];GR.names[gid]=data[0].name;render()}}catch(e){}}
function grStart(){if(GR.uid!==S.uid){try{GR.ch&&grSB().removeChannel(GR.ch)}catch(e){}GR.ch=null;Object.assign(GR,{list:[],msgs:{},mem:{},info:{},loaded:false,queue:[],mod:null})}
  GR.uid=S.uid;GR.started=true;grRestore();grLoad();grFlush();
  try{GR.ch=grSB().channel("grp-"+Math.random().toString(36).slice(2,10))
    .on("postgres_changes",{event:"*",schema:"public",table:"group_messages"},p=>{try{grRT(p)}catch(e){}})
    .on("postgres_changes",{event:"*",schema:"public",table:"group_members"},p=>{try{grRTM(p)}catch(e){}})
    .subscribe(st=>{GR.rt=st})}catch(e){}}
setInterval(()=>{if(!grOn())return;if(!GR.started||GR.uid!==S.uid){grStart();return}if(document.visibilityState!=="visible")return;
  const v=S.view,age=Date.now()-GR.at,live=GR.rt==="SUBSCRIBED";
  if(age>(live?90000:25000))grLoad();
  if(v&&v.type==="group"&&Date.now()-(GR.msgAt||0)>(live?60000:12000)){GR.msgAt=Date.now();grLoadMsgs(v.id)}
  if(GR.queue.length&&navigator.onLine)grFlush()},3000);
addEventListener("online",()=>{if(grOn()){grFlush();grLoad()}});
function grRT(p){const r=grRow(p.new||{});if(!r.id||!r.group_id)return;const gid=r.group_id,L=GR.msgs[gid],g=GR.list.find(x=>x.id===gid);
  if(p.eventType==="INSERT"){
    if(L&&!L.some(x=>x.id===r.id)){const i=r.sender===S.uid?L.findIndex(x=>x.pending&&x.body===r.body&&JSON.stringify(x.att&&x.att.k)===JSON.stringify(r.att&&r.att.k)):-1;if(i>=0)L[i]=r;else L.push(r)}
    if(!g){if(!grStaff()||grMember(gid))grLoad();else if(GR.mod)render();return}
    g.last=r;g.updated_at=r.created_at;const sys=r.meta&&r.meta.sys;
    if(r.sender!==S.uid&&!sys){if(S.view?.type==="group"&&S.view.id===gid&&document.visibilityState==="visible")grMarkRead(gid);else g.unread=(g.unread||0)+1}
    if(sys){grLoad();if(GR.mem[gid])grLoadMem(gid)}
    grSave();render();grNear()}
  else if(p.eventType==="UPDATE"){if(L){const i=L.findIndex(x=>x.id===r.id);if(i>=0){L[i]={...L[i],...r};grSave();render()}}if(g&&g.last&&g.last.id===r.id){g.last={...g.last,...r};render()}}}
function grRTM(p){const r=p.new||{},o=p.old||{},gid=r.group_id||o.group_id;
  if(p.eventType==="UPDATE"&&gid&&GR.mem[gid]){const m=GR.mem[gid].find(x=>x.uid===r.uid);if(m){Object.assign(m,r);render();return}}
  clearTimeout(grRTM._t);grRTM._t=setTimeout(()=>{grLoad();if(gid&&GR.mem[gid])grLoadMem(gid)},500)}
function grNear(){requestAnimationFrame(()=>{const cs=document.getElementById("chatScroll");if(cs&&S.view?.type==="group"&&B4near(cs))cs.scrollTop=cs.scrollHeight})}
function grMarkRead(gid){if(!grMember(gid))return;const g=GR.list.find(x=>x.id===gid);if(g)g.unread=0;clearTimeout(GR.readT[gid]);
  GR.readT[gid]=setTimeout(()=>{if(!navigator.onLine)return;grSB().rpc("mark_group_read",{p_id:gid}).then(()=>{const m=(GR.mem[gid]||[]).find(x=>x.uid===S.uid);if(m)m.last_read_at=new Date().toISOString()},()=>{})},700)}
function grReadAll(gid,at){const M=(GR.mem[gid]||[]).filter(x=>x.uid!==S.uid);if(!M.length)return false;return M.every(x=>+new Date(x.last_read_at||0)>=at)}

/* ---------------- sending ---------------- */
async function grSend(gid,text,att,meta){
  const once=!!(att&&att.o);const row={id:"tmp"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),group_id:gid,sender:S.uid,from:S.uid,who:grMeWho(),body:once?"":(text||""),
    att:once?{k:"img",o:true}:(att||null),meta:meta||null,react:null,created_at:new Date().toISOString(),pending:true};
  (GR.msgs[gid]=GR.msgs[gid]||[]).push(row);const g=GR.list.find(x=>x.id===gid);if(g){g.last=row;g.updated_at=row.created_at}render();grNear();
  if(!navigator.onLine){if(att&&att.p){GR.msgs[gid]=GR.msgs[gid].filter(x=>x!==row);render();throw new Error("No network: try again when you are connected.")}
    GR.queue.push({gid,text:text||"",att:att||null,meta:meta||null,tmp:row.id});grSave();toast("You are offline: it will be sent when you are connected.","clock");return}
  try{const id=await grRpcSend(gid,text,att,meta);grSettle(gid,row.id,id)}
  catch(e){GR.msgs[gid]=(GR.msgs[gid]||[]).filter(x=>x!==row);render();throw e}}
async function grRpcSend(gid,text,att,meta){const{data,error}=await grSB().rpc("send_group_message",{p_group:gid,p_body:text||"",p_att:att||null,p_meta:meta||null});if(error)throw grErr(error,"Could not send");return data}
function grSettle(gid,tmp,id){const L=GR.msgs[gid]||[];const i=L.findIndex(x=>x.id===tmp);if(i<0)return;if(id&&L.some(x=>x.id===id))L.splice(i,1);else{L[i].id=id||L[i].id;delete L[i].pending}
  const g=GR.list.find(x=>x.id===gid);if(g&&g.last&&g.last.id===tmp)g.last={...g.last,id,pending:false};grSave();render()}
async function grFlush(){if(GR.flushing||!GR.queue.length||!navigator.onLine||!window.__sb)return;GR.flushing=true;
  while(GR.queue.length&&navigator.onLine){const q=GR.queue[0];try{const id=await grRpcSend(q.gid,q.text,q.att,q.meta);GR.queue.shift();grSettle(q.gid,q.tmp,id)}
    catch(e){if(!navigator.onLine)break;GR.queue.shift();GR.msgs[q.gid]=(GR.msgs[q.gid]||[]).filter(x=>x.id!==q.tmp);toast(e.message||"A message could not be sent","x")}}
  GR.flushing=false;grSave();render()}

/* ---------------- chat kind "group" (re-uses the v4 messenger) ---------------- */
V4KINDS.group={input:"groupInput",form:"groupchat"};
{const _d=v4Deliver;v4Deliver=function(kind,target,text,att,meta){if(kind==="group")return grSend(target,text,att,meta);return _d(kind,target,text,att,meta)}}
{const _n=v4Norm;v4Norm=function(kind,m,c){if(kind!=="group")return _n(kind,m,c);const mine=m.sender===S.uid,at=+new Date(m.created_at),op=m.opened||{};
  return{id:m.id,mine,from:m.sender,text:m.body||"",att:m.att,at,re:m.meta&&m.meta.re,react:m.react||{},del:!!m.deleted_at,read:mine&&grReadAll(m.group_id,at),opened:mine?Object.keys(op).length>0:!!op[S.uid],sys:!!(m.meta&&m.meta.sys),pending:!!m.pending}}}
{const _c=v4Ctx;v4Ctx=function(kind,id,x){if(kind!=="group")return _c(kind,id,x);
  const c={target:id,gid:id,list:()=>GR.msgs[id]||[],get other(){const a=GR.lastAct;return a&&a.raw?grName(id,a.raw.sender,a.raw.who):"Member"}};V4.ctx.group=c;return c}}
{const _w=v4Who;v4Who=function(kind,w,c){if(kind!=="group")return _w(kind,w,c);if(!w)return"";if(w===S.uid)return"You";const raw=(GR.msgs[c.gid]||[]).find(x=>x.sender===w);return grName(c.gid,w,raw&&raw.who)}}
{const _a=v4ActMsg;v4ActMsg=function(){const r=_a();if(r&&r.kind==="group")GR.lastAct=r;return r}}
{const _r=v4React;v4React=async function(e){const a=V4.act;if(!a||a.kind!=="group")return _r(e);const x=v4ActMsg();V4.act=null;if(!x||!grMember(x.c.gid)){render();return}
  const cur=(x.m.react||{})[S.uid],ne=cur===e?"":e;x.raw.react={...(x.raw.react||{})};if(ne)x.raw.react[S.uid]=ne;else delete x.raw.react[S.uid];render();
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
  const{error}=await grSB().rpc("react_group_message",{p_id:x.raw.id,p_e:ne});if(error)toast(grErr(error,"Could not react").message,"x")}}
{const _da=v4DelAll;v4DelAll=async function(){const a=V4.act;if(!a||a.kind!=="group")return _da();const x=v4ActMsg();V4.act=null;if(!x||!(x.m.mine||grStaff())){render();return}
  if(!navigator.onLine){render();toast("No network: try again when you are online.","x");return}
  const{error}=await grSB().rpc("delete_group_message",{p_id:x.raw.id});if(error){toast(grErr(error,"Could not delete").message,"x");render();return}
  Object.assign(x.raw,{deleted_at:new Date().toISOString(),body:"",att:null,meta:null,react:null});render()}}
{const _o=v4OpenOnce;v4OpenOnce=async function(kind,id){if(kind!=="group")return _o(kind,id);const c=V4.ctx.group;if(!c)return;const raw=c.list().find(x=>x.id===id);if(!raw)return;
  if(!navigator.onLine){toast("No network: view once photos need the internet.","x");return}
  const{data,error}=await grSB().rpc("open_group_once",{p_id:id});if(error){toast(grErr(error,"Cannot open this photo.").message,"x");return}
  raw.opened={...(raw.opened||{}),[S.uid]:Date.now()};render();const att=data;if(!att||!att.p){toast("This photo was already opened.","eye");return}
  const ov=document.createElement("div");ov.className="v4onceview";ov.innerHTML=`<div class="v4spin"></div><button type="button" class="iconbtn" aria-label="Close">${ic("x")}</button><p>View once · it disappears when you close it</p>`;document.body.appendChild(ov);
  let url=null;const close=()=>{ov.remove();if(url)URL.revokeObjectURL(url)};ov.querySelector("button").onclick=close;
  try{const r=await fetch(await srcURL({k:"m",id:att.p,t:att.t}));const b=await r.blob();url=URL.createObjectURL(b);const im=new Image();im.src=url;im.alt="View once photo";im.draggable=false;im.oncontextmenu=ev=>ev.preventDefault();ov.querySelector(".v4spin").replaceWith(im)}
  catch(er){ov.querySelector(".v4spin").replaceWith(Object.assign(document.createElement("p"),{textContent:"Cannot load the photo (network)."}))}}}
{const _as=v4ActSheet;v4ActSheet=function(kind,list,c){let h=_as(kind,list,c);if(kind!=="group")return h;const raw=list.find(x=>x.id===(V4.act&&V4.act.id));if(!raw)return h;
  const mem=grMember(c.gid),mine=raw.sender===S.uid,del=!!raw.deleted_at;
  if(!mem)h=h.replace(/<div class="v4rxrow">[\s\S]*?<\/div>/,"").replace(/<button type="button" data-v4="reply">[\s\S]*?<\/button>/,"");
  const who=grName(c.gid,raw.sender,raw.who);
  let add=`<div class="grsheet-who">${whoAva(grWho(c.gid,raw.sender,raw.who),raw.sender,28)}<span>${esc(mine?"Your message":who)} · ${esc(grWhen(+new Date(raw.created_at)))}</span></div>`;
  h=h.replace('<div class="v4sheet" role="dialog" aria-label="Message options">','<div class="v4sheet" role="dialog" aria-label="Message options">'+add);
  let extra="";if(!mine&&!del&&S.mode==="student")extra+=`<button type="button" data-v4="grRepMsg">${ic("shield")}Report or block</button>`;
  if(!mine&&!del&&grStaff())extra+=`<button type="button" class="danger" data-v4="delAll">${ic("trash")}Remove for everyone (moderation)</button>`;
  return h.replace('<button type="button" class="v4cancel"',extra+'<button type="button" class="v4cancel"')}}

function grMsgList(gid,list,c){const H=v4Hidden();let out="",lastDay="",prev=null;
  for(const raw of list){const m=v4Norm("group",raw,c);if(H.has(m.id))continue;const day=new Date(m.at).toDateString();
    if(day!==lastDay){lastDay=day;prev=null;out+=`<div class="v4day"><span>${v4DayLabel(m.at)}</span></div>`}
    if(m.sys){out+=`<div class="grsys"><span>${E(m.text)}</span></div>`;prev=null;continue}
    let h=v4MsgHTML("group",m,c);
    if(m.pending)h=h.replace(/<i class="v4tick[^"]*"[^>]*>[^<]*<\/i>/,`<i class="v4tick grpend" aria-label="Waiting to be sent">${ic("clock")}</i>`);
    if(!m.mine){const first=!prev||prev.mine||prev.from!==m.from||m.at-prev.at>6*60000,who=grWho(gid,m.from,raw.who),col=GR_COL[grHash(m.from)%GR_COL.length];
      if(first)h=h.replace(/^(<div [^>]*>)/,`$1<b class="grname" style="color:${col}">${esc(grName(gid,m.from,raw.who))}</b>`);
      h=`<div class="grm${first?" first":""}" style="--gc:${col}">${first?`<span class="grm-av">${whoAva(who,m.from,30)}</span>`:`<span class="grm-sp"></span>`}${h}</div>`}
    out+=h;prev=m}
  return out}

/* ---------------- Classmates screen: Groups section ---------------- */
function grRows(){const q=(S.drafts.peer_q||"").trim().toLowerCase();
  const L=GR.list.filter(g=>!q||String(g.name).toLowerCase().includes(q)),t=g=>+new Date((g.last&&g.last.created_at)||g.updated_at||g.created_at||0);
  const pin=g=>convHas("group:"+g.id,"pin")?1:0;
  const act=L.filter(g=>!convHas("group:"+g.id,"arch")).sort((a,b)=>pin(b)-pin(a)||t(b)-t(a)),arch=L.filter(g=>convHas("group:"+g.id,"arch")).sort((a,b)=>t(b)-t(a));
  return{act,arch}}
function grRowHTML(g){const id=g.id,mu=grMuted(id),pi=convHas("group:"+id,"pin"),un=g.unread||0,l=g.last;
  return`<div class="grrow${un?" un":""}" data-v4="grOpen" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(g.name)}${un?`, ${un} unread`:""}">
    ${grAva(g,52)}
    <div class="grrow-t"><div class="grrow-1"><b>${esc(g.name)}</b><small>${esc(grWhen(l?+new Date(l.created_at):+new Date(g.created_at||0)))}</small></div>
      <div class="grrow-2"><span>${grPreview(g)}</span><span class="grrow-ic">${mu?ic("bellOff"):""}${pi?ic("pin"):""}${un?`<i class="grbadge${mu?" mu":""}">${un>99?"99+":un}</i>`:""}</span></div></div>
    <button type="button" class="iconbtn sm grmore" data-v4="grMore" data-id="${esc(id)}" aria-label="Options for ${esc(g.name)}" title="Options">⋯</button></div>`}
function grSectionHTML(){const{act,arch}=grRows(),q=(S.drafts.peer_q||"").trim();
  return`<div class="grsec">
  <div class="grsec-h"><div class="grsec-ti"><span class="grsec-ico">${ic("users")}</span><div><span class="eyebrow">Groups</span><b>Group chats</b></div></div><button type="button" class="grnewbtn" data-v4="grNew">${ic("plus")}<span>New group</span></button></div>
  ${GR.err&&!GR.list.length?`<p class="hint">${esc(GR.err)}</p>`:""}
  ${!GR.loaded?`<div class="grskel"><i></i><i></i></div>`:act.length||arch.length?`<div class="grlist">${act.map(grRowHTML).join("")}${arch.length?`<button type="button" class="grarch" data-v4="grArchTog" aria-expanded="${GR.showArch}">${ic("archive")}<span>Archived</span><b>${arch.length}</b>${arch.some(g=>g.unread)?`<i class="grbadge mu">${arch.reduce((s,g)=>s+(g.unread||0),0)}</i>`:""}</button>${GR.showArch?arch.map(grRowHTML).join(""):""}`:""}</div>`
    :q?`<p class="small muted" style="margin:4px 2px">No group with this name.</p>`:`<div class="grempty"><div class="grempty-orbs">${grAva({photo:"g:0:🚀"},46)}${grAva({photo:"g:2:📚"},38)}${grAva({photo:"g:5:⚽"},42)}</div><div><b>Chat together in a group</b><p class="small muted">Make a group for your class, a project or your friends. Share messages, voice notes, photos and stickers.</p></div></div>`}
  </div><div class="grsec-h2"><span class="eyebrow">Classmates</span></div>`}
{const _pv=peersView;peersView=function(){const h=_pv();if(!grOn())return h;if(!GR.started)grStart();
  const k='aria-label="Search for a classmate">',i=h.indexOf(k);if(i<0)return h+grSectionHTML();return h.slice(0,i+k.length)+grSectionHTML()+h.slice(i+k.length)}}

/* ---------------- options sheets (row ⋯ / long press, member actions) ---------------- */
function grSheetHTML(){const s=GR.sheet;if(!s)return"";
  if(s.k==="row"){const g=grG(s.id);if(!g)return"";const id="group:"+s.id,mem=grMember(s.id);
    return`<div class="v4sheet-bg fz" data-v4="grSheetX"></div><div class="v4sheet fz grsheet" role="dialog" aria-label="Group options"><div class="grsheet-h">${grAva(g,44)}<b>${esc(g.name)}</b></div>
    ${mem?`<button type="button" data-v4="grConv" data-k="pin" data-id="${esc(s.id)}">${ic("pin")}${convHas(id,"pin")?"Unpin":"Pin to the top"}</button>
    <button type="button" data-v4="grConv" data-k="arch" data-id="${esc(s.id)}">${ic("archive")}${convHas(id,"arch")?"Unarchive":"Archive"}</button>
    <button type="button" data-v4="grConv" data-k="mute" data-id="${esc(s.id)}">${ic(convHas(id,"mute")?"bell2":"bellOff")}${convHas(id,"mute")?"Unmute notifications":"Mute notifications"}</button>
    ${g.unread?`<button type="button" data-v4="grReadNow" data-id="${esc(s.id)}">${ic("check")}Mark as read</button>`:""}`:""}
    <button type="button" data-v4="grInfo" data-id="${esc(s.id)}">${ic("user")}Group info</button>
    <button type="button" class="v4cancel" data-v4="grSheetX">Cancel</button></div>`}
  if(s.k==="mem"){const m=(GR.mem[s.id]||[]).find(x=>x.uid===s.uid);if(!m)return"";const nm=grName(s.id,m.uid,m.who),adm=grAdmin(s.id),canDm=S.mode==="student"&&typeof peerOn==="function"&&peerOn()&&(PR.dir||[]).some(x=>x.uid===m.uid);
    return`<div class="v4sheet-bg fz" data-v4="grSheetX"></div><div class="v4sheet fz grsheet" role="dialog" aria-label="Member options"><div class="grsheet-h">${whoAva(m.who,m.uid,44)}<b>${esc(nm)}</b>${m.role==="admin"?`<span class="grchip">Admin</span>`:""}</div>
    ${canDm?`<button type="button" data-v4="grDm" data-id="${esc(m.uid)}">${ic("chat")}Message ${esc(grFirst(nm))}</button>`:""}
    ${adm?`<button type="button" data-v4="grAdminSet" data-id="${esc(s.id)}" data-u="${esc(m.uid)}" data-on="${m.role==="admin"?0:1}">${ic("shield")}${m.role==="admin"?"Dismiss as admin":"Make group admin"}</button>`:""}
    ${adm||grStaff()?`<button type="button" class="danger" data-v4="grKick" data-id="${esc(s.id)}" data-u="${esc(m.uid)}">${ic("x")}Remove from the group</button>`:""}
    <button type="button" class="v4cancel" data-v4="grSheetX">Cancel</button></div>`}
  return""}
function grSync(){let h=document.getElementById("grhost");if(!h){h=document.createElement("div");h.id="grhost";document.body.appendChild(h)}
  const v=S.view&&S.view.type;if(GR.sheet&&!["peers","group","grinfo"].includes(v)&&!grStaff())GR.sheet=null;
  const x=grSheetHTML();if(h._h!==x){h._h=x;h.innerHTML=x}}
{const _l=v4ChatLayout;v4ChatLayout=function(){_l();grSync()}}

/* ---------------- New group / add members ---------------- */
function grDir(){if(grStaff())return(S.students||[]).filter(s=>s&&s.id&&!isParent(s)&&s.profile!=="primaire"&&!(s.access&&s.access.noChat)).map(s=>({uid:s.id,name:s.name||"Student",classe:s.classe||""}));
  if(!PR.loaded&&typeof peerRefresh==="function"&&!GR.dirAsk){GR.dirAsk=1;peerRefresh()}return(PR.dir||[]).filter(x=>!BL.set.has(x.uid))}
function grPickerHTML(except){const q=(S.drafts.gr_q||"").trim().toLowerCase(),D=grDir().filter(x=>!except||!except.has(x.uid)),sel=D.filter(x=>GR.pick.has(x.uid));
  const L=D.filter(x=>!q||String(x.name).toLowerCase().includes(q)||String(x.classe||"").toLowerCase().includes(q)).sort((a,b)=>(GR.pick.has(b.uid)-GR.pick.has(a.uid))||((b.same?1:0)-(a.same?1:0))||String(a.name).localeCompare(String(b.name)));
  return`<div class="grpicker">
  ${sel.length?`<div class="grsel" aria-label="Selected members">${sel.map(x=>`<button type="button" class="grselc" data-v4="grPick" data-id="${esc(x.uid)}" aria-label="Remove ${esc(x.name)}">${avatar(x.uid,x.name,40)}<span>${esc(grFirst(dispName(x.uid,x.name)))}</span><i>${ic("x")}</i></button>`).join("")}</div>`:""}
  <input id="gr_q" type="search" placeholder="Search for a classmate…" value="${esc(S.drafts.gr_q||"")}" aria-label="Search members" autocomplete="off">
  <div class="grplist">${!D.length?`<p class="small muted">${PR.loaded||grStaff()?"Nobody to add yet.":"Loading…"}</p>`:L.slice(0,q?200:80).map(x=>{const on=GR.pick.has(x.uid);return`<button type="button" class="grpick${on?" on":""}" data-v4="grPick" data-id="${esc(x.uid)}" aria-pressed="${on}">${avatar(x.uid,x.name,40)}<span class="grpick-t"><b>${esc(dispName(x.uid,x.name))}</b><small>${esc(x.classe?CL(x.classe)+(x.same?" · your class":""):"")}</small></span><i class="grcheck">${on?ic("check"):""}</i></button>`}).join("")}
  ${L.length>(q?200:80)?`<p class="small muted">Search for a name to see the others.</p>`:""}</div></div>`}
function grNewView(){const P=GR.np||(GR.np={g:Math.floor(Math.random()*GR_GRAD.length),e:GR_EMO[Math.floor(Math.random()*GR_EMO.length)],url:null,blob:null});
  const prev={id:"new",name:S.drafts.gr_name||"New group",photo:P.url||("g:"+P.g+":"+P.e)},n=GR.pick.size;
  return`<div class="section grpage" style="max-width:720px;margin-inline:auto"><div><button class="back" data-v4="grBack">${ic("left")}Back</button></div>
  <div class="row"><span class="grsec-ico">${ic("users")}</span><div><span class="eyebrow">Groups</span><h2>New group</h2></div></div>
  <div class="glass grhero">
    <div class="grhero-ph"><label class="grphpick" title="Choose a photo">${grAva(prev,108,"big")}<input type="file" id="gr_np_file" accept="image/*" hidden><span class="grcam">${ic("camera")}</span></label>
      ${P.url?`<button type="button" class="btn ghost sm" data-v4="grNpClear">${ic("x")}Remove photo</button>`:`<div class="grstyle" aria-label="Group icon"><div class="grswatch">${GR_GRAD.map((c,i)=>`<button type="button" style="--g1:${c[0]};--g2:${c[1]}" class="${P.g===i?"on":""}" data-v4="grNpG" data-k="${i}" aria-label="Colour ${i+1}"></button>`).join("")}</div>
        <div class="gremo">${GR_EMO.map(e=>`<button type="button" class="${P.e===e?"on":""}" data-v4="grNpE" data-e="${e}" aria-label="${e}">${E(e)}</button>`).join("")}</div></div>`}</div>
    <label class="grfield">Group name<input id="gr_name" maxlength="60" placeholder="e.g. Tle D English club" autocomplete="off" value="${esc(S.drafts.gr_name||"")}"></label>
    <label class="grfield">Description <small class="muted">(optional)</small><textarea id="gr_bio" maxlength="200" rows="2" placeholder="What is this group about?">${esc(S.drafts.gr_bio||"")}</textarea></label>
  </div>
  <div class="glass grcard"><div class="row between"><b>${ic("userplus")} Members</b><span class="grchip">${n} selected</span></div>${grPickerHTML()}</div>
  <div class="grfoot"><button type="button" class="grgo" data-v4="grCreate" ${GR.busy?"disabled":""}>${GR.busy?`<span class="v4spin"></span>Creating…`:`${ic("check")}Create group${n?` · ${n+1} people`:""}`}</button></div></div>`}
function grAddView(){const id=S.view.id,g=grG(id),M=new Set((GR.mem[id]||[]).map(m=>m.uid));if(!GR.mem[id])grLoadMem(id);
  return`<div class="section grpage" style="max-width:720px;margin-inline:auto"><div><button class="back" data-v4="grInfo" data-id="${esc(id)}">${ic("left")}Group info</button></div>
  <div class="row">${grAva(g,48)}<div><span class="eyebrow">Add members</span><h2>${esc(g?g.name:"Group")}</h2></div></div>
  <div class="glass grcard">${grPickerHTML(M)}</div>
  <div class="grfoot"><button type="button" class="grgo" data-v4="grAddGo" data-id="${esc(id)}" ${GR.busy||!GR.pick.size?"disabled":""}>${GR.busy?`<span class="v4spin"></span>Adding…`:`${ic("userplus")}Add ${GR.pick.size||""} ${GR.pick.size===1?"member":"members"}`}</button></div></div>`}
async function grSquare(file){const f=await shrinkImg(file,1200,.88);const bmp=await createImageBitmap(f);const s=Math.min(bmp.width,bmp.height),o=Math.min(512,s),c=document.createElement("canvas");c.width=c.height=o;
  c.getContext("2d").drawImage(bmp,(bmp.width-s)/2,(bmp.height-s)/2,s,s,0,0,o,o);return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("Cannot read this photo")),"image/jpeg",.84))}
async function grCreate(){if(GR.busy)return;const name=(S.drafts.gr_name||"").trim(),bio=(S.drafts.gr_bio||"").trim();
  if(!name){toast("Give the group a name.","x");document.getElementById("gr_name")?.focus();return}
  if(!GR.pick.size){toast("Choose at least one member.","x");return}
  if(!navigator.onLine){toast("You are offline: connect to the internet to create a group.","x");return}
  GR.busy=true;render();
  try{let photo="g:"+GR.np.g+":"+GR.np.e;if(GR.np.blob){if(!window.__avatarUpload)throw new Error("Photos are not available here.");photo=await window.__avatarUpload(GR.np.blob)}
    const{data,error}=await grSB().rpc("create_group",{p_name:name,p_bio:bio,p_photo:photo,p_members:[...GR.pick]});if(error)throw grErr(error,"Could not create the group");
    if(GR.np.url)URL.revokeObjectURL(GR.np.url);GR.np=null;GR.pick=new Set();delete S.drafts.gr_name;delete S.drafts.gr_bio;delete S.drafts.gr_q;GR.busy=false;
    toast("Group created!","check");await grLoad();if(grStaff())GR.mod=null;grOpen(data)}
  catch(e){GR.busy=false;render();toast(e.message||"Could not create the group","x")}}

/* ---------------- Group chat view ---------------- */
function grOpen(id){if(!id)return;S.view={type:"group",id};GR.sheet=null;S.animate=true;if(S.mode==="student")PR.with=null;
  if(!GR.msgs[id]||!GR.msgs[id].length||navigator.onLine)grLoadMsgs(id);grLoadMem(id);grLoadInfo(id);GR.msgAt=Date.now();grMarkRead(id);scrollTo(0,0);render()}
function grBack(){GR.sheet=null;S.animate=true;if(grStaff()){S.view=null;S.tab="msgs";S.msgsTab="peers"}else{S.view={type:"peers"};PR.with=null}scrollTo(0,0);render()}
function grChatView(){const id=S.view.id,g=grG(id),mem=grMember(id),M=GR.mem[id]||[],L=GR.msgs[id];
  if(!g&&!GR.loaded)return`<div class="empty">Loading…</div>`;
  const nm=g?g.name:(GR.names[id]||"Group"),cnt=M.length||(g&&g.members)||0,names=M.filter(m=>m.uid!==S.uid).slice(0,4).map(m=>grFirst(dispName(m.uid,(m.who||{}).name))).join(", ");
  const c=v4Ctx("group",id);
  return`<div class="section grchat" style="max-width:780px;margin-inline:auto">
  <div class="grhead glass"><button type="button" class="iconbtn" data-v4="grBack" aria-label="Back">${ic("left")}</button>
    <button type="button" class="grhead-id" data-v4="grInfo" data-id="${esc(id)}" aria-label="Group info">${grAva(g||{id,name:nm},44)}<span><b>${esc(nm)}${grMuted(id)?` ${ic("bellOff")}`:""}</b><small>${cnt?`${cnt} member${cnt>1?"s":""}`:"Group"}${names?` · ${esc(names)}${M.length>5?"…":""}`:""}</small></span></button>
    <button type="button" class="iconbtn" data-v4="grMore" data-id="${esc(id)}" aria-label="Options" title="Options">⋯</button></div>
  ${!mem?`<div class="grro">${grStaff()?`${ic("shield")}<span><b>Moderation</b> · You can read this group. Tap a message to remove it.</span>`:`${ic("lock")}<span>You are no longer a member of this group.</span>`}</div>`:""}
  <div class="glass chat grbox"><div class="msgs" id="chatScroll">${L&&L.length?grMsgList(id,L,c):!L&&navigator.onLine?`<div class="muted" style="margin:auto">Loading…</div>`:`<div class="grhello">${grAva(g||{id,name:nm},72)}<b>${esc(nm)}</b><span class="small muted">No messages yet. Say hello to the group! You can write, or send a voice message, a photo, a file or a sticker.</span></div>`}</div>
  ${mem?v4Bar("group",id,"Message…"):""}</div>
  ${mem&&S.mode==="student"?`<p class="hint">Be kind and write in English. Your teachers can read group chats.</p>`:""}</div>`}

/* ---------------- Group info ---------------- */
function grInfoView(){const id=S.view.id,g=grG(id),mem=grMember(id),adm=grAdmin(id),M=GR.mem[id];if(!M)grLoadMem(id);if(!g)grLoadInfo(id);
  if(!g)return`<div class="section">${backBtn()}<div class="empty">${GR.loaded?"This group is not available.":"Loading…"}</div></div>`;
  const cid="group:"+id,ed=GR.edit===id,cre=(M||[]).find(m=>m.uid===g.created_by);
  if(staffArchNeeded(id))grArchLoad(id);
  return`<div class="section grpage grinfo" style="max-width:640px;margin-inline:auto"><div><button class="back" data-v4="grOpenB" data-id="${esc(id)}">${ic("left")}Chat</button></div>
  <div class="glass grinfo-hero">
    <div class="grinfo-ph">${adm?`<label class="grphpick" title="Change the group photo">${grAva(g,128,"big")}<input type="file" id="gr_ph_file" accept="image/*" hidden><span class="grcam">${ic("camera")}</span></label>`:grAva(g,128,"big")}</div>
    ${ed?`<form class="grform" data-ff="grEdit" data-id="${esc(id)}"><label class="grfield">Group name<input id="gr_ename" maxlength="60" value="${esc(g.name)}" required autocomplete="off"></label>
      <label class="grfield">Description<textarea id="gr_ebio" maxlength="200" rows="3">${esc(g.bio||"")}</textarea></label>
      <div class="row" style="justify-content:center"><button type="button" class="btn ghost sm" data-v4="grEditX">Cancel</button><button class="btn sm" type="submit" ${GR.busy?"disabled":""}>${ic("check")}Save</button></div></form>`
    :`<h2>${esc(g.name)}${adm?` <button type="button" class="iconbtn sm" data-v4="grEdit" data-id="${esc(id)}" aria-label="Edit name and description" title="Edit">${ic("edit")}</button>`:""}</h2>
      <p class="grbio">${g.bio?E(g.bio):adm?`<button type="button" class="grlink" data-v4="grEdit" data-id="${esc(id)}">Add a group description</button>`:`<span class="muted">No description</span>`}</p>
      <small class="muted">Group · ${(M||[]).length||g.members||0} members${g.created_at?` · created ${cre?`by ${esc(grName(id,cre.uid,cre.who))} `:""}${esc(new Date(g.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}))}`:""}</small>`}
    ${mem?`<div class="gracts">
      <button type="button" data-v4="grConv" data-k="mute" data-id="${esc(id)}" aria-pressed="${convHas(cid,"mute")}">${ic(convHas(cid,"mute")?"bellOff":"bell2")}<span>${convHas(cid,"mute")?"Muted":"Mute"}</span></button>
      <button type="button" data-v4="grConv" data-k="pin" data-id="${esc(id)}" aria-pressed="${convHas(cid,"pin")}">${ic("pin")}<span>${convHas(cid,"pin")?"Pinned":"Pin"}</span></button>
      <button type="button" data-v4="grConv" data-k="arch" data-id="${esc(id)}" aria-pressed="${convHas(cid,"arch")}">${ic("archive")}<span>${convHas(cid,"arch")?"Archived":"Archive"}</span></button></div>`:""}
  </div>
  <div class="glass grcard"><div class="row between"><b>${(M||[]).length||""} members</b>${adm?`<button type="button" class="btn sm" data-v4="grAdd" data-id="${esc(id)}">${ic("userplus")}Add</button>`:""}</div>
    ${!M?`<div class="grskel"><i></i><i></i></div>`:`<div class="grmems">${M.map(m=>{const me=m.uid===S.uid,nm=grName(id,m.uid,m.who);
      return`<button type="button" class="grmem" ${me?"disabled":`data-v4="grMem" data-id="${esc(id)}" data-u="${esc(m.uid)}"`}>${whoAva(m.who,m.uid,42)}<span class="grpick-t"><b>${esc(me?"You":nm)}</b><small>${esc(m.who&&m.who.role==="teacher"?"Teacher":(m.who&&m.who.classe?CL(m.who.classe):""))}</small></span>${m.role==="admin"?`<span class="grchip">Admin</span>`:""}</button>`}).join("")}</div>`}</div>
  ${grStaff()?grArchHTML(id):""}
  <div class="glass grcard grdanger">
    ${S.mode==="student"?`<button type="button" data-v4="grReport" data-id="${esc(id)}">${ic("flag")}Report group</button>`:""}
    ${mem?`<button type="button" class="danger" data-v4="grLeave" data-id="${esc(id)}">${ic("logout")}Leave group</button>`:""}</div></div>`}
/* teachers: deleted messages and view once photos of this group */
const staffArchNeeded=id=>grStaff()&&GR.arch[id]===undefined;
async function grArchLoad(id){GR.arch[id]=null;try{const{data}=await grSB().from("group_archive").select("*").eq("group_id",id).order("created_at",{ascending:false}).limit(100);GR.arch[id]=data||[]}catch(e){GR.arch[id]=[]}render()}
function grArchHTML(id){const L=GR.arch[id]||[];if(!L.length)return"";
  return`<div class="glass grcard"><b>${ic("shield")} Safety copy</b><p class="small muted" style="margin:0">Deleted messages and view once photos stay here for teachers.</p><div class="grmems">${L.map(x=>`<div class="grarchit">${whoAva(x.who,x.sender,32)}<div><b>${esc((x.who||{}).name||"Member")}</b> <span class="grchip ${/once/.test(x.kind)?"":"bad"}">${/once/.test(x.kind)?"View once":"Deleted"}</span><div class="small">${msgBodyHTML(x.body||"",x.att&&x.att.p?{...x.att,o:undefined}:null)}</div><small class="muted">${esc(fmtTime(+new Date(x.sent_at||x.created_at)))}</small></div></div>`).join("")}</div></div>`}
async function grAct(fn,args,ok){if(!navigator.onLine){toast("You are offline: try again when you are connected.","x");return false}
  const{data,error}=await grSB().rpc(fn,args);if(error){toast(grErr(error).message,"x");return false}if(ok)toast(ok,"check");return data===null?true:data}

/* ---------------- teachers: groups in Messages → Between students ---------------- */
async function grModLoad(){if(GR.modLoading)return;GR.modLoading=true;try{const{data,error}=await grSB().from("chat_groups").select("*").order("updated_at",{ascending:false}).limit(300);if(error)throw grErr(error);GR.mod=data||[];GR.modErr=""}
  catch(e){GR.mod=GR.mod||[];GR.modErr=e.message}GR.modLoading=false;render()}
function grModHTML(){if(!grOn())return"";if(!GR.started)grStart();if(GR.mod===null&&!GR.modLoading)grModLoad();const L=GR.mod||[];
  return`<div class="section"><div class="grsec grsec-mod"><div class="grsec-h"><div class="grsec-ti"><span class="grsec-ico">${ic("users")}</span><div><span class="eyebrow">Moderation</span><b>Group chats</b></div></div><button type="button" class="grnewbtn" data-v4="grNew">${ic("plus")}<span>New group</span></button></div>
  <p class="sub small" style="margin:0">You can read every group of your students. Open a group to see its messages, members and deleted messages.</p>
  ${GR.modErr?`<p class="hint">${esc(GR.modErr)}</p>`:""}
  ${GR.mod===null?`<div class="grskel"><i></i><i></i></div>`:L.length?`<div class="grlist">${L.slice(0,60).map(g=>{const my=GR.list.find(x=>x.id===g.id);return my?grRowHTML(my):`<div class="grrow" data-v4="grOpen" data-id="${esc(g.id)}" tabindex="0" role="button">${grAva(g,48)}<div class="grrow-t"><div class="grrow-1"><b>${esc(g.name)}</b><small>${esc(grWhen(+new Date(g.updated_at)))}</small></div><div class="grrow-2"><span>${esc(g.bio||"Group chat")}</span></div></div></div>`}).join("")}</div>`:`<p class="small muted">No group chats yet.</p>`}</div></div>`}
{const _pm=peerModView;peerModView=function(){const h=_pm();return grStaff()?grModHTML()+h:h}}

/* ---------------- routes ---------------- */
function grRoute(){const t=S.view&&S.view.type;if(!t||!grOn())return null;
  if(t==="group")return grChatView();if(t==="grinfo")return grInfoView();if(t==="grnew")return grNewView();if(t==="gradd")return grAddView();return null}
{const _sv=studentView;studentView=function(){const h=S.mode==="student"&&S.me&&!isParent(S.me)?grRoute():null;return h!=null?h:_sv()}}
{const _tv=teacherView;teacherView=function(){const h=grStaff()?grRoute():null;return h!=null?h:_tv()}}

/* ---------------- notifications ---------------- */
const grNameOf=ref=>{const id=String(ref||"").slice(6);const g=grG(id);return(g&&g.name)||GR.names[id]||"a group"};
{const _t=nTitle,_b=nBody;nTitle=n=>n.kind==="group"?`${nName(n)} in ${grNameOf(n.ref)}`:n.kind==="group_add"?`${nName(n)} added you to a group`:_t(n);
  nBody=n=>n.kind==="group"?(n.body||"New message"):n.kind==="group_add"?`“${n.body||grNameOf(n.ref)}” · tap to open`:_b(n)}
{const _v=nViewing;nViewing=function(n){const r=n.ref||"";if(r.startsWith("group:"))return S.view?.type==="group"&&S.view.id===r.slice(6)&&!document.hidden;return _v(n)}}
{const _na=nArrive;nArrive=function(n){const r=String(n.ref||"");if(r.startsWith("group:")){const id=r.slice(6);if(!grG(id)||n.kind==="group_add")grLoad();if(n.kind==="group"&&grMuted(id))return}return _na(n)}}
{const _ns=nSound;nSound=function(k,soft){return _ns(k==="group"||k==="group_add"?"msg":k,soft)}}
{const _g=nGo;nGo=function(id){const n=N.list.find(x=>String(x.id)===String(id));const r=n?String(n.ref||""):"";
  if(r.startsWith("group:")&&grOn()){if(!n.read_at){n.read_at=new Date().toISOString();window.__notif.read([n.id]).catch(()=>{})}if(!GR.started)grStart();grOpen(r.slice(6));return}return _g(id)}}

/* ---------------- events ---------------- */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4;if(!a.startsWith("gr")&&a!=="grRepMsg")return;const id=el.dataset.id;
  if(GR.lpFired&&(a==="grOpen")){GR.lpFired=false;return}
  switch(a){
  case"grOpen":grOpen(id);return;
  case"grOpenB":GR.edit=null;grOpen(id);return;
  case"grBack":grBack();return;
  case"grNew":GR.pick=new Set();GR.np=null;delete S.drafts.gr_q;S.view={type:"grnew"};S.animate=true;scrollTo(0,0);render();setTimeout(()=>document.getElementById("gr_name")?.focus({preventScroll:true}),80);return;
  case"grNpG":if(GR.np){GR.np.g=+el.dataset.k;render()}return;
  case"grNpE":if(GR.np){GR.np.e=el.dataset.e;render()}return;
  case"grNpClear":if(GR.np){if(GR.np.url)URL.revokeObjectURL(GR.np.url);GR.np.url=null;GR.np.blob=null;render()}return;
  case"grPick":if(GR.pick.has(id))GR.pick.delete(id);else{if(GR.pick.size>=99){toast("A group can have 100 members maximum.","x");return}GR.pick.add(id)}render();return;
  case"grCreate":grCreate();return;
  case"grMore":GR.sheet={k:"row",id};grSync();return;
  case"grSheetX":GR.sheet=null;grSync();return;
  case"grConv":{const k=el.dataset.k,was=convHas("group:"+id,k);GR.sheet=null;convToggle("group:"+id,k);grSync();toast(k==="pin"?(was?"Unpinned":"Pinned to the top"):k==="arch"?(was?"Unarchived":"Archived"):(was?"Notifications on":"Muted: no sound or pop-up for this group"),k==="mute"?(was?"speaker":"mute"):"check");return}
  case"grReadNow":GR.sheet=null;grSync();grMarkRead(id);render();return;
  case"grArchTog":GR.showArch=!GR.showArch;render();return;
  case"grInfo":GR.sheet=null;grSync();GR.edit=null;GR.pick=new Set();S.view={type:"grinfo",id};S.animate=true;grLoadMem(id);scrollTo(0,0);render();return;
  case"grEdit":GR.edit=id;render();setTimeout(()=>document.getElementById("gr_ename")?.focus(),60);return;
  case"grEditX":GR.edit=null;render();return;
  case"grAdd":GR.pick=new Set();delete S.drafts.gr_q;S.view={type:"gradd",id};S.animate=true;scrollTo(0,0);render();return;
  case"grAddGo":(async()=>{if(GR.busy||!GR.pick.size)return;GR.busy=true;render();const n=await grAct("add_group_members",{p_id:id,p_uids:[...GR.pick]});GR.busy=false;
    if(n!==false){toast(n?`${n} member${n>1?"s":""} added`:"Nobody was added (they cannot join).",n?"check":"x");GR.pick=new Set();await grLoadMem(id);grLoad();S.view={type:"grinfo",id};S.animate=true}render()})();return;
  case"grMem":GR.sheet={k:"mem",id,uid:el.dataset.u};grSync();return;
  case"grAdminSet":{const u=el.dataset.u,on=el.dataset.on==="1";GR.sheet=null;grSync();grAct("set_group_admin",{p_id:id,p_uid:u,p_on:on},on?"Now a group admin":"No longer an admin").then(r=>{if(r!==false){grLoadMem(id);grLoad()}});return}
  case"grKick":{const u=el.dataset.u,m=(GR.mem[id]||[]).find(x=>x.uid===u);GR.sheet=null;grSync();if(!confirm(`Remove ${m?grName(id,u,m.who):"this person"} from the group?`))return;
    grAct("remove_group_member",{p_id:id,p_uid:u},"Removed from the group").then(r=>{if(r!==false){GR.mem[id]=(GR.mem[id]||[]).filter(x=>x.uid!==u);render();grLoadMem(id);grLoad()}});return}
  case"grDm":GR.sheet=null;grSync();S.view={type:"peer",id};PR.with=id;S.animate=true;if(typeof peerStart==="function")peerStart();if(typeof peerMarkRead==="function")peerMarkRead(id);scrollTo(0,0);render();return;
  case"grLeave":{const g=grG(id);if(!confirm(`Leave “${g?g.name:"this group"}”? You will not receive its messages any more.`))return;
    grAct("leave_group",{p_id:id},"You left the group").then(r=>{if(r===false)return;GR.list=GR.list.filter(x=>x.id!==id);delete GR.msgs[id];grSave();grBack();grLoad()});return}
  case"grReport":{const g=grG(id);sfOpen({kind:"group",ref:id,name:g?g.name:"Group",excerpt:g?(g.name+(g.bio?" · "+g.bio:"")).slice(0,200):""});return}
  case"grRepMsg":{const x=v4ActMsg();V4.act=null;render();if(!x)return;sfOpen({kind:"gmsg",ref:x.raw.id,target:x.raw.sender,name:grName(x.c.gid,x.raw.sender,x.raw.who),excerpt:(v4Plain(x.raw.body)||attLabel(x.raw.att)||"").slice(0,200)});return}
  }},true);
/* long press on a group row → options */
document.addEventListener("pointerdown",e=>{const r=e.target.closest&&e.target.closest(".grrow[data-id]");if(!r||e.target.closest(".grmore")||e.button>0)return;GR.lpFired=false;clearTimeout(GR.lp);
  const x0=e.clientX,y0=e.clientY;GR.lp=setTimeout(()=>{GR.lpFired=true;GR.sheet={k:"row",id:r.dataset.id};grSync();try{navigator.vibrate&&navigator.vibrate(25)}catch(er){}},520);
  const up=ev=>{if(ev.type==="pointermove"&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<10)return;clearTimeout(GR.lp);removeEventListener("pointerup",up);removeEventListener("pointercancel",up);removeEventListener("pointermove",up)};
  addEventListener("pointerup",up);addEventListener("pointercancel",up);addEventListener("pointermove",up)});
document.addEventListener("contextmenu",e=>{const r=e.target.closest&&e.target.closest(".grrow[data-id]");if(!r)return;e.preventDefault();clearTimeout(GR.lp);GR.sheet={k:"row",id:r.dataset.id};grSync()});
document.addEventListener("input",e=>{const el=e.target;if(el&&el.id==="gr_q"){S.drafts.gr_q=el.value;render()}else if(el&&el.id==="gr_name"&&S.view?.type==="grnew"&&!GR.np?.url){clearTimeout(grNewView._t);grNewView._t=setTimeout(render,250)}});
document.addEventListener("change",e=>{const el=e.target;if(!el||(el.id!=="gr_np_file"&&el.id!=="gr_ph_file"))return;e.stopPropagation();const f=el.files&&el.files[0];el.value="";if(!f)return;
  if(!/^image\//.test(f.type)){toast("Choose a photo.","x");return}
  (async()=>{try{const b=await grSquare(f);
    if(el.id==="gr_np_file"){if(!GR.np)return;if(GR.np.url)URL.revokeObjectURL(GR.np.url);GR.np.blob=b;GR.np.url=URL.createObjectURL(b);render();return}
    const id=S.view&&S.view.id;if(!id)return;if(!navigator.onLine){toast("You are offline: try again when you are connected.","x");return}
    toast("Sending the photo…","camera");const url=await window.__avatarUpload(b);const r=await grAct("update_group",{p_id:id,p_name:null,p_bio:null,p_photo:url},"Group photo changed");
    if(r!==false){const g=GR.list.find(x=>x.id===id);if(g)g.photo=url;grSave();render()}}catch(er){toast(er.message||"Could not change the photo","x")}})()},true);
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset)return;
  if(f.dataset.f==="groupchat"&&f.classList.contains("v4bar")){e.preventDefault();e.stopImmediatePropagation();v4TextSend("group",f);return}
  if(f.dataset.ff==="grEdit"){e.preventDefault();e.stopImmediatePropagation();const id=f.dataset.id,name=(document.getElementById("gr_ename")?.value||"").trim(),bio=(document.getElementById("gr_ebio")?.value||"").trim();
    if(!name){toast("Give the group a name.","x");return}GR.busy=true;render();
    grAct("update_group",{p_id:id,p_name:name,p_bio:bio,p_photo:null},"Saved").then(r=>{GR.busy=false;if(r!==false){GR.edit=null;const g=GR.list.find(x=>x.id===id);if(g){g.name=name;g.bio=bio}GR.names[id]=name;grSave();grLoad()}render()})}},true);

/* ---------------- look: glass, gradients, glowing 3D group avatars ---------------- */
{const st=document.createElement("style");st.textContent=`
.grava{--s:48px;position:relative;flex:none;width:var(--s);height:var(--s);border-radius:calc(var(--s)*.34);padding:2px;background:conic-gradient(from 200deg,var(--g1),var(--g2),#fff8,var(--g1));box-shadow:0 calc(var(--s)*.1) calc(var(--s)*.32) -6px color-mix(in srgb,var(--g2) 70%,transparent),0 0 0 1px rgba(255,255,255,.08) inset;display:inline-grid;transform:translateZ(0)}
.grava-in{display:grid;place-items:center;width:100%;height:100%;border-radius:calc(var(--s)*.31);overflow:hidden;background:radial-gradient(120% 90% at 25% 15%,rgba(255,255,255,.55),transparent 45%),linear-gradient(140deg,var(--g1),var(--g2));color:#fff;box-shadow:inset 0 -6px 14px rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.35)}
.grava-in img:not(.e3d){width:100%;height:100%;object-fit:cover;display:block}
.grava-in .e3d{width:calc(var(--s)*.58);height:calc(var(--s)*.58);filter:drop-shadow(0 3px 4px rgba(0,0,0,.28))}
.grava-in b{font-size:calc(var(--s)*.36);font-weight:800;letter-spacing:.02em;text-shadow:0 2px 6px rgba(0,0,0,.25)}
.grava.big{animation:grfloat 5s ease-in-out infinite}.grava.big::after{content:"";position:absolute;inset:-14px;border-radius:inherit;background:radial-gradient(closest-side,color-mix(in srgb,var(--g1) 45%,transparent),transparent);z-index:-1;filter:blur(8px)}
@keyframes grfloat{50%{transform:translateY(-4px) rotate(-1.5deg)}}
@media (prefers-reduced-motion:reduce){.grava.big{animation:none}}
.grsec{display:grid;gap:10px;margin:14px 0 6px;padding:14px;border-radius:24px;background:linear-gradient(160deg,color-mix(in srgb,#6C80FF 14%,var(--surface)),color-mix(in srgb,#9A7CFF 8%,var(--surface)) 60%,var(--surface));border:1px solid color-mix(in srgb,#8B7CFF 30%,var(--line));box-shadow:0 18px 40px -22px rgba(76,70,180,.55),inset 0 1px 0 rgba(255,255,255,.18)}
.grsec-h{display:flex;align-items:center;justify-content:space-between;gap:10px}.grsec-ti{display:flex;align-items:center;gap:10px;min-width:0}.grsec-ti b{display:block;font-size:1.05rem}
.grsec-ico{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;background:linear-gradient(135deg,#6C80FF,#9A7CFF);color:#fff;box-shadow:0 8px 18px -6px #7B6CFF;flex:none}.grsec-ico svg{width:20px;height:20px}
.grnewbtn{display:inline-flex;align-items:center;gap:6px;border:0;cursor:pointer;font:inherit;font-weight:800;font-size:.86rem;color:#fff;padding:9px 14px;border-radius:999px;background:linear-gradient(135deg,#6C80FF,#9A7CFF);box-shadow:0 10px 22px -8px #7B6CFF,inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s,box-shadow .2s;white-space:nowrap}
.grnewbtn:hover{transform:translateY(-2px);box-shadow:0 14px 26px -8px #7B6CFF}.grnewbtn svg{width:18px;height:18px}
.grlist{display:grid;gap:6px}
.grrow{display:flex;align-items:center;gap:12px;padding:9px 6px 9px 10px;border-radius:18px;cursor:pointer;background:color-mix(in srgb,var(--surface) 78%,transparent);border:1px solid var(--line);transition:transform .15s,box-shadow .2s,background .2s;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.grrow:hover{transform:translateY(-1px);box-shadow:0 10px 24px -14px rgba(60,50,160,.6)}.grrow:focus-visible{outline:2px solid #8B7CFF;outline-offset:2px}
.grrow-t{flex:1;min-width:0;display:grid;gap:2px}.grrow-1,.grrow-2{display:flex;align-items:center;gap:8px;min-width:0}
.grrow-1 b{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.98rem}.grrow-1 small{color:var(--muted);font-size:.72rem;flex:none}
.grrow.un .grrow-1 small{color:#25D366;font-weight:800}
.grrow-2>span:first-child{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:.86rem}.grrow-2 .e3d{width:16px;height:16px;vertical-align:-3px}
.grwho{font-weight:700;color:var(--fg);opacity:.8}
.grrow-ic{display:flex;align-items:center;gap:4px;color:var(--muted);flex:none}.grrow-ic svg{width:15px;height:15px}
.grbadge{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:linear-gradient(135deg,#25D366,#1EBE5A);color:#fff;font-size:.7rem;font-weight:800;display:grid;place-items:center;box-shadow:0 0 12px rgba(37,211,102,.55)}.grbadge.mu{background:var(--muted);box-shadow:none}
.grmore{flex:none;font-size:1.2rem;line-height:1;opacity:.75}
.grarch{display:flex;align-items:center;gap:10px;border:1px dashed var(--line);background:none;color:var(--muted);font:inherit;font-weight:700;padding:10px 14px;border-radius:16px;cursor:pointer}.grarch b{margin-left:auto;font-size:.8rem}.grarch svg{width:18px;height:18px}
.grsec-h2{margin:14px 2px 6px}
.grempty{display:flex;align-items:center;gap:14px;padding:6px 2px}.grempty p{margin:2px 0 0}.grempty-orbs{display:flex;flex:none}.grempty-orbs .grava:nth-child(2){margin:16px -8px 0 -8px;z-index:1}
.grskel{display:grid;gap:8px}.grskel i{height:62px;border-radius:18px;background:linear-gradient(90deg,var(--surface2),var(--surface),var(--surface2));background-size:200% 100%;animation:grsh 1.2s linear infinite}@keyframes grsh{to{background-position:-200% 0}}
.grsheet-h{display:flex;align-items:center;gap:12px;padding:4px 6px 10px;border-bottom:1px solid var(--line);margin-bottom:4px}.grsheet-h b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grsheet-who{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--muted);padding:0 6px 6px}
.grchip{display:inline-flex;align-items:center;font-size:.68rem;font-weight:800;letter-spacing:.03em;padding:3px 9px;border-radius:999px;color:#fff;background:linear-gradient(135deg,#25D366,#12A150);white-space:nowrap;flex:none}.grchip.bad{background:#E5484D}
/* new group */
.grpage{display:grid;gap:14px}
.grhero{display:grid;gap:12px;padding:18px;border-radius:24px;background:linear-gradient(160deg,color-mix(in srgb,#6C80FF 12%,var(--surface)),var(--surface));position:relative;overflow:hidden}
.grhero::before{content:"";position:absolute;width:260px;height:260px;right:-90px;top:-120px;border-radius:50%;background:radial-gradient(closest-side,rgba(154,124,255,.35),transparent);pointer-events:none}
.grhero-ph{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.grphpick{position:relative;cursor:pointer;display:inline-block;border-radius:40px}.grcam{position:absolute;right:-4px;bottom:-4px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--surface);color:var(--fg);border:1px solid var(--line);box-shadow:var(--shadow)}.grcam svg{width:18px;height:18px}
.grstyle{display:grid;gap:8px;flex:1;min-width:200px}
.grswatch{display:flex;flex-wrap:wrap;gap:6px}.grswatch button{width:26px;height:26px;border-radius:9px;border:2px solid transparent;cursor:pointer;background:linear-gradient(135deg,var(--g1),var(--g2));box-shadow:0 4px 10px -4px var(--g2)}.grswatch button.on{border-color:var(--fg);transform:scale(1.12)}
.gremo{display:flex;flex-wrap:wrap;gap:4px}.gremo button{width:34px;height:34px;border-radius:11px;border:1px solid transparent;background:var(--surface2);cursor:pointer;display:grid;place-items:center;padding:0}.gremo button.on{border-color:#8B7CFF;background:color-mix(in srgb,#8B7CFF 22%,var(--surface));box-shadow:0 0 0 3px color-mix(in srgb,#8B7CFF 25%,transparent)}.gremo .e3d{width:22px;height:22px}
.grfield{display:grid;gap:6px;font-weight:700;font-size:.85rem}.grfield input,.grfield textarea{width:100%;font-weight:500}
.grcard{display:grid;gap:12px;padding:16px;border-radius:22px}
.grpicker{display:grid;gap:10px}
.grsel{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 6px;scrollbar-width:thin}
.grselc{position:relative;display:grid;justify-items:center;gap:3px;border:0;background:none;color:inherit;font:inherit;font-size:.72rem;cursor:pointer;flex:none;width:56px;animation:grpop .18s ease-out}.grselc span{max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grselc i{position:absolute;top:-2px;right:2px;width:18px;height:18px;border-radius:50%;background:var(--muted);color:var(--bg);display:grid;place-items:center}.grselc i svg{width:11px;height:11px}
@keyframes grpop{from{transform:scale(.6);opacity:0}}
.grplist{display:grid;gap:4px;max-height:min(52vh,460px);overflow:auto;padding-right:2px}
.grpick,.grmem{display:flex;align-items:center;gap:12px;border:1px solid transparent;background:none;color:inherit;font:inherit;text-align:left;padding:7px 8px;border-radius:14px;cursor:pointer;width:100%}
.grpick:hover,.grmem:not([disabled]):hover{background:var(--surface2)}.grpick.on{background:color-mix(in srgb,#25D366 12%,transparent);border-color:color-mix(in srgb,#25D366 40%,transparent)}
.grmem[disabled]{cursor:default;opacity:1;color:inherit}
.grpick-t{flex:1;min-width:0;display:grid}.grpick-t b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.grpick-t small{color:var(--muted);font-size:.76rem}
.grcheck{font-style:normal;width:24px;height:24px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;flex:none;transition:all .15s}.grpick.on .grcheck{background:linear-gradient(135deg,#25D366,#12A150);border-color:transparent;color:#fff;box-shadow:0 0 12px rgba(37,211,102,.5)}.grcheck svg{width:14px;height:14px}
.grfoot{position:sticky;bottom:calc(76px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center;z-index:5;pointer-events:none}
.grgo{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;font:inherit;font-weight:800;font-size:1rem;color:#fff;padding:14px 26px;border-radius:999px;background:linear-gradient(135deg,#25D366,#12A150);box-shadow:0 14px 30px -10px rgba(18,161,80,.8),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s}
.grgo:hover:not([disabled]){transform:translateY(-2px)}.grgo[disabled]{opacity:.55;cursor:default}.grgo .v4spin{width:16px;height:16px;border-color:#fff8;border-top-color:#fff}
/* chat */
.grchat{display:grid;gap:10px}
.grhead{display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:20px;position:relative;overflow:hidden}
.grhead::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,#6C80FF,#9A7CFF,transparent);opacity:.7}
.grhead-id{flex:1;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:2px;border-radius:14px}
.grhead-id>span:last-child{min-width:0;display:grid}.grhead-id b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:1.02rem;display:flex;align-items:center;gap:4px}.grhead-id b svg{width:15px;height:15px;opacity:.6;flex:none}
.grhead-id small{color:var(--muted);font-size:.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grro{display:flex;align-items:center;gap:8px;font-size:.84rem;padding:9px 12px;border-radius:14px;background:color-mix(in srgb,#F59E0B 14%,var(--surface));border:1px solid color-mix(in srgb,#F59E0B 35%,var(--line))}.grro svg{width:18px;height:18px;flex:none}
.grbox .msgs{background:radial-gradient(120% 60% at 0% 0%,color-mix(in srgb,#6C80FF 9%,transparent),transparent 60%),radial-gradient(100% 50% at 100% 100%,color-mix(in srgb,#25D366 7%,transparent),transparent 60%),var(--surface2)}
.grm{display:flex;align-items:flex-end;gap:6px;align-self:flex-start;max-width:86%;min-width:0}.grm>.msg{max-width:calc(100% - 36px);align-self:auto}
.grm-av,.grm-sp{width:30px;flex:none}.grm-av{align-self:flex-start;margin-top:2px}.grm-av .av{box-shadow:0 0 0 2px color-mix(in srgb,var(--gc) 55%,transparent)}
.grm.first>.msg{border-top-left-radius:6px}
.grm>.msg{border-left:3px solid color-mix(in srgb,var(--gc) 55%,transparent)}
.grname{display:block;font-size:.78rem;font-weight:800;margin-bottom:2px;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msg.stk .grname{background:var(--surface);border-radius:8px;padding:1px 7px;width:fit-content}
.grsys{display:flex;justify-content:center;margin:2px 0}.grsys span{font-size:.74rem;font-weight:600;text-align:center;padding:5px 12px;border-radius:12px;max-width:88%;background:color-mix(in srgb,#8B7CFF 13%,var(--surface));color:var(--muted);border:1px solid color-mix(in srgb,#8B7CFF 25%,var(--line));box-shadow:0 0 18px -8px #8B7CFF}.grsys .e3d{width:15px;height:15px;vertical-align:-3px}
.v4tick.grpend svg{width:12px;height:12px;vertical-align:-2px}
.grhello{margin:auto;display:grid;justify-items:center;gap:8px;text-align:center;max-width:300px}
/* info */
.grinfo-hero{display:grid;justify-items:center;gap:8px;text-align:center;padding:24px 18px 18px;border-radius:26px;background:linear-gradient(170deg,color-mix(in srgb,#6C80FF 16%,var(--surface)),var(--surface) 70%);position:relative;overflow:hidden}
.grinfo-hero::before{content:"";position:absolute;inset:-40% -20% auto;height:70%;background:radial-gradient(closest-side,rgba(154,124,255,.32),transparent);pointer-events:none}
.grinfo-ph{margin-bottom:6px;position:relative}
.grinfo-hero h2{margin:0;display:flex;align-items:center;gap:6px;justify-content:center;flex-wrap:wrap;word-break:break-word}
.grbio{margin:0;max-width:460px;white-space:pre-wrap}.grbio .e3d{width:18px;height:18px;vertical-align:-3px}
.grlink{border:0;background:none;color:#7B6CFF;font:inherit;font-weight:700;cursor:pointer;padding:0}
.grform{display:grid;gap:10px;width:100%;max-width:420px;text-align:left}
.gracts{display:flex;gap:10px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.gracts button{display:grid;justify-items:center;gap:4px;min-width:84px;padding:10px 12px;border-radius:18px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--fg);font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px -12px rgba(60,50,160,.6);transition:transform .15s}
.gracts button:hover{transform:translateY(-2px)}.gracts button svg{width:22px;height:22px;color:#7B6CFF}.gracts button[aria-pressed=true]{background:linear-gradient(135deg,#6C80FF,#9A7CFF);color:#fff;border-color:transparent}.gracts button[aria-pressed=true] svg{color:#fff}
.grmems{display:grid;gap:2px}
.grarchit{display:flex;gap:10px;align-items:flex-start;padding:8px 4px;border-top:1px solid var(--line)}
.grdanger{gap:2px;padding:8px}.grdanger button{display:flex;align-items:center;gap:12px;border:0;background:none;color:inherit;font:inherit;font-weight:700;padding:12px;border-radius:12px;cursor:pointer;text-align:left}.grdanger button:hover{background:var(--surface2)}.grdanger button.danger{color:#E5484D}.grdanger svg{width:20px;height:20px}
@media (max-width:430px){.grsec{padding:12px;margin-inline:-4px}.grnewbtn span{display:none}.grnewbtn{padding:10px}.grrow{gap:10px}.grm{max-width:92%}.gracts button{min-width:76px}}
@media (max-width:900px){body.v4chat .grchat>.grhead{position:relative;z-index:26}}
`;document.head.appendChild(st)}
