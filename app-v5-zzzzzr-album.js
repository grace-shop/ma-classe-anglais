/* v5 · Plusieurs photos et vidéos envoyées ensemble : un seul message,
   affiché en grille (2 × 2, « +N » s'il y en a plus de 4). */
function albumParts(a){const items=((a&&a.items)||[]).filter(x=>x&&x.p);
  return {items,ni:items.filter(x=>x.k==="img").length,nv:items.filter(x=>x.k==="vid").length}}
function albumLabel(a){const {ni,nv}=albumParts(a);const b=[];
  if(ni)b.push(ni+(ni>1?" photos":" photo"));if(nv)b.push(nv+(nv>1?" vidéos":" vidéo"));return "📷 "+(b.join(", ")||"Médias")}
function albumHTML(a){const {items}=albumParts(a);const n=items.length;if(!n)return"";
  const show=items.slice(0,4),more=n-4;
  const data=esc(JSON.stringify(items.map(x=>({k:x.k,p:x.p,t:x.t,n:x.n,e:x.e||null}))));
  return`<div class="v4album n${Math.min(n,4)}" data-zzitems="${data}">${show.map((x,i)=>{const isV=x.k==="vid";const u=V4.obj[x.p];
    const inner=isV?`<video data-zzvid="${esc(x.p)}" data-t="${esc(x.t||"video/mp4")}" muted playsinline preload="metadata"></video><span class="v4al-play" aria-hidden="true">▶</span>`:(u?`<img src="${u}" alt="">`:`<img data-chatp="${esc(x.p)}" data-t="${esc(x.t||"image/jpeg")}" alt="">`);
    return`<button type="button" class="v4al-t${isV?" vid":""}" data-zzal="${i}" aria-label="${isV?"Open the video":"Open the photo"}">${inner}${i===3&&more>0?`<span class="v4al-more">+${more}</span>`:""}</button>`}).join("")}</div>`}
// the viewer follows the album: previous / next, swipe, one video at a time
function zzAlbumOpen(items,start){
  var old=document.getElementById("zzal");if(old)old.remove();
  var ov=document.createElement("div");ov.id="zzal";ov.className="zzal";
  ov.innerHTML='<div class="zzal-top"><button type="button" class="zzal-x" aria-label="Close">'+ic("x")+'</button><b class="zzal-n"></b></div><div class="zzal-w"></div><button type="button" class="zzal-p" aria-label="Previous">‹</button><button type="button" class="zzal-nx" aria-label="Next">›</button>';
  document.body.appendChild(ov);
  var cur=start,urls=[];
  function close(){urls.forEach(function(u){try{URL.revokeObjectURL(u)}catch(e){}});ov.remove()}
  function show(){
    var it=items[cur];if(!it)return;
    if(it.k==="vid"&&it.e){close();zzVidPlayEdited(it.p,it.t,it.e);return}
    ov.querySelector(".zzal-n").textContent=(cur+1)+" / "+items.length;
    ov.querySelector(".zzal-p").style.visibility=cur>0?"":"hidden";
    ov.querySelector(".zzal-nx").style.visibility=cur<items.length-1?"":"hidden";
    var w=ov.querySelector(".zzal-w");w.innerHTML='<div class="v4spin"></div>';
    var mine=cur;
    srcBlob({k:"m",id:it.p,t:it.t}).then(function(b){
      if(mine!==cur||!document.getElementById("zzal"))return;
      var u=URL.createObjectURL(b);urls.push(u);
      w.innerHTML=it.k==="vid"?'<video src="'+u+'" controls playsinline autoplay></video>':'<img src="'+u+'" alt="">';
    }).catch(function(){if(mine===cur)w.innerHTML='<p class="zzal-err">Cannot open this item.</p>'});
  }
  ov.querySelector(".zzal-x").onclick=close;
  ov.querySelector(".zzal-p").onclick=function(){if(cur>0){cur--;show()}};
  ov.querySelector(".zzal-nx").onclick=function(){if(cur<items.length-1){cur++;show()}};
  var x0=null;
  ov.addEventListener("touchstart",function(e){x0=e.touches[0].clientX},{passive:true});
  ov.addEventListener("touchend",function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;
    if(dx<-50&&cur<items.length-1){cur++;show()}else if(dx>50&&cur>0){cur--;show()}},{passive:true});
  show();
}
document.addEventListener("click",function(e){
  var b=e.target&&e.target.closest&&e.target.closest("[data-zzal]");if(!b)return;
  e.preventDefault();e.stopPropagation();
  var box=b.closest(".v4album"),items=[];try{items=JSON.parse(box.getAttribute("data-zzitems")||"[]")}catch(x){}
  zzAlbumOpen(items,+b.getAttribute("data-zzal")||0);
},true);
// video tiles show their first frame
setInterval(function(){document.querySelectorAll("video[data-zzvid]:not([data-ok])").forEach(function(v){
  v.setAttribute("data-ok","1");
  srcBlob({k:"m",id:v.getAttribute("data-zzvid"),t:v.getAttribute("data-t")}).then(function(b){v.src=URL.createObjectURL(b)+"#t=0.1"}).catch(function(){})})},900);
// a file without its type gets it from its name (videos from some galleries have none)
var ZZ_MIME={mp4:"video/mp4",m4v:"video/mp4",mov:"video/quicktime",webm:"video/webm","3gp":"video/3gpp",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",heic:"image/heic",pdf:"application/pdf"};
function zzFileOf(file,name){if(file.type)return file;const ext=String(name||file.name||"").split(".").pop().toLowerCase();const t=ZZ_MIME[ext];return t?new File([file],name||file.name||"file",{type:t}):file}
// sends the entries (file + optional video edit) as ONE message
async function v4SendAlbumItems(kind,target,entries,reply){
  if(!window.__chatFiles){toast("Sending files is not available here.","x");return}
  if(!navigator.onLine){toast("No network: try again when you are connected.","x");return}
  if(!target)return;
  V4.sending=true;V4.upl=kind;render();zzProg("Envoi de "+entries.length+" élément"+(entries.length>1?"s":"")+"…");
  let upDone=0;
  try{
    // all files go up at the same time; the order of the album is kept
    const done=await Promise.all(entries.map(async function(en){
      const file=en.file;
      if(file.size>50*1024*1024){toast("File too big (50 MB maximum).","x");return null}
      try{
        let f=zzFileOf(file);const isImg=/^image\//.test(f.type);
        if(isImg)f=await shrinkImg(f,1280,.72);
        const up=await window.__chatFiles.upload(f,file.name||(isImg?"photo.jpg":"video.mp4"));
        const k=isImg?"img":"vid";
        V4.obj[up.p]=URL.createObjectURL(f);fcPut("m:"+up.p,f);
        zzProg("Envoi "+(++upDone)+" / "+entries.length+"…");
        return {k,p:up.p,t:up.t,n:up.n,s:up.s,...(en.edit?{e:en.edit}:{})};
      }catch(e){toast((e&&e.message)||"Cannot send this file.","x");return null}
    }));
    const items=done.filter(Boolean);
    if(items.length){
      const inp=document.getElementById(V4IN(kind));let text=(inp&&inp.value||"").trim();if(inp){inp.value="";delete S.drafts[inp.id]}
      try{
        await v4Deliver(kind,target,text,{k:"album",items},reply);
      }catch(e){
        // the server does not know albums yet: the photos go one by one, the text with the first
        if(!/Invalid (attachment|album)/i.test((e&&e.message)||""))throw e;
        for(let i=0;i<items.length;i++){
          const it=items[i];
          await v4Deliver(kind,target,i===0?text:"",{k:it.k==="img"?"img":"file",p:it.p,t:it.t,n:it.n,s:it.s,...(it.e?{e:it.e}:{})},i===0?reply:null);
        }
      }
    }
  }catch(e){toast((e&&e.message)||"Cannot send right now.","x")}
  zzProgEnd();V4.sending=false;V4.upl=null;render()}
function zzProg(label){let b=document.getElementById("zzprog");if(!b){b=document.createElement("div");b.id="zzprog";b.className="zzprog";b.innerHTML='<span></span><i></i>';document.body.appendChild(b)}b.firstChild.textContent=label}
function zzProgEnd(){const b=document.getElementById("zzprog");if(b)b.remove()}
function v4SendAlbum(kind,target,files){return v4SendAlbumItems(kind,target,files.map(function(f){return{file:f}}),null)}

// ---- review before sending several media: touch one to edit it, × to drop it ----
var ZZR=null;
function zzReviewOpen(kind,target,files){
  zzReviewClose();
  ZZR={kind:kind,target:target,reply:v4TakeReply(kind),items:files.map(function(f){
    var vid=/^video\//.test(f.type)||/\.(mp4|webm|mov|3gp|m4v)$/i.test(f.name||"");
    return{file:f,video:vid,url:URL.createObjectURL(f),edit:null,editUrl:null,edited:false}})};
  var ov=document.createElement("div");ov.id="zzrv";ov.className="zzrv";
  ov.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest("[data-zzrv]");if(!b||!ZZR)return;
    e.preventDefault();e.stopPropagation();
    var a=b.getAttribute("data-zzrv"),i=+b.getAttribute("data-i");
    if(a==="cancel")zzReviewClose();
    else if(a==="rm"){ZZR.items.splice(i,1);if(!ZZR.items.length)zzReviewClose();else zzReviewPaint()}
    else if(a==="edit")zzReviewEdit(i);
    else if(a==="send")zzReviewSend();
  });
  document.body.appendChild(ov);zzReviewPaint();
}
function zzReviewPaint(){
  var ov=document.getElementById("zzrv");if(!ov||!ZZR)return;
  ov.innerHTML='<div class="zzrv-top"><button type="button" class="zzrv-x" data-zzrv="cancel" aria-label="Close">'+ic("x")+'</button><b>'+ZZR.items.length+' sélectionné'+(ZZR.items.length>1?'s':'')+'</b></div>'+
    '<p class="zzrv-h">Touchez un élément pour le modifier. × pour le retirer.</p>'+
    '<div class="zzrv-g">'+ZZR.items.map(function(it,i){
      var src=it.editUrl||it.url;
      var media=it.video&&!it.editUrl?'<video src="'+src+'#t=0.1" muted playsinline preload="metadata"></video>':'<img src="'+src+'" alt="">';
      return'<div class="zzrv-t"><button type="button" class="zzrv-e" data-zzrv="edit" data-i="'+i+'" aria-label="Edit">'+media+(it.video&&!it.editUrl?'<span class="zzrv-play">▶</span>':'')+(it.edit||it.edited?'<i class="zzrv-ed">Modifié</i>':'')+'</button><button type="button" class="zzrv-rm" data-zzrv="rm" data-i="'+i+'" aria-label="Remove">×</button></div>';
    }).join('')+'</div>'+
    '<div class="zzrv-foot"><button type="button" class="zzrv-go" data-zzrv="send">Envoyer ('+ZZR.items.length+')</button></div>';
}
function zzReviewEdit(i){
  var it=ZZR&&ZZR.items[i];if(!it||!window.__zzPhotoEdit)return;
  var ov=document.getElementById("zzrv");if(ov)ov.style.display="none";
  var back=setInterval(function(){if(!document.getElementById("zzPe")){clearInterval(back);var o=document.getElementById("zzrv");if(o)o.style.display=""}},300);
  if(it.video){
    zzVidPoster(it.file).then(function(b){
      var u=URL.createObjectURL(b);
      window.__zzPhotoEdit.open(u,function(still){
        if(!ZZR||ZZR.items[i]!==it)return;
        var L=window.__zzLastEdit;it.edit=L?JSON.parse(JSON.stringify(L)):null;
        it.editUrl=URL.createObjectURL(still);it.edited=true;zzReviewPaint();
      },"text");
    }).catch(function(){toast("Vidéo illisible.","x");zzReviewPaint()});
  }else{
    window.__zzPhotoEdit.open(it.url,function(file){
      if(!ZZR||ZZR.items[i]!==it)return;
      try{URL.revokeObjectURL(it.url)}catch(x){}
      it.file=file;it.url=URL.createObjectURL(file);it.edited=true;zzReviewPaint();
    },"text");
  }
}
function zzReviewClose(){var ov=document.getElementById("zzrv");if(ov)ov.remove();
  if(ZZR){ZZR.items.forEach(function(it){try{URL.revokeObjectURL(it.url)}catch(e){}});ZZR=null}}
function zzReviewSend(){
  var R=ZZR;if(!R)return;
  var entries=R.items.map(function(it){return{file:it.file,edit:it.video?it.edit:null}});
  var ov=document.getElementById("zzrv");if(ov)ov.remove();ZZR=null;
  v4SendAlbumItems(R.kind,R.target,entries,R.reply);
}
{
  const st=document.createElement("style");st.id="zzzzzrAlbum";
  st.textContent=`
.v4album{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:min(260px,70vw);border-radius:14px;overflow:hidden;margin:2px 0 4px}
.v4album.n1{grid-template-columns:1fr}
.v4al-t{position:relative;display:block;width:100%;height:0;padding:0 0 100% 0;margin:0;border:0;background:#2a2a33;cursor:pointer;overflow:hidden}
.v4album.n1 .v4al-t{padding-bottom:75%}
.v4al-t img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
.v4al-t.vid{background:#15161b}
.v4al-t video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
.zzprog{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:10070;background:#1B1D24;color:#fff;border-radius:999px;padding:9px 16px;font:700 14px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:90vw}
.zzprog i{display:block;height:3px;border-radius:3px;background:#A78BFA;margin-top:6px;width:100%}
.zzrv{position:fixed;inset:0;z-index:10040;background:#0B0D12;color:#fff;display:flex;flex-direction:column;font:600 15px system-ui,sans-serif}
.zzrv-top{display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 10px}
.zzrv-x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;display:grid;place-items:center;cursor:pointer}
.zzrv-h{margin:0 14px 10px;opacity:.7;font-size:13px}
.zzrv-g{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 4px 90px}
.zzrv-t{position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden;background:#222}
.zzrv-e{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:none;cursor:pointer}
.zzrv-t img,.zzrv-t video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.zzrv-play{position:absolute;inset:0;display:grid;place-items:center;font-size:26px;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.zzrv-ed{position:absolute;left:6px;bottom:6px;font:700 11px system-ui,sans-serif;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:8px;font-style:normal}
.zzrv-rm{position:absolute;top:4px;right:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:18px;line-height:24px;cursor:pointer;z-index:2}
.zzrv-foot{position:fixed;left:0;right:0;bottom:0;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));background:#0B0D12}
.zzrv-go{width:100%;padding:14px;border-radius:16px;border:0;background:#A78BFA;color:#0B0D12;font:800 16px system-ui,sans-serif;cursor:pointer}
.zzal{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;touch-action:pan-y}
.zzal-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 12px;background:linear-gradient(rgba(0,0,0,.6),transparent)}
.zzal-x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;display:grid;place-items:center;cursor:pointer}
.zzal-n{font:700 15px system-ui,sans-serif}
.zzal-w{width:100%;max-height:100vh;display:grid;place-items:center}
.zzal-w img,.zzal-w video{max-width:100%;max-height:86vh;object-fit:contain}
.zzal-p,.zzal-nx{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:26px;cursor:pointer}
.zzal-p{left:8px}.zzal-nx{right:8px}
.zzal-err{opacity:.8}
.v4al-play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:30px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.v4al-more{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45);color:#fff;font:700 28px system-ui,sans-serif}
.msg .v4album{white-space:normal}`;
  document.head.appendChild(st);
}
