/* =====================================================================
   v5 · Médias : plusieurs photos/vidéos pour une story, découpe des
   vidéos envoyées dans la messagerie, et téléchargement des vidéos.
   (Charge en dernier : redéfinit fComposerHTML et fStoryPost.)
   ===================================================================== */
{const st=document.createElement("style");st.id="zzmfx";st.textContent=`
.zzdl{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:14px;z-index:6;width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;padding:0;cursor:pointer}
.zzdl svg{width:22px;height:22px}
.zzal-top .zzdl{position:static;margin-left:auto;margin-right:8px}
.zzst-strip{display:flex;gap:8px;align-items:center;overflow-x:auto;padding:6px 2px 8px;scrollbar-width:none}
.zzst-strip::-webkit-scrollbar{display:none}
.zzst-it{position:relative;flex:none;width:56px;height:56px;border-radius:12px;overflow:hidden;background:#0B0D22}
.zzst-it img,.zzst-it video{width:100%;height:100%;object-fit:cover;display:block}
.zzst-x{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:0;background:rgba(0,0,0,.7);color:#fff;font-size:14px;line-height:18px;padding:0;cursor:pointer}
.zzst-n{flex:none;font-size:.8rem;font-weight:700;color:#fff;opacity:.9;white-space:nowrap}
`;document.head.appendChild(st)}

/* ---------- download of a video in the messaging ---------- */
function zzDlBtn(p,t){return '<button type="button" class="zzdl" data-zzdl="1" data-p="'+esc(p)+'" data-t="'+esc(t||"video/mp4")+'" aria-label="Download" title="Download">'+ic("download")+'</button>'}
async function zzDlMedia(p,t){
  try{
    const b=await srcBlob({k:"m",id:p,t:t});
    const ext=/webm/.test(t||"")?"webm":/quicktime|mov/.test(t||"")?"mov":"mp4";
    const fn="video-"+Date.now()+"."+ext;
    if(S.dl&&S.dl.save){await S.dl.save({filename:fn,data:b});toast("Video saved","download")}
    else{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000)}
  }catch(e){toast(navigator.onLine?"Could not save this video.":"No network: the video needs internet.","x")}
}
window.addEventListener("click",function(e){
  const b=e.target&&e.target.closest&&e.target.closest("[data-zzdl]");if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  zzDlMedia(b.getAttribute("data-p"),b.getAttribute("data-t"));
},true);

/* ---------- cut a video before it is sent (same cutter as the story) ---------- */
window.addEventListener("click",function(e){
  const b=e.target&&e.target.closest&&e.target.closest('[data-v4="preTool"][data-tool="cut"]');if(!b)return;
  const P=V4.pre;if(!P||!P.video||!P.file||!window.ed5Open)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const cap=document.getElementById("v4cap");if(cap)P.cap=cap.value;
  const file=P.file;
  ED5.cb=function(out){
    const cur=V4.pre;if(!cur||!out||out===cur.file)return;
    try{if(cur.url)URL.revokeObjectURL(cur.url)}catch(x){}
    cur.file=out;cur.url=URL.createObjectURL(out);render();
  };
  ed5Open(file,"video",null);
},true);

/* ---------- story: several photos and videos at once ---------- */
function zzStSet(c){const f=c.list&&c.list[0];if(f){c.file=f.file;c.url=f.url;c.video=f.video;c.d=f.d}else{c.file=null;c.url=null;c.video=false;c.d=0;c.list=null}}
function zzStStrip(c){
  return '<div class="zzst-strip"><b class="zzst-n">'+c.list.length+' stories</b>'+c.list.map(function(it,i){
    return '<div class="zzst-it">'+(it.video?'<video src="'+it.url+'" muted playsinline></video>':'<img src="'+it.url+'" alt="">')+'<button type="button" class="zzst-x" data-zzst="rm" data-i="'+i+'" aria-label="Remove">×</button></div>'}).join('')+'</div>';
}
{const _fcm=fComposerHTML;fComposerHTML=function(){
  let h=_fcm();
  h=h.replace('accept="image/*,video/*" hidden','accept="image/*,video/*" multiple hidden');
  const c=F.sc;if(c&&c.list&&c.list.length>1)h=h.replace('<textarea id="fsc_text"',zzStStrip(c)+'<textarea id="fsc_text"');
  return h}}

window.addEventListener("change",function(e){
  const el=e.target;if(!el||el.id!=="fsc_file"||!el.files)return;
  if(el.files.length<2){
    // one item: the single-item path (and its editor) takes over; the old list is dropped
    if(F.sc&&F.sc.list){F.sc.list.forEach(function(x){try{if(x.url)URL.revokeObjectURL(x.url)}catch(_){}});F.sc.list=null}
    return;
  }
  e.stopImmediatePropagation();e.stopPropagation();
  const files=[...el.files];el.value="";
  if(!F.sc)return;
  (async function(){
    const c=F.sc;c.text=(document.getElementById("fsc_text")||{}).value||"";
    const list=(c.list&&c.list.length)?c.list.slice():(c.file?[{file:c.file,url:c.url,video:c.video,d:c.d}]:[]);
    for(const f of files){
      if(list.length>=10){toast("10 photos or videos maximum.","x");break}
      const vid=/^video\//.test(f.type||"");
      if(!vid&&!/^image\//.test(f.type||""))continue;
      let d=0;
      if(vid){const chk=await fVideoCheck(f,60);if(!chk)continue;d=chk.d}
      list.push({file:f,url:URL.createObjectURL(f),video:vid,d:d});
    }
    if(!F.sc)return;
    c.list=list.length?list:null;zzStSet(c);feedSync();
  })();
},true);
window.addEventListener("click",function(e){
  const b=e.target&&e.target.closest&&e.target.closest('[data-zzst="rm"]');if(!b||!F.sc||!F.sc.list)return;
  e.preventDefault();e.stopPropagation();
  const i=+b.getAttribute("data-i"),c=F.sc;const gone=c.list.splice(i,1)[0];
  if(gone&&gone.url)try{URL.revokeObjectURL(gone.url)}catch(x){}
  zzStSet(c);feedSync();
},true);

async function fStoryPost(){
  const c=F.sc;if(!c||c.busy)return;
  const t=((document.getElementById("fsc_text")||{}).value||"").trim();
  const items=(c.list&&c.list.length)?c.list.slice():(c.file?[{file:c.file,url:c.url,video:c.video,d:c.d}]:[]);
  if(!t&&!items.length){toast("Write something or add a photo.","x");return}
  if(c.aud==="hide"&&!c.hide){toast("Choose the classmate who must not see this story.","x");return}
  c.busy=true;c.text=t;feedSync();
  const seq=items.length?items:[null];
  let done=0;
  try{
    for(const it of seq){
      if(it&&it.video)toast("Uploading the video… keep the app open.","clock");
      const media=it?await fUpload(it.file,it.d):null;
      const body=await fFix(t,300);
      await window.__feed.story(media,body,it?"":c.bg,{dur:c.dur||5,aud:c.aud==="hide"?"hide":"all",hide:c.aud==="hide"?c.hide:null});
      if(media)fRememberMedia(media);
      done++;
    }
    for(const it of items)if(it&&it.url)try{URL.revokeObjectURL(it.url)}catch(x){}
    F.sc=null;feedSync();
    toast(done>1?done+" stories shared! They stay 24 hours.":"Story shared! It stays 24 hours.","rocket");
    await feedLoad();
  }catch(e){
    // what was posted is kept out of the composer; the rest stays for another try
    c.busy=false;
    const rest=items.slice(done);
    for(const it of items.slice(0,done))if(it&&it.url)try{URL.revokeObjectURL(it.url)}catch(x){}
    c.list=rest.length?rest:null;zzStSet(c);feedSync();
    toast((e&&e.message)||"Could not share","x");
  }
}
