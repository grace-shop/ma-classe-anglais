/* =====================================================================
   v5 · Amis entre élèves, comme Facebook ou Snapchat.
   1. On ajoute un camarade → il reçoit une demande.
   2. Il accepte ou refuse.
   3. Une fois accepté, ils sont amis et peuvent discuter.
   Sans amitié, on ne peut pas écrire (la base le vérifie aussi).
   ===================================================================== */
const FR={list:[],loaded:false,busy:{},err:""};

function frState(uid){
  const r=FR.list.find(x=>x.uid===uid);
  if(!r) return "none";
  if(r.status==="accepted") return "friends";
  return r.incoming?"in":"out";
}

const frIsFriend=uid=>frState(uid)==="friends";

async function frRefresh(){
  if(!window.__peer||!window.__peer.friendList) return;
  try{
    const next=await window.__peer.friendList();
    const same=JSON.stringify(next)===JSON.stringify(FR.list)&&FR.loaded;
    FR.list=next; FR.loaded=true; FR.err="";
    if(!same) render();
  }catch(e){ FR.err=e.message||""; FR.loaded=true; }
}

/* la liste des élèves se met à jour avec les amis */
{const _pr=peerRefresh;
  peerRefresh=async function(){await _pr();await frRefresh()}}

/* Actions (ajouter, accepter, refuser, annuler, retirer) */
document.addEventListener("click",async e=>{
  const el=e.target.closest&&e.target.closest("[data-fr]");
  if(!el) return;
  e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
  const a=el.dataset.fr, id=el.dataset.id;
  if(!id||FR.busy[id]) return;
  if(a==="cancel"&&frState(id)==="friends"&&!window.confirm("Remove this friend? You will no longer be able to chat.")) return;
  FR.busy[id]=true;
  try{
    if(a==="add"){
      const r=await window.__peer.friendRequest(id);
      toast(r==="friends"?"You are now friends! You can chat now.":"Friend request sent","check");
    }else if(a==="accept"||a==="refuse"){
      const r=await window.__peer.friendRespond(id,a==="accept");
      toast(r==="friends"?"You are now friends! You can chat now.":"Request declined","check");
    }else if(a==="cancel"){
      await window.__peer.friendRemove(id);
      toast(frState(id)==="friends"?"Friend removed":"Request cancelled","check");
    }
    await frRefresh();
  }catch(er){ toast(er.message||"Could not update friends","x") }
  finally{ delete FR.busy[id]; }
},true);

/* Boutons d'une ligne de la liste */
function frRowAction(uid){
  const st=frState(uid);
  if(st==="friends") return `<span class="chip ok">Friends</span>`;
  if(st==="out") return `<span class="chip">Request sent</span>`;
  if(st==="in") return `<span class="chip warn">Answer</span>`;
  return `<button class="btn ghost sm" data-fr="add" data-id="${uid}">${ic("plus")}Add</button>`;
}

/* Décor de la liste des élèves (après le rendu de l'écran) :
   la demande reçue en haut, et un bouton « Ajouter / Amis / Demande envoyée » sur chaque ligne. */
function frDecorate(){
  if(!S.view||S.view.type!=="peers"||!PR.loaded) return;
  const root=document.querySelector("#peer_q"); if(!root) return;
  document.querySelectorAll(".fr-card,.fr-act").forEach(n=>n.remove());
  const name=id=>(PR.dir.find(x=>x.uid===id)||{}).name||"Classmate";
  const inc=FR.list.filter(x=>x.status==="pending"&&x.incoming);
  if(inc.length){
    root.insertAdjacentHTML("beforebegin",`<div class="glass card fr-card" style="border-color:var(--rose-soft)"><b class="row">${ic("users")} ${inc.length} friend request${inc.length>1?"s":""}</b><div class="list" style="padding:0">${inc.map(r=>`<div class="it">${avatar(r.uid,name(r.uid))}<div class="txt"><b>${esc(name(r.uid))}</b><span>Wants to be your friend</span></div><button class="btn sm" data-fr="accept" data-id="${r.uid}">${ic("check")}Accept</button><button class="btn ghost sm" data-fr="refuse" data-id="${r.uid}">Decline</button></div>`).join("")}</div></div>`);
  }
  document.querySelectorAll('.it[data-a="openPeer"][data-id]').forEach(row=>{
    if(row.querySelector(".fr-act")) return;
    const wrap=document.createElement("span"); wrap.className="fr-act"; wrap.innerHTML=frRowAction(row.dataset.id);
    row.appendChild(wrap);
  });
}
{const _r=render;render=function(){const o=_r.apply(this,arguments);try{frDecorate()}catch(e){}return o}}

/* Discussion : seulement avec un ami. On remplace la barre d'écriture si on n'est pas amis. */
function frBarHTML(id,st,first){
  if(st==="in") return `<div class="glass card small fr-bar" style="text-align:center"><b>${esc(first)} wants to be your friend.</b><div class="row" style="justify-content:center;gap:8px;margin-top:10px"><button class="btn sm" data-fr="accept" data-id="${id}">${ic("check")}Accept</button><button class="btn ghost sm" data-fr="refuse" data-id="${id}">Decline</button></div></div>`;
  if(st==="out") return `<div class="glass card small fr-bar" style="text-align:center">Friend request sent. You can chat once ${esc(first)} accepts.<div style="margin-top:10px"><button class="btn ghost sm" data-fr="cancel" data-id="${id}">Cancel request</button></div></div>`;
  return `<div class="glass card small fr-bar" style="text-align:center">Add ${esc(first)} as a friend to start chatting.<div style="margin-top:10px"><button class="btn sm" data-fr="add" data-id="${id}">${ic("plus")}Add friend</button></div></div>`;
}
{const _pc=peerChatView;peerChatView=function(){
  const h=_pc(); const id=S.view&&S.view.id; if(!id) return h;
  const st=frState(id); if(st==="friends") return h.replace("Stay polite and respectful.</p>",`Stay polite and respectful.</p><button class="btn ghost sm fr-bar" data-fr="cancel" data-id="${id}">Remove friend</button>`);
  const first=String(peerName(id)).split(" ")[0];
  return h.replace(/<form class="chatbar[^"]*"[\s\S]*?<\/form>/,frBarHTML(id,st,first))
}}

/* Notifications : demande reçue, demande acceptée */
{const _nt=nTitle,_nb=nBody;
  nBody=function(n){
    if(n&&n.kind==="friend_req") return `${n.body||"A classmate"} wants to be your friend`;
    if(n&&n.kind==="friend_ok") return `${n.body||"A classmate"} accepted your friend request`;
    return _nb(n)};
  nTitle=function(n){
    if(n&&(n.kind==="friend_req"||n.kind==="friend_ok")) return "Friends";
    return _nt(n)}}
