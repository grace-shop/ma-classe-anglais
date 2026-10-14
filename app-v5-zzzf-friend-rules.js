/* =====================================================================
   v5 · Amis : les listes de choix ne proposent que des amis
   (groupes et appels entre élèves). La base de données reste la vraie règle.
   ===================================================================== */
{const _g=grDir;
  grDir=function(){const L=_g();return S.mode==="student"?L.filter(x=>frIsFriend(x.uid)):L}}
{const _c=callCandidates;
  callCandidates=async function(){const L=await _c();return S.mode==="student"?L.filter(x=>frIsFriend(x.uid)):L}}
