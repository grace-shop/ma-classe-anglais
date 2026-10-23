/* v5 · Plusieurs photos et vidéos envoyées ensemble : un seul message,
   affiché en grille (2 × 2, « +N » s'il y en a plus de 4). */
function albumParts(a){const items=((a&&a.items)||[]).filter(x=>x&&x.p);
  return {items,ni:items.filter(x=>x.k==="img").length,nv:items.filter(x=>x.k==="vid").length}}
function albumLabel(a){const {ni,nv}=albumParts(a);const b=[];
  if(ni)b.push(ni+(ni>1?" photos":" photo"));if(nv)b.push(nv+(nv>1?" vidéos":" vidéo"));return "📷 "+(b.join(", ")||"Médias")}
function albumHTML(a){const {items}=albumParts(a);const n=items.length;if(!n)return"";
  const show=items.slice(0,4),more=n-4;
  return`<div class="v4album n${Math.min(n,4)}">${show.map((x,i)=>{const isV=x.k==="vid";const u=V4.obj[x.p];
    const inner=isV?`<span class="v4al-play" aria-hidden="true">▶</span>`:(u?`<img src="${u}" alt="">`:`<img data-chatp="${esc(x.p)}" data-t="${esc(x.t||"image/jpeg")}" alt="">`);
    return`<button type="button" class="v4al-t${isV?" vid":""}" data-v4="doc" data-k="m" data-id="${esc(x.p)}" data-t="${esc(x.t||(isV?"video/mp4":"image/jpeg"))}" data-n="${esc(x.n||(isV?"video.mp4":"photo.jpg"))}" aria-label="${isV?"Open the video":"Open the photo"}">${inner}${i===3&&more>0?`<span class="v4al-more">+${more}</span>`:""}</button>`}).join("")}</div>`}
// sends the selected media in order as ONE message
async function v4SendAlbum(kind,target,files){
  if(!window.__chatFiles){toast("Sending files is not available here.","x");return}
  if(!navigator.onLine){toast("No network: try again when you are connected.","x");return}
  if(!target)return;
  V4.sending=true;V4.upl=kind;render();
  try{
    // all files go up at the same time; the order of the album is kept
    const done=await Promise.all(files.map(async function(file){
      if(file.size>50*1024*1024){toast("File too big (50 MB maximum).","x");return null}
      try{
        let f=file;const isImg=/^image\//.test(f.type);
        if(isImg)f=await shrinkImg(f,1280,.72);
        const up=await window.__chatFiles.upload(f,file.name||(isImg?"photo.jpg":"video.mp4"));
        const k=isImg?"img":"vid";
        V4.obj[up.p]=URL.createObjectURL(f);fcPut("m:"+up.p,f);
        return {k,p:up.p,t:up.t,n:up.n,s:up.s};
      }catch(e){toast((e&&e.message)||"Cannot send this file.","x");return null}
    }));
    const items=done.filter(Boolean);
    if(items.length){
      const inp=document.getElementById(V4IN(kind));let text=(inp&&inp.value||"").trim();if(inp){inp.value="";delete S.drafts[inp.id]}
      await v4Deliver(kind,target,text,{k:"album",items},v4TakeReply(kind));
    }
  }catch(e){toast((e&&e.message)||"Cannot send right now.","x")}
  V4.sending=false;V4.upl=null;render()}
{
  const st=document.createElement("style");st.id="zzzzzrAlbum";
  st.textContent=`
.v4album{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:min(260px,70vw);border-radius:14px;overflow:hidden;margin:2px 0 4px}
.v4album.n1{grid-template-columns:1fr}
.v4al-t{position:relative;display:block;width:100%;height:0;padding:0 0 100% 0;margin:0;border:0;background:#2a2a33;cursor:pointer;overflow:hidden}
.v4album.n1 .v4al-t{padding-bottom:75%}
.v4al-t img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
.v4al-t.vid{background:#15161b}
.v4al-play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:30px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.v4al-more{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45);color:#fff;font:700 28px system-ui,sans-serif}
.msg .v4album{white-space:normal}`;
  document.head.appendChild(st);
}
