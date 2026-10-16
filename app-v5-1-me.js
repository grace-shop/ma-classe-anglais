/* =====================================================================
   v5 · me: XP earned slowly, exam papers protected, chats pin/archive/mute/nicknames
   ===================================================================== */
/* ---- XP: students earn little by little (30 % of the old amounts) ---- */
const XP_RATE=0.3;
{const _g=gain;gain=function(xp,...a){if(typeof xp==="number"&&xp>0)xp=Math.max(1,Math.round(xp*XP_RATE));return _g(xp,...a)}}

/* ---- Exam papers and lesson files: students can read them in the app, never download them ---- */
const docProt=src=>S.mode==="student"&&src&&src.k==="a";
{const _od=openDoc;openDoc=async function(src,label){const prot=docProt(src);const pr=_od(src,label);V4.docProt=prot;await pr;V4.docProt=prot;const o=document.getElementById("docv");if(!o||!prot)return;
  o.classList.add("prot");document.body.classList.add("docprot");
  if(!o.querySelector(".docv-wm")){const who=esc((S.me&&S.me.name)||"Student"),d=new Date().toLocaleDateString("en-GB"),line=`${who} · ${d} · English Classes · `;
    o.insertAdjacentHTML("beforeend",`<div class="docv-wm" aria-hidden="true">${Array.from({length:40},()=>`<span>${line.repeat(3)}</span>`).join("")}</div>`)}
  const body=document.getElementById("docvBody");const fix=()=>{if(!body)return;for(const b of body.querySelectorAll('[data-v4="docSave"]')){const m=b.closest(".docv-msg");if(m)m.innerHTML=`${ic("lock")}<p>This file can only be read in the app. Ask your teacher for a PDF version.</p>`;else b.remove()}};fix();setTimeout(fix,1500);setTimeout(fix,5000)}}
{const _ds=docSave;docSave=function(){if(V4.docProt){toast("Exam papers and lesson files cannot be downloaded.","lock");return}return _ds()}}
{const _cd=closeDoc;closeDoc=function(){document.body.classList.remove("docprot");V4.docProt=false;return _cd()}}
document.addEventListener("contextmenu",e=>{if(V4.docProt&&e.target.closest&&e.target.closest("#docv"))e.preventDefault()},true);
document.addEventListener("keydown",e=>{if(V4.docProt&&(e.ctrlKey||e.metaKey)&&/^[sp]$/i.test(e.key)){e.preventDefault();toast("Exam papers cannot be saved or printed.","lock")}},true);
{const st=document.createElement("style");st.textContent=`
.docv.prot [data-v4="docSave"]{display:none!important}
.docv.prot .docv-body,.docv.prot img,.docv.prot canvas{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.docv.prot img,.docv.prot canvas{pointer-events:none}
.docv-wm{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:5;display:flex;flex-direction:column;gap:60px;transform:rotate(-24deg) scale(1.6);opacity:.11;color:#9A7CFF;font-weight:800;font-size:15px;white-space:nowrap;padding-top:40px}
.docv{position:fixed}
@media print{body.docprot *{display:none!important}body.docprot::after{content:"Printing is not allowed.";display:block!important}}
`;document.head.appendChild(st)}

/* ---- Classmates list: pin, archive, mute, nicknames (like WhatsApp) ---- */
V5.showArch=false;
peersView=function(){const me=S.uid,last={},un={};
  for(const m of PR.inbox){const o=m.sender===me?m.receiver:m.sender;if(!last[o])last[o]=m;if(m.receiver===me&&!m.read_at&&!m.deleted_at)un[m.sender]=(un[m.sender]||0)+1}
  const q=(S.drafts.peer_q||"").trim().toLowerCase(),t=m=>m?+new Date(m.created_at):0,pin=u=>((v5Prefs().conv["peer:"+u]||{}).pin)||0;
  const all=PR.dir.filter(x=>!BL.set.has(x.uid)&&frState(x.uid)==="friends").filter(x=>!q||x.name.toLowerCase().includes(q)||nickOf(x.uid).toLowerCase().includes(q)).map(x=>({...x,on:!!S.peers[x.uid],un:un[x.uid]||0,last:last[x.uid],pin:pin(x.uid),arch:convHas("peer:"+x.uid,"arch"),mute:convHas("peer:"+x.uid,"mute")}));
  const sort=(a,b)=>(!!b.pin-!!a.pin)||(b.pin-a.pin)||(b.un-a.un)||(t(b.last)-t(a.last))||(b.on-a.on)||a.name.localeCompare(b.name);
  const rows=all.filter(x=>q||!x.arch).sort(sort),arch=all.filter(x=>x.arch).sort(sort);
  const row=x=>{const nk=nickOf(x.uid),prev=x.last?((x.last.sender===me?"You: ":"")+String(x.last.deleted_at?"⊘ Message deleted":(v4Plain(x.last.body)||attLabel(x.last.att))).slice(0,60)):((x.classe?CL(x.classe)+(x.same?" · your class":""):"")||"Say hello!");
    return`<div class="it click pv-row${x.un?" pv-un":""}" data-a="openPeer" data-id="${x.uid}" tabindex="0">${avatar(x.uid,x.name)}<div class="txt"><b>${esc(nk||x.name)}${nk?` <small class="muted">${esc(x.name)}</small>`:""}${x.on?` <span class="pv-on" title="Online"></span>`:""}</b><span>${esc(prev)}</span></div>
    <div class="pv-meta"><small>${x.last?fmtTime(t(x.last)):""}</small><span class="row" style="gap:4px">${x.pin?`<i class="pv-ic" title="Pinned">📌</i>`:""}${x.mute?`<i class="pv-ic" title="Muted">🔕</i>`:""}${x.un?`<span class="pv-badge">${x.un}</span>`:""}</span></div>
    <button type="button" class="iconbtn sm pv-more" data-v4="pvMore" data-id="${x.uid}" aria-label="Options for ${esc(nk||x.name)}">⋯</button></div>`};
  return`<div class="section" style="max-width:720px;margin-inline:auto">${backBtn()}<div class="row">${ic("users")}<div><span class="eyebrow">Classmates</span><h2>Chats</h2></div></div>
  <p class="sub">Write to other learners at school: messages, voice notes, photos, videos, files and stickers. Be kind and respectful.</p>
  ${PR.err?`<div class="glass card small">${esc(PR.err)}</div>`:""}
  <input id="peer_q" type="search" placeholder="Search for a classmate…" value="${esc(S.drafts.peer_q||"")}" aria-label="Search for a classmate">
  ${!PR.loaded?`<div class="empty">Loading…</div>`:rows.length||arch.length?`${arch.length&&!q?`<button type="button" class="glass pv-arch" data-v4="pvArch">${ic("file")}<b>Archived</b><span class="chip">${arch.length}</span><span class="muted small" style="margin-left:auto">${V5.showArch?"Hide":"Show"}</span></button>${V5.showArch?`<div class="glass list pv-list">${arch.map(row).join("")}</div>`:""}`:""}
    ${rows.length>60&&!q?`<p class="hint">${rows.length} learners: the 60 most recent are shown. Search for a name to find the others.</p>`:""}<div class="glass list pv-list">${rows.slice(0,q?200:60).map(row).join("")}</div>`
   :`<div class="empty"><b>No friends yet.</b><br>Tap + to find classmates and send them a friend request. Once they accept, they appear here.</div>`}</div>`};
function pvSheetHTML(){const u=V5.pv;if(!u)return"";const nm=peerName(u),id="peer:"+u,nk=nickOf(u);
  if(V5.pvNick)return`<div class="v4sheet-bg fz" data-v4="pvX"></div><form class="v4sheet fz" data-ff="nick"><b>Nickname for ${esc(nm)}</b><p class="small muted" style="margin:0">Only you can see it.</p><input id="pv_nick" maxlength="30" value="${esc(nk)}" placeholder="e.g. My bestie 💛" autocomplete="off"><button class="btn" type="submit">Save</button>${nk?`<button type="button" data-v4="pvNickDel">${ic("trash")}Remove the nickname</button>`:""}<button type="button" class="v4cancel" data-v4="pvX">Cancel</button></form>`;
  return`<div class="v4sheet-bg fz" data-v4="pvX"></div><div class="v4sheet fz"><b>${esc(nk||nm)}</b>
  <button type="button" data-v4="pvT" data-k="pin">📌 ${convHas(id,"pin")?"Unpin":"Pin to the top"}</button>
  <button type="button" data-v4="pvT" data-k="arch">🗂️ ${convHas(id,"arch")?"Unarchive":"Archive"}</button>
  <button type="button" data-v4="pvT" data-k="mute">${convHas(id,"mute")?"🔔 Unmute":"🔕 Mute notifications"}</button>
  <button type="button" data-v4="pvNick">✏️ ${nk?"Change the nickname":"Give a nickname"}</button>
  ${typeof personView==="function"||true?`<button type="button" data-v4="pvProfile">${ic("user")}View profile</button>`:""}
  <button type="button" class="danger" data-v4="pvBlock">${ic("shield")}Report or block</button>
  <button type="button" class="v4cancel" data-v4="pvX">Cancel</button></div>`}
{const _fs2=feedSync;feedSync=function(){_fs2();let h=document.getElementById("pvhost");if(!h){h=document.createElement("div");h.id="pvhost";document.body.appendChild(h)}const x=pvSheetHTML();if(h._h!==x){h._h=x;h.innerHTML=x;const n=document.getElementById("pv_nick");if(n)n.focus()}}}
const pvOpen=u=>{V5.pv=u;V5.pvNick=false;feedSync()},pvClose=()=>{V5.pv=null;V5.pvNick=false;feedSync()};
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4,u=V5.pv;
  switch(a){
  case"pvMore":e.stopPropagation();pvOpen(el.dataset.id);return;
  case"pvArch":V5.showArch=!V5.showArch;render();return;
  case"pvX":pvClose();return;
  case"pvT":if(u){convToggle("peer:"+u,el.dataset.k);toast({pin:convHas("peer:"+u,"pin")?"Pinned":"Unpinned",arch:convHas("peer:"+u,"arch")?"Chat archived":"Chat unarchived",mute:convHas("peer:"+u,"mute")?"Notifications muted":"Notifications on"}[el.dataset.k],"check");pvClose()}return;
  case"pvNick":V5.pvNick=true;const h=document.getElementById("pvhost");if(h)h._h="";feedSync();return;
  case"pvNickDel":if(u){nickSet(u,"");pvClose()}return;
  case"pvProfile":if(u){pvClose();S.view={type:"person",id:u};S.animate=true;scrollTo(0,0);render()}return;
  case"pvBlock":if(u){const nm=peerName(u);pvClose();sfOpen({kind:"profile",ref:u,target:u,name:nm})}return;
  case"pvChatMore":pvOpen(el.dataset.id);return;
  }},true);
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset||f.dataset.ff!=="nick")return;e.preventDefault();e.stopImmediatePropagation();const u=V5.pv,v=(f.querySelector("#pv_nick")||{}).value||"";if(u){nickSet(u,v);toast(v.trim()?"Nickname saved":"Nickname removed","check")}pvClose()},true);
/* chat header: nickname + options */
{const _pc=peerChatView;peerChatView=function(){let h=_pc();const id=S.view&&S.view.id;if(!id)return h;const nk=nickOf(id),nm=peerName(id);
  if(nk)h=h.replace(`<h2>${esc(nm)}`,`<h2>${esc(nk)} <small class="muted" style="font-size:.55em">${esc(nm)}</small>`);
  return h.replace('<span class="eyebrow">Classmate</span>',`<span class="eyebrow">Classmate${convHas("peer:"+id,"mute")?" · 🔕 muted":""}</span>`).replace(/(<\/h2><\/div>)(<\/div>)/,`$1<button type="button" class="iconbtn" data-v4="pvChatMore" data-id="${id}" aria-label="Chat options" style="margin-left:auto">⋯</button>$2`)}}
/* muted chats: no toast, sound or phone notification */
const pvMutedName=n=>PR.dir.some(x=>(x.name===n||nickOf(x.uid)===n)&&convHas("peer:"+x.uid,"mute"));
{const _t=toast;toast=function(msg,...a){const m=/^Message from (.+)$/.exec(String(msg||""));if(m&&pvMutedName(m[1]))return;return _t(msg,...a)}}
{const _nn=notifyNow;notifyNow=function(title,body){const m=/^Message from (.+)$/.exec(String(title||""));if(m&&pvMutedName(m[1]))return;return _nn(title,body)}}
{const _na2=nArrive;nArrive=function(n){const r=n.ref||"";if(r.startsWith("peer:")&&convHas(r,"mute"))return;if(r.startsWith("peer:")&&convHas(r,"arch")){convToggle(r,"arch")}return _na2(n)}}
{const st=document.createElement("style");st.textContent=`
.pv-row{position:relative;gap:10px}.pv-row{display:flex;align-items:center}.pv-row .txt{display:grid!important;gap:2px;min-width:0;flex:1}.pv-row .txt b{display:block}.pv-row .txt span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:.86rem}.pv-row .txt b small{font-weight:500}
.pv-meta{display:grid;justify-items:end;gap:4px;margin-left:auto}.pv-meta small{color:var(--muted);font-size:.72rem}
.pv-badge{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#25D366;color:#fff;font-size:.72rem;font-weight:800;display:grid;place-items:center}
.pv-un .txt b{font-weight:800}.pv-un .txt span{color:var(--fg)}
.pv-on{display:inline-block;width:9px;height:9px;border-radius:50%;background:#25D366;box-shadow:0 0 0 2px var(--surface),0 0 8px #25D366;vertical-align:middle}
.pv-ic{font-style:normal;font-size:.8rem}
.pv-more{opacity:.6;flex:none}.pv-more:hover{opacity:1}
.pv-arch{display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;border-radius:16px;border:1px solid var(--line);color:inherit;font:inherit;cursor:pointer;margin-bottom:10px}
.pv-list{margin-bottom:10px}
`;document.head.appendChild(st)}
