/* =====================================================================
   v5 · Community polish.
   - Community shows the real emoji (the 3D icons stay on the rest of the app).
   - You can change the words of your own post (Edit, then Save).
   - One video plays at a time; a tap starts it at once, and a refresh of
     the page no longer stops it or starts another one.
   - While you type, the Arena and AI buttons step aside so the text shows.
   ===================================================================== */

/* 1 · real emoji in the Community */
{const _E=E;E=function(str,cls=""){if(!window.__natEmo)return _E(str,cls);
  return segG(String(str||"")).map(g=>/\p{Extended_Pictographic}/u.test(g)?`<span class="emo-nat ${cls||""}">${esc(g)}</span>`:esc(g)).join("")}}
{const _fv=feedView;feedView=function(e){window.__natEmo=true;try{return _fv(e)}finally{window.__natEmo=false}}}

/* 1b · the story viewer and the story text are drawn outside the feed: native emoji there too */
{const _fs=feedSync;feedSync=function(){const was=window.__natEmo;window.__natEmo=true;try{return _fs.apply(this,arguments)}finally{window.__natEmo=was}}}

/* 2 · edit your own post */
{const _fp=fPostHTML;fPostHTML=function(p){let h=_fp(p);
  if(!p||p.deleted_at||p.author!==S.uid)return h;
  const ed=window.__fEdit;
  if(ed&&ed.id===p.id){
    const editor=`<div class="fedit"><textarea id="fe_${esc(p.id)}" maxlength="4000" aria-label="Change your post">${esc(ed.text)}</textarea><div class="fedit-row"><button type="button" class="btn sm" data-fe="save" data-id="${esc(p.id)}">Save</button><button type="button" class="linkbtn" data-fe="cancel" data-id="${esc(p.id)}">Cancel</button></div></div>`;
    const body=p.body?fText(p.body):"";
    h=body?h.replace(body,()=>editor):h.replace('<div class="fcount">',()=>editor+'<div class="fcount">');
  }else{
    h=h.replace("</header>",()=>`<button type="button" class="linkbtn fedit-btn" data-fe="edit" data-id="${esc(p.id)}">Edit</button></header>`);
  }
  return h}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-fe]");if(!b)return;
  e.preventDefault();e.stopPropagation();
  const id=b.dataset.id,act=b.dataset.fe;
  if(act==="edit"){const p=F.posts.find(x=>x.id===id);window.__fEdit={id,text:p?p.body||"":""};render();const ta=document.getElementById("fe_"+id);if(ta)ta.focus();return}
  if(act==="cancel"){window.__fEdit=null;render();return}
  if(act==="save"){const ta=document.getElementById("fe_"+id);const text=((ta&&ta.value)||"").trim();
    if(!text){toast("Write something first.","x");return}
    const p=F.posts.find(x=>x.id===id);if(p)p.body=text;window.__fEdit=null;render();
    window.__feed.edit(id,text).then(()=>toast("Post changed.","rocket")).catch(er=>{toast(er.message||"Could not change the post","x");feedLoad()})}
},true);

/* 3 · one video at a time, started at once */
window.__vid={p:null,el:null,tile:""};
function vidTileOf(p){return[...document.querySelectorAll("button.fvid")].find(b=>b.dataset.p===p)}
function vidStop(){const V=window.__vid;if(!V.el)return;
  V.el.pause();
  if(V.el.isConnected){const tpl=document.createElement("template");tpl.innerHTML=V.tile;V.el.replaceWith(tpl.content.firstElementChild)}
  V.p=null;V.el=null;V.tile=""}
{const _vp=vPlay;
vPlay=async function(p,t){const V=window.__vid;
  if(V.el&&V.p===p){if(V.el.paused)V.el.play().catch(()=>{});else V.el.pause();return}
  const tile=vidTileOf(p);
  if(!tile)return _vp(p,t);
  vidStop();
  V.p=p;V.tile=tile.outerHTML;
  const v=document.createElement("video");v.controls=true;v.playsInline=true;v.preload="auto";v.className="fvid-v ld";v.setAttribute("aria-label","Video");
  V.el=v;tile.replaceWith(v);
  try{const u=await srcURL({k:"m",id:p,t});
    if(V.el!==v)return;
    v.src=u;v.addEventListener("canplay",()=>v.classList.remove("ld"),{once:true});
    v.play().catch(()=>{});
  }catch(e){if(V.el===v)vidStop();toast(navigator.onLine?"Cannot play this video.":"No network: the video needs internet.","x")}}}
/* a refresh rebuilds the feed: put the playing video back in its place, and keep it playing */
{const _r=render;render=function(){const V=window.__vid;const was=!!(V.el&&V.el.isConnected&&!V.el.paused);
  const r=_r.apply(this,arguments);
  try{document.body.classList.toggle("in-feed",!!document.querySelector(".fwrap"))}catch(e){}
  try{if(V.el&&!V.el.isConnected&&V.p){const tile=vidTileOf(V.p);if(tile){tile.replaceWith(V.el);if(was)V.el.play().catch(()=>{})}}}catch(e){}
  return r}}

/* 3b · the upload of a picked photo or video starts at once, while you write, not after you press Post */
{const _up=fUpload;fUpload=function(file,d){
  if(!file.__up){const pr=_up(file,d);file.__up=pr.catch(e=>{delete file.__up;throw e})}
  return file.__up}}
function fPreUpload(){if(!F)return;if(F.sc&&F.sc.file&&!F.sc.file.__up)fUpload(F.sc.file,F.sc.d).catch(()=>{});if(!F.files)return;for(const f of F.files){if(!f.file||f.file.__up)continue;
  fUpload(f.file,f.d).catch(()=>{})}}
function fTagRemoveButtons(){document.querySelectorAll('[data-v4="fFileX"]').forEach(b=>{b.__pickedFile=(F.files||[])[+b.dataset.i]})}
{const _r0=render;render=function(){const r=_r0.apply(this,arguments);try{fPreUpload();fTagRemoveButtons()}catch(e){}return r}}

/* 3c · a picked file you remove is deleted from the server (it was uploaded early) */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-v4="fFileX"]');if(!b)return;
  const f=b.__pickedFile;if(!f||!f.file||!f.file.__up)return;
  f.file.__up.then(r=>{const paths=[r&&r.p,r&&r.poster&&r.poster.p].filter(Boolean);
    if(paths.length&&window.__chatFiles&&window.__chatFiles.remove)return window.__chatFiles.remove(paths)}).catch(()=>{})},true);

/* 3d · the length of a video is already known from the editor: do not search it again (that search was slow) */
{const _dl=ed5Deliver;ed5Deliver=function(file){try{if(file&&typeof ED5!=="undefined"&&ED5.kind==="video"){const d=file===ED5.file?ED5.dur:(ED5.e-ED5.s);if(d>0)file.__dur=d}}catch(e){}return _dl.apply(this,arguments)}}
{const _vc=fVideoCheck;fVideoCheck=function(f,maxSec){if(!(f.__dur>0)||f.size>50*1024*1024)return _vc(f,maxSec);
  if(f.__dur>maxSec+0.5){toast(`Video too long: ${maxSec>=120?Math.round(maxSec/60)+" minutes":maxSec+" seconds"} maximum.`,"x");return Promise.resolve(null)}
  return Promise.resolve({d:Math.round(f.__dur)})}}

/* 3e · the English check does not hold up posting: it waits at most 4 seconds, then the text is posted as written */
{const _ff=fFix;fFix=function(t,max){const plain=String(t||"").trim();
  return Promise.race([_ff(t,max),new Promise(r=>setTimeout(()=>r(plain),4000))])}}

/* 4b · writing a story text: the options at the bottom step aside so the text shows */
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="fsc_text")document.body.classList.add("story-typing")});
document.addEventListener("focusout",e=>{if(e.target&&e.target.id==="fsc_text")setTimeout(()=>{if(!document.activeElement||document.activeElement.id!=="fsc_text")document.body.classList.remove("story-typing")},250)});

/* 4 · the text you type stays visible: the floating buttons step aside */
document.addEventListener("focusin",e=>{const t=e.target;if(!t||!t.matches)return;
  if(t.matches("textarea,input[type=text],input:not([type])")){document.body.classList.add("kbd-typing");
    setTimeout(()=>{try{t.scrollIntoView({block:"center",behavior:"smooth"})}catch(er){}},350)}});
document.addEventListener("focusout",e=>{const t=e.target;if(t&&t.matches&&t.matches("textarea,input"))setTimeout(()=>{if(!document.activeElement||!document.activeElement.matches||!document.activeElement.matches("textarea,input"))document.body.classList.remove("kbd-typing")},250)});

{const st=document.createElement("style");st.id="zzzcommunity";st.textContent=`
.emo-nat{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;font-style:normal;line-height:1;display:inline-block;vertical-align:-.12em}
.fpick button .emo-nat{font-size:1.7rem}
.factions .emo-nat{font-size:1.2rem}
.fcount .emo-nat{font-size:1rem}
.fedit{display:grid;gap:8px;margin:6px 0}
.fedit textarea{width:100%;min-height:96px;border-radius:14px;border:1px solid var(--line);background:var(--surface2);color:inherit;font:inherit;padding:10px 12px;resize:vertical}
.fedit-row{display:flex;gap:12px;align-items:center}
.fedit-btn{margin-left:auto;font-size:.85rem}
.fvid-v.ld{opacity:.55}
body.kbd-typing #arFab,body.kbd-typing #aiFab,body.in-feed #arFab,body.in-feed #aiFab{display:none!important}
body.story-typing .zc-dock{display:none!important}
`;document.head.appendChild(st)}
