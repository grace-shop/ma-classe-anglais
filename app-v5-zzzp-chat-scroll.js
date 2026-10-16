/* =====================================================================
   v5 · Le chat garde la position de lecture. Quand l'élève remonte
   dans une conversation, un nouveau message, une photo qui se charge
   ou une mise à jour ne le ramène plus en bas. Il redescend seulement
   s'il était déjà en bas (ou quand il envoie un message).
   ===================================================================== */
{const _r=render;render=function(){
  const cs0=document.getElementById("chatScroll");
  const saved=cs0?{top:cs0.scrollTop,key:S.view&&S.view.type+":"+(S.view.id||"")}:null;
  CHAT_STICK.lock=true;
  const o=_r.apply(this,arguments);
  try{
    const cs=document.getElementById("chatScroll");
    if(cs){
      if(!saved||saved.key!==(S.view&&S.view.type+":"+(S.view.id||""))){CHAT_STICK.on=true}
      if(CHAT_STICK.on)cs.scrollTop=cs.scrollHeight;else cs.scrollTop=saved.top;
    }
  }finally{setTimeout(()=>{CHAT_STICK.lock=false},80)}
  return o;
}}
