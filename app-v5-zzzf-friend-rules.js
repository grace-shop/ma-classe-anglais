/* =====================================================================
   v5 · Amis : les listes de choix ne proposent que des amis
   (groupes et appels entre élèves). La base de données reste la vraie règle.
   ===================================================================== */
{const _g=grDir;
  grDir=function(){const L=_g();return S.mode==="student"?L.filter(x=>frIsFriend(x.uid)):L}}
{const _c=callCandidates;
  callCandidates=async function(){const L=await _c();return S.mode==="student"?L.filter(x=>frIsFriend(x.uid)):L}}

/* Pas d'appel avec un élève qui n'est pas ami : le bouton disparaît.
   Dans un groupe, le bouton d'appel disparaît s'il y a un camarade qui n'est pas ami. */
const FR_CALL_BAR=/<div class="call-entry">[\s\S]*?<\/div>/;
{const _pc=peerChatView;peerChatView=function(){
  const h=_pc(); const id=S.view&&S.view.id;
  if(!id||S.mode!=="student"||frIsFriend(id)) return h;
  return h.replace(FR_CALL_BAR,"");
}}
{const _gc=grChatView;grChatView=function(){
  const h=_gc(); const id=S.view&&S.view.id;
  if(!id||S.mode!=="student") return h;
  const mem=(GR.mem&&GR.mem[id])||[];
  const stranger=mem.some(m=>m.uid!==S.uid&&PR.dir.some(x=>x.uid===m.uid)&&!frIsFriend(m.uid));
  return stranger?h.replace(FR_CALL_BAR,""):h;
}}
