/* =====================================================================
   v5 · Chaque publication peut être téléchargée.
   - Une publication avec photos ou vidéos : on télécharge les fichiers.
   - Une publication sans fichier : on télécharge son texte (.txt).
   ===================================================================== */
{const _fp=fPostHTML;
  fPostHTML=function(p){const h=_fp(p);
    const btn=`<button type="button" class="iconbtn sm" data-fdl="${esc(p.id)}" aria-label="Download this post" title="Download this post">${ic("download")}</button>`;
    return h.replace("</header>",btn+"</header>")}}

function frSaveBlob(blob,name){
  if(S.dl&&S.dl.save) return S.dl.save({filename:name,data:blob});
  const u=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=u;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000);
}

async function fDownloadPost(p){
  const stamp=new Date(p.created_at||Date.now()).toISOString().slice(0,10);
  const id=String(p.id).slice(0,6);
  const media=[...(Array.isArray(p.media)?p.media:[]),...(p.shared&&Array.isArray(p.shared.media)?p.shared.media:[])];
  if(!media.length){
    const txt=`${p.who?.name||"Student"} · ${stamp}\n\n${p.body||""}\n`;
    await frSaveBlob(new Blob([txt],{type:"text/plain"}),`post-${stamp}-${id}.txt`);
    toast("Post saved","download");
    return;
  }
  toast(`Downloading ${media.length} file${media.length>1?"s":""}…`,"download");
  let i=0;
  for(const m of media){
    i++;
    const url=await srcURL({k:"m",id:m.p,t:m.t});
    const res=await fetch(url);
    if(!res.ok) throw new Error("Could not download the file");
    const blob=await res.blob();
    const ext=(EXT[m.t]||String(m.t||"").split("/")[1]||"bin").replace(/[^a-z0-9]/gi,"");
    await frSaveBlob(blob,`post-${stamp}-${id}-${i}.${ext}`);
    if(i<media.length) await new Promise(r=>setTimeout(r,400));
  }
  toast("Post saved","download");
}

document.addEventListener("click",async e=>{
  const el=e.target.closest&&e.target.closest("[data-fdl]");
  if(!el) return;
  e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
  const p=(F.posts||[]).find(x=>String(x.id)===el.dataset.fdl);
  if(!p){toast("Post not found","x");return}
  try{ await fDownloadPost(p) }catch(er){ toast(er.message||"Could not download","x") }
},true);
