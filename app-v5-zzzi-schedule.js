/* =====================================================================
   v5 · Publications programmées (enseignants).
   L'enseignant choisit une heure : la publication (texte, photo ou vidéo)
   apparaît dans le fil à cette heure-là. Il peut en annuler une avant.
   La base de données fait le travail (voir supabase/planifier.sql).
   ===================================================================== */
const SCH={list:[],at:0,busy:false};

function schSB(){return window.__sb}
function schLocalMin(){const d=new Date(Date.now()+2*60000-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,16)}

async function schLoad(force){
  if(!fStaff()||!schSB()||SCH.busy) return;
  if(!force&&Date.now()-SCH.at<20000) return;
  SCH.busy=true; SCH.at=Date.now();
  try{
    const {data,error}=await schSB().rpc("my_scheduled_posts");
    if(error) throw error;
    SCH.list=data||[];
  }catch(e){ SCH.list=[] }
  SCH.busy=false; render();
}

/* 1) Le champ « Publier à » dans la zone d'écriture (enseignants seulement) */
{const _r=render;render=function(){const o=_r.apply(this,arguments);try{schDecorate()}catch(e){}return o}}
function schDecorate(){
  if(!fStaff()) return;
  const ta=document.getElementById("f_text"); if(!ta) return;
  if(!document.getElementById("f_when")){
    ta.insertAdjacentHTML("afterend",`<div class="fwhen"><label class="small">${"Publish at (leave empty to publish now)"}<input type="datetime-local" id="f_when" min="${schLocalMin()}" value="${esc(S.drafts.f_when||"")}"></label></div>`);
  }
  if(!document.getElementById("f_sched")&&SCH.list.length){
    const w=document.querySelector(".fwhen");
    if(w) w.insertAdjacentHTML("afterend",`<div class="fsched" id="f_sched">${SCH.list.map(x=>`<div class="fsched-it"><span>⏱ ${esc(new Date(x.created_at).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"}))} · ${esc(String(x.body||"").slice(0,40)||(x.media?"📷 media":""))}</span><button type="button" class="btn ghost sm" data-fsc="${esc(x.id)}">Cancel</button></div>`).join("")}</div>`);
  }
  schLoad(false);
}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="f_when"){S.drafts.f_when=e.target.value}},true);

/* 2) Annuler une publication programmée */
document.addEventListener("click",async e=>{
  const el=e.target.closest&&e.target.closest("[data-fsc]");
  if(!el) return;
  e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
  if(!window.confirm("Cancel this scheduled post?")) return;
  try{
    const {error}=await schSB().rpc("cancel_scheduled_post",{p_id:el.dataset.fsc});
    if(error) throw error;
    toast("Scheduled post cancelled","check");
    SCH.at=0; await schLoad(true);
  }catch(er){ toast(er.message||"Could not cancel","x") }
},true);

/* 3) Envoi : si une heure est choisie, on programme au lieu de publier */
{const _fp=fPost;
  fPost=function(){
    const w=document.getElementById("f_when");
    window.__postAt=(w&&w.value)?new Date(w.value).toISOString():null;
    return _fp.apply(this,arguments)}}
{const _cr=window.__feed.create;
  window.__feed.create=async function(body,media){
    const at=window.__postAt; window.__postAt=null;
    if(!at) return _cr.apply(this,arguments);
    const id=await schSB().rpc("schedule_post",{p_body:body||"",p_media:media&&media.length?media:null,p_at:at});
    if(id.error) throw new Error(id.error.message||"Could not schedule");
    delete S.drafts.f_when;
    toast("Scheduled for "+new Date(at).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"}),"clock");
    SCH.at=0; schLoad(true);
    return id.data}}

{const st=document.createElement("style");st.id="zzzischedule";st.textContent=`
.fwhen{margin-top:8px}.fwhen label{display:grid;gap:4px;color:var(--muted)}
.fwhen input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:inherit;font:inherit}
.fsched{display:grid;gap:6px;margin-top:8px}
.fsched-it{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.86rem;padding:6px 10px;border-radius:12px;background:var(--surface2)}
.fsched-it span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;document.head.appendChild(st)}
