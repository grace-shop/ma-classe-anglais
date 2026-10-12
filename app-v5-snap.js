/* =====================================================================
   v5 · snap: Snapchat-style chat home, "Near me" map (opt-in, about 1 km),
   typing indicator, class mode (teacher pauses chats and calls), teacher calls
   ===================================================================== */
const SN={near:false,filter:"",typing:{},tt:{},chans:{},own:false,loc:null,at:0,rows:[],timer:null};
const SN_TX={};
const SN_LOME=[6.1319,1.2228];   /* default map centre (Lomé, Togo) until a position is known */

/* ---- icons that are not in the base set ---- */
ICONS.search=ICONS.search||'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>';
ICONS.locate=ICONS.locate||'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>';

/* ---- styles ---- */
{const st=document.createElement("style");st.id="snapcss";st.textContent=`
.sn-home{padding-bottom:110px}
.sn-hd{display:flex;align-items:center;gap:8px;margin:-4px -4px 10px;padding:10px 10px;border-radius:22px;background:#0E1116;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.sn-hd h1{flex:1;margin:0;text-align:center;font-size:20px;font-weight:800;letter-spacing:.2px;color:#fff}
.sn-av{width:42px;height:42px;border-radius:50%;border:0;padding:0;background:none;cursor:pointer;flex:none}
.sn-av .av{width:42px!important;height:42px!important;font-size:15px!important;background:#FFD60A!important;color:#111!important;font-weight:800}
.sn-home #peer_q{width:100%;box-sizing:border-box;border-radius:999px;padding:11px 16px;margin:0 0 12px;border:1px solid var(--line2);background:var(--surface);color:var(--fg)}
.sn-home .pv-more{background:transparent!important;border:0!important;box-shadow:none!important;color:var(--muted)}
.sn-home .pv-more svg{stroke:var(--muted)}
.sn-home .pv-row>.av{width:48px!important;height:48px!important;font-size:17px!important}
.sn-ic{position:relative;width:38px;height:38px;border-radius:50%;border:0;background:transparent;color:#fff;display:grid;place-items:center;cursor:pointer;flex:none}
.sn-ic svg,.sn-add svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sn-add{position:relative;width:38px;height:38px;border-radius:50%;border:0;background:#FFD60A;color:#111;display:grid;place-items:center;cursor:pointer;flex:none}
.sn-badge{position:absolute;top:-3px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#FF3B30;color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;font-style:normal}
.sn-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}
.sn-chips::-webkit-scrollbar{display:none}
.sn-chip{flex:none;border:1px solid var(--line2);background:var(--surface);color:var(--fg);border-radius:999px;padding:7px 14px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.sn-chip b{background:#FF3B30;color:#fff;border-radius:9px;padding:0 6px;font-size:12px;line-height:18px}
.sn-chip[aria-pressed="true"]{background:#FFD60A;color:#111;border-color:#FFD60A}
.sn-chip[aria-pressed="true"] b{background:#111;color:#FFD60A}
.sn-home .av3-mine,.sn-home>p.sub{display:none!important}
.sn-home .pv-list .pv-row{align-items:center}
.sn-home .pv-row.pv-un>:first-child{box-shadow:0 0 0 2px var(--bg),0 0 0 4px #FF4FA3;border-radius:50%}
.sn-home .pv-row.pv-un .txt b{font-weight:800}
.sn-home .pv-row.pv-un .txt span{color:#3B9DFF;font-weight:700}
.sn-home .pv-row:not(.pv-un) .txt span{color:var(--muted)}
.sn-home .pv-row .txt span.sn-typing{color:#34D399!important;font-weight:700}
.sn-home .pv-meta small{color:var(--muted);font-weight:600}
.sn-bub{display:inline-grid;place-items:center;color:#FFD60A;margin-right:2px}
.sn-bub svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linejoin:round}
.sn-home[data-f="unread"] .pv-row:not(.pv-un){display:none}
.sn-home[data-f="groups"] .pv-list{display:none}
.sn-fab{position:fixed;right:18px;bottom:calc(88px + env(safe-area-inset-bottom,0px));width:60px;height:60px;border-radius:50%;border:0;background:#FFD60A;color:#111;display:grid;place-items:center;box-shadow:0 12px 26px rgba(0,0,0,.35);cursor:pointer;z-index:30}
.sn-fab svg{width:26px;height:26px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.sn-pause{margin:0 0 10px;padding:10px 14px;border-radius:14px;background:rgba(251,191,36,.14);border:1px solid rgba(251,191,36,.5);font-weight:700;font-size:14px}
.sn-near{margin:0 0 12px;padding:12px;border-radius:20px;background:var(--surface);border:1px solid var(--line2)}
.sn-near-h{display:flex;align-items:center;gap:10px;justify-content:space-between}
.sn-near-h>div:first-child{min-width:0;flex:1}
.sn-near-h b{display:flex;align-items:center;gap:6px;font-size:16px}
.sn-near-h b svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
.sn-near-h small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.sn-switch{flex:none;width:52px;height:30px;border-radius:999px;border:0;background:var(--line2);position:relative;cursor:pointer}
.sn-switch::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}
.sn-switch.on{background:#34D399}
.sn-switch.on::after{transform:translateX(22px)}
.sn-map{height:240px;border-radius:16px;margin:12px 0 8px;overflow:hidden;background:var(--surface2);isolation:isolate}
.sn-map .sn-empty{display:grid;place-items:center;height:100%;color:var(--muted);text-align:center;padding:12px}
.sn-near-list{display:grid;gap:6px}
.sn-row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:12px}
.sn-row .sn-dot{width:10px;height:10px;border-radius:50%;background:#FF4FA3;flex:none}
.sn-row span{flex:1;min-width:0;font-weight:700}
.sn-row small{color:var(--muted)}
.sn-note{margin:6px 2px 0;color:var(--muted);font-size:12.5px}
.sn-tp{display:block;color:#34D399;font-weight:700;font-size:12.5px;margin-top:2px}
.sn-cls-card{margin-bottom:12px}
.sn-cls-card>b svg,.sn-pause svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-4px;margin-right:6px}
.sn-cls-card>small{display:block;margin-top:2px;color:var(--muted)}
.sn-calls{display:grid;gap:6px;margin-top:10px;max-height:340px;overflow:auto}
.sn-call-row{display:flex;align-items:center;gap:10px;padding:6px;border-radius:12px;background:var(--surface2)}
.sn-call-row>span{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sn-call-row button{width:38px;height:38px;border-radius:50%;border:0;background:#34D399;color:#06241A;display:grid;place-items:center;cursor:pointer;flex:none}
.sn-call-row button+button{background:#FFD60A;color:#111}
.sn-call-row svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`;document.head.appendChild(st)}

/* ---- small helpers ---- */
const snKm=(a,b,c,d)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b),h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const snUnreadFrom=()=>{const me=S.uid,set=new Set();for(const m of (PR.inbox||[])){if(m.receiver===me&&!m.read_at&&!m.deleted_at)set.add(m.sender)}return set};
const snGroupsUnread=()=>(GR.list||[]).filter(g=>g.unread).length;
const snBellCount=()=>(PR.inbox||[]).filter(m=>m.receiver===S.uid&&!m.read_at&&!m.deleted_at).length;

/* ---- the new chat home: header, filter chips, Near me, compose button ---- */
function snHeadHTML(){const bell=snBellCount();
  return`<header class="sn-hd">
    <button type="button" class="sn-av" data-snap="avatar" aria-label="My avatar and bio">${avatar(S.uid,(S.me&&S.me.name)||"Me",42)}</button>
    <button type="button" class="sn-ic" data-snap="search" aria-label="Search for a classmate">${ic("search")}</button>
    <h1>Chat</h1>
    <button type="button" class="sn-ic" data-snap="bell" aria-label="Notifications">${ic("bell")}${bell?`<i class="sn-badge">${bell}</i>`:""}</button>
    <button type="button" class="sn-add" data-snap="search" aria-label="Find a classmate to chat with">${ic("plus")}</button>
    <button type="button" class="sn-ic" data-snap="more" aria-label="More">${ic("dots")}</button>
  </header>`}
function snChipsHTML(){const unread=snUnreadFrom().size+snGroupsUnread(),groups=(GR.list||[]).length,chip=(k,label,n)=>`<button type="button" class="sn-chip" data-snap="chip" data-k="${k}" aria-pressed="${SN.filter===k}">${label}${n?` <b>${n}</b>`:""}</button>`;
  return`<div class="sn-chips" role="group" aria-label="Filters">
    ${chip("unread","Unread",unread)}
    <button type="button" class="sn-chip" data-snap="ai">My AI</button>
    <button type="button" class="sn-chip" data-snap="near" aria-pressed="${SN.near}">Near me</button>
    ${chip("groups","Groups",groups)}
  </div>`}
function snNearList(){const me=SN.loc&&SN.loc.sharing&&SN.loc.lat!=null?SN.loc:null;
  if(!SN.rows.length)return`<p class="sn-note">No classmate is sharing their location right now.</p>`;
  return SN.rows.map(r=>{const d=me?snKm(me.lat,me.lng,r.lat,r.lng):null,ago=Math.max(1,Math.round((Date.now()-new Date(r.updated_at))/60000));
    return`<div class="sn-row"><i class="sn-dot" aria-hidden="true"></i><span>${esc(r.name)}</span><small>${d!=null?`≈ ${d<1?"under 1":d.toFixed(1)} km · `:""}${ago<60?ago+" min ago":"earlier"}</small></div>`}).join("")}
function snNearHTML(){const on=!!(SN.loc&&SN.loc.sharing);
  return`<section class="sn-near" aria-label="Near me">
    <div class="sn-near-h"><div><b>${ic("locate")}Near me</b><small>Only classmates who share too. Position rounded to about 1 km. Sharing stops by itself after 8 hours.</small></div>
    <button type="button" class="sn-switch${on?" on":""}" role="switch" aria-checked="${on}" aria-label="Share my location with classmates" data-snap="locOn" data-on="${on?0:1}"></button></div>
    <div id="snMap" class="sn-map"></div>
    <div class="sn-near-list">${snNearList()}</div>
    <p class="sn-note">${on?"You are shared with classmates on the map. Switch off at any time.":"Your location is off. Nobody can see where you are."}</p>
  </section>`}

/* ---- the chat list: wrap the existing list with the new look ---- */
{const _pv=peersView;peersView=function(){let h=_pv();if(S.mode!=="student")return h;snTypingInit();
  const pre=`<div class="section sn-home" data-f="${SN.filter}" style="max-width:720px;margin-inline:auto">`;
  h=h.replace('<div class="section" style="max-width:720px;margin-inline:auto">',pre);
  h=h.replace(/<div class="row">\s*<svg[\s\S]*?<h2>Chats<\/h2><\/div><\/div>/,snHeadHTML()+snChipsHTML()+(SN.near?snNearHTML():""));
  h=h.replace(/<p class="sub">[\s\S]*?<\/p>/,"");
  if(S.settings&&S.settings.chatPaused)h=h.replace(pre,pre+`<div class="sn-pause" role="status">${ic("pin")}Your teacher has paused chats and calls for the class.</div>`);
  h=h.replace(/<button type="button" class="iconbtn sm pv-more"/g,`<span class="sn-bub" aria-hidden="true">${ic("chat")}</span>$&`);
  return h+`<button type="button" class="sn-fab" data-snap="compose" aria-label="New chat">${ic("edit")}</button>`}}

/* ---- chat screen: show "typing…" under the name ---- */
{const _pc=peerChatView;peerChatView=function(){snTypingInit();const id=S.view&&S.view.id,h=_pc();if(!id)return h;
  const on=SN.typing[id]&&Date.now()-SN.typing[id]<3000;
  return h.replace("</h2>",`</h2><small class="sn-tp" data-tp="${esc(id)}"${on?"":" hidden"}>typing…</small>`)}}

/* ---- typing indicator: a quick broadcast to the other person's channel ---- */
function snTypingInit(){if(SN.own||!window.__sb||!S.uid)return;SN.own=true;
  try{window.__sb.channel("typ:"+S.uid).on("broadcast",{event:"typing"},({payload})=>snTypingSeen(payload&&payload.from)).subscribe()}catch(e){SN.own=false}}
function snTypingSeen(u){if(!u||u===S.uid)return;SN.typing[u]=Date.now();snTypingPaint(u);clearTimeout(SN.tt[u]);
  SN.tt[u]=setTimeout(()=>{delete SN.typing[u];snTypingPaint(u)},3000)}
function snTypingPaint(u){const on=!!SN.typing[u];
  document.querySelectorAll(`.sn-tp[data-tp="${u}"]`).forEach(el=>{el.hidden=!on});
  document.querySelectorAll(`.pv-row[data-id="${u}"] .txt span`).forEach(el=>{if(on){if(!el.dataset.orig)el.dataset.orig=el.textContent;el.textContent="typing…";el.classList.add("sn-typing")}else if(el.dataset.orig){el.textContent=el.dataset.orig;delete el.dataset.orig;el.classList.remove("sn-typing")}})}
function snTypingSend(to){if(!to||!window.__sb||!S.uid)return;const now=Date.now();if(SN_TX[to]&&now-SN_TX[to]<2500)return;SN_TX[to]=now;
  let ch=SN.chans[to];if(!ch){ch=window.__sb.channel("typ:"+to);ch.subscribe();SN.chans[to]=ch}
  ch.send({type:"broadcast",event:"typing",payload:{from:S.uid}})}
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!==V4IN("peer"))return;
  if(S.view&&S.view.type==="peer"&&S.view.id)snTypingSend(S.view.id)},true);

/* ---- Near me: load my state and the classmates who share ---- */
async function snNearLoad(){if(!window.__sb||!S.uid)return;
  try{const [mine,near]=await Promise.all([window.__sb.rpc("my_location"),window.__sb.rpc("nearby_classmates")]);
    if(mine.error||near.error)throw(mine.error||near.error);
    const m=(mine.data||[])[0];SN.loc=m&&m.sharing?{sharing:true,lat:m.lat,lng:m.lng}:{sharing:false};
    SN.rows=(near.data||[]).map(r=>({name:r.name||"Classmate",lat:r.lat,lng:r.lng,updated_at:r.updated_at}));SN.at=Date.now();
  }catch(err){console.warn("near",err);SN.rows=SN.rows||[]}
  if(SN.near)render()}
function snNearOpen(){SN.near=true;snNearLoad();clearInterval(SN.timer);
  SN.timer=setInterval(()=>{if(!SN.near){clearInterval(SN.timer);return}snNearLoad();if(SN.loc&&SN.loc.sharing&&Date.now()-(SN.sharedAt||0)>600000)snLocRefresh()},60000)}
function snNearClose(){SN.near=false;clearInterval(SN.timer)}
function snLocRefresh(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>snShare(p.coords.latitude,p.coords.longitude),()=>{},{enableHighAccuracy:false,timeout:15000,maximumAge:600000})}
async function snShare(lat,lng){if(!window.__sb)return;
  const {error}=await window.__sb.rpc("share_location",{p_lat:lat,p_lng:lng,p_on:true});
  if(error){toast("Your location could not be shared. Try again.","x");return}
  SN.loc={sharing:true,lat,lng};SN.sharedAt=Date.now();if(SN.near)render()}
function snLocToggle(on){
  if(!on){window.__sb.rpc("share_location",{p_lat:0,p_lng:0,p_on:false}).then(({error})=>{if(error)throw error;SN.loc={sharing:false};toast("Your location is off","mute");render()}).catch(()=>toast("Could not switch off sharing. Try again.","x"));return}
  if(!navigator.geolocation){toast("Location is not available on this device","x");return}
  navigator.geolocation.getCurrentPosition(p=>{snShare(p.coords.latitude,p.coords.longitude).then(()=>toast("Shared with classmates for 8 hours","check"))},
    ()=>toast("Allow location for English Classes in your phone settings.","x"),{enableHighAccuracy:false,timeout:15000,maximumAge:300000})}

/* ---- the map (Leaflet + OpenStreetMap), built after each render ---- */
function snLoadLeaflet(){return new Promise(res=>{if(window.L)return res();
  if(!document.getElementById("snLeafCss")){const l=document.createElement("link");l.id="snLeafCss";l.rel="stylesheet";l.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(l)}
  const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.onload=()=>res();s.onerror=()=>res();document.head.appendChild(s)})}
async function snNearInit(){const el=document.getElementById("snMap");if(!el||el._lf)return;
  await snLoadLeaflet();
  if(!window.L){el.innerHTML='<div class="sn-empty">The map needs an internet connection.</div>';return}
  const me=SN.loc&&SN.loc.sharing?SN.loc:null,first=SN.rows[0],c=me?[me.lat,me.lng]:first?[first.lat,first.lng]:SN_LOME;
  const map=L.map(el,{zoomControl:false,attributionControl:true}).setView(c,13);el._lf=map;
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"© OpenStreetMap"}).addTo(map);
  for(const r of SN.rows){const m=L.circleMarker([r.lat,r.lng],{radius:9,color:"#fff",weight:2,fillColor:"#FF4FA3",fillOpacity:1}).addTo(map);
    const t=document.createElement("span");t.textContent=r.name;m.bindTooltip(t)}
  if(me){const m=L.circleMarker([me.lat,me.lng],{radius:10,color:"#fff",weight:3,fillColor:"#3B9DFF",fillOpacity:1}).addTo(map);const t=document.createElement("span");t.textContent="You";m.bindTooltip(t)}
  setTimeout(()=>map.invalidateSize(),50);
  if(!me&&!first){const n=document.createElement("div");n.className="sn-empty";n.textContent="Turn on Near me to appear on the map.";el.appendChild(n)}}

/* ---- the Near me panel: each render, build the map once ---- */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-snap]");if(!el)return;
  const a=el.dataset.snap;
  switch(a){
    case"avatar":AV.draft=null;S.view={type:"avt"};S.animate=true;scrollTo(0,0);render();break;
    case"search":{const i=document.getElementById("peer_q");if(i){i.scrollIntoView({block:"center"});i.focus()}break}
    case"compose":{const i=document.getElementById("peer_q");if(i){i.scrollIntoView({block:"center"});i.focus()}else toast("Find a classmate to chat with","x");break}
    case"bell":S.view={type:"notifs"};S.animate=true;scrollTo(0,0);render();break;
    case"more":toast("Press ⋯ on a chat to pin, archive or mute it.","mute");break;
    case"chip":{const k=el.dataset.k;SN.filter=SN.filter===k?"":k;const home=document.querySelector(".sn-home");if(home)home.dataset.f=SN.filter;
      document.querySelectorAll('.sn-chip[data-k]').forEach(c=>c.setAttribute("aria-pressed",String(c.dataset.k===SN.filter)));break}
    case"ai":document.querySelector('[data-a="aiOpen"]')?.click();break;
    case"near":if(SN.near){snNearClose();render()}else{snNearOpen();render()}break;
    case"locOn":snLocToggle(el.dataset.on==="1");break;
    case"pause":{const v=el.dataset.on==="1";write(()=>S.db.doc("settings/main").set({...S.settings,chatPaused:v})).then(()=>toast(v?"Class mode on: chats and calls are paused":"Class mode off: students can chat again",v?"mute":"check"));break}
    default:return;
  }
  if(a!=="chip")e.preventDefault();
},true);
/* build the map on the next tick, after the panel is in the page */
{const _pv=peersView;peersView=function(){const h=_pv();if(SN.near&&S.mode==="student")setTimeout(snNearInit,0);return h}}

/* ---- class mode, for the teacher: pause chats and calls, and call a student ---- */
function snClassHTML(){if(S.mode!=="teacher")return"";const paused=!!(S.settings&&S.settings.chatPaused);
  const kids=(S.students||[]).slice(0,120);
  return`<div class="section sn-class" style="margin-bottom:10px">
    <div class="glass card sn-cls-card"><div class="sn-near-h"><div><b>${ic("pin")}Class mode</b><small>${paused?"Chats and calls between students are paused.":"Students can chat and call each other."}</small></div>
    ${S.isOwner?`<button type="button" class="sn-switch${paused?" on":""}" role="switch" aria-checked="${paused}" aria-label="Pause chats and calls for the class" data-snap="pause" data-on="${paused?0:1}"></button>`:""}</div></div>
    <div class="glass card sn-cls-card"><b>${ic("phone")}Call a student</b><small>Start a voice or video call with one student.</small>
      <div class="sn-calls">${kids.map(x=>`<div class="sn-call-row">${avatar(x.id,x.name)}<span>${esc(x.name||"Student")}</span>
        <button type="button" data-call="go" data-k="duo" data-id="${esc(x.id)}" data-v="0" aria-label="Voice call ${esc(x.name||"student")}">${ic("mic")}</button>
        <button type="button" data-call="go" data-k="duo" data-id="${esc(x.id)}" data-v="1" aria-label="Video call ${esc(x.name||"student")}">${ic("camera")}</button></div>`).join("")||'<p class="muted small">No students yet.</p>'}</div></div>
  </div>`}
{const _cv=classView;classView=function(){const h=_cv();const x=snClassHTML();return x?x+h:h}}
