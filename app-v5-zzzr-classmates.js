/* =====================================================================
   v5 · Liste des camarades bien rangée : trois sections (Amis, Demandes,
   Camarades), chacune triée par dernier message (les non lus d'abord).
   Une seule ligne par camarade : heure et badge à droite, le bouton « ⋯ »
   toujours au même endroit. Les amis n'ont plus de pastille répétée.
   ===================================================================== */
function pvLastAt(u,me){let t=0;for(const m of PR.inbox){if(m.deleted_at)continue;const o=m.sender===me?m.receiver:m.sender;if(o===u){const x=+new Date(m.created_at);if(x>t)t=x}}return t}
function pvOrganize(){
  if(!S.view||S.view.type!=="peers"||!PR.loaded)return;
  const me=S.uid;
  document.querySelectorAll(".pv-list").forEach(L=>{
    const rows=[...L.children].filter(n=>n.classList&&n.classList.contains("it")&&n.dataset.a==="openPeer");
    if(!rows.length)return;
    const info=rows.map(r=>{const u=r.dataset.id,st=(typeof frState==="function")?frState(u):"none";
      return{r,st,pin:(typeof convHas==="function"&&convHas("peer:"+u,"pin"))?1:0,last:pvLastAt(u,me),un:r.classList.contains("pv-un"),name:(r.querySelector("b")||{}).textContent||""}});
    // épinglés d'abord, puis les non lus, puis le plus récent
    const byRecent=(a,b)=>(b.pin-a.pin)||(b.un-a.un)||(b.last-a.last)||a.name.localeCompare(b.name);
    const friends=info.filter(x=>x.st==="friends").sort(byRecent);
    const reqs=info.filter(x=>x.st==="in"||x.st==="out").sort(byRecent);
    const others=info.filter(x=>x.st!=="friends"&&x.st!=="in"&&x.st!=="out").sort(byRecent);
    // une seule pastille par ligne, à gauche du bouton ⋯
    info.forEach(x=>{
      const fa=x.r.querySelector(".fr-act"),meta=x.r.querySelector(".pv-meta"),more=x.r.querySelector(".pv-more");
      if(fa&&meta){if(x.st==="friends")fa.remove();else meta.insertBefore(fa,more||null)}
    });
    const sec=(title,list)=>{if(!list.length)return null;const h=document.createElement("div");h.className="pv-sec";h.innerHTML=`<span>${title}</span><b>${list.length}</b>`;return[h,...list.map(x=>x.r)]};
    const parts=[sec("Friends",friends),sec("Friend requests",reqs),sec("Classmates",others)].filter(Boolean).flat();
    L.replaceChildren(...parts);
  });
}
{const _r=render;render=function(){const o=_r.apply(this,arguments);try{pvOrganize()}catch(e){}return o}}
{const st=document.createElement("style");st.id="zzzrclassmates";st.textContent=`
.pv-list .pv-sec{display:flex;align-items:center;gap:10px;padding:14px 16px 6px;font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#94A3B8)}
.pv-list .pv-sec:first-child{padding-top:10px}
.pv-list .pv-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(148,163,184,.4),transparent)}
.pv-list .pv-sec b{font-size:.7rem;padding:2px 8px;border-radius:999px;background:rgba(148,163,184,.14);color:inherit;letter-spacing:0}
.pv-list .it.pv-row,.pv-list>.it[data-a="openPeer"]{align-items:center}
.pv-list .pv-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:72px}
.pv-list .pv-meta .row{justify-content:flex-end;flex-wrap:nowrap}
.pv-list .fr-act .chip{font-size:.7rem;padding:3px 9px;white-space:nowrap}
.pv-list .pv-more{flex:0 0 auto;margin-left:6px}
`;document.head.appendChild(st)}
