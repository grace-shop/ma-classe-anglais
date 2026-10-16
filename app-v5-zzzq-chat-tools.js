/* =====================================================================
   v5 · Messagerie : modifier un message envoyé, glisser un message pour
   y répondre, et la mention « modifié ». Les conversations entre élèves
   (messagerie de classe) ont ces outils ; ils ne touchent pas aux autres
   conversations.
   Nécessite supabase/messagerie-edit.sql.
   ===================================================================== */

/* 1 · l'action « Modifier » dans le menu d'un de mes messages */
{const _s=v4ActSheet;v4ActSheet=function(kind,list,c){let h=_s.apply(this,arguments);
  if(kind!=="peer"||!V4.act)return h;
  const raw=list.find(x=>x.id===V4.act.id);
  if(raw&&raw.sender===S.uid&&!raw.deleted_at&&raw.body)h=h.replace('<button type="button" data-v4="reply">','<button type="button" data-v4="editMsg">'+ic("edit")+'Edit</button><button type="button" data-v4="reply">');
  return h}}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest('[data-v4="editMsg"],[data-v4="editX"]');if(!b)return;
  e.stopImmediatePropagation();e.preventDefault();
  if(b.dataset.v4==="editX"){V4.edit=null;const i=document.getElementById(V4IN("peer"));if(i)i.value="";render();return}
  const x=v4ActMsg();V4.act=null;
  if(!x||x.kind!=="peer"){render();return}
  V4.reply=null;V4.edit={kind:"peer",id:x.raw.id,orig:x.raw.body||""};
  render();
  const n=document.getElementById(V4IN("peer"));if(n){n.value=V4.edit.orig;n.focus()}
},true);

/* 2 · la barre du haut indique qu'on modifie, avec un bouton pour annuler */
{const _b=v4Bar;v4Bar=function(kind,target,ph){let h=_b.apply(this,arguments);
  if(kind==="peer"&&V4.edit&&V4.edit.kind==="peer")h='<div class="v4replybar v4editbar"><div class="v4quote"><div class="v4q-w">Editing your message</div><div class="v4q-t">'+esc(String(V4.edit.orig).slice(0,140))+'</div></div><button type="button" class="iconbtn sm" data-v4="editX" aria-label="Cancel editing">'+ic("x")+'</button></div>'+h;
  return h}}

/* 3 · envoyer la modification au lieu d'un nouveau message */
{const _t=v4TextSend;v4TextSend=async function(kind,f){
  if(!(kind==="peer"&&V4.edit&&V4.edit.kind==="peer"))return _t.apply(this,arguments);
  const id=V4IN(kind),inp=document.getElementById(id),text=String((inp&&inp.value)||"").trim(),E0=V4.edit;
  if(!text)return;
  if(text===String(E0.orig).trim()){V4.edit=null;if(inp)inp.value="";render();return}
  try{
    await window.__peer.edit(E0.id,text);
    const raw=PR.inbox.find(x=>x.id===E0.id);if(raw){raw.body=text;raw.edited_at=new Date().toISOString()}
    V4.edit=null;if(inp)inp.value="";render();
  }catch(e){toast((e&&e.message)||"Could not edit the message","x")}
}}

/* 4 · « modifié » à côté de l'heure */
{const _m=v4MsgHTML;v4MsgHTML=function(kind,m,c){let h=_m.apply(this,arguments);
  if(kind==="peer"&&!m.del){const raw=PR.inbox.find(x=>x.id===m.id);if(raw&&raw.edited_at)h=h.replace("<span>","<span class=\"v4ed\">edited · ")}
  return h}}

/* 5 · glisser un message (vers la droite) pour répondre */
{
  let sw=null;
  const swipeReply=el=>{const kind=el.dataset.k,c=V4.ctx[kind];if(!c)return;
    const raw=c.list().find(x=>x.id===el.dataset.mid);if(!raw)return;
    const m=v4Norm(kind,raw,c),t=v4Plain(m.text)||attLabel(m.att)||"Message";
    V4.edit=null;
    V4.reply={kind:kind,id:raw.id,t:t.slice(0,140),w:kind==="chat"?raw.from:(kind==="peer"?raw.sender:raw.from),who:m.mine?"yourself":c.other};
    render();const n=document.getElementById(V4IN(kind));if(n)n.focus();
    if(navigator.vibrate)navigator.vibrate(12)};
  document.addEventListener("pointerdown",e=>{
    const m=e.target.closest&&e.target.closest("#chatScroll .msg[data-mid]");
    if(!m||e.button>0||e.target.closest("button,a,input,audio,video,.v4once,.v4quote")||String(m.dataset.mid).startsWith("tmp"))return;
    sw={el:m,x:e.clientX,y:e.clientY,dx:0,mode:null};
  },true);
  document.addEventListener("pointermove",e=>{
    if(!sw)return;
    const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
    if(!sw.mode){
      if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){sw=null;return}
      if(dx>8&&Math.abs(dx)>Math.abs(dy)*1.5)sw.mode="x";else return;
    }
    sw.dx=Math.max(0,Math.min(96,dx));
    sw.el.style.transition="none";sw.el.style.transform="translateX("+sw.dx+"px)";
  },{passive:true});
  const end=()=>{if(!sw)return;const s=sw;sw=null;
    s.el.style.transition="transform .25s ease";s.el.style.transform="";
    if(s.mode==="x"&&s.dx>=60)swipeReply(s.el)};
  document.addEventListener("pointerup",end,true);
  document.addEventListener("pointercancel",end,true);
}

{const st=document.createElement("style");st.id="zzzqchattools";st.textContent=`
#chatScroll .msg{touch-action:pan-y}
.v4ed{font-style:italic;opacity:.75;margin-right:4px}
.v4editbar{border-left:3px solid #FBBF24}
`;document.head.appendChild(st)}
