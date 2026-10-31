/* =====================================================================
   v5 · Médias et messages : téléchargement (photos et vidéos), découpe
   et modifications des vidéos (intégrées au fichier envoyé), stories à
   plusieurs médias avec légende, appui long sur un média, et messages
   épinglés partagés (liste en haut de la discussion).
   (Charge en dernier.)
   ===================================================================== */
{const st=document.createElement("style");st.id="zzmfx";st.textContent=`
.zzdl{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:14px;z-index:6;width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;padding:0;cursor:pointer}
.zzdl svg{width:22px;height:22px}
.zzal-top .zzdl{position:static;margin-left:auto;margin-right:8px;flex:none}
.msg[data-mid]{position:relative}
.msg.zz-pn::before{content:"📌";position:absolute;top:-9px;left:6px;font-size:13px;line-height:1;z-index:2}
#zzPinBar{flex:none;max-height:30vh;overflow-y:auto;margin:0 0 6px;padding:8px 10px;border-radius:14px;background:rgba(16,18,40,.86);color:#fff;font:600 .82rem/1.25 system-ui,sans-serif;border:1px solid rgba(255,255,255,.12)}
#zzPinBar>b{display:block;margin-bottom:4px;opacity:.9}
.zz-pr{display:flex;align-items:center;gap:6px;margin-top:4px}
.zz-pr button{border:0;background:none;color:#fff;font:inherit;text-align:left;padding:4px 2px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.zz-pru{flex:none!important;flex:none;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.14)!important;text-align:center;padding:0!important;flex:none}
.zzst-cap{width:100%;box-sizing:border-box;margin:0 0 10px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:#1a1d26;color:#fff;font:600 15px system-ui,sans-serif}
`;document.head.appendChild(st)}

/* ---------- download (photos and videos) ---------- */
function zzDlBtn(p,t){return '<button type="button" class="zzdl" data-zzdl="1" data-p="'+esc(p)+'" data-t="'+esc(t||"video/mp4")+'" aria-label="Download" title="Download">'+ic("download")+'</button>'}
function zzExt(t){t=t||"";if(/png/.test(t))return"png";if(/webp/.test(t))return"webp";if(/gif/.test(t))return"gif";if(/jpe?g/.test(t))return"jpg";if(/webm/.test(t))return"webm";if(/quicktime|mov/.test(t))return"mov";if(/3gp/.test(t))return"3gp";return"mp4"}
async function zzDlMedia(p,t){
  try{
    const b=await srcBlob({k:"m",id:p,t:t});
    const fn=(/^image\//.test(t||"")?"photo-":"video-")+Date.now()+"."+zzExt(t);
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

/* ---------- long press on a message (photo, video, text): the message menu ----------
   A timer on the pointer decides, so it works on buttons (photos, videos) where the
   phone does not always send its "menu" event. The press that opened the menu does not
   also open the photo or video. */
var zzLpAt=0,zzLpT=0,zzLpX=0,zzLpY=0;
function zzLpCancel(){clearTimeout(zzLpT);zzLpT=0}
window.addEventListener("pointerdown",function(e){
  zzLpCancel();
  const t=e.target;if(!t||!t.closest)return;
  const m=t.closest(".msg[data-mid]");if(!m||String(m.dataset.mid).indexOf("tmp")===0)return;
  if(t.closest("a,input,textarea,audio,.v4quote,[data-zzpj],[data-zzpu]"))return;
  zzLpX=e.clientX;zzLpY=e.clientY;
  zzLpT=setTimeout(function(){
    zzLpT=0;zzLpAt=Date.now();
    if(navigator.vibrate)try{navigator.vibrate(12)}catch(x){}
    V4.act={kind:m.dataset.k,id:m.dataset.mid};render();
  },480);
},true);
window.addEventListener("pointermove",function(e){if(zzLpT&&Math.hypot(e.clientX-zzLpX,e.clientY-zzLpY)>12)zzLpCancel()},true);
window.addEventListener("pointerup",function(){zzLpCancel()},true);
window.addEventListener("pointercancel",function(){zzLpCancel()},true);
window.addEventListener("contextmenu",function(e){
  const t=e.target;if(!t||!t.closest)return;
  const m=t.closest(".msg[data-mid]");if(!m||String(m.dataset.mid).indexOf("tmp")===0)return;
  e.preventDefault();e.stopImmediatePropagation();
  zzLpAt=Date.now();V4.act={kind:m.dataset.k,id:m.dataset.mid};render();
},true);
window.addEventListener("click",function(e){
  if(Date.now()-zzLpAt>700)return;
  if(!e.target||!e.target.closest||!e.target.closest(".msg[data-mid]"))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
},true);

/* ---------- pinned messages: shared with the other person (peer, group) or the teacher chat ---------- */
{const _n=v4Norm;v4Norm=function(kind,m,c){const r=_n(kind,m,c);if(r&&typeof r==="object")r.pin=kind==="chat"?!!m.pin:!!m.pinned_at;return r}}
async function zzPinSet(x,on){
  if(!x||!x.raw)return;const id=x.raw.id;
  try{
    if(x.kind==="peer"){await window.__peer.pin(id,on);x.raw.pinned_at=on?new Date().toISOString():null}
    else if(x.kind==="group"){
      const {error}=await grSB().rpc("pin_group_message",{p_id:id,p_on:!!on});
      if(error)throw new Error(/pin_group_message|schema cache/i.test(error.message||"")?"The teacher must first run the file supabase/groupes.sql in Supabase.":(error.message||"Could not pin"));
      x.raw.pinned_at=on?new Date().toISOString():null;
    }
    else{await write(function(){return S.db.doc(v4DocPath(x.kind,x.c,id)).update({pin:!!on})});x.raw.pin=!!on}
    toast(on?"Pinned":"Unpinned","check");
  }catch(e){toast((e&&e.message)||"Could not pin","x")}
  render();zzPinBar();
}
function zzPinOf(id){
  const el=document.querySelector('.msg[data-mid="'+String(id).replace(/"/g,"")+'"]');if(!el)return null;
  const kind=el.dataset.k,c=V4.ctx&&V4.ctx[kind];if(!c)return null;
  const raw=c.list().find(function(x){return String(x.id)===String(id)});
  return raw?{kind:kind,c:c,raw:raw}:null;
}
function zzPinBar(){
  const chat=document.querySelector(".glass.chat.zz-framed");if(!chat)return;
  const pinned=[...chat.querySelectorAll(".msg.zz-pn[data-mid]")];
  let bar=chat.querySelector(":scope > #zzPinBar");
  if(!pinned.length){if(bar)bar.remove();return}
  if(!bar){bar=document.createElement("div");bar.id="zzPinBar";const cs=chat.querySelector(":scope > #chatScroll");chat.insertBefore(bar,cs||chat.firstChild)}
  const html="<b>📌 "+pinned.length+" pinned</b>"+pinned.map(function(m){
    const c=m.cloneNode(true);c.querySelectorAll("span,.zzdl,.v4quote,.zz-pinb,i,button").forEach(function(n){n.remove()});
    let t=(c.textContent||"").trim().replace(/\s+/g," ").slice(0,70);
    if(!t)t=m.querySelector("video,.fvid")?"🎬 Video":m.querySelector("img,.v4img")?"📷 Photo":"Message";
    return '<div class="zz-pr"><button type="button" data-zzpj="'+esc(m.dataset.mid)+'">'+esc(t)+'</button><button type="button" class="zz-pru" data-zzpu="'+esc(m.dataset.mid)+'" aria-label="Unpin">×</button></div>';
  }).join("");
  if(bar.dataset.h!==html){bar.dataset.h=html;bar.innerHTML=html}
}
{let raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;try{zzPinBar()}catch(e){}})}).observe(document.body,{childList:true,subtree:true})}
window.addEventListener("click",function(e){
  const j=e.target&&e.target.closest&&e.target.closest("[data-zzpj]");
  if(j){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const t=document.getElementById("m-"+j.getAttribute("data-zzpj"));if(t){t.scrollIntoView({block:"center",behavior:"smooth"});t.classList.add("v4flash");setTimeout(function(){t.classList.remove("v4flash")},1200)}return}
  const u=e.target&&e.target.closest&&e.target.closest("[data-zzpu]");
  if(u){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();zzPinSet(zzPinOf(u.getAttribute("data-zzpu")),false);return}
  const b=e.target&&e.target.closest&&e.target.closest('[data-v4="fwdOne"],[data-v4="pinOne"]');if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const x=v4ActMsg();V4.act=null;render();if(!x)return;
  if(b.getAttribute("data-v4")==="fwdOne"){window.zzSelAct&&window.zzSelAct("fwd",[x.raw.id])}
  else zzPinSet(x,!x.m.pin);
},true);

/* ---------- story: several photos and videos, with one caption, reviewed like the chat selection ---------- */
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
{const _rp=zzReviewPaint;zzReviewPaint=function(){_rp();const R=ZZR;if(!R||R.kind!=="story")return;
  const foot=document.querySelector("#zzrv .zzrv-foot");if(!foot||foot.querySelector("#zzStCap"))return;
  foot.insertAdjacentHTML("afterbegin",'<input id="zzStCap" class="zzst-cap" maxlength="300" placeholder="Add a caption for these stories…" autocomplete="off">');
  const inp=foot.querySelector("#zzStCap");inp.value=R.cap||"";inp.addEventListener("input",function(){R.cap=inp.value})}}
async function zzStorySend(){
  const R=ZZR;if(!R||R.busy)return;
  const cap=((R.cap||"")+"").trim();
  const items=R.items.slice(),total=items.length;let done=0;
  /* close the picker, go to the home page, and send the stories from there */
  zzReviewClose();F.sc=null;S.view=null;S.tab="home";S.animate=true;scrollTo(0,0);render();
  zzProg("Sharing "+total+" stor"+(total>1?"ies":"y")+"…");
  try{
    for(const it of items){
      const media=await fUpload(it.file,it.d||0);
      const body=await fFix(cap,300);
      await window.__feed.story(media,body,"",{dur:5,aud:"all",hide:null});
      if(media)fRememberMedia(media);
      done++;
      zzProg("Sharing "+Math.min(done+1,total)+" / "+total+"…");
    }
    feedSync();
    toast(done>1?done+" stories shared! They stay 24 hours.":"Story shared! It stays 24 hours.","rocket");
    await feedLoad();
  }catch(e){
    toast(((e&&e.message)||"Could not share")+(done?" ("+done+" / "+total+" shared)":""),"x");
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
