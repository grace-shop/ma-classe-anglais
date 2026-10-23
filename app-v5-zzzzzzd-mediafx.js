/* =====================================================================
   v5 · Médias : téléchargement (photos et vidéos), découpe des vidéos
   avant envoi, stories à plusieurs médias (revue en tuiles), appui long
   sur un média (menu : réagir, répondre, transférer, épingler, supprimer).
   (Charge en dernier.)
   ===================================================================== */
{const st=document.createElement("style");st.id="zzmfx";st.textContent=`
.zzdl{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:14px;z-index:6;width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;padding:0;cursor:pointer}
.zzdl svg{width:22px;height:22px}
.zzal-top .zzdl{position:static;margin-left:auto;margin-right:8px;flex:none}
.msg[data-mid]{position:relative}
.zz-pinb{position:absolute;top:-9px;left:6px;font-size:13px;line-height:1;z-index:2;font-style:normal}
`;document.head.appendChild(st)}

/* ---------- download (photos and videos) ---------- */
function zzDlBtn(p,t){return '<button type="button" class="zzdl" data-zzdl="1" data-p="'+esc(p)+'" data-t="'+esc(t||"video/mp4")+'" aria-label="Download" title="Download">'+ic("download")+'</button>'}
function zzExt(t){t=t||"";if(/png/.test(t))return"png";if(/webp/.test(t))return"webp";if(/gif/.test(t))return"gif";if(/jpe?g/.test(t))return"jpg";if(/webm/.test(t))return"webm";if(/quicktime|mov/.test(t))return"mov";if(/3gp/.test(t))return"3gp";return"mp4"}
async function zzDlMedia(p,t){
  try{
    const b=await srcBlob({k:"m",id:p,t:t});
    const isImg=/^image\//.test(t||"");
    const fn=(isImg?"photo-":"video-")+Date.now()+"."+zzExt(t);
    if(S.dl&&S.dl.save){await S.dl.save({filename:fn,data:b});toast("Saved","download")}
    else{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000)}
  }catch(e){toast(navigator.onLine?"Could not save this file.":"No network: the file needs internet.","x")}
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
  ED5.cb=function(out){
    const cur=V4.pre;if(!cur||!out||out===cur.file)return;
    try{if(cur.url)URL.revokeObjectURL(cur.url)}catch(x){}
    cur.file=out;cur.url=URL.createObjectURL(out);render();
  };
  ed5Open(P.file,"video",null);
},true);

/* ---------- long press on a photo or video: the message menu (the media is a button, so the app skipped it) ---------- */
var zzLpAt=0;
window.addEventListener("contextmenu",function(e){
  const t=e.target;if(!t||!t.closest)return;
  const m=t.closest(".msg[data-mid]");if(!m||String(m.dataset.mid).indexOf("tmp")===0)return;
  if(!t.closest("button"))return;            // text bubbles keep the app's own menu
  e.preventDefault();e.stopImmediatePropagation();
  zzLpAt=Date.now();
  V4.act={kind:m.dataset.k,id:m.dataset.mid};render();
},true);
// the press that opened the menu must not also open the photo or video
window.addEventListener("click",function(e){
  if(Date.now()-zzLpAt>700)return;
  if(!e.target||!e.target.closest||!e.target.closest(".msg[data-mid]"))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
},true);

/* ---------- menu actions: forward and pin (pins are kept on this phone) ---------- */
function zzPins(){try{return JSON.parse(localStorage.getItem("zzpins")||"[]")}catch(e){return[]}}
function zzIsPinned(id){return zzPins().indexOf(String(id))>=0}
function zzPinToggle(id){const a=zzPins(),k=String(id),i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);try{localStorage.setItem("zzpins",JSON.stringify(a))}catch(e){}zzPinPaint()}
function zzPinPaint(){const a=zzPins();document.querySelectorAll(".msg[data-mid]").forEach(function(m){
  const on=a.indexOf(String(m.dataset.mid))>=0,b=m.querySelector(":scope > .zz-pinb");
  if(on&&!b)m.insertAdjacentHTML("afterbegin",'<i class="zz-pinb" aria-label="Pinned">📌</i>');else if(!on&&b)b.remove()})}
{let raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;try{zzPinPaint()}catch(e){}})}).observe(document.body,{childList:true,subtree:true})}
window.addEventListener("click",function(e){
  const b=e.target&&e.target.closest&&e.target.closest('[data-v4="fwdOne"],[data-v4="pinOne"]');if(!b)return;
  const x=V4.act;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  V4.act=null;render();if(!x)return;
  if(b.getAttribute("data-v4")==="fwdOne"){window.zzSelAct&&window.zzSelAct("fwd",[x.id])}
  else{zzPinToggle(x.id);toast(zzIsPinned(x.id)?"Pinned on this phone":"Unpinned","check")}
},true);

/* ---------- story: several photos and videos, reviewed like the chat selection ---------- */
async function zzStoryReview(files){
  const ok=[],dur=new Map();
  for(const f of files){
    const vid=/^video\//.test(f.type||"");
    if(vid){const chk=await fVideoCheck(f,60);if(!chk)continue;dur.set(f,chk.d)}
    else if(!/^image\//.test(f.type||""))continue;
    ok.push(f);
  }
  if(!ok.length)return;
  zzReviewOpen("story",null,ok);
  if(ZZR)ZZR.items.forEach(function(it){it.d=dur.get(it.file)||0});
}
async function zzStorySend(){
  const R=ZZR;if(!R||R.busy)return;R.busy=true;
  const total=R.items.length;let done=0;
  zzProg("Sharing "+total+" stor"+(total>1?"ies":"y")+"…");
  try{
    for(const it of R.items.slice()){
      const media=await fUpload(it.file,it.d||0);
      const body=await fFix("",300);
      await window.__feed.story(media,body,"",{dur:5,aud:"all",hide:null});
      if(media)fRememberMedia(media);
      done++;R.items.splice(R.items.indexOf(it),1);
      zzProg("Sharing "+(done+1>total?total:done+1)+" / "+total+"…");
    }
    zzReviewClose();F.sc=null;feedSync();
    toast(done>1?done+" stories shared! They stay 24 hours.":"Story shared! It stays 24 hours.","rocket");
    await feedLoad();
  }catch(e){
    // what was shared is out of the review; the rest waits for another try
    R.busy=false;toast((e&&e.message)||"Could not share","x");
    if(ZZR===R)zzReviewPaint();
  }
  zzProgEnd();
}

// several files picked for a story: the review opens instead of the composer
window.addEventListener("change",function(e){
  const el=e.target;if(!el||el.id!=="fsc_file"||!el.files||el.files.length<2)return;
  e.stopImmediatePropagation();e.stopPropagation();
  const files=[...el.files];el.value="";
  if(F.sc)zzStoryReview(files);
},true);
{const _fcm=fComposerHTML;fComposerHTML=function(){return _fcm().replace('accept="image/*,video/*" hidden','accept="image/*,video/*" multiple hidden')}}
