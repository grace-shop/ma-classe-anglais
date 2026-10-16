/* =====================================================================
   v5 · Messagerie rangée : une seule ligne par camarade (nom et aperçu
   à gauche, heure, badge et ⋯ à droite), la liste se met à jour quand
   une demande d'ami change, et les demandes reçues sont lisibles.
   ===================================================================== */
{const _fr=frRefresh;frRefresh=async function(){const r=await _fr.apply(this,arguments);
  try{if(S.view&&S.view.type==="peers")render()}catch(e){}return r}}
{const st=document.createElement("style");st.id="zzzumsg";st.textContent=`
.pv-list .it.pv-row,.pv-list>.it[data-a="openPeer"]{display:flex;flex-wrap:nowrap;align-items:center;gap:12px;padding:12px 14px}
.pv-list .it .txt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.pv-list .it .txt b,.pv-list .it .txt span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:100%}
.pv-list .sn-bub{display:none!important}
.pv-list .pv-meta{order:2;flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:64px}
.pv-list .pv-meta small{font-size:.72rem;opacity:.75;white-space:nowrap}
.pv-list .pv-more{order:3;flex:0 0 auto;margin-left:0}
.pv-list .txt .fr-act{display:flex;margin-top:2px}
.pv-list .fr-act .chip{font-size:.7rem;padding:3px 9px;white-space:nowrap}
.fr-card .list>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fr-card .list>div>b{display:block;width:100%}
.fr-card .list>div>div{display:flex;gap:8px;margin-left:auto}
`;document.head.appendChild(st)}

/* l'état d'amitié (Ami, Demande envoyée, Ajouter) passe sous le nom, pas à droite */
{const _r=render;render=function(){const o=_r.apply(this,arguments);
  try{document.querySelectorAll(".pv-list .it[data-a='openPeer']").forEach(row=>{const fa=row.querySelector(":scope > .fr-act"),tx=row.querySelector(":scope > .txt");if(fa&&tx)tx.appendChild(fa)})}catch(e){}
  return o}}
