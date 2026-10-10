/* =====================================================================
   v4 — visionneuse intégrée (PDF, images) qui marche hors ligne,
   messageries riches (vocaux, photos, fichiers, stickers, emojis),
   reprise des conversations avec Nova, dossiers d'élèves par classe,
   corrigés rédigés par Nova (PDF, Word, image), quiz en images préparés
   par Nova, mots du jour personnels, pièces jointes des devoirs.
   ===================================================================== */
Object.assign(ICONS,{
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  play:'<path d="M8 5l11 7-11 7z"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  zin:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>',
  zout:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
  word:'<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M8.5 12l1.5 6 2-5 2 5 1.5-6"/>'
});
if(!ICONS.clip)ICONS.clip='<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>';
if(!ICONS.mic)ICONS.mic='<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';

const V4={cached:new Set(),pre:new Set(),obj:{},talkLogs:null,talkLoading:false,rec:null,panel:null,sending:false,upl:null,playing:null,audio:null,doc:null,
  canRec:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder),hwFiles:[],cor:null,aipics:undefined,aipBusy:false,words:false};
const v4uid=()=>"v"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtDur=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const fmtSize=b=>!b?"":b<1024*1024?Math.max(1,Math.round(b/1024))+" KB":(b/1048576).toFixed(1)+" MB";

/* ---------- styles ---------- */
document.head.insertAdjacentHTML("beforeend",`<style id="v4css">
.v4hide{display:none!important}
.docv{position:fixed;inset:0;z-index:9000;display:grid;grid-template-rows:auto 1fr;background:#0B0E1C;color:#EEF1FF}
.docv-top{display:flex;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) 12px 10px;background:rgba(18,22,44,.96);border-bottom:1px solid rgba(140,160,255,.18)}
.docv-top b{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.95rem}
.docv-top button{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(140,160,255,.3);background:rgba(110,130,255,.12);color:#EEF1FF;border-radius:12px;padding:8px 10px;font:inherit;font-weight:700;cursor:pointer}
.docv-top button svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.docv-top .x{border:0;background:none;padding:6px}
@media (max-width:480px){.docv-top button span{display:none}}
.docv-body{overflow:auto;-webkit-overflow-scrolling:touch;display:grid;justify-items:center;align-content:start;padding:12px 8px 40px;gap:10px;touch-action:pan-x pan-y pinch-zoom}
.docv-page{background:#fff;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.45);max-width:none}
.docv-img{max-width:100%;height:auto;border-radius:8px;background:#fff}
.docv-msg{display:grid;justify-items:center;gap:14px;text-align:center;max-width:420px;margin:12vh auto 0;color:#C9CFEA;line-height:1.5}
.docv-msg svg{width:48px;height:48px;fill:none;stroke:#93ABFF;stroke-width:1.6}
.docv-wait{display:flex;align-items:center;gap:10px;margin-top:20vh;color:#C9CFEA}
.v4spin{width:22px;height:22px;border-radius:50%;border:3px solid rgba(147,171,255,.25);border-top-color:#93ABFF;animation:v4spin 1s linear infinite}
@keyframes v4spin{to{transform:rotate(360deg)}}
.docbtn{gap:8px}.docbtn .chip{margin-left:4px}
button.scanimg{border:0;padding:0;background:none;cursor:zoom-in;display:block}
.offchip{font-size:.72rem;padding:2px 8px}
/* messageries */
.v4bar{align-items:center}
.v4bar .iconbtn{flex:none}
.v4bar .iconbtn.on{background:var(--ink-soft);color:var(--ink)}
.v4bar label.iconbtn{cursor:pointer}
.chatbar.v4bar input{min-width:0;flex:1}
.v4panel{margin:0 0 8px;padding:10px;display:grid;gap:8px;border-radius:18px}
.v4tabs{display:flex;align-items:center;gap:6px}.v4tabs .iconbtn{margin-left:auto}
.v4grid{display:grid;gap:6px;max-height:220px;overflow:auto}
.v4grid.emo{grid-template-columns:repeat(auto-fill,minmax(42px,1fr))}
.v4grid.stk{grid-template-columns:repeat(auto-fill,minmax(68px,1fr))}
.v4grid button{border:0;background:var(--surface2);border-radius:12px;padding:6px;cursor:pointer;font-size:1.5rem;line-height:1;display:grid;place-items:center;aspect-ratio:1}
.v4grid button:hover{background:var(--ink-soft);transform:scale(1.06)}
.v4grid img,.v4grid .e3d{width:100%;height:auto;max-width:54px}
.v4grid.emo .e3d{width:30px;height:30px}
.msg .v4stk{width:110px;height:110px;object-fit:contain;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.25))}
.msg.stk{background:none!important;box-shadow:none!important;border:0!important;padding:0!important}
.msg .msg-emo{font-size:2.2rem;line-height:1.15}.msg .msg-emo .e3d{width:44px;height:44px}
.msg .e3d{width:1.35em;height:1.35em;vertical-align:-.3em}
.v4img{border:0;padding:0;background:none;cursor:zoom-in;display:block}
.v4img img{max-width:min(240px,62vw);max-height:280px;border-radius:14px;display:block;background:rgba(0,0,0,.08);min-width:120px;min-height:90px;object-fit:cover}
.v4file{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:14px;padding:8px 12px;cursor:pointer;text-align:left;max-width:260px;font:inherit}
.v4file b{display:block;font-size:.88rem;word-break:break-word}.v4file small{color:var(--muted)}
.v4voice{display:flex;align-items:center;gap:10px;min-width:200px}.v4voice small{margin-left:auto}
.v4voice button{width:40px;height:40px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:linear-gradient(135deg,#6C80FF,#9A7CFF);color:#fff;flex:none}
.v4voice button svg{width:18px;height:18px;fill:currentColor;stroke:currentColor}
.v4bars{display:flex;align-items:center;gap:2px;height:26px;flex:1}
.v4bars .v4b{display:block;flex:none;width:3px;border-radius:2px;background:currentColor;opacity:.55;position:static}
.v4voice.on .v4bars .v4b{animation:v4eq .9s ease-in-out infinite alternate}
.v4voice.on .v4bars .v4b:nth-child(3n){animation-delay:.2s}.v4voice.on .v4bars .v4b:nth-child(3n+1){animation-delay:.45s}
@keyframes v4eq{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
.v4voice small{opacity:.75;font-family:var(--f-mono);font-size:.78rem}
.v4rec{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--line);background:var(--surface);min-width:0}
.chat{grid-template-columns:minmax(0,1fr)!important}.chat>*{min-width:0}.chatbar.v4bar{min-width:0}
.v4rec .btn{flex:none;padding-inline:16px}.v4rec .iconbtn{flex:none}
@media (max-width:460px){.v4rec-l{display:none}.v4wave i:nth-child(n+9){display:none}}
body:has(.glass.chat) #aiFab{display:none!important}
.v4rec b{white-space:nowrap}.v4rec-dot{width:12px;height:12px;border-radius:50%;background:#E5484D;animation:v4blink 1s infinite}
@keyframes v4blink{50%{opacity:.25}}
.v4wave{display:flex;gap:3px;align-items:center;flex:1 1 0;min-width:0;height:24px;color:#E5484D;overflow:hidden}
.v4wave i{width:3px;height:100%;background:currentColor;border-radius:2px;animation:v4eq .7s ease-in-out infinite alternate}
.v4wave i:nth-child(2n){animation-delay:.25s}.v4wave i:nth-child(3n){animation-delay:.5s}
.msg .v4voice,.msg .v4file,.msg .v4img,.msg .v4stk{white-space:normal}
.msg .v4voice span,.msg .v4file span,.msg .v4bars{margin:0;opacity:1;font-size:inherit}
.msg .v4bars{display:flex}.msg .v4bars .v4b{display:block;margin:0;opacity:.55}
.msg .v4file span{display:block}.msg .v4file small{font-size:.75rem}
@media (max-width:520px){.talk-h>.chip{display:none}.talk-h-last{max-width:58vw}}
.v4upl{font-size:.82rem;color:var(--muted);display:flex;align-items:center;gap:8px;padding:6px 12px}
/* dossiers */
.v4folders{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:4px 0 14px}
.v4folder{position:relative;display:grid;gap:4px;justify-items:start;text-align:left;padding:16px;border-radius:18px;border:1px solid var(--line);background:var(--glass-bg);color:var(--fg);cursor:pointer;font:inherit;box-shadow:var(--shadow);transition:transform .15s,border-color .15s}
.v4folder:hover{transform:translateY(-2px);border-color:var(--sky)}
.v4folder-ic{width:46px;height:38px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#F6C453,#E39B2D);color:#fff;box-shadow:0 6px 16px rgba(227,155,45,.35)}
.v4folder-ic svg{width:24px;height:24px;fill:rgba(255,255,255,.25);stroke:#fff;stroke-width:1.8}
.v4folder b{font-size:1.02rem}.v4folder small{color:var(--muted);display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.v4folder .chip{position:absolute;top:10px;right:10px}
.v4crumb{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}
/* historique Nova */
.talk-h{cursor:pointer}.talk-h-ic{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--sky-soft);flex:none;font-size:1.3rem}
.talk-h-ic .e3d{width:28px;height:28px}.talk-h .txt{display:grid;gap:2px}.talk-h-last{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52vw}
/* mots du jour */
.v4wl{display:grid;gap:8px}
.v4w{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--surface2);border:1px solid var(--line)}
.v4w b{font-size:1.02rem}.v4w .small{display:block}
.v4w.known{opacity:.55}
/* corrigés Nova + propositions d'images */
.v4modal{position:fixed;inset:0;z-index:8500;background:var(--overlay,rgba(10,12,30,.5));display:grid;place-items:center;padding:12px;overflow:auto}
.v4modal>.glass{width:min(820px,100%);max-height:calc(100vh - 24px);overflow:auto;display:grid;gap:14px;padding:clamp(16px,3vw,26px);background:var(--surface)!important;backdrop-filter:none!important}
.aip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.aip{display:grid;justify-items:center;gap:4px;padding:10px;border-radius:14px;background:var(--surface2);text-align:center;font-size:.85rem}
.aip .e3d{width:56px;height:56px}
.pemo-th{font-size:3rem;display:grid;place-items:center;height:110px}.pemo-th .e3d{width:80px;height:80px}
.hwfiles{display:flex;gap:8px;flex-wrap:wrap}
/* bouton de téléchargement de l'application */
.dl-card2{position:relative;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;padding:clamp(16px,3vw,24px);border-radius:24px;overflow:hidden;color:#EEF1FF;
  background:radial-gradient(120% 140% at 0% 0%,#2A3A9E 0%,#141A3C 55%,#0D1128 100%);border:1px solid rgba(140,160,255,.35);box-shadow:0 24px 60px -24px rgba(70,95,230,.75)}
.dl-card2::before{content:"";position:absolute;width:260px;height:260px;right:-80px;top:-120px;border-radius:50%;background:radial-gradient(circle,rgba(79,209,232,.35),transparent 70%);pointer-events:none}
.dl-card2 .dl-app{width:72px;height:72px;border-radius:20px;box-shadow:0 12px 30px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.12)}
.dl-card2 h3{margin:0;color:#fff;font-size:1.2rem}.dl-card2 p{margin:4px 0 0;color:#B9C1E6;font-size:.9rem;line-height:1.45}
.dl-card2 .dl-row{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap}
.dl-card2 .dl-go{display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:800;color:#06091c;background:linear-gradient(135deg,#8EA0FF,#B49BFF 55%,#6FE3F0);box-shadow:0 12px 30px -10px rgba(120,140,255,.95);transition:transform .15s}
.dl-card2 .dl-go:hover{transform:translateY(-2px)}
.dl-card2 .dl-go svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4}
.dl-card2 .dl-go small{display:block;font-weight:600;font-size:.72rem;opacity:.75}
.dl-card2 .dl-alt{display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border-radius:999px;border:1px solid rgba(160,175,255,.45);background:rgba(110,130,255,.12);color:#EEF1FF;font:inherit;font-weight:700;cursor:pointer}
.dl-card2 .dl-feat{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}
.dl-card2 .dl-feat span{font-size:.78rem;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:#D5DBFA}
</style>`);

/* =====================================================================
   1. Fichiers gardés sur l'appareil + visionneuse intégrée
   ===================================================================== */
const FC="mca-files-v1",fcKey=k=>"https://mca-cache.local/"+encodeURIComponent(k);
async function fcGet(k){try{if(!window.caches)return null;const c=await caches.open(FC),r=await c.match(fcKey(k));if(!r)return null;V4.cached.add(k);return await r.blob()}catch(e){return null}}
async function fcPut(k,b){try{if(!window.caches||!b)return;const c=await caches.open(FC);await c.put(fcKey(k),new Response(b,{headers:{"Content-Type":b.type||"application/octet-stream"}}));V4.cached.add(k)}catch(e){}}
(async()=>{try{if(!window.caches)return;const c=await caches.open(FC);for(const r of await c.keys())V4.cached.add(decodeURIComponent(r.url.split("/").pop()))}catch(e){}})();
async function srcURL(src){if(src.k==="a")return blobURL(src.id);if(src.k==="c")return await window.__copies.url(src.id);if(src.k==="m")return await window.__chatFiles.url(src.id);throw new Error("source")}
async function srcBlob(src){const key=src.k+":"+src.id;let b=await fcGet(key);if(b)return b;
  const r=await fetch(await srcURL(src));if(!r.ok)throw new Error("http "+r.status);b=await r.blob();
  if(src.t&&(!b.type||b.type==="application/octet-stream"||b.type==="binary/octet-stream"))b=new Blob([b],{type:src.t});
  await fcPut(key,b);return b}
const offChip=key=>V4.cached.has(key)?`<span class="chip ok offchip">${ic("check")}Offline</span>`:"";
const EXT={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","audio/webm":"webm","audio/mp4":"m4a","audio/ogg":"ogg","audio/mpeg":"mp3","application/msword":"doc","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","text/plain":"txt"};
function fileNameOf(label,type){const m=String(label||"").match(/\(([^()]+\.[a-z0-9]{2,5})\)\s*$/i);if(m)return m[1];const base=String(label||"document").replace(/^(Ouvrir (le |la )?|Open (the )?)/i,"").replace(/[\\/:*?"<>|]+/g,"").trim().slice(0,60)||"document";const ext=EXT[type]||"";return ext&&!base.toLowerCase().endsWith("."+ext)?base+"."+ext:base}
async function loadPdfJs(){if(window.pdfjsLib)return window.pdfjsLib;
  const tries=window.__STANDALONE?[["vendor/pdf.js","vendor/pdf.worker.js"],["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js","https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"]]:[["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js","https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"]];
  for(const[js,wk]of tries){try{await new Promise((res,rej)=>{const s=document.createElement("script");s.src=js;s.onload=res;s.onerror=rej;document.head.appendChild(s)});if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=wk;return window.pdfjsLib}}catch(e){}}
  throw new Error("pdfjs")}
function closeDoc(){const o=document.getElementById("docv");if(o)o.remove();document.documentElement.style.overflow="";if(V4.docUrl){try{URL.revokeObjectURL(V4.docUrl)}catch(e){}V4.docUrl=null}V4.doc=null;V4.pdf=null}
async function openDoc(src,label){closeDoc();const name=fileNameOf(label,src.t);
  const o=document.createElement("div");o.id="docv";o.className="docv";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label",name);
  o.innerHTML=`<div class="docv-top"><button class="x" data-v4="docClose" aria-label="Close">${ic("left")}</button><b>${esc(name)}</b><span id="docvZoom"></span><button data-v4="docSave" aria-label="Save to this device">${ic("download")}<span>Save</span></button></div><div class="docv-body" id="docvBody"><div class="docv-wait"><span class="v4spin"></span>Opening…</div></div>`;
  document.body.appendChild(o);document.documentElement.style.overflow="hidden";
  let b;try{b=await srcBlob(src)}catch(e){const body=document.getElementById("docvBody");if(body)body.innerHTML=`<div class="docv-msg">${ic("wifi")}<p>${navigator.onLine?"This file cannot be opened right now. Try again in a moment.":"No connection, and this file is not saved on this device yet.<br>Open it once with Internet: then it will stay available <b>offline</b>."}</p></div>`;return}
  if(!document.getElementById("docv"))return;V4.doc={blob:b,name};render();
  const body=document.getElementById("docvBody"),t=b.type||src.t||"";
  if(/^image\//.test(t)){const u=URL.createObjectURL(b);V4.docUrl=u;body.innerHTML=`<img class="docv-img" src="${u}" alt="${esc(name)}">`;return}
  if(/^audio\//.test(t)){const u=URL.createObjectURL(b);V4.docUrl=u;body.innerHTML=`<div class="docv-msg"><audio controls src="${u}" style="width:min(420px,90vw)"></audio></div>`;return}
  if(t==="application/pdf"||/\.pdf$/i.test(name)){try{const lib=await loadPdfJs();const doc=await lib.getDocument({data:new Uint8Array(await b.arrayBuffer()),isEvalSupported:false}).promise;if(!document.getElementById("docv"))return;V4.pdf={doc,zoom:1};drawPdf()}
    catch(e){body.innerHTML=`<div class="docv-msg">${ic("file")}<p>This PDF cannot be shown here. Save it and open it with another app.</p><button class="btn" data-v4="docSave">${ic("download")}Save the file</button></div>`}return}
  body.innerHTML=`<div class="docv-msg">${ic(/word|msword/.test(t)?"word":"file")}<p><b>${esc(name)}</b><br>This type of file opens with another app (Word, WPS…).</p><button class="btn" data-v4="docSave">${ic("download")}Save the file</button></div>`}
async function drawPdf(){const P=V4.pdf,body=document.getElementById("docvBody");if(!P||!body)return;const my=P.run=(P.run||0)+1;
  const z=document.getElementById("docvZoom");if(z)z.innerHTML=`<button data-v4="docZoom" data-k="-1" aria-label="Zoom out">${ic("zout")}</button> <button data-v4="docZoom" data-k="1" aria-label="Zoom in">${ic("zin")}</button>`;
  body.innerHTML=`<div id="docvPages" style="display:grid;gap:10px;justify-items:center"></div>`;const box=document.getElementById("docvPages");
  const w=Math.min(body.clientWidth-16,980)*P.zoom,dpr=Math.min(2,window.devicePixelRatio||1),n=Math.min(P.doc.numPages,120);
  for(let i=1;i<=n;i++){if(P.run!==my||!document.getElementById("docvPages"))return;const page=await P.doc.getPage(i),v0=page.getViewport({scale:1}),sc=w/v0.width,vp=page.getViewport({scale:sc*dpr});
    const c=document.createElement("canvas");c.className="docv-page";c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);c.style.width=Math.floor(vp.width/dpr)+"px";box.appendChild(c);
    try{await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise}catch(e){}}
  if(P.doc.numPages>n)box.insertAdjacentHTML("beforeend",`<p class="docv-msg">The last ${P.doc.numPages-n} pages are not shown: save the file to see everything.</p>`)}
async function docSave(){const d=V4.doc;if(!d)return;try{if(S.dl&&S.dl.save){await S.dl.save({filename:d.name,data:d.blob});toast("File saved","download")}else{const a=document.createElement("a");a.href=URL.createObjectURL(d.blob);a.download=d.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}}catch(e){toast("Could not save the file.","x")}}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById("docv"))closeDoc()});
addEventListener("popstate",()=>{if(document.getElementById("docv"))closeDoc()});
openCopy=function(p,t){openDoc({k:"c",id:p,t},isImg(t)?"answer-sheet.jpg":"answer-sheet.pdf")};

/* téléchargement automatique des sujets pour le hors ligne (élèves) */
function v4FilesToKeep(){const out=[];if(S.mode!=="student"||!S.me)return out;
  const eps=typeof byLevel==="function"?byLevel(S.eps||[]):(S.eps||[]);
  for(const e of eps){if(e.fileId)out.push({k:"a",id:e.fileId,t:e.fileType});const cp=e.corrigeVisible&&e.corrigePublic;if(cp&&cp.fileId)out.push({k:"a",id:cp.fileId,t:cp.fileType})}
  for(const h of (S.homework||[]).filter(x=>typeof visible!=="function"||visible(x)))for(const f of h.files||[])out.push({k:"a",id:f.id,t:f.type});
  return out}
async function v4Prefetch(){if(V4.prefetching||!navigator.onLine||LITE||!S.uid)return;const cn=navigator.connection;if(cn&&(cn.saveData||/(^|-)2g$/.test(cn.effectiveType||"")))return;
  V4.prefetching=true;let n=0;try{for(const it of v4FilesToKeep().slice(0,30)){const key=it.k+":"+it.id;if(V4.cached.has(key)||V4.pre.has(key))continue;V4.pre.add(key);try{await srcBlob(it);n++}catch(e){}if(!navigator.onLine)break}}finally{V4.prefetching=false}if(n)render()}
setTimeout(v4Prefetch,9000);setInterval(v4Prefetch,60000);addEventListener("online",()=>setTimeout(v4Prefetch,4000));

/* =====================================================================
   2. Messageries : vocaux, photos, fichiers, stickers, emojis
   ===================================================================== */
const V4EMO="😀 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 😇 🙂 😉 😢 😭 😡 😱 🤔 🙄 😴 🤗 🤭 😅 👍 👎 👏 🙏 💪 👋 ✌️ 🤝 👌 ❤️ 💙 💚 💛 💜 🔥 ⭐ ✨ 🎉 🎂 🎁 📚 ✏️ 📝 ✅ ❌ 💯 🏆 ⚽ 🎵 ☀️ 🌧️ 🍕 🍚 🥭 🇹🇬".split(" ");
const V4STK=["1f600","1f602","1f60d","1f929","1f60c","1f622","1f62d","1f621","1f914","1f633","1f632","1f634","1f971","1f629","1f62c","1f44f","1f44b","1f64f","1f4aa","1f91d","2764","1f525","2b50","1f388","1f381","1f3c6","1f393","1f4da","1f4dd","2705","1f680","1f916","1f47d","1f431","1f436","1f981","1f98b","26bd","1f355","1f366","2600","1f308"].filter(c=>{try{return EMO_SET.has(c)}catch(e){return false}});
function attLabel(a){if(!a)return"";return a.k==="voice"?"🎤 Voice message":a.k==="img"?"📷 Photo":a.k==="sticker"?"Sticker":"📎 "+(a.n||"File")}
const onlyEmoji=t=>{const s=String(t||"").trim();if(!s||s.length>16)return false;try{return/^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(s)}catch(e){return false}};
function voiceHTML(a){const on=V4.playing===a.p;return`<div class="v4voice${on?" on":""}"><button type="button" data-v4="play" data-p="${esc(a.p)}" data-t="${esc(a.t||"audio/webm")}" aria-label="${on?"Pause":"Listen to the voice message"}">${ic(on?"pause":"play")}</button><span class="v4bars" aria-hidden="true">${[5,9,14,8,18,11,6,15,20,9,13,7,16,10,5,12].map(h=>`<span class="v4b" style="height:${h}px"></span>`).join("")}</span><small>${fmtDur(a.d)}</small></div>`}
function msgBodyHTML(text,a){let h="";
  if(a&&typeof a==="object"){if(a.k==="sticker")h+=`<img class="v4stk" src="img/${esc(a.e)}.webp" alt="Sticker" loading="lazy" draggable="false">`;
    else if(a.k==="voice")h+=voiceHTML(a);
    else if(a.k==="img"){const u=V4.obj[a.p];h+=`<button type="button" class="v4img" data-v4="doc" data-k="m" data-id="${esc(a.p)}" data-t="${esc(a.t||"image/jpeg")}" data-n="${esc(a.n||"photo.jpg")}" aria-label="See the photo"><img ${u?`src="${u}"`:`data-chatp="${esc(a.p)}" data-t="${esc(a.t||"")}"`} alt="Photo"></button>`}
    else if(a.p)h+=`<button type="button" class="v4file" data-v4="doc" data-k="m" data-id="${esc(a.p)}" data-t="${esc(a.t||"")}" data-n="${esc(a.n||"file")}">${ic(/word/.test(a.t||"")?"word":"file")}<span><b>${esc(a.n||"File")}</b><small>${fmtSize(a.s)}${V4.cached.has("m:"+a.p)?" · offline":""}</small></span></button>`}
  if(text){const fx=v4Split(text);h+=fx?v4FixHTML(fx[0],fx[1],fx[2]):`<div class="${onlyEmoji(text)?"msg-emo":""}" style="white-space:pre-wrap">${E(text)}</div>`}
  return h}
const msgHTML=(mine,text,a,at)=>`<div class="msg ${mine?"mine":""}${a&&a.k==="sticker"&&!text?" stk":""}">${msgBodyHTML(text,a)}<span>${fmtTime(at)}</span></div>`;
async function hydrateChat(){for(const img of document.querySelectorAll("img[data-chatp]:not([data-ok])")){img.dataset.ok="1";const p=img.dataset.chatp;
  try{let u=V4.obj[p];if(!u){const b=await srcBlob({k:"m",id:p,t:img.dataset.t});u=V4.obj[p]=URL.createObjectURL(b)}img.src=u}catch(e){img.alt="Photo not available offline"}}}
document.addEventListener("load",e=>{const t=e.target;if(t&&t.tagName==="IMG"&&t.closest&&t.closest("#chatScroll")){const cs=document.getElementById("chatScroll");if(cs&&cs.scrollHeight-cs.scrollTop-cs.clientHeight<400)cs.scrollTop=cs.scrollHeight}},true);
new MutationObserver(()=>{clearTimeout(hydrateChat._t);hydrateChat._t=setTimeout(hydrateChat,60);if(typeof v4ChatLayout==="function"&&!v4ChatLayout._q){v4ChatLayout._q=1;requestAnimationFrame(()=>{v4ChatLayout._q=0;v4ChatLayout()})}}).observe(document.body,{childList:true,subtree:true});
async function v4Play(p,t){const A=V4.audio||(V4.audio=new Audio());if(V4.playing===p){A.pause();V4.playing=null;render();return}
  try{let u=V4.obj[p];if(!u){V4.playing=p;render();const b=await srcBlob({k:"m",id:p,t});u=V4.obj[p]=URL.createObjectURL(b)}A.src=u;A.onended=()=>{V4.playing=null;render()};V4.playing=p;await A.play();render()}
  catch(e){V4.playing=null;render();toast(navigator.onLine?"Cannot play audio on this device.":"This voice message is not saved on this device yet.","x")}}
function v4PanelHTML(kind,t){return`<div class="v4panel glass"><div class="v4tabs seg"><button type="button" data-v4="panel" data-k="${kind}" data-t="emo" aria-pressed="${t==="emo"}">Emojis</button><button type="button" data-v4="panel" data-k="${kind}" data-t="stk" aria-pressed="${t==="stk"}">Stickers 3D</button><button type="button" class="iconbtn sm" data-v4="panelClose" aria-label="Close">${ic("x")}</button></div>
  ${t==="emo"?`<div class="v4grid emo">${V4EMO.map(x=>`<button type="button" data-v4="emo" data-k="${kind}" data-e="${x}" aria-label="${x}">${E(x)}</button>`).join("")}</div>`:`<div class="v4grid stk">${v4Stickers().map(c=>`<button type="button" data-v4="stk" data-k="${kind}" data-e="${c}" aria-label="Send this sticker"><img src="img/${c}.webp" alt="" loading="lazy"></button>`).join("")}${v4LockedPacks().map(pk=>`<button type="button" class="lockpk" data-v4="packInfo" data-id="${pk.id}" aria-label="${esc(pk.t)} pack to unlock" title="Unlock it in the shop"><img src="img/${pk.e[0]}.webp" alt="" loading="lazy"></button>`).join("")}</div>${v4LockedPacks().length&&S.mode==="student"?`<span class="small muted">${v4LockedPacks().length} sticker pack${v4LockedPacks().length>1?"s":""} to unlock in the shop (greyed out).</span>`:""}`}</div>`}
const v4Stickers=()=>{const own=(S.me&&S.me.owned)||{},all=[...V4STK];if(typeof SH_PACKS!=="undefined")for(const pk of SH_PACKS)if(own[pk.id]||S.mode==="teacher")for(const c of pk.e)if(!all.includes(c))all.push(c);return all};
const v4LockedPacks=()=>{if(typeof SH_PACKS==="undefined"||S.mode!=="student")return[];const own=(S.me&&S.me.owned)||{};return SH_PACKS.filter(pk=>!own[pk.id])};
const V4IN=k=>({peer:"peerInput",chat:"chatInput",staff:"staffInput"})[k]||"chatInput",V4F=k=>({peer:"peerchat",chat:"chat",staff:"staffchat"})[k]||"chat";
function v4Bar(kind,target,ph){const inId=V4IN(kind),files=!!window.__chatFiles,rec=V4.rec&&V4.rec.kind===kind?V4.rec:null,pan=V4.panel&&V4.panel.kind===kind?V4.panel.t:null,busy=V4.sending||(kind==="peer"&&PR.sending);
  if(rec)return`<div class="v4rec" role="status"><span class="v4rec-dot" aria-hidden="true"></span><b><span class="v4rec-l">Recording </span><span id="v4recT">${fmtDur(rec.sec)}</span></b><span class="v4wave" aria-hidden="true">${"<i></i>".repeat(18)}</span><button type="button" class="iconbtn" data-v4="recCancel" aria-label="Cancel the voice message" title="Cancel">${ic("trash")}</button><button type="button" class="btn sm" data-v4="recSend" aria-label="Send the voice message">${ic("send")}Send</button></div>`;
  return`${pan?v4PanelHTML(kind,pan):""}${V4.reply&&V4.reply.kind===kind?`<div class="v4replybar"><div class="v4quote"><div class="v4q-w">Replying to ${esc(V4.reply.who)}</div><div class="v4q-t">${esc(V4.reply.t)}</div></div><button type="button" class="iconbtn sm" data-v4="replyX" aria-label="Cancel reply">${ic("x")}</button></div>`:""}${V4.upl===kind?`<div class="v4upl"><span class="v4spin"></span>Sending…</div>`:""}${V4.fixing===kind?`<div class="v4upl"><span class="v4spin"></span>Nova is checking your English…</div>`:""}<form class="chatbar v4bar" data-f="${V4F(kind)}" data-s="${esc(target)}">
  <button type="button" class="iconbtn${pan?" on":""}" data-v4="panel" data-k="${kind}" data-t="${pan||"emo"}" aria-label="Emojis and stickers" title="Emojis and stickers">${ic("smile")}</button>
  <input id="${inId}" placeholder="${esc(ph||"Write a message…")}" maxlength="1000" autocomplete="off" aria-label="Message">
  ${files?`<span class="v4att"><label class="iconbtn" title="Send a photo or a file" aria-label="Send a photo or a file">${ic("clip")}<input type="file" id="v4f_${kind}" hidden accept="image/*,video/*,application/pdf,audio/*,.doc,.docx,.ppt,.pptx,.txt"></label>${V4.canRec?`<button type="button" class="iconbtn" data-v4="rec" data-k="${kind}" aria-label="Record a voice message" title="Voice message">${ic("mic")}</button>`:""}</span>`:""}
  <button class="btn" type="submit" aria-label="Send" ${busy?"disabled":""}>${ic("send")}</button></form>`}
async function v4Deliver(kind,target,text,att,meta){
  if(kind==="staff")return staffSend(target,text,att,meta);
  if(kind==="peer"){const id=await window.__peer.send(target,text||"",att||null,meta||null);PR.inbox.unshift({id:id||("tmp"+Date.now()),sender:S.uid,receiver:target,body:text||"",att:att||null,meta:meta||null,created_at:new Date().toISOString(),read_at:null});render();return}
  const at=Date.now(),from=S.mode==="teacher"?"teacher":"student",pv=(v4Plain(text)||attLabel(att)).slice(0,80);
  await write(()=>S.db.collection("students/"+target+"/msgs").add({from,text:text||"",at,...(att?{att}:{}),...(meta&&meta.re?{re:meta.re}:{})}));
  await write(()=>S.db.doc("students/"+target).update(from==="teacher"?{lastMsgAt:at,lastMsgFrom:"teacher",lastMsgText:pv,teacherReadAt:at}:{lastMsgAt:at,lastMsgFrom:"student",lastMsgText:pv,studentReadAt:at,lastActive:at,activity:"Wrote to the teacher"}));
  if(from==="student")presence("Writing a message")}
function v4Target(kind){const f=document.querySelector(`form.v4bar[data-f="${V4F(kind)}"]`);return f?f.dataset.s:(V4.rec&&V4.rec.target)||(V4.panel&&V4.panel.target)||""}
async function v4SendFile(kind,target,file,name,k,dur,opt){opt=opt||{};if(!window.__chatFiles){toast("Sending files is not available here.","x");return}
  if(!navigator.onLine){toast("No network: try again when you are connected.","x");return}
  if(!target)return;if(file.size>50*1024*1024){toast("File too big (50 MB maximum).","x");return}
  let f=file;if(/^image\//.test(f.type)&&!/gif/.test(f.type))f=await shrinkImg(f,1280,.72);
  const kk=k||(/^image\//.test(f.type)?"img":"file");V4.sending=true;V4.upl=kind;render();
  try{const up=await window.__chatFiles.upload(f,name||f.name||"file");const att={k:kk,p:up.p,t:up.t,n:up.n,s:up.s,...(dur?{d:dur}:{}),...(opt.once&&kk==="img"?{o:true}:{})};
    if(kk!=="file"&&!opt.once){V4.obj[up.p]=URL.createObjectURL(f);fcPut("m:"+up.p,f)}
    let text="";if(opt.caption!=null)text=opt.once?"":String(opt.caption).trim();else if(kk!=="voice"){const inp=document.getElementById(V4IN(kind));text=(inp&&inp.value||"").trim();if(inp){inp.value="";delete S.drafts[inp.id]}}
    if(text&&v4NeedFix(text)){const r=await v4Check(text);if(r)text=v4Pack(text,r.en,r.k)}
    await v4Deliver(kind,target,text,att,v4TakeReply(kind))}
  catch(e){toast((e&&e.message)||"Cannot send right now.","x")}
  V4.sending=false;V4.upl=null;render()}
async function recStart(kind,target){if(V4.rec||!target)return;let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
  catch(e){toast(e&&(e.name==="NotAllowedError"||e.name==="SecurityError")?"Allow the microphone to send a voice message: tap the lock next to the address (or phone Settings → Apps → English Classes → Permissions → Microphone).":"Microphone not available on this device.","x");return}
  const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}})||"";
  let mr;try{mr=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:24000}:undefined)}catch(e){stream.getTracks().forEach(t=>t.stop());toast("Voice recording is not possible on this device.","x");return}
  const chunks=[];V4.panel=null;V4.rec={kind,target,mr,stream,chunks,start:Date.now(),sec:0,cancel:false};
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const r=V4.rec;V4.rec=null;if(r)clearInterval(r.timer);render();if(!r||r.cancel)return;const sec=Math.round((Date.now()-r.start)/1000);if(sec<1){toast("Voice message too short.","x");return}
    const type=String(mr.mimeType||mime||"audio/webm").split(";")[0],blob=new Blob(chunks,{type});v4SendFile(r.kind,r.target,blob,"voice."+(EXT[type]||"webm"),"voice",sec)};
  mr.start(250);V4.rec.timer=setInterval(()=>{const r=V4.rec;if(!r)return;r.sec=Math.round((Date.now()-r.start)/1000);const el=document.getElementById("v4recT");if(el)el.textContent=fmtDur(r.sec);if(r.sec>=180)recStop(false)},400);render()}
function recStop(cancel){const r=V4.rec;if(!r)return;r.cancel=!!cancel;try{r.mr.stop()}catch(e){V4.rec=null;render()}}

/* conversation privée prof ↔ élève / parent */
chatHTML=function(sid,me){const ready=S.chatFor===sid&&S.msgsReady;
  return`<div class="glass chat"><div class="msgs" id="chatScroll">${!ready?`<div class="muted" style="margin:auto">Loading…</div>`:S.msgs.length?v4MsgList("chat",S.msgs,v4Ctx("chat",sid,me)):`<div class="muted" style="margin:auto;text-align:center">No messages yet.<br>${me==="student"?"Ask your teacher a question in English. You can also send a voice message or a photo.":"Write the first message, or send a voice message, a photo or a file."}</div>`}</div>
  ${v4Bar("chat",sid,me==="student"?"Write to your teacher…":"Write a message…")}</div>`};
/* camarades */
peerChatView=function(){const id=S.view.id,me=S.uid,nm=peerName(id),msgs=PR.inbox.filter(m=>(m.sender===me&&m.receiver===id)||(m.sender===id&&m.receiver===me)).slice().reverse();
  return`<div class="section" style="max-width:720px;margin-inline:auto"><div><button class="back" data-a="peerBack">${ic("left")}Classmates</button></div><div class="row">${avatar(id,nm,48)}<div><span class="eyebrow">Classmate</span><h2>${esc(nm)}${S.peers[id]?` <span class="chip ok">Online</span>`:""}</h2></div></div>
  <div class="glass chat"><div class="msgs" id="chatScroll">${msgs.length?v4MsgList("peer",msgs,v4Ctx("peer",id)):`<div class="muted" style="margin:auto;text-align:center">No messages yet.<br>Say hello to ${esc(nm.split(" ")[0])}! You can write, or send a voice message, a photo, a file or a sticker.</div>`}</div>
  ${v4Bar("peer",id,"Write a message…")}</div>
  <p class="hint">Be polite and kind to your classmates. Write in English to practise!</p></div>`};

/* =====================================================================
   3. Nova : historique cliquable, on reprend la conversation
   ===================================================================== */
const TALK_LS=()=>"mca_talks_"+(S.uid||"x");
function talkLocal(){try{return JSON.parse(localStorage.getItem(TALK_LS())||"{}")||{}}catch(e){return{}}}
function talkSave(T){if(!T||S.mode!=="student"||!S.uid||!T.turns||!T.turns.length)return;if(!T.id)T.id="t"+v4uid();
  const sc=TALK_SC.find(x=>x.k===T.sc);
  const log={id:T.id,sc:T.sc,title:sc?sc.t:"Conversation",en:sc?sc.en:"",at:T.at||Date.now(),upd:Date.now(),strict:!!T.strict,paidN:T.paidN||0,
    turns:T.turns.slice(-80).map(t=>{const o={role:t.role,text:String(t.text||"").slice(0,900)};if(t.fr)o.fr=String(t.fr).slice(0,900);if(t.corr)o.corr=t.corr;if(t.praise)o.praise=t.praise;if(t.words&&t.words.length)o.words=t.words;return o}),
    summary:T.summary||null,n:T.turns.filter(t=>t.role==="me").length,fixes:T.turns.filter(t=>t.corr).length};
  try{const all=talkLocal();all[log.id]=log;const keep=Object.values(all).sort((a,b)=>(b.upd||0)-(a.upd||0)).slice(0,30);localStorage.setItem(TALK_LS(),JSON.stringify(Object.fromEntries(keep.map(x=>[x.id,x]))))}catch(e){}
  if(V4.talkLogs){const i=V4.talkLogs.findIndex(x=>x.id===log.id);if(i>=0)V4.talkLogs.splice(i,1);V4.talkLogs.unshift(log)}
  clearTimeout(talkSave._t);talkSave._t=setTimeout(()=>{try{S.db&&S.db.doc("students/"+S.uid+"/talklog/"+log.id).set(log).catch(()=>{})}catch(e){}},1500)}
async function talkLogsLoad(){if(V4.talkLogs||V4.talkLoading||!S.db||!S.uid)return;V4.talkLoading=true;let db=[];
  try{const s=await S.db.collection("students/"+S.uid+"/talklog").orderBy("upd","desc").limit(30).get();db=s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){}
  const m={};for(const x of[...db,...Object.values(talkLocal())])if(x&&x.id&&Array.isArray(x.turns)&&(!m[x.id]||(x.upd||0)>(m[x.id].upd||0)))m[x.id]=x;
  V4.talkLogs=Object.values(m).sort((a,b)=>(b.upd||0)-(a.upd||0));V4.talkLoading=false;render()}
function talkHistHTML(){if(!V4.talkLogs)talkLogsLoad();const logs=(V4.talkLogs||[]).slice(0,12),ids=new Set(logs.map(x=>x.id));
  const old=[...(S.me?.talks||[])].reverse().filter(h=>!h.id||!ids.has(h.id)).slice(0,4);if(!logs.length&&!old.length)return"";
  return`<div class="section"><div><span class="eyebrow">History</span><h2>My conversations</h2><p class="sub">Tap a conversation to read it again and continue where you stopped.</p></div><div class="glass list">
  ${logs.map(l=>{const sc=TALK_SC.find(x=>x.k===l.sc),last=[...l.turns].reverse()[0];return`<div class="it click talk-h" data-v4="talkResume" data-id="${esc(l.id)}" tabindex="0" role="button" aria-label="Continue the conversation ${esc(l.title)}"><span class="talk-h-ic" aria-hidden="true">${E(sc?sc.e:"💬")}</span><div class="txt" style="min-width:0"><b>${esc(l.title)}</b><span class="small muted">${fmtTime(l.upd)} · ${l.n} message${l.n>1?"s":""} · ${l.fixes} correction${l.fixes>1?"s":""}${l.summary?" · review done":""}</span>${last?`<span class="small talk-h-last">${last.role==="me"?"You: ":"Nova: "}${esc(String(last.text).slice(0,80))}</span>`:""}</div><span class="chip lvl">${ic("chat")}Continue</span><button class="iconbtn sm" data-v4="talkDel" data-id="${esc(l.id)}" aria-label="Delete this conversation" title="Delete">${ic("trash")}</button></div>`}).join("")}
  ${old.map(h=>{const sc=TALK_SC.find(x=>x.k===h.sc);return`<div class="it click talk-h" data-a="talkStart" data-k="${esc(h.sc||(TALK_SC[0]||{}).k||"")}" tabindex="0" role="button"><span class="talk-h-ic" aria-hidden="true">${E(sc?sc.e:"💬")}</span><div class="txt"><b>${esc(h.title)}</b><span class="small muted">${fmtDate(h.at)} · ${h.n} message${h.n>1?"s":""} · old conversation</span></div><span class="chip">${ic("refresh")}Do again</span></div>`}).join("")}</div></div>`}
function talkResume(id){const l=(V4.talkLogs||[]).find(x=>x.id===id)||talkLocal()[id];if(!l)return;
  S.talk={id:l.id,sc:l.sc,turns:l.turns.map(t=>({...t})),busy:false,strict:!!l.strict,at:l.at||Date.now(),paidN:l.paidN||0};
  S.view=null;S.tab="talk";S.animate=true;render();talkScroll();try{touch("Continues a conversation with Nova: "+(l.en||l.title))}catch(e){}
  const last=S.talk.turns[S.talk.turns.length-1];if(!last||last.role==="me")talkAsk(!last)}
function talkDel(id){try{const all=talkLocal();delete all[id];localStorage.setItem(TALK_LS(),JSON.stringify(all))}catch(e){}
  if(V4.talkLogs)V4.talkLogs=V4.talkLogs.filter(x=>x.id!==id);try{S.db.doc("students/"+S.uid+"/talklog/"+id).delete().catch(()=>{})}catch(e){}toast("Conversation deleted","trash");render()}
{const _ts=talkStart;talkStart=function(k){_ts(k);if(S.talk&&!S.talk.id)S.talk.id="t"+v4uid()}}
{const _ta=talkAsk;talkAsk=async function(start){const T=S.talk;await _ta(start);if(T&&T.turns&&T.turns.length)talkSave(T)}}
{const _tp=talkPickerHTML;talkPickerHTML=function(){const m=S.me;if(!m)return _tp();const keep=m.talks;m.talks=[];let h;try{h=_tp()}finally{m.talks=keep}return h+talkHistHTML()}}
talkReward=function(T){const n=T.turns.filter(t=>t.role==="me").length,paid=T.paidN||0;if(n<=paid){talkSave(T);return 0}
  const nn=n-paid;T.paidN=n;T.rewarded=true;const fixes=T.turns.filter(t=>t.corr).length,xp=Math.min(nn,10)*5+(nn>=5?20:0),sc=TALK_SC.find(x=>x.k===T.sc);if(!T.id)T.id="t"+v4uid();
  const entry={id:T.id,sc:T.sc,title:sc?.t||"Conversation",at:Date.now(),n,fixes,score:T.summary?.score||null,level:T.summary?.level||"",mistakes:T.turns.filter(t=>t.corr).slice(-3).map(t=>({wrong:t.corr.you||"",right:t.corr.better}))};
  const talks=[...(S.me?.talks||[]).filter(x=>x.id!==T.id),entry].slice(-40);
  gain(xp,`Spoke English with Nova (${sc?.en||"chat"}): ${nn} message${nn>1?"s":""}`,{talks});talkSave(T);return xp};

/* =====================================================================
   4. Dossiers d'élèves (par classe) pour les longues listes
   ===================================================================== */
const V4FOLD_MIN=12;
const v4FolderOf=s=>isParent(s)?"__parents":(String(s.classe||"").trim()||"__none");
const v4FName=k=>k==="__none"?"No class":k==="__parents"?"Parents":k;
function v4Folders(list){const m=new Map();for(const s of list){const k=v4FolderOf(s),f=m.get(k)||{k,n:0,on:0,un:0};f.n++;if(online(s))f.on++;if(teacherUnread(s))f.un++;m.set(k,f)}
  return[...m.values()].sort((a,b)=>(a.k.startsWith("__")-b.k.startsWith("__"))||a.k.localeCompare(b.k,"en",{numeric:true}))}
function v4FolderGrid(list,act,sel){return`<div class="v4folders">${v4Folders(list).map(f=>`<button class="v4folder${sel===f.k?" on":""}" data-v4="${act}" data-k="${esc(f.k)}"><span class="v4folder-ic" aria-hidden="true">${ic("folder")}</span><b>${esc(v4FName(f.k))}</b><small>${f.n} ${f.k==="__parents"?"parent":"student"}${f.n>1?"s":""}${f.on?` · <span class="dot on"></span>${f.on} online`:""}</small>${f.un?`<span class="chip bad">${f.un}</span>`:""}</button>`).join("")}</div>`}
const v4UseFolders=list=>list.length>V4FOLD_MIN&&v4Folders(list).length>1;
const v4DashFoldersOnly=st=>v4UseFolders(st)&&!S.drafts.st_cls&&!(S.drafts.st_q||"").trim()&&!stOnOff();
stFiltered=function(st){const q=(S.drafts.st_q||"").trim().toLowerCase(),cl=S.drafts.st_cls||"",on=stOnOff();if(v4DashFoldersOnly(st))return[];
  return[...st].filter(s=>(!q||(s.name||"").toLowerCase().includes(q))&&(!cl||v4FolderOf(s)===cl||(s.classe||"")===cl)&&(!on||online(s))).sort((a,b)=>(b.lastActive||0)-(a.lastActive||0))};
stToolbar=function(st,n){const useF=v4UseFolders(st),cl=S.drafts.st_cls||"";
  const top=`<div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px"><input id="st_q" type="search" placeholder="Search for a student…" value="${esc(S.drafts.st_q||"")}" style="flex:1;min-width:170px"><label class="row small" style="gap:6px;flex-wrap:nowrap"><input id="st_on" type="checkbox"${stOnOff()?" checked":""}>Online</label><span class="chip">${v4DashFoldersOnly(st)?st.length+" students":n+" / "+st.length}</span></div>`;
  if(!useF){const cls=[...new Set(st.map(s=>s.classe).filter(Boolean))].sort();return top.replace(`<label class="row small"`,`${cls.length>1?`<select id="st_cls"><option value="">All classes</option>${cls.map(c=>`<option value="${esc(c)}"${cl===c?" selected":""}>${esc(c)}</option>`).join("")}</select>`:""}<label class="row small"`)}
  if(cl)return top+`<div class="v4crumb"><button class="back" data-v4="dashFold" data-k="">${ic("left")}All folders</button><span class="chip">${ic("folder")}${esc(v4FName(cl))}</span></div>`;
  return top+(v4DashFoldersOnly(st)?`<p class="sub small" style="margin:0 0 8px">Your ${st.length} students are sorted by class. Open a folder, or search for a name above.</p>`+v4FolderGrid(st,"dashFold",""):"")};
/* conversations de la prof : dossiers aussi */
{const _mv=msgsView0;msgsView0=function(){const all=[...S.students,...S.parents];if(!v4UseFolders(all))return _mv();
  const sel=S.v4msgFold||"",q=(S.drafts.fq_msgs||"").trim().toLowerCase(),un=all.filter(teacherUnread);
  const list=(q?all.filter(s=>(s.name||"").toLowerCase().includes(q)):sel?all.filter(s=>v4FolderOf(s)===sel):[]).sort((a,b)=>(b.lastMsgAt||0)-(a.lastMsgAt||0));
  const row=s=>`<div class="thread" data-a="openChat" data-id="${s.id}" tabindex="0">${avatar(s.id,s.name)}<div class="txt"><b>${esc(s.name)}${isParent(s)?` <span class="chip">Parent${s.childName?" of "+esc(s.childName):""}</span>`:""}</b><span>${s.lastMsgAt?esc((s.lastMsgFrom==="teacher"?"You: ":"")+(s.lastMsgText||"New message")):"No messages"}</span></div><div class="row small muted">${s.lastMsgAt?fmtTime(s.lastMsgAt):""}${teacherUnread(s)?`<span class="chip bad">New</span>`:""}</div></div>`;
  return`<div class="section"><div><span class="eyebrow">Messages</span><h2>Conversations</h2><p class="sub">Each conversation is private between you and the student or parent. Students are sorted by class.</p></div>
  <input id="fq_msgs" type="search" placeholder="Search for a student or a parent…" value="${esc(S.drafts.fq_msgs||"")}" style="margin-bottom:12px">
  ${!q&&!sel&&un.length?`<div><span class="eyebrow">Unread · ${un.length}</span></div><div class="glass list" style="margin:8px 0 16px">${un.sort((a,b)=>(b.lastMsgAt||0)-(a.lastMsgAt||0)).slice(0,20).map(row).join("")}</div>`:""}
  ${q?"":sel?`<div class="v4crumb"><button class="back" data-v4="msgFold" data-k="">${ic("left")}All folders</button><span class="chip">${ic("folder")}${esc(v4FName(sel))} · ${list.length}</span></div>`:v4FolderGrid(all,"msgFold","")}
  ${q||sel?(list.length?`<div class="glass list">${list.slice(0,S.v4msgLim||40).map(row).join("")}</div>${moreBtn(Math.min(list.length,S.v4msgLim||40),list.length,"v4msgMore")}`:`<div class="empty">No one matches.</div>`):""}</div>`}}

/* =====================================================================
   5. Nova rédige le corrigé (épreuve ou devoir) : PDF, Word, image
   ===================================================================== */
function corItem(kind,id){return kind==="epreuves"?S.eps.find(x=>x.id===id):S.homework.find(x=>x.id===id)}
async function pdfToImages(blob,max=3){const lib=await loadPdfJs(),doc=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false}).promise,out=[];
  for(let i=1;i<=Math.min(max,doc.numPages);i++){const p=await doc.getPage(i),v0=p.getViewport({scale:1}),vp=p.getViewport({scale:Math.min(2,1400/v0.width)}),c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;
    const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);await p.render({canvasContext:g,viewport:vp}).promise;out.push(await new Promise(r=>c.toBlob(r,"image/jpeg",.8)))}return out.filter(Boolean)}
async function itemImages(x){const imgs=[];const files=[];if(x.fileId)files.push({id:x.fileId,type:x.fileType});for(const f of x.files||[])files.push({id:f.id,type:f.type});
  for(const f of files.slice(0,3)){try{const b=await srcBlob({k:"a",id:f.id,t:f.type});if(/^image\//.test(b.type||f.type))imgs.push(b);else if((b.type||f.type)==="application/pdf")imgs.push(...await pdfToImages(b,3))}catch(e){}if(imgs.length>=4)break}return imgs.slice(0,4)}
async function aiCorrige(kind,id){const x=corItem(kind,id);if(!x||!AI.sample)return;V4.cor={kind,id,busy:true,text:"",err:""};v4CorModal();
  try{const imgs=await itemImages(x),body=kind==="epreuves"?(x.sujet||""):(x.instructions||"");
    if(!body.trim()&&!imgs.length)throw{code:"empty",message:"The test is empty: add the text or a file."};
    const prompt=`You are an experienced English teacher in Togo (APC programme). Write the FULL, detailed ANSWER KEY (corrigé) for ${kind==="epreuves"?"this test":"this homework"} for students at level ${x.level||"A2"}${x.exam?" ("+x.exam+")":""}.
Title: ${x.title}
${body.trim()?"Test (text):\n"+body.slice(0,12000):"The test is in the attached images."}
Writing instructions:
- Write ONLY in English. Never use French.
- Go through each part and each question in order (I, II, Item 1, question 1…), with the correct answer.
- For open questions or writing tasks, give a model answer in correct English at the expected level, then 2 or 3 success criteria in very simple English.
- Add a short explanation in very simple English (A1–A2 level) when it helps (grammar, vocabulary, meaning).
- Give the marking scheme if the test has one.
- Format: plain text. Part titles on their own line starting with "## ". Important words between **double asterisks**. No tables, no HTML.`;
    const r=await AI.sample(prompt,{modelTier:"complex",cache:false,...(imgs.length?{images:imgs}:{})});
    if(!V4.cor||V4.cor.id!==id)return;V4.cor.text=String(r.text||"").trim();V4.cor.busy=false;if(!V4.cor.text)V4.cor.err="Nova did not answer. Try again."}
  catch(e){if(V4.cor&&V4.cor.id===id){V4.cor.busy=false;V4.cor.err=(e&&e.code==="empty")?e.message:aiErr(e&&e.code)}}
  v4CorModal()}
function v4CorModal(){let m=document.getElementById("v4cor");const C=V4.cor;if(!C){if(m)m.remove();return}const x=corItem(C.kind,C.id);
  if(!m){m=document.createElement("div");m.id="v4cor";m.className="v4modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");document.body.appendChild(m)}
  const pub=C.kind==="epreuves"?x?.corrigeVisible:x?.corrigeVisible;
  m.innerHTML=`<div class="glass"><div class="row between" style="flex-wrap:nowrap"><div><span class="eyebrow">${ic("spark")} Answer key written by Nova</span><h2 style="margin:4px 0 0">${esc(x?.title||"")}</h2></div><button class="iconbtn" data-v4="corClose" aria-label="Close">${ic("x")}</button></div>
  ${C.busy?`<div class="row" style="gap:12px;padding:30px 0"><span class="v4spin"></span><span>Nova is reading the test and writing the answer key… (up to one minute)</span></div>`:C.err?`<div class="note">${esc(C.err)}</div><div><button class="btn" data-v4="aiCor" data-k="${C.kind}" data-id="${C.id}">${ic("refresh")}Try again</button></div>`:`
  <div class="note small">Always check the answer key: Nova can make mistakes. You can edit it below before saving it.</div>
  <textarea id="v4corTxt" style="min-height:300px;font-family:var(--f-body)">${esc(C.text)}</textarea>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-v4="corDl" data-k="pdf">${ic("download")}PDF</button><button class="btn ghost sm" data-v4="corDl" data-k="doc">${ic("word")}Word</button><button class="btn ghost sm" data-v4="corDl" data-k="png">${ic("image")}Image</button></div>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-v4="corSave" data-k="0">${ic("lock")}Save (only visible to me)</button><button class="btn" data-v4="corSave" data-k="1">${ic("eye")}${pub?"Update the published answer key":"Publish for students"}</button><button class="btn ghost sm" data-v4="aiCor" data-k="${C.kind}" data-id="${C.id}">${ic("refresh")}New version</button></div>`}</div>`}
const corText=()=>{const t=document.getElementById("v4corTxt");return(t?t.value:(V4.cor&&V4.cor.text)||"").trim()};
async function corSave(publish){const C=V4.cor;if(!C)return;const text=corText();if(!text){toast("The answer key is empty.","x");return}V4.cor.text=text;
  if(C.kind==="epreuves"){const prev=S.corriges[C.id]||{},corr={...prev,text,by:"nova",at:Date.now()};await write(()=>S.db.doc("corriges/"+C.id).set(corr));
    const e=S.eps.find(x=>x.id===C.id);if(publish)await write(()=>S.db.doc("epreuves/"+C.id).update({corrigeVisible:true,corrigePublic:{text,fileId:prev.fileId||"",fileName:prev.fileName||"",fileType:prev.fileType||""}}));else if(e&&e.corrigeVisible)await write(()=>S.db.doc("epreuves/"+C.id).update({corrigePublic:{text,fileId:prev.fileId||"",fileName:prev.fileName||"",fileType:prev.fileType||""}}))}
  else{await write(()=>S.db.doc("corriges/hw_"+C.id).set({text,by:"nova",at:Date.now()}));const h=S.homework.find(x=>x.id===C.id);
    if(publish||(h&&h.corrigeVisible))await write(()=>S.db.doc("homework/"+C.id).update({corrigeVisible:true,corrigePublic:{text}}))}
  toast(publish?"Answer key published for students":"Answer key saved (private)","check");V4.cor=null;v4CorModal();render()}
/* fichiers : PDF (sans bibliothèque), Word (.doc), image (.png) */
const cleanMd=t=>String(t||"").replace(/\r/g,"");
function toCp1252(str){const map={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
  let o="";for(const ch of str){const c=ch.codePointAt(0);let b=c<128||(c>=160&&c<256)?c:map[ch];if(b===undefined)b=63;const s=String.fromCharCode(b);o+=s==="("||s===")"||s==="\\"?"\\"+s:s}return o}
function makePdf(title,text){const W=595,H=842,M=50,lines=[];const wrap=(s,size,bold)=>{const max=Math.floor((W-2*M)/(size*(bold?.56:.52)));const words=s.split(/\s+/);let cur="";const out=[];for(const w of words){if((cur+" "+w).trim().length>max&&cur){out.push(cur);cur=w}else cur=(cur+" "+w).trim()}out.push(cur);return out};
  lines.push({t:title,s:16,b:true,gap:8});lines.push({t:"Answer key · English Classes",s:9,b:false,gap:14});
  for(let raw of cleanMd(text).split("\n")){raw=raw.replace(/\*\*/g,"").replace(/^\s*[-*•]\s+/,"• ");if(!raw.trim()){lines.push({t:"",s:6});continue}const h=/^#{1,3}\s+/.test(raw);const t=raw.replace(/^#{1,3}\s+/,"");for(const l of wrap(t,h?12.5:11,h))lines.push({t:l,s:h?12.5:11,b:h,gap:h?4:0})}
  const pages=[];let cur=[],y=H-M;for(const l of lines){const lh=l.s*1.38+(l.gap||0);if(y-lh<M){pages.push(cur);cur=[];y=H-M}y-=l.s*1.38;cur.push({...l,y});y-=(l.gap||0)}pages.push(cur);
  const objs=[];const add=s=>{objs.push(s);return objs.length};const fR=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),fB=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pagesId=objs.length+1;objs.push(null);const kids=[];
  pages.forEach((pg,i)=>{let c="BT\n";for(const l of pg){if(!l.t)continue;c+=`/${l.b?"F2":"F1"} ${l.s} Tf 1 0 0 1 ${M} ${l.y.toFixed(1)} Tm (${toCp1252(l.t)}) Tj\n`}c+=`/F1 8 Tf 1 0 0 1 ${W-M-40} 28 Tm (${i+1} / ${pages.length}) Tj\nET`;
    const cid=add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fR} 0 R /F2 ${fB} 0 R >> >> /Contents ${cid} 0 R >>`))});
  objs[pagesId-1]=`<< /Type /Pages /Kids [${kids.map(k=>k+" 0 R").join(" ")}] /Count ${kids.length} >>`;const cat=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out="%PDF-1.4\n",offs=[];objs.forEach((o,i)=>{offs.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=out.length;
  out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n${offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")}trailer\n<< /Size ${objs.length+1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes=new Uint8Array(out.length);for(let i=0;i<out.length;i++)bytes[i]=out.charCodeAt(i)&255;return new Blob([bytes],{type:"application/pdf"})}
function makeDoc(title,text){const body=cleanMd(text).split("\n").map(l=>/^#{1,3}\s+/.test(l)?`<h2>${esc(l.replace(/^#{1,3}\s+/,""))}</h2>`:l.trim()?`<p>${esc(l).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}</p>`:"").join("");
  return new Blob([`﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt}h1{font-size:18pt;color:#1E2558}h2{font-size:14pt;color:#1E2558;margin-top:14pt}p{margin:4pt 0}</style></head><body><h1>${esc(title)}</h1><p><i>Answer key · English Classes</i></p>${body}</body></html>`],{type:"application/msword"})}
async function makePng(title,text){const W=1240,pad=70,c=document.createElement("canvas"),g=c.getContext("2d");const font=(s,b)=>`${b?"700":"400"} ${s}px Manrope, Arial, sans-serif`;
  const items=[];const wrap=(t,s,b)=>{g.font=font(s,b);const out=[];let cur="";for(const w of t.split(/\s+/)){const tt=(cur+" "+w).trim();if(g.measureText(tt).width>W-2*pad&&cur){out.push(cur);cur=w}else cur=tt}out.push(cur);return out};
  for(const l of wrap(title,46,true))items.push({t:l,s:46,b:true,c:"#1E2558"});items.push({t:"Answer key · English Classes",s:22,b:false,c:"#8A8FA8",gap:24});
  for(let raw of cleanMd(text).split("\n")){raw=raw.replace(/\*\*/g,"").replace(/^\s*[-*•]\s+/,"• ");if(!raw.trim()){items.push({t:"",s:14});continue}const h=/^#{1,3}\s+/.test(raw),t=raw.replace(/^#{1,3}\s+/,"");for(const l of wrap(t,h?32:27,h))items.push({t:l,s:h?32:27,b:h,c:h?"#1E2558":"#1B1F33",gap:h?6:0})}
  const H=Math.min(16000,pad*2+items.reduce((n,i)=>n+i.s*1.45+(i.gap||0),0));c.width=W;c.height=H;g.fillStyle="#fff";g.fillRect(0,0,W,H);g.fillStyle="#4B6BD6";g.fillRect(0,0,W,14);
  let y=pad;for(const i of items){y+=i.s*1.2;g.font=font(i.s,i.b);g.fillStyle=i.c||"#000";if(i.t)g.fillText(i.t,pad,y);y+=i.s*.25+(i.gap||0)}
  return await new Promise(r=>c.toBlob(r,"image/png"))}
async function corDownload(kind){const C=V4.cor;if(!C)return;const x=corItem(C.kind,C.id),title="Answer key - "+(x?.title||"homework"),text=corText(),base=title.replace(/[\\/:*?"<>|]+/g,"").slice(0,70);
  try{const blob=kind==="pdf"?makePdf(title,text):kind==="doc"?makeDoc(title,text):await makePng(title,text);const name=base+"."+(kind==="doc"?"doc":kind);
    if(S.dl&&S.dl.save)await S.dl.save({filename:name,data:blob});else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}toast("File saved","download")}
  catch(e){toast("Could not create the file.","x")}}

/* =====================================================================
   6. Devoirs : la prof peut joindre des fichiers ou des photos
   ===================================================================== */
function v4HwFilesHTML(){const ed=S.editing&&S.editing.kind==="homework"?S.homework.find(x=>x.id===S.editing.id):null,old=(ed&&ed.files)||[];
  return`<div class="scanbox"><div class="row"><label class="btn ghost sm filebtn" style="cursor:pointer">${ic("clip")}Attach a file or a photo<input type="file" id="v4hwf" multiple accept="image/*,application/pdf,.doc,.docx" hidden></label><span class="hint">Optional · PDF, Word or photos (5 maximum).</span></div>
  ${old.length||V4.hwFiles.length?`<div class="hwfiles">${old.map((f,i)=>`<span class="chip">${ic("file")}${esc(f.name)}<button type="button" class="iconbtn sm" data-v4="hwOldRm" data-i="${i}" aria-label="Remove">${ic("x")}</button></span>`).join("")}${V4.hwFiles.map((f,i)=>`<span class="chip ok">${ic("clip")}${esc(f.name)}<button type="button" class="iconbtn sm" data-v4="hwRm" data-i="${i}" aria-label="Remove">${ic("x")}</button></span>`).join("")}</div>`:""}</div>`}
async function hwSubmit(f){const v=id=>(document.getElementById(id)?.value||"").trim();const btn=f.querySelector('button[type=submit]');
  const instr=(document.getElementById("h_body")?.value||"").trim(),ed=S.editing&&S.editing.kind==="homework"?S.homework.find(x=>x.id===S.editing.id):null;
  let files=[...((ed&&ed.files)||[])].filter((_,i)=>!(V4.hwOldRm||[]).includes(i));
  if(!instr&&!files.length&&!V4.hwFiles.length){toast("Write the instructions or attach a file.","x");return}
  if(V4.hwFiles.length&&!S.assets){toast("Sending files is not available here.","x");return}
  if(btn)btn.disabled=true;
  try{for(const file of V4.hwFiles){let b=file;if(isImg(b.type))b=await shrinkImg(b,2000,.85);const up=await S.assets.upload(b,{type:b.type||"application/octet-stream"});files.push({id:up.id,name:file.name.slice(0,80),type:b.type||up.contentType||""})}
    const ed2=await saveContent("homework",{title:v("h_title"),level:v("h_level"),audience:v("h_aud")||"tous",due:v("h_due"),instructions:instr,files:files.slice(0,8),autoCorrect:!!document.getElementById("h_auto")?.checked,autoMode:S.drafts.h_amode==="draft"?"draft":"live"});
    FORM_FIELDS.hw.forEach(i=>delete S.drafts[i]);try{f.reset()}catch(e){}V4.hwFiles=[];V4.hwOldRm=[];toast(ed2?"Homework updated":"Homework published","pen")}
  catch(e){toast((e&&e.code)==="too_large"?"File too big.":(e&&e.code)==="unsupported_type"?"This file type is not accepted.":"Cannot send right now.","x")}
  if(btn)btn.disabled=false;render()}
const hwFilesBlock=h=>(h.files||[]).length?`<div class="hwfiles">${h.files.map(f=>`<button type="button" class="btn ghost sm docbtn" data-v4="doc" data-k="a" data-id="${esc(f.id)}" data-t="${esc(f.type||"")}" data-n="${esc(f.name||"document")}">${ic(isImg(f.type)?"image":/word/.test(f.type||"")?"word":"file")}${esc(f.name||"Document")}${offChip("a:"+f.id)}</button>`).join("")}</div>`:"";
{const _hv=hwView;hwView=function(){let h=_hv();const x=S.homework.find(y=>y.id===S.view?.id);if(!x)return h;const t=`<h2>${esc(x.title)}</h2>`;
  if((x.files||[]).length)h=h.replace(t,t+`<div><span class="eyebrow">Homework documents</span>${hwFilesBlock(x)}</div>`);
  if(x.corrigeVisible&&x.corrigePublic&&x.corrigePublic.text){const i=h.lastIndexOf("</div>");h=h.slice(0,i)+`<div class="glass card" style="border-color:#BFE3D0"><span class="eyebrow">${ic("check")} Answer key from your teacher</span><div class="lesson-body">${lessonHTML(x.corrigePublic.text)}</div></div>`+h.slice(i)}
  return h}}

/* =====================================================================
   7. Quiz en images préparés par Nova (la prof n'a qu'à publier)
   ===================================================================== */
function v4Bank(){const out=[];const push=(x,kind)=>{if(x&&x.pic&&x.en)out.push({pic:x.pic,en:x.en,fr:x.fr||"",kind,f:x.f||""})};
  try{for(const arr of Object.values(PB.nouns))for(const x of arr)push(x,"noun");for(const x of PB.actions)push(x,"action");for(const x of PB.jobs)push(x,"job");for(const x of PB.places)push(x,"place");for(const x of PB.feelings)push(x,"feel");for(const x of PB.weather)push(x,"weather")}catch(e){}return out}
async function aipLoad(){if(V4.aipics!==undefined||S.mode!=="teacher"||!S.db)return;V4.aipics=null;
  try{const d=await S.db.doc("aipics/"+S.uid).get();V4.aipics=d.exists?(d.data()||{}):{}}catch(e){V4.aipics={}}render();aipAuto()}
function aipAuto(){const A=V4.aipics;if(!A||V4.aipBusy||!AI.sample||AI.disabled||!navigator.onLine)return;const left=(A.sets||[]).filter(s=>!s.done);if(left.length>=2||(A.at&&Date.now()-A.at<20*3600e3&&left.length))return;aipGen()}
async function aipGen(){if(V4.aipBusy||!AI.sample)return;V4.aipBusy=true;render();const bank=v4Bank();
  try{const used=new Set([...(V4.aipics?.sets||[]).map(s=>s.title),...vis(S.pictures).map(p=>p.set||"")]);
    const r=await AI.sample.json(`You are preparing picture quizzes for an English-learning app in Togo (students from primary school to high school, and adults). Here is the bank of available pictures, in the format number|English word|type:
${bank.map((b,i)=>i+"|"+b.en+"|"+b.kind).join("\n")}
Create 3 NEW themed sets of 8 questions (varied themes that are useful in Togo: market, school, home, jobs, health, transport, feelings, weather, sport, cooking…), different from: ${[...used].filter(Boolean).slice(0,30).join(", ")||"none"}.
Each question uses ONE picture from the bank (its number) and the answer must match the picture exactly. Varied, natural questions (What is it? / What is she doing? / Where can you buy it? / What does this person do?…).
Write everything ONLY in English. Answer only in JSON: {"sets":[{"title":"short title in English","level":"A1|A2|B1","items":[{"i":number,"q":"question in English","a":"correct answer in English, short sentence","alt":["other accepted answers"],"fr":"a very simple English explanation of the answer (A1–A2 level)"}]}]}`,{modelTier:"complex",cache:false});
    const sets=(Array.isArray(r?.sets)?r.sets:[]).map(s=>({id:v4uid(),title:cleanStr(s.title,60)||"Picture quiz",level:["A1","A2","B1","B2"].includes(s.level)?s.level:"A1",
      items:(Array.isArray(s.items)?s.items:[]).filter(it=>bank[+it.i]&&cleanStr(it.a)).slice(0,10).map(it=>{const b=bank[+it.i];return{emo:b.pic,kind:["noun","action","job","place"].includes(b.kind)?b.kind:"free",q:cleanStr(it.q,120),a:cleanStr(it.a,140),alt:(Array.isArray(it.alt)?it.alt:[]).map(x=>cleanStr(x,80)).filter(Boolean).slice(0,4),fr:cleanStr(it.fr,120)}})})).filter(s=>s.items.length>=4);
    if(!sets.length)throw{code:"invalid_json"};
    const keep=(V4.aipics?.sets||[]).filter(s=>!s.done).slice(-6);V4.aipics={sets:[...keep,...sets],at:Date.now()};await write(()=>S.db.doc("aipics/"+S.uid).set(V4.aipics))}
  catch(e){V4.aipErr=aiErr(e&&e.code)}V4.aipBusy=false;render()}
async function aipPublish(id,aud){const A=V4.aipics,s=(A?.sets||[]).find(x=>x.id===id);if(!s)return;s.busy=true;render();
  try{for(const it of s.items)await write(()=>S.db.collection("pictures").add({emo:it.emo,kind:it.kind,prompt:it.q,answer:it.a,alt:it.alt,fr:it.fr,level:s.level,audience:aud||"tous",set:s.title,teacherId:S.uid,createdAt:Date.now(),by:"nova"}));
    s.done=true;s.busy=false;await write(()=>S.db.doc("aipics/"+S.uid).set(A));toast(`“${s.title}” published: ${s.items.length} pictures`,"camera");aipAuto()}
  catch(e){s.busy=false;toast("Cannot publish right now.","x")}render()}
function aipHTML(){if(S.mode!=="teacher"||!AI.sample||AI.disabled)return"";if(V4.aipics===undefined){aipLoad();return""}const sets=(V4.aipics?.sets||[]).filter(s=>!s.done);
  return`<div class="section"><div class="head"><div><span class="eyebrow">${ic("spark")} Made by Nova</span><h2>New picture quizzes</h2><p class="sub">Every day, Nova makes new sets with the app’s 3D pictures. Have a look, then publish: they join your students’ picture games.</p></div><button class="btn ghost sm" data-v4="aipGen" ${V4.aipBusy?"disabled":""}>${ic("refresh")}${V4.aipBusy?"Nova is working…":"More ideas"}</button></div>
  ${V4.aipBusy&&!sets.length?`<div class="glass card row" style="gap:12px"><span class="v4spin"></span>Nova is making new picture sets…</div>`:""}
  ${!V4.aipBusy&&!sets.length&&V4.aipErr?`<div class="note small">${esc(V4.aipErr)}</div>`:""}
  ${sets.map(s=>`<div class="glass card" style="gap:12px"><div class="row between"><div><h3 style="margin:0">${esc(s.title)}</h3><span class="small muted">${s.items.length} pictures · level ${esc(s.level)}</span></div><div class="row" style="gap:8px"><select id="aipAud_${s.id}" aria-label="Audience">${Object.entries(AUDIENCES).map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><button class="btn sm" data-v4="aipPub" data-id="${s.id}" ${s.busy?"disabled":""}>${ic("rocket")}${s.busy?"Publishing…":"Publish"}</button><button class="iconbtn" data-v4="aipDrop" data-id="${s.id}" aria-label="Remove this set" title="Remove">${ic("trash")}</button></div></div>
    <div class="aip-grid">${s.items.map(it=>`<div class="aip">${E(it.emo)}<b>${esc(it.a)}</b><span class="muted">${esc(it.q)}</span></div>`).join("")}</div></div>`).join("")}</div>`}
{const _cv=contentView0;contentView0=function(){const h=_cv(),a=aipHTML();if(!a)return h;const k=h.indexOf('<div class="section"><div><span class="eyebrow">Picture games</span>');return k>0?h.slice(0,k)+a+h.slice(k):h+a}}
{const _ev=epView;epView=function(){let h=_ev();const e=S.eps.find(x=>x.id===S.view?.id);if(S.mode==="teacher"&&e&&AI.sample&&!AI.disabled){const k=h.indexOf('<div class="row"><button class="btn ghost sm" data-a="editItem" data-k="epreuves"');if(k>0)h=h.slice(0,k)+`<div><button class="btn sm" data-v4="aiCor" data-k="epreuves" data-id="${e.id}">${ic("spark")}Nova writes the answer key</button> <span class="hint">PDF, Word or image, to keep for yourself or to publish.</span></div>`+h.slice(k)}return h}}
{const _tq=teacherPicQ;teacherPicQ=function(p,all,lvl){const q=_tq(p,all,lvl);if(!p.picId&&p.emo){q.pic=p.emo;delete q.picId}return q}}

/* =====================================================================
   8. Mots du jour : Nova choisit de nouveaux mots chaque jour pour
      chaque apprenant ; un mot non appris reste jusqu'à ce qu'il le sache
   ===================================================================== */
const WD_MAX=12,WD_NEW=5;
const wdOf=()=>((S.me&&S.me.dailyWords)||{items:[]});
const wdPending=()=>(wdOf().items||[]).filter(w=>!w.known);
async function wdGen(){if(V4.wdAt&&Date.now()-V4.wdAt<600000)return;if(V4.words||!S.me||isParent(S.me)||!AI.sample||AI.disabled||!navigator.onLine||S.mode!=="student")return;const d=wdOf();if(d.day===today())return;
  V4.words=true;V4.wdAt=Date.now();const pend=wdPending(),need=Math.max(0,Math.min(WD_NEW,WD_MAX-pend.length)),m=S.me;
  try{let add=[];if(need){const known=[...(m.wordsKnown||[]),...(d.items||[]).map(w=>w.en)].slice(-250);
      const r=await AI.sample.json(`Choose ${need} NEW and useful English words or expressions for a learner in Togo: ${PROFILES[m.profile]||"student"}${m.classe?" in "+m.classe:""}, level ${m.level||"A2"}. Follow the Togolese English syllabus (APC) for their class and daily life in Togo. Avoid these words already seen: ${known.join(", ")||"none"}.
Write everything ONLY in English. Answer only in JSON: {"words":[{"en":"word or expression","fr":"a short, very simple English definition (A1–A2 level)","ex":"a short example sentence in English, at their level","ex_fr":"a very simple English explanation of the example (optional, can be empty)"}]}`,{modelTier:"quick",cache:false});
      add=(Array.isArray(r?.words)?r.words:[]).filter(w=>cleanStr(w.en)&&cleanStr(w.fr)).slice(0,need).map(w=>({en:cleanStr(w.en,60),fr:cleanStr(w.fr,80),ex:cleanStr(w.ex,160),exfr:cleanStr(w.ex_fr,160),added:today(),known:false}))}
    const items=[...(d.items||[]).filter(w=>!w.known||w.day===today()),...add].slice(-20);
    await write(()=>meRef().update({dailyWords:{day:today(),items}}))}catch(e){}
  V4.words=false}
function wdHTML(compact){if(!S.me||isParent(S.me)||S.mode!=="student")return"";const d=wdOf(),items=d.items||[],pend=items.filter(w=>!w.known);
  if(d.day!==today()&&AI.sample&&!AI.disabled)setTimeout(wdGen,400);if(!items.length||(compact&&!pend.length))return"";const show=compact?pend.slice(0,3):items;
  return`<div class="section"><div class="glass card" style="gap:12px;border-color:var(--sky-soft)"><div class="row between"><div class="row"><span class="ic t-cyan">${ic("spark")}</span><div><span class="eyebrow">Chosen for you by Nova</span><h3 style="margin:0">My words of the day</h3></div></div>${pend.length?`<span class="chip warn">${pend.length} to learn</span>`:`<span class="chip ok">${ic("check")}All learned</span>`}</div>
  ${compact?"":`<p class="muted small" style="margin:0">Every day, Nova adds new words for you. A word stays here until you pass the test.</p>`}
  <div class="v4wl">${show.map(w=>`<div class="v4w${w.known?" known":""}"><button class="iconbtn" data-say="${esc(w.en)}" aria-label="Listen to ${esc(w.en)}">${ic("speaker")}</button><div><b>${esc(w.en)}</b> <span class="muted">· ${esc(w.fr)}</span>${w.ex&&!compact?`<span class="small">${esc(w.ex)}${w.exfr?` <span class="muted">(${esc(w.exfr)})</span>`:""}</span>`:""}</div>${w.known?`<span class="chip ok">${ic("check")}Learned</span>`:""}</div>`).join("")}</div>
  ${compact&&pend.length>3?`<span class="small muted">+ ${pend.length-3} more words</span>`:""}
  ${pend.length?`<div class="row"><button class="btn sm" data-v4="wdTest">${ic("bolt")}Test my words</button>${compact?`<button class="btn ghost sm" data-a="tab" data-k="learn">See all</button>`:""}</div>`:""}</div></div>`}
function wdTest(){const pend=wdPending();if(!pend.length)return;const all=(wdOf().items||[]),pool=[...all.map(w=>w.en),"house","school","market","teacher","friend","water","family","book"];
  const qs=shuffle([...pend]).slice(0,10).map(w=>{const others=shuffle(pool.filter(x=>x!==w.en)).slice(0,3),ch=shuffle([w.en,...others]);return{q:`Which word means “${w.fr}”?`,choices:ch,answer:ch.indexOf(w.en),explain:w.ex?`${w.en} = ${w.fr}. Example: ${w.ex}`:`${w.en} = ${w.fr}`,say:w.en,_w:w.en}});
  S.view=null;S.run={temp:{id:"nova-words",title:"My words of the day",questions:qs},quizId:"nova-words",i:0,picked:null,score:0,answers:[],wrong:[],combo:0,best:0};S.animate=true;scrollTo(0,0);try{touch("Testing words of the day")}catch(e){}render()}
{const _fq=finishQuiz;finishQuiz=function(q){const r=S.run;_fq(q);try{if(r&&q&&q.id==="nova-words"&&S.me){const ok=new Set(q.questions.filter((x,i)=>!r.wrong.includes(i)&&r.answers[i]!==undefined).map(x=>x._w));
  if(ok.size){const d=wdOf(),items=(d.items||[]).map(w=>ok.has(w.en)?{...w,known:true,day:today()}:w);write(()=>meRef().update({dailyWords:{...d,items},wordsKnown:[...(S.me.wordsKnown||[]),...ok].slice(-400)}))}}}catch(e){}}}
{const _lv=learnView;learnView=function(){return wdHTML(false)+_lv()}}
{const _hm=homeView;homeView=function(){const h=_hm(),w=wdHTML(true);if(!w)return h;const i=h.indexOf('<div class="section"',10);return i>0?h.slice(0,i)+w+h.slice(i):h+w}}


/* =====================================================================
   10. Pages d'accueil après connexion (inscription, attente, accès suspendu…) :
       bouton « Retour à la connexion » pour changer de compte
   ===================================================================== */
const v4BackLogin=()=>window.__appLogout?`<div class="section v4back" style="max-width:640px;margin:0 auto 12px"><button class="back" data-v4="toLogin">${ic("left")}Back to sign in</button></div>`:"";
for(const n of["joinView","waitingView","blockedView","refusedView","closedView","pendingTeacherView","noAccessView"]){const f=window[n];if(typeof f!=="function")continue;
  window[n]=function(){return v4BackLogin()+f.apply(this,arguments)}}

/* =====================================================================
   11. Professeure : réinitialiser le mot de passe d'un élève (utile pour les
       comptes créés avec un numéro de téléphone, sans e-mail)
   ===================================================================== */
{const _sd=studentDetail;studentDetail=function(){const h=_sd();const s=S.students.find(x=>x.id===S.view?.id);if(!s||!window.__resetPwd||!(S.isOwner||S.isStaff))return h;
  const R=V4.pwd&&V4.pwd.id===s.id?V4.pwd:null;
  return h+`<div class="section"><div class="glass card" style="gap:10px"><div class="row"><span class="ic t-gold">${ic("lock")}</span><div><h3 style="margin:0">Forgot password?</h3><p class="sub small" style="margin:0">Create a temporary password for ${esc(String(s.name||"").split(" ")[0])} and give it to them in person. They can then sign in with it.</p></div></div>
  ${R&&R.pw?`<div class="note"><b>New password: <span class="mono" style="font-size:1.2rem;letter-spacing:1px">${esc(R.pw)}</span></b><br><span class="small">Give it only to the student. The old password no longer works.</span></div>`:R&&R.err?`<div class="note small">${esc(R.err)}</div>`:""}
  <div class="row">${R&&R.ask?`<button class="btn danger sm" data-v4="pwdGo" data-id="${s.id}" ${R.busy?"disabled":""}>${R.busy?"Please wait…":"Yes, reset"}</button><button class="btn ghost sm" data-v4="pwdCancel">Cancel</button>`:`<button class="btn ghost sm" data-v4="pwdAsk" data-id="${s.id}">${ic("refresh")}Reset password</button>`}</div></div></div>`}}

/* =====================================================================
   12. Photo de profil (vraie photo de l'apprenant) + la prof peut la retirer
   ===================================================================== */
async function squareJpeg(file,size=400){const bmp=await createImageBitmap(file),m=Math.min(bmp.width,bmp.height),c=document.createElement("canvas");c.width=c.height=size;
  c.getContext("2d").drawImage(bmp,(bmp.width-m)/2,(bmp.height-m)/2,m,m,0,0,size,size);return await new Promise(r=>c.toBlob(r,"image/jpeg",.82))}
async function photoSet(file){if(!window.__avatarUpload){toast("Profile photos are not available here.","x");return}if(!isImg(file.type)){toast("Choose a photo (JPG or PNG).","x");return}
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}V4.photoBusy=true;render();
  try{const b=await squareJpeg(file);const url=await window.__avatarUpload(b);await write(()=>meRef().update({photo:url}));try{await write(()=>S.db.doc("board/"+S.uid).update({photo:url}))}catch(e){}toast("Profile photo saved","camera")}
  catch(e){toast((e&&e.message)||"Could not send.","x")}V4.photoBusy=false;render()}
function photoCardHTML(){const m=S.me;if(!m||!window.__avatarUpload)return"";
  return`<div class="section"><div class="glass card" style="grid-template-columns:auto 1fr;align-items:center;gap:16px"><div>${avatar(S.uid,m.name,84)}</div><div style="display:grid;gap:8px"><div><h3 style="margin:0">My profile photo</h3><p class="sub small" style="margin:0">Add a real photo of yourself: your classmates and your teacher will see it. A proper and respectful photo, please.</p></div>
  <div class="row" style="gap:8px"><label class="btn sm" style="cursor:pointer">${ic("camera")}${V4.photoBusy?"Sending…":m.photo?"Change my photo":"Add my photo"}<input type="file" id="v4photo" accept="image/*" hidden ${V4.photoBusy?"disabled":""}></label>${m.photo?`<button class="btn ghost sm" data-v4="photoRm">${ic("trash")}Remove</button>`:""}</div>
  ${m.photo?`<span class="hint">Your photo is shown instead of your shop avatar.</span>`:""}</div></div></div>`}
{const _pv=profileView;profileView=function(){const h=_pv();const c=photoCardHTML();if(!c)return h;const i=h.indexOf('<div class="section"',10);return i>0?h.slice(0,i)+c+h.slice(i):c+h}}
{const _sd2=studentDetail;studentDetail=function(){const h=_sd2();const s=S.students.find(x=>x.id===S.view?.id);if(!s||!s.photo)return h;
  return h+`<div class="section"><div class="glass card row between"><div class="row">${avatar(s.id,s.name,56)}<div><h3 style="margin:0">Profile photo</h3><p class="sub small" style="margin:0">If the photo is not appropriate, you can remove it.</p></div></div><button class="btn ghost sm" data-v4="photoRmFor" data-id="${s.id}">${ic("trash")}Remove photo</button></div></div>`}}
document.addEventListener("change",e=>{const el=e.target;if(el&&el.id==="v4photo"){const f=el.files&&el.files[0];el.value="";if(f)photoSet(f);e.stopPropagation()}},true);

/* =====================================================================
   13. Messagerie entre professeurs (privée : les élèves n'y ont pas accès)
   ===================================================================== */
const SC={un:{},subs:{},meta:{},msgs:[],ready:false,unsub:null,with:null};
const staffPair=(a,b)=>"chat_"+[a,b].sort().join("_");
const staffBase=o=>"gradebook/"+staffPair(S.uid,o);       // « gradebook » : lecture et écriture réservées aux professeurs
const staffOn=()=>S.mode==="teacher"&&(S.isOwner||S.isStaff)&&!!S.db;
const staffPeers=()=>(S.staff||[]).filter(d=>d.id!==S.uid&&(d.role==="principal"||d.role==="teacher"));
function staffWatch(){if(!staffOn())return;for(const d of staffPeers()){if(SC.subs[d.id])continue;
  SC.subs[d.id]=S.db.doc(staffBase(d.id)).onSnapshot(x=>{SC.meta[d.id]=x.exists?x.data():null;render()},()=>{})}}
setInterval(()=>{try{staffWatch()}catch(e){}},4000);
const staffUnread=id=>{const m=SC.meta[id];return!!(m&&m.last&&m.last.from!==S.uid&&(m.last.at||0)>((m.read||{})[S.uid]||0))};
const staffUnreadCount=()=>staffPeers().filter(d=>staffUnread(d.id)).length;
function staffOpen(id){SC.unsub?.();SC.with=id;SC.msgs=[];SC.ready=false;S.view={type:"staffchat",id};
  SC.unsub=S.db.collection(staffBase(id)+"/msgs").orderBy("at","desc").limit(200).onSnapshot(q=>{SC.msgs=q.docs.map(d=>({id:d.id,...d.data()})).reverse();SC.ready=true;render()},()=>{SC.ready=true;render()});
  write(()=>S.db.doc(staffBase(id)).set({...(SC.meta[id]||{}),read:{...((SC.meta[id]||{}).read||{}),[S.uid]:Date.now()}})).catch(()=>{});S.animate=true;scrollTo(0,0);render()}
async function staffSend(to,text,att,meta){const at=Date.now();
  await write(()=>S.db.collection(staffBase(to)+"/msgs").add({from:S.uid,text:text||"",at,...(att?{att}:{}),...(meta&&meta.re?{re:meta.re}:{})}));
  const m=SC.meta[to]||{};await write(()=>S.db.doc(staffBase(to)).set({...m,members:[S.uid,to],last:{from:S.uid,text:(v4Plain(text)||attLabel(att)).slice(0,80),at},read:{...(m.read||{}),[S.uid]:at}}))}
function staffListHTML(){const L=staffPeers();
  return`<div class="section"><div><span class="eyebrow">Between colleagues</span><h2>Teachers</h2><p class="sub">Chat with the other teachers at your school: messages, voice notes, photos and files. Students and parents cannot see it.</p></div>
  ${L.length?`<div class="glass list">${L.sort((a,b)=>((SC.meta[b.id]||{}).last?.at||0)-((SC.meta[a.id]||{}).last?.at||0)).map(d=>{const m=SC.meta[d.id]||{},l=m.last;return`<div class="thread" data-v4="staffOpen" data-id="${d.id}" tabindex="0">${avatar(d.id,d.name||"Teacher")}<div class="txt"><b>${esc(d.name||"Teacher")} <small class="muted" style="font-weight:600">· ${d.role==="principal"?"Head teacher":"Teacher"}</small></b><span>${l?esc((l.from===S.uid?"You: ":"")+l.text):"No messages"}</span></div><div class="row small muted">${l?fmtTime(l.at):""}${staffUnread(d.id)?`<span class="chip bad">New</span>`:""}</div></div>`}).join("")}</div>`:`<div class="empty">No other teachers yet. When the head teacher accepts a teacher (Class tab), they appear here.</div>`}</div>`}
function staffChatView(){const id=S.view.id,d=(S.staff||[]).find(x=>x.id===id)||{},nm=d.name||"Teacher";
  return`<div class="section" style="max-width:760px;margin-inline:auto"><div><button class="back" data-v4="staffBack">${ic("left")}Teachers</button></div><div class="row">${avatar(id,nm,48)}<div><span class="eyebrow">Between teachers · private</span><h2>${esc(nm)}</h2></div></div>
  <div class="glass chat"><div class="msgs" id="chatScroll">${!SC.ready?`<div class="muted" style="margin:auto">Loading…</div>`:SC.msgs.length?v4MsgList("staff",SC.msgs,v4Ctx("staff",id,nm)):`<div class="muted" style="margin:auto;text-align:center">No messages yet.<br>Write the first message to ${esc(nm.split(" ")[0])}.</div>`}</div>
  ${v4Bar("staff",id,"Write to your colleague…")}</div></div>`}
{const _tabs=msgsTabsHTML;msgsTabsHTML=()=>{const h=_tabs();if(!staffOn())return h;const n=staffUnreadCount();return h.replace('</div></div>',`<button data-a="msgsTab" data-k="staff" aria-pressed="${S.msgsTab==="staff"}">Teachers${n?` <span class="chip bad">${n}</span>`:""}</button></div></div>`)}}
{const _mv=msgsView;msgsView=function(){if(S.msgsTab==="staff"&&staffOn())return msgsTabsHTML()+staffListHTML();return _mv()}}
{const _tv=teacherView;teacherView=function(){if(S.view?.type==="staffchat"&&staffOn())return staffChatView();return _tv()}}

/* =====================================================================
   14. Espace prof plus léger pour les grosses classes : le tableau de bord
       n'est recalculé que si les données ont vraiment changé
   ===================================================================== */
const V4OID=new WeakMap();let V4OIDN=0;const v4oid=x=>{if(!x||typeof x!=="object")return String(x);let n=V4OID.get(x);if(!n){n=++V4OIDN;V4OID.set(x,n)}return"#"+n};
{const _dv=dashView;let mk=null,mh="";dashView=function(){
  const k=[S.students,S.quizzes,S.homework,S.pending,S.eps,S.corriges,S.access,S.settings,S.staff].map(v4oid).join(",")+"|"+[S.profFilter,S.drafts.st_q,S.drafts.st_cls,S.drafts.st_on,S.stLim,S._peerSig,LITE,Math.floor(Date.now()/60000)].join("|");
  if(k===mk)return mh;mk=k;mh=_dv();return mh}}

/* =====================================================================
   15. Boutique motivante : coffre du jour (gagné en travaillant), turbo XP,
       jokers 50/50, packs de stickers, mise en avant au classement,
       avatars légendaires débloqués par l'effort
   ===================================================================== */
const SH_LOCK={"ava-lion":800,"ava-ninja":1000,"ava-mage-man":1200,"ava-mage-woman":1200,"ava-hero-man":1500,"ava-hero-woman":1500,"ava-robot":2000,"ava-alien":2000,"ava-prince":2500,"ava-princess":2500,"ava-unicorn":4000,"ava-dragon":5000};
const SH_PACKS=[
 {id:"stk-animals",t:"Savanna animals",price:200,e:["1f418","1f42f","1f43c","1f43b","1f98a","1f984","1f989","1f99c","1f9a9","1f422","1f42c","1f433","1f434","1f438","1f430","1f425","1f40a","1f419"]},
 {id:"stk-food",t:"Party and treats",price:250,e:["1f370","1f36c","1f349","1f34c","1f34d","1f353","1f96d","1f965","1f35a","1f372","1f36f","1f951","1f381","1f388"]},
 {id:"stk-fun",t:"Champions and music",price:300,e:["1f3c5","1f3af","1f3ae","1f3b8","1f3a7","1f3a8","1f3b9","1f941","1f6b2","1f3d3","1f451","1f48e","1f3a4","1f3c6"]}];
SH_PACKS.forEach(pk=>{pk.e=pk.e.filter(c=>{try{return EMO_SET.has(c)}catch(e){return false}})});
const JOKER_PRICE=80,JOKER_MAX=5,SPOT_PRICE=350,SPOT_DAYS=7;
const BOOSTS=[{id:"boost30",t:"Turbo XP ×2 · 30 min",min:30,price:250},{id:"boost60",t:"Turbo XP ×2 · 1 hour",min:60,price:400}];
const boostLeft=()=>Math.max(0,((S.me&&S.me.boostUntil)||0)-Date.now());
const spotLeft=m=>Math.max(0,((m&&m.spotUntil)||0)-Date.now());
const shCoins=()=>coinsOf(S.me);
function shSpend(price,patch,msg){const m=S.me;if(!m)return false;if(shCoins()<price){toast("Not enough XP yet: keep working!","x");return false}
  meWrite({spent:(m.spent||0)+price,...patch});beep("win");if(!LITE)confetti();toast(msg+` (−${price} XP)`,"bag");return true}
/* XP doublés pendant le turbo */
{const _g=gain;gain=function(xp,activity,extra,anchor){if(xp>0&&boostLeft()>0)xp=xp*2;return _g(xp,activity,extra,anchor)}}
/* coffre du jour : s'ouvre quand l'objectif du jour est atteint */
const CHEST=[{k:"joker",t:"1 50/50 joker"},{k:"xp",t:"+40 bonus XP"},{k:"freeze",t:"1 streak freeze"},{k:"boost",t:"Turbo XP ×2 for 15 min"}];
const chestToday=()=>CHEST[(Math.floor(Date.now()/864e5))%CHEST.length];
const chestReady=()=>{const m=S.me;return!!m&&m.lastDay===today()&&(m.dayXp||0)>=DAILY_GOAL&&m.chestDay!==today()};
function chestOpen(){const m=S.me;if(!chestReady())return;const r=chestToday();let k=r.k;if(k==="freeze"&&(m.freezes||0)>=FREEZE_MAX)k="xp";
  if(k==="xp"){meWrite({chestDay:today()});gain(40,"Opened the daily chest")}
  else if(k==="joker")meWrite({chestDay:today(),jokers:Math.min(JOKER_MAX,(m.jokers||0)+1)});
  else if(k==="freeze")meWrite({chestDay:today(),freezes:(m.freezes||0)+1});
  else meWrite({chestDay:today(),boostUntil:Math.max(Date.now(),m.boostUntil||0)+15*60000});
  beep("win");if(!LITE)confetti();celebrate&&setTimeout(()=>{try{celebrate("Daily chest",(CHEST.find(x=>x.k===k)||r).t+"! Come back tomorrow for a new chest.","gift")}catch(e){toast("Chest opened: "+(CHEST.find(x=>x.k===k)||r).t,"gift")}},300)}
function chestHTML(compact){const m=S.me;if(!m||isParent(m))return"";const done=m.chestDay===today(),ready=chestReady(),dx=m.lastDay===today()?(m.dayXp||0):0,r=chestToday();
  if(compact&&!ready)return"";
  return`<div class="section"><div class="glass card shx-chest ${ready?"ready":""}"><span class="shx-chest-ic" aria-hidden="true">${E("🎁")}</span><div style="display:grid;gap:4px;min-width:0"><span class="eyebrow">Daily chest · free</span><h3 style="margin:0">${done?"Chest opened! Come back tomorrow":ready?"Your chest is ready!":"Earn "+DAILY_GOAL+" XP today to open it"}</h3><span class="small muted">Today: ${esc(r.t)}</span>${!done&&!ready?`<div class="bar" style="max-width:260px"><i style="width:${Math.min(100,Math.round(dx/DAILY_GOAL*100))}%"></i></div><span class="small muted">${dx} / ${DAILY_GOAL} XP</span>`:""}</div>${ready?`<button class="btn" data-v4="chest">${ic("gift")}Open</button>`:done?`<span class="chip ok">${ic("check")}Opened</span>`:""}</div></div>`}
function shopExtraHTML(){const m=S.me,c=shCoins(),own=m.owned||{},bl=boostLeft(),jk=m.jokers||0,sp=spotLeft(m);
  const nextLock=Object.entries(SH_LOCK).filter(([id,x])=>(m.xp||0)<x).sort((a,b)=>a[1]-b[1])[0],nl=nextLock&&shopItem(nextLock[0]);
  return`${chestHTML(false)}
  ${nl?`<div class="section"><div class="glass card row" style="gap:14px;flex-wrap:nowrap"><span class="shop-ava" style="flex:none">${avaHTML(nl.v)}</span><div style="display:grid;gap:6px;flex:1;min-width:0"><span class="eyebrow">Next legendary avatar</span><b>${esc(nl.label)} · unlocks at ${nextLock[1]} XP earned</b><div class="bar"><i style="width:${Math.min(100,Math.round((m.xp||0)/nextLock[1]*100))}%"></i></div><span class="small muted">${nextLock[1]-(m.xp||0)} XP to go: every lesson, quiz or homework brings you closer!</span></div></div></div>`:""}
  <div class="section"><div><span class="eyebrow">To go faster</span><h2>Work bonuses</h2><p class="sub">Boosts that reward hard workers.</p></div><div class="shx-grid">
   ${BOOSTS.map(b=>`<div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("🚀")}</span><b>${b.t}</b><span class="small muted">All XP you earn counts double for ${b.min} minutes. Great before revising!</span>${bl?`<span class="chip ok">${ic("bolt")}Active · ${Math.ceil(bl/60000)} min left</span>`:`<button class="btn sm" data-v4="buyBoost" data-k="${b.id}" ${c<b.price?"disabled":""}>${ic("bolt")}${b.price}</button>`}</div>`).join("")}
   <div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("🃏")}</span><b>50/50 joker</b><span class="small muted">In a quiz, it removes two wrong answers. You have <b>${jk}</b> / ${JOKER_MAX}.</span>${jk>=JOKER_MAX?`<span class="chip">Maximum reached</span>`:`<button class="btn sm" data-v4="buyJoker" ${c<JOKER_PRICE?"disabled":""}>${ic("bolt")}${JOKER_PRICE}</button>`}</div>
   <div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("👑")}</span><b>Leaderboard spotlight</b><span class="small muted">Your name shines in gold with a crown on the class leaderboard for ${SPOT_DAYS} days.</span>${sp?`<span class="chip ok">${ic("check")}Active · ${Math.ceil(sp/864e5)} d</span>`:`<button class="btn sm" data-v4="buySpot" ${c<SPOT_PRICE?"disabled":""}>${ic("bolt")}${SPOT_PRICE}</button>`}</div>
  </div></div>
  <div class="section"><div><span class="eyebrow">For your chats</span><h2>3D sticker packs</h2><p class="sub">Unlock new stickers to send to your classmates and your teacher.</p></div><div class="shx-grid">
   ${SH_PACKS.map(pk=>`<div class="glass card shx"><div class="shx-stk">${pk.e.slice(0,6).map(c=>`<img src="img/${c}.webp" alt="" loading="lazy">`).join("")}</div><b>${esc(pk.t)}</b><span class="small muted">${pk.e.length} stickers</span>${own[pk.id]?`<span class="chip ok">${ic("check")}Unlocked</span>`:`<button class="btn sm" data-v4="buyPack" data-id="${pk.id}" ${c<pk.price?"disabled":""}>${ic("bolt")}${pk.price}</button>`}</div>`).join("")}
  </div></div>`}
{const _sv=shopView;shopView=function(){let h=_sv();const m=S.me;if(!m)return h;
  // avatars légendaires : verrouillés tant que l'XP gagné n'est pas suffisant
  for(const[id,need]of Object.entries(SH_LOCK)){if((m.xp||0)>=need||(m.owned||{})[id])continue;
    h=h.replace(new RegExp(`<button class="btn sm" data-a="buy" data-id="${id}"[^>]*>[\\s\\S]*?</button>`),`<span class="chip">${ic("lock")}${need} XP earned</span>`)}
  const k=h.indexOf('<div class="section"><div><span class="eyebrow">In real life</span>');const x=shopExtraHTML();return k>0?h.slice(0,k)+x+h.slice(k):h+x}}
/* jokers dans les quiz */
{const _qr=quizRunView;quizRunView=function(){let h=_qr();const r=S.run,q=curQuiz&&curQuiz();if(!r||!q||S.mode!=="student"||!S.me)return h;const cur=(q.questions||[])[r.i];
  if(!cur||!Array.isArray(cur.choices)||cur.type==="type")return h;const hid=(r.fifty||{})[r.i];
  if(hid)for(const i of hid)h=h.replace(`data-a="pick" data-i="${i}" `,`data-a="pick" data-i="${i}" disabled style="opacity:.18;pointer-events:none" `);
  if(r.picked==null&&!r.exam&&!hid&&cur.choices.length>=3&&(S.me.jokers||0)>0)h=h.replace('<div class="choices">',`<div><button class="btn ghost sm" data-v4="joker">${E("🃏")} 50/50 joker · ${S.me.jokers} left</button></div><div class="choices">`);
  return h}}
/* classement : élèves en vedette */
leaderboardHTML=function(rows,meId){let h=leaderboardHTML0(rows,meId);const now=Date.now();
  const spot=id=>{const p=(S.board||[]).find(x=>x.id===id)||(typeof personOf==="function"?personOf(id):null);return p&&(p.spotUntil||0)>now};
  rows=[...rows].sort((a,b)=>(b.xp||0)-(a.xp||0)).slice(0,20);const parts=h.split('<div class="it ');
  return parts.map((seg,i)=>i===0?seg:(rows[i-1]&&spot(rows[i-1].id)?'<div class="it lb-spot '+seg.replace("</b>",` <span class="lb-crown">${E("👑")}</span></b>`):'<div class="it '+seg)).join("")};
/* idées de récompenses pour la prof */
const RW_IDEAS=[["Choose your seat for a week",500],["+1 point on the next test",800],["Choose the Friday English song",300],["Be the “teacher assistant” for one lesson",600],["Go out to break 5 minutes early",700],["One less homework (your choice)",1200],["“English Star” certificate given in front of the class",1000],["Read your English text in front of the class",250]];
{const _rh=rewardsHTML;rewardsHTML=function(){const h=_rh();const k=h.indexOf('<p class="hint" style="margin:0">Ideas');const ideas=`<div style="display:grid;gap:6px"><span class="small muted">One-click ideas:</span><div class="row" style="gap:6px;flex-wrap:wrap">${RW_IDEAS.map(([t,c],i)=>`<button type="button" class="chip" data-v4="rwIdea" data-i="${i}" style="cursor:pointer">${esc(t)} · ${c} XP</button>`).join("")}</div></div>`;
  return k>0?h.slice(0,k)+ideas+h.slice(k):h}}
/* coffre prêt : rappel sur l'accueil */
{const _hm2=homeView;homeView=function(){const h=_hm2(),c=chestHTML(true);if(!c)return h;const i=h.indexOf('<div class="section"',10);return i>0?h.slice(0,i)+c+h.slice(i):h+c}}
document.head.insertAdjacentHTML("beforeend",`<style>
.shx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.shx{display:grid;gap:8px;justify-items:start;align-content:start}
.shx-ic{font-size:2.2rem;line-height:1}.shx-ic .e3d{width:54px;height:54px}
.shx-stk{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;width:100%}.shx-stk img{width:100%;max-width:56px;aspect-ratio:1;object-fit:contain}
.shx-chest{grid-template-columns:auto 1fr auto;align-items:center;gap:16px;border-color:var(--gold-soft)}
.shx-chest-ic{font-size:3rem;line-height:1}.shx-chest-ic .e3d{width:64px;height:64px}
.shx-chest.ready{box-shadow:0 0 0 2px #E3C173,0 18px 50px -18px rgba(227,193,115,.9)}
.shx-chest.ready .shx-chest-ic{animation:shxBounce 1.4s ease-in-out infinite}
@keyframes shxBounce{50%{transform:translateY(-6px) rotate(-6deg)}}
@media (max-width:520px){.shx-chest{grid-template-columns:auto 1fr}.shx-chest>.btn,.shx-chest>.chip{grid-column:1/-1;justify-self:start}}
.lb .it.lb-spot{background:linear-gradient(90deg,rgba(227,193,115,.28),rgba(227,193,115,.06));border-radius:14px;box-shadow:inset 0 0 0 1px rgba(227,193,115,.6)}
.lb .it.lb-spot b{color:#E9C46A}.lb-crown .e3d{width:20px;height:20px;vertical-align:-4px}
.v4grid .lockpk{opacity:.35;filter:grayscale(1)}
@media (prefers-reduced-motion:reduce){.shx-chest.ready .shx-chest-ic{animation:none}}
</style>`);

/* =====================================================================
   16. Mises à jour : bouton « Vérifier les mises à jour » (profil et espace prof)
   ===================================================================== */
{const _lo=logoutHTML;logoutHTML=function(){const v=window.__appBuild?` · version ${window.__appBuild}`:"";return`<div class="section"><div class="glass card row between"><div><h3 style="margin:0">Updates</h3><p class="sub small" style="margin:0">The app tells you by itself when a new version is ready${esc(v)}.</p></div><button class="btn ghost sm" data-v4="checkUpd">${ic("refresh")}Check</button></div></div>`+_lo()}}
/* =====================================================================
   9. Événements
   ===================================================================== */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4;e.preventDefault();e.stopPropagation();
  switch(a){
  case"doc":openDoc({k:el.dataset.k,id:el.dataset.id,t:el.dataset.t},el.dataset.n||"document");return;
  case"docClose":closeDoc();return;case"docSave":docSave();return;
  case"docZoom":if(V4.pdf){V4.pdf.zoom=Math.max(.6,Math.min(3,V4.pdf.zoom*(+el.dataset.k>0?1.35:1/1.35)));drawPdf()}return;
  case"keepOff":{const it={k:"a",id:el.dataset.id,t:el.dataset.t};el.disabled=true;srcBlob(it).then(()=>{toast("Available offline on this device","check");render()}).catch(()=>{el.disabled=false;toast("Cannot download right now.","x")});return}
  case"panel":{const k=el.dataset.k,t=el.dataset.t;V4.panel=V4.panel&&V4.panel.kind===k&&V4.panel.t===t&&!el.closest(".v4panel")?null:{kind:k,t,target:v4Target(k)};render();return}
  case"panelClose":V4.panel=null;render();return;
  case"emo":{const id=V4IN(el.dataset.k),inp=document.getElementById(id),cur=(inp?inp.value:S.drafts[id])||"";S.drafts[id]=(cur+el.dataset.e).slice(0,1000);render();return}
  case"stk":{const k=el.dataset.k,t=v4Target(k)||(V4.panel&&V4.panel.target);V4.panel=null;render();if(!t)return;if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
    v4Deliver(k,t,"",{k:"sticker",e:el.dataset.e}).catch(err=>toast((err&&err.message)||"Could not send","x"));return}
  case"rec":recStart(el.dataset.k,v4Target(el.dataset.k));return;
  case"recCancel":recStop(true);return;case"recSend":recStop(false);return;
  case"play":v4Play(el.dataset.p,el.dataset.t);return;
  case"talkResume":talkResume(el.dataset.id);return;case"talkDel":talkDel(el.dataset.id);return;
  case"dashFold":S.drafts.st_cls=el.dataset.k||"";S.stLim=ST_STEP;render();scrollTo({top:Math.max(0,(document.getElementById("st_q")?.getBoundingClientRect().top||0)+scrollY-90),behavior:"smooth"});return;
  case"msgFold":S.v4msgFold=el.dataset.k||"";S.v4msgLim=40;render();return;
  case"aiCor":aiCorrige(el.dataset.k,el.dataset.id);return;
  case"corClose":V4.cor=null;v4CorModal();return;case"corDl":corDownload(el.dataset.k);return;case"corSave":corSave(el.dataset.k==="1");return;
  case"hwRm":V4.hwFiles.splice(+el.dataset.i,1);render();return;
  case"hwOldRm":(V4.hwOldRm=V4.hwOldRm||[]).push(+el.dataset.i);{const ed=S.homework.find(x=>S.editing&&x.id===S.editing.id);if(ed&&ed.files){ed.files=ed.files.filter((_,i)=>i!==+el.dataset.i);V4.hwOldRm=[]}}render();return;
  case"aipGen":aipGen();return;case"aipPub":aipPublish(el.dataset.id,document.getElementById("aipAud_"+el.dataset.id)?.value);return;
  case"aipDrop":{const s=(V4.aipics?.sets||[]).find(x=>x.id===el.dataset.id);if(s){s.done=true;write(()=>S.db.doc("aipics/"+S.uid).set(V4.aipics));render();aipAuto()}return}
  case"wdTest":wdTest();return;
  case"pwdAsk":V4.pwd={id:el.dataset.id,ask:true};render();return;case"pwdCancel":V4.pwd=null;render();return;
  case"pwdGo":{const id=el.dataset.id;V4.pwd={id,ask:true,busy:true};render();window.__resetPwd(id).then(pw=>{V4.pwd={id,pw}}).catch(e=>{V4.pwd={id,err:e.message}}).finally(render);return}
  case"photoRm":write(()=>meRef().update({photo:""})).then(()=>{try{S.db.doc("board/"+S.uid).update({photo:""}).catch(()=>{})}catch(e){}toast("Photo removed","trash")});return;
  case"photoRmFor":write(()=>S.db.doc("students/"+el.dataset.id).update({photo:""})).then(()=>{try{S.db.doc("board/"+el.dataset.id).update({photo:""}).catch(()=>{})}catch(e){}toast("Photo removed","trash")});return;
  case"staffOpen":staffOpen(el.dataset.id);return;
  case"staffBack":SC.unsub?.();SC.unsub=null;SC.with=null;S.view=null;S.tab="msgs";S.msgsTab="staff";S.animate=true;render();return;
  case"iosGuide":window.__iosGuide&&window.__iosGuide();return;
  case"chest":chestOpen();return;
  case"buyBoost":{const b=BOOSTS.find(x=>x.id===el.dataset.k);if(!b||boostLeft()>0)return;shSpend(b.price,{boostUntil:Date.now()+b.min*60000},"Turbo on: XP ×2 for "+b.min+" min");return}
  case"buyJoker":{const n=S.me.jokers||0;if(n>=JOKER_MAX)return;shSpend(JOKER_PRICE,{jokers:n+1},"50/50 joker added");return}
  case"buySpot":if(spotLeft(S.me))return;if(shSpend(SPOT_PRICE,{spotUntil:Date.now()+SPOT_DAYS*864e5},"You are in the leaderboard spotlight for "+SPOT_DAYS+" days")){try{S.db.doc("board/"+S.uid).update({spotUntil:Date.now()+SPOT_DAYS*864e5}).catch(()=>{})}catch(e){}}return;
  case"buyPack":{const pk=SH_PACKS.find(x=>x.id===el.dataset.id);if(!pk||(S.me.owned||{})[pk.id])return;shSpend(pk.price,{owned:{...(S.me.owned||{}),[pk.id]:Date.now()}},"Pack “"+pk.t+"” unlocked");return}
  case"packInfo":toast("Unlock this pack in the XP shop (XP button at the top).","gift");return;
  case"joker":{const r=S.run,q=curQuiz();if(!r||!q||(S.me.jokers||0)<1)return;const cur=q.questions[r.i];const wrong=shuffle(cur.choices.map((_,i)=>i).filter(i=>i!==cur.answer)).slice(0,Math.min(2,cur.choices.length-2));
    r.fifty=r.fifty||{};r.fifty[r.i]=wrong;meWrite({jokers:(S.me.jokers||0)-1});beep("ok");render();return}
  case"rwIdea":{const it=RW_IDEAS[+el.dataset.i];if(!it)return;S.drafts.rw_title=it[0];S.drafts.rw_cost=String(it[1]);render();return}
  case"checkUpd":if(window.__checkUpdate)window.__checkUpdate(true);else toast("You have the latest version.","check");return;
  case"toLogin":{el.disabled=true;Promise.resolve(window.__appLogout&&window.__appLogout()).catch(()=>location.reload());return}
  }},true);
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest('[data-a="v4msgMore"]');if(el){e.stopPropagation();S.v4msgLim=(S.v4msgLim||40)+40;render()}},true);
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("[data-v4][tabindex]")){e.preventDefault();e.target.click()}});
document.addEventListener("change",e=>{const el=e.target;if(!el||!el.id)return;
  if(el.id.startsWith("v4f_")){const kind=el.id.slice(4),file=el.files&&el.files[0],t=el.closest("form")?.dataset.s;el.value="";if(file&&t){if(/^image\//.test(file.type)&&!/gif/.test(file.type)){V4.pre={kind,target:t,file,url:URL.createObjectURL(file),once:false};render()}else v4SendFile(kind,t,file,file.name)}e.stopPropagation();return}
  if(el.id==="v4hwf"){const fl=[...(el.files||[])];el.value="";for(const f of fl){if(V4.hwFiles.length>=5){toast("5 files maximum.","x");break}if(f.size>20*1024*1024){toast(f.name+": too big (20 MB maximum).","x");continue}V4.hwFiles.push(f)}render();e.stopPropagation()}},true);
document.addEventListener("input",e=>{const el=e.target;if(el&&el.id==="fq_msgs"){S.drafts.fq_msgs=el.value;S.v4msgLim=40;render()}});
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset)return;
  if(f.dataset.f==="hw"){e.preventDefault();e.stopImmediatePropagation();hwSubmit(f)}
  if((f.dataset.f==="chat"||f.dataset.f==="peerchat")&&f.classList.contains("v4bar")){e.preventDefault();e.stopImmediatePropagation();v4TextSend(f.dataset.f==="peerchat"?"peer":"chat",f)}
  if(f.dataset.f==="staffchat"){e.preventDefault();e.stopImmediatePropagation();const inp=document.getElementById("staffInput"),text=(inp&&inp.value||"").trim();if(!text)return;if(inp)inp.value="";delete S.drafts.staffInput;staffSend(f.dataset.s,text,null,v4TakeReply("staff")).catch(()=>{});render()}},true);

/* =====================================================================
   17. French → English: a learner's French message is struck through in red,
       with the English version in green under it. + mobile chat layout.
   ===================================================================== */
const V4MK="\n⟦EN⟧ ",V4MK2="\n⟦OK⟧ ";
function v4Split(t){t=String(t||"");for(const[m,k]of[[V4MK,"fr"],[V4MK2,"fix"]]){const i=t.indexOf(m);if(i>=0)return[t.slice(0,i),t.slice(i+m.length),k]}return null}
function v4Plain(t){const x=v4Split(t);return x?x[1]:String(t||"")}
function v4FixHTML(fr,en,k){return`<s class="v4fr">${E(fr)}</s><div class="v4en"><span class="v4en-l">${k==="fix"?"Correct English":"In English"}</span><span>${E(en)}</span></div>`}
function v4NeedFix(t){t=String(t||"").trim();return S.mode==="student"&&S.me&&!isParent(S.me)&&!!AI.sample&&!AI.disabled&&navigator.onLine&&t.length>=2&&!onlyEmoji(t)&&/\p{L}{2}/u.test(t)}
async function v4Check(t){try{
  const r=await Promise.race([AI.sample.json(`You check chat messages written by a learner of English in Togo. Message:
"""${String(t).slice(0,600)}"""
Decide:
- "french": the message is fully or partly in French (or another language than English) → give the natural English version.
- "mistakes": it is in English but has real mistakes (grammar, spelling, wrong word, word order, missing words) → give the corrected English.
- "ok": it is correct English. Ignore small things: capital letters, final punctuation, informal chat style (hi, ok, lol, pls), emojis, names.
Keep the same meaning, the emojis and the names; simple, natural English, as a friendly student would write.
The topic can be anything (personal, private, sensitive or taboo): only correct the language. Never refuse, never judge, never add advice, never change or soften the meaning.
Answer only in JSON: {"status":"ok" or "french" or "mistakes","english":"the correct English version (empty if ok)"}`,{cache:false}),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),15000))]);
  const st=r&&r.status,en=String(r&&r.english||"").trim();
  if(!en||(st!=="french"&&st!=="mistakes"))return null;
  const n=x=>x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"");if(n(en)===n(String(t)))return null;
  return{k:st==="french"?"fr":"fix",en:en.slice(0,480)}}catch(e){return null}}
function v4Pack(fr,en,k){const mk=k==="fix"?V4MK2:V4MK,room=1000-mk.length-en.length;return(fr.length>room?fr.slice(0,Math.max(0,room-1))+"…":fr)+mk+en}
async function v4TextSend(kind,f){const id=V4IN(kind),inp=document.getElementById(id),orig=(inp&&inp.value||"").trim();if(!orig)return;
  if(kind==="peer"&&(PR.sending||V4.fixing))return;
  if(kind==="peer"&&!navigator.onLine){toast("No network: try again when you are online.","x");return}
  const tgt=f.dataset.s,hadFocus=document.activeElement===inp;if(inp)inp.value="";delete S.drafts[id];
  let text=orig;
  if(v4NeedFix(orig)){V4.fixing=kind;render();const r=await v4Check(orig);V4.fixing=null;if(r)text=v4Pack(orig,r.en,r.k)}
  if(kind==="peer")PR.sending=true;render();
  try{await v4Deliver(kind,tgt,text,null,v4TakeReply(kind))}catch(e){toast((e&&e.message)||"Could not send","x");S.drafts[id]=orig}
  if(kind==="peer")PR.sending=false;render();
  const cs=document.getElementById("chatScroll");if(cs)cs.scrollTop=cs.scrollHeight;
  if(hadFocus){const n=document.getElementById(id);if(n)n.focus({preventScroll:true})}}
/* Nova panel: same correction on the learner's bubble */
{const _aiSend=aiSend;aiSend=async function(text){const t0=String(text||"").trim();if(!AI.busy&&t0&&v4NeedFix(t0)){const p=_aiSend(text);const u=[...AI.turns].reverse().find(x=>x.role==="user"&&x.content===t0);if(u)v4Check(t0).then(r=>{if(r){u.en=r.en;u.enk=r.k;try{renderAI()}catch(e){}}});return p}return _aiSend(text)}}

/* mobile: the chat fills the screen, the send bar stays above the keyboard */
function v4ChatLayout(){const c=document.querySelector(".glass.chat"),B=document.body;
  let on=!!c&&innerWidth<=900&&!document.getElementById("docv");
  if(on){const was=B.classList.contains("v4chat");if(scrollY>0&&(!was||!B.classList.contains("v4kb")))scrollTo(0,0);
    const hd=document.querySelector("header.top"),hb=hd?hd.getBoundingClientRect().bottom:0,vh=window.visualViewport?visualViewport.height:innerHeight;
    let b=hb;for(const el of c.parentElement.children){if(el===c)break;const r=el.getBoundingClientRect();if(r.height)b=Math.max(b,r.bottom)}
    if(!was&&b-hb>vh*0.5)on=false;
    else{V4.maxVH=Math.max(V4.maxVH||0,vh);const kb=B.classList.contains("v4kb")&&vh<V4.maxVH*0.8;const top=kb?hb+4:Math.min(b+8,vh*0.42);document.documentElement.style.setProperty("--v4ct",Math.round(top)+"px");
      const cs=document.getElementById("chatScroll");if(cs&&!was)cs.scrollTop=cs.scrollHeight}}
  B.classList.toggle("v4chat",on)}
if(window.visualViewport)visualViewport.addEventListener("resize",()=>{v4ChatLayout();const cs=document.getElementById("chatScroll");if(cs&&B4near(cs))cs.scrollTop=cs.scrollHeight});
addEventListener("resize",()=>v4ChatLayout());
function B4near(cs){return cs.scrollHeight-cs.scrollTop-cs.clientHeight<260}
document.addEventListener("focusin",e=>{const t=e.target;if(!t||!t.matches||!t.matches(".v4bar input:not([type=file])"))return;
  document.body.classList.add("v4kb");if(V4.panel){V4.panel=null;const id=t.id;render();const n=document.getElementById(id);if(n&&document.activeElement!==n)n.focus({preventScroll:true})}
  v4ChatLayout();setTimeout(()=>{v4ChatLayout();const cs=document.getElementById("chatScroll");if(cs)cs.scrollTop=cs.scrollHeight},350)});
document.addEventListener("focusout",()=>setTimeout(()=>{const a=document.activeElement;if(!(a&&a.matches&&a.matches(".v4bar input:not([type=file])"))){document.body.classList.remove("v4kb");v4ChatLayout()}},120));
{const st=document.createElement("style");st.textContent=`
.v4fr{display:block;width:fit-content;max-width:100%;color:#B91C1C;background:#FFE4E6;border-radius:10px;padding:3px 8px;text-decoration:line-through;text-decoration-thickness:2px;white-space:pre-wrap}
.v4en{display:grid;gap:2px;margin-top:6px;color:#166534;background:#DCFCE7;border-radius:10px;padding:5px 9px;font-weight:600;white-space:pre-wrap}
.v4en-l{font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;opacity:.75;font-weight:800}
.v4bar:has(>input:not(:placeholder-shown)) .v4att{display:none}
.v4att{display:contents}
.v4bar .btn[type=submit]{padding-inline:16px;flex:none}
body::after{content:"";position:fixed;left:0;right:0;top:0;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:60;pointer-events:none}
@media (max-width:900px){
 body.v4chat nav.tabs{display:none!important}
 body.v4chat .glass.chat{position:fixed!important;left:0;right:0;top:var(--v4ct,140px);bottom:0;height:auto!important;max-height:none!important;z-index:25;border-radius:22px 22px 0 0;margin:0!important;display:flex!important;flex-direction:column}
 body.v4chat .glass.chat>.msgs{flex:1 1 auto;min-height:0}
 body.v4chat .glass.chat>.v4panel{flex:none;margin:6px 8px}
 body.v4chat .glass.chat>.chatbar,body.v4chat .glass.chat>.v4rec{flex:none;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
 body.v4chat.v4kb .glass.chat>.chatbar{padding-bottom:10px}
 body.v4chat .v4grid{max-height:min(210px,30vh)}
 body.v4chat main,body.v4chat .wrap{padding-bottom:0!important}
}`;document.head.appendChild(st)}

/* =====================================================================
   18. Like WhatsApp: delete (for me / for everyone), view once photos,
       reply, reactions, read ticks, day separators — in every messenger.
   ===================================================================== */
const V4RE=["👍","❤️","😂","😮","😢","🙏"];
V4.ctx={};
const v4HidKey=()=>"ec_hid_"+(S.uid||"x");
function v4Hidden(){if(!V4.hid||V4.hidFor!==S.uid){V4.hidFor=S.uid;try{V4.hid=new Set(JSON.parse(localStorage.getItem(v4HidKey())||"[]"))}catch(e){V4.hid=new Set()}}return V4.hid}
function v4HideForMe(id){const h=v4Hidden();h.add(id);try{localStorage.setItem(v4HidKey(),JSON.stringify([...h].slice(-3000)))}catch(e){}}
function v4Ctx(kind,id,x){let c;
  if(kind==="peer")c={target:id,other:peerName(id),list:()=>PR.inbox};
  else if(kind==="staff")c={target:id,other:x||"Teacher",readAt:((SC.meta[id]||{}).read||{})[id]||0,base:staffBase(id)+"/msgs",list:()=>SC.msgs};
  else{const st=x==="student";c={target:id,me:x,other:st?"Teacher":((person(id)||{}).name||"Student"),readAt:st?((S.me||{}).teacherReadAt||0):((person(id)||{}).studentReadAt||0),base:"students/"+id+"/msgs",list:()=>S.msgs}}
  V4.ctx[kind]=c;return c}
function v4Norm(kind,m,c){
  if(kind==="peer")return{id:m.id,mine:m.sender===S.uid,from:m.sender,text:m.body||"",att:m.att,at:+new Date(m.created_at),re:m.meta&&m.meta.re,react:m.react||{},del:!!m.deleted_at,read:!!m.read_at,opened:!!(m.opened_at||(m.att&&m.att.opened))};
  const mine=kind==="chat"?m.from===c.me:m.from===S.uid;
  return{id:m.id,mine,from:m.from,text:m.text||"",att:m.att,at:m.at,re:m.re,react:m.react||{},del:!!m.del,read:mine&&(c.readAt||0)>=m.at,opened:!!(m.att&&m.att.opened)}}
function v4Who(kind,w,c){if(!w)return"";if(w===S.uid||(kind==="chat"&&w===c.me))return"You";return c.other}
function v4DayLabel(d){const t=new Date();t.setHours(0,0,0,0);const x=new Date(d);x.setHours(0,0,0,0);const n=Math.round((t-x)/864e5);
  return n===0?"Today":n===1?"Yesterday":n<7?x.toLocaleDateString("en-GB",{weekday:"long"}):x.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:x.getFullYear()===t.getFullYear()?undefined:"numeric"})}
function v4MsgList(kind,list,c){const H=v4Hidden();let out="",lastDay="";
  for(const raw of list){const m=v4Norm(kind,raw,c);if(H.has(m.id))continue;const day=new Date(m.at).toDateString();
    if(day!==lastDay){lastDay=day;out+=`<div class="v4day"><span>${v4DayLabel(m.at)}</span></div>`}
    out+=v4MsgHTML(kind,m,c)}
  return out}
function v4MsgHTML(kind,m,c){const a=m.att,once=!!(a&&a.o)&&!m.del,stk=a&&a.k==="sticker"&&!m.text&&!m.del;let body;
  if(m.del)body=`<div class="v4del">⊘ ${m.mine?"You deleted this message":"This message was deleted"}</div>`;
  else if(once){const ob=`<i class="v4one">1</i>`;
    body=m.mine?`<div class="v4once">${ob}<b>Photo</b><small>${m.opened?"Opened":"View once"}</small></div>`
      :m.opened?`<div class="v4once off">${ob}<b>Opened</b></div>`
      :`<button type="button" class="v4once" data-v4="once" data-k="${kind}" data-id="${esc(m.id)}">${ob}<b>Photo</b><small>Tap to view once</small></button>`}
  else body=msgBodyHTML(m.text,a);
  const re=m.re&&!m.del?`<div class="v4quote" data-v4="jump" data-id="${esc(m.re.id||"")}"><div class="v4q-w">${esc(v4Who(kind,m.re.w,c))}</div><div class="v4q-t">${esc(m.re.t||"")}</div></div>`:"";
  const rx=Object.values(m.react||{}).filter(Boolean),rxh=rx.length&&!m.del?`<div class="v4rx">${[...new Set(rx)].map(e=>E(e)).join("")}${rx.length>1?`<b>${rx.length}</b>`:""}</div>`:"";
  const tick=m.mine&&!m.del&&kind!=="x"?`<i class="v4tick${m.read?" rd":""}" aria-label="${m.read?"Read":"Sent"}">${m.read?"✓✓":"✓"}</i>`:"";
  return`<div class="msg ${m.mine?"mine":""}${stk?" stk":""}${m.del?" del":""}${rxh?" hasrx":""}" data-mid="${esc(m.id)}" data-k="${kind}" id="m-${esc(m.id)}">${re}${body}<span>${fmtTime(m.at)}${tick}</span>${rxh}</div>`}
function v4ActSheet(kind,list,c){const raw=list.find(x=>x.id===V4.act.id);if(!raw)return"";const m=v4Norm(kind,raw,c),txt=v4Plain(m.text);
  return`<div class="v4sheet-bg" data-v4="actClose"></div><div class="v4sheet" role="dialog" aria-label="Message options">
  ${!m.del?`<div class="v4rxrow">${V4RE.map(e=>`<button type="button" data-v4="react" data-e="${e}" aria-pressed="${(m.react||{})[S.uid]===e}" aria-label="React ${e}">${E(e)}</button>`).join("")}</div>`:""}
  ${!m.del?`<button type="button" data-v4="reply">${ic("left")}Reply</button>`:""}
  ${!m.del&&txt?`<button type="button" data-v4="copy">${ic("copy")}Copy</button>`:""}
  <button type="button" data-v4="delMe">${ic("trash")}Delete for me</button>
  ${m.mine&&!m.del?`<button type="button" class="danger" data-v4="delAll">${ic("trash")}Delete for everyone</button>`:""}
  <button type="button" class="v4cancel" data-v4="actClose">Cancel</button></div>`}
function v4PreSheet(){const P=V4.pre;return`<div class="v4sheet-bg" data-v4="preX"></div><div class="v4sheet v4pre" role="dialog" aria-label="Send a photo">
  <img src="${P.url}" alt="Photo to send">
  <div class="v4pre-row"><input id="v4cap" placeholder="${P.once?"No caption for view once photos":"Add a caption…"}" maxlength="1000" ${P.once?"disabled":""} value="${esc(P.cap||"")}" autocomplete="off">
  <button type="button" class="v4onebtn${P.once?" on":""}" data-v4="preOnce" aria-pressed="${P.once}" title="View once" aria-label="View once"><i class="v4one">1</i></button>
  <button type="button" class="btn" data-v4="preSend" aria-label="Send">${ic("send")}</button></div>
  ${P.once?`<p class="small" style="margin:0">View once: your contact can open this photo only one time.</p>`:""}
  <button type="button" class="v4cancel" data-v4="preX">Cancel</button></div>`}
function v4TakeReply(kind){const r=V4.reply;if(!r||r.kind!==kind)return null;V4.reply=null;return{re:{id:r.id,t:r.t.slice(0,140),w:r.w}}}
function v4ActMsg(){const a=V4.act;if(!a)return null;const c=V4.ctx[a.kind];if(!c)return null;const raw=c.list().find(x=>x.id===a.id);return raw?{kind:a.kind,c,raw,m:v4Norm(a.kind,raw,c)}:null}
function v4DocPath(kind,c,id){return c.base+"/"+id}
async function v4React(e){const x=v4ActMsg();V4.act=null;if(!x){render();return}const cur=(x.m.react||{})[S.uid],ne=cur===e?"":e;
  if(x.kind==="peer"){x.raw.react={...(x.raw.react||{}),[S.uid]:ne};if(!ne)delete x.raw.react[S.uid];render();try{await window.__peer.react(x.raw.id,ne)}catch(er){toast(er.message||"Could not react","x")}return}
  x.raw.react={...(x.raw.react||{}),[S.uid]:ne};render();await write(()=>S.db.doc(v4DocPath(x.kind,x.c,x.raw.id)).update({react:{[S.uid]:ne}})).catch(()=>{})}
async function v4DelAll(){const x=v4ActMsg();V4.act=null;if(!x||!x.m.mine){render();return}
  if(x.kind==="peer"){try{await window.__peer.del(x.raw.id);x.raw.deleted_at=new Date().toISOString();x.raw.body="";x.raw.att=null;x.raw.meta=null}catch(er){toast(er.message||"Could not delete","x")}render();return}
  if(S.mode==="teacher")write(()=>S.db.collection("gradebook/archive/msgs").add({path:x.c.base,id:x.raw.id,from:x.raw.from||"",text:x.raw.text||"",att:x.raw.att||null,at:x.raw.at||0,delAt:Date.now(),by:S.uid})).catch(()=>{});
  Object.assign(x.raw,{del:true,text:"",att:null,re:null});render();
  await write(()=>S.db.doc(v4DocPath(x.kind,x.c,x.raw.id)).update({del:true,text:"",att:null,re:null,react:null})).catch(()=>{});
  if(x.kind==="chat")write(()=>S.db.doc("students/"+x.c.target).update({lastMsgText:"⊘ Message deleted"})).catch(()=>{})}
async function v4OpenOnce(kind,id){const c=V4.ctx[kind];if(!c)return;const raw=c.list().find(x=>x.id===id);if(!raw)return;
  let att=null;
  try{if(kind==="peer"){att=await window.__peer.openOnce(id);raw.opened_at=new Date().toISOString();raw.att={k:"img",o:true,opened:true}}
    else{att=raw.att&&raw.att.p?{...raw.att}:null;const op={k:"img",o:true,opened:Date.now(),p:null,t:null,n:null,s:null};raw.att=op;write(()=>S.db.doc(v4DocPath(kind,c,id)).update({att:op})).catch(()=>{})}}
  catch(er){toast(er.message||"Cannot open this photo.","x");return}
  render();if(!att||!att.p){toast("This photo was already opened.","eye");return}
  const ov=document.createElement("div");ov.className="v4onceview";ov.innerHTML=`<div class="v4spin"></div><button type="button" class="iconbtn" aria-label="Close">${ic("x")}</button><p>View once · it disappears when you close it</p>`;document.body.appendChild(ov);
  let url=null;const close=()=>{ov.remove();if(url)URL.revokeObjectURL(url)};ov.querySelector("button").onclick=close;
  try{const r=await fetch(await srcURL({k:"m",id:att.p,t:att.t}));const b=await r.blob();url=URL.createObjectURL(b);const im=new Image();im.src=url;im.alt="View once photo";im.draggable=false;im.oncontextmenu=e=>e.preventDefault();ov.querySelector(".v4spin").replaceWith(im)}
  catch(er){ov.querySelector(".v4spin").replaceWith(Object.assign(document.createElement("p"),{textContent:"Cannot load the photo (network)."}))}}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4;
  switch(a){
  case"actClose":V4.act=null;render();return;
  case"react":v4React(el.dataset.e);return;
  case"reply":{const x=v4ActMsg();V4.act=null;if(x){const t=v4Plain(x.m.text)||attLabel(x.m.att)||"Message";V4.reply={kind:x.kind,id:x.raw.id,t:t.slice(0,140),w:x.kind==="chat"?x.raw.from:(x.kind==="peer"?x.raw.sender:x.raw.from),who:x.m.mine?"yourself":x.c.other}}render();const n=document.getElementById(V4IN(x?x.kind:"chat"));if(n)n.focus();return}
  case"replyX":V4.reply=null;render();return;
  case"copy":{const x=v4ActMsg();V4.act=null;render();if(x){const t=v4Plain(x.m.text);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Message copied","copy")).catch(()=>toast("Cannot copy here.","x"))}return}
  case"delMe":{const x=v4ActMsg();V4.act=null;if(x){v4HideForMe(x.raw.id);toast("Message deleted for you","trash")}render();return}
  case"delAll":v4DelAll();return;
  case"once":v4OpenOnce(el.dataset.k,el.dataset.id);return;
  case"jump":{const t=document.getElementById("m-"+el.dataset.id);if(t){t.scrollIntoView({block:"center",behavior:"smooth"});t.classList.add("v4flash");setTimeout(()=>t.classList.remove("v4flash"),1200)}return}
  case"preX":if(V4.pre)URL.revokeObjectURL(V4.pre.url);V4.pre=null;render();return;
  case"preOnce":if(V4.pre){V4.pre.cap=(document.getElementById("v4cap")||{}).value||V4.pre.cap||"";V4.pre.once=!V4.pre.once;render()}return;
  case"preSend":{const P=V4.pre;if(!P)return;const cap=(document.getElementById("v4cap")||{}).value||"";V4.pre=null;URL.revokeObjectURL(P.url);render();v4SendFile(P.kind,P.target,P.file,P.file.name,"img",null,{once:P.once,caption:cap});return}
  }},true);
/* option sheets live outside the chat box (so nothing clips them) */
function v4SyncSheets(){let host=document.getElementById("v4sheets");if(!host){host=document.createElement("div");host.id="v4sheets";document.body.appendChild(host)}
  const inChat=!!document.getElementById("chatScroll");let h="";
  if(inChat){const a=V4.act,c=a&&V4.ctx[a.kind];if(a&&c)h=v4ActSheet(a.kind,c.list(),c);else if(V4.pre)h=v4PreSheet()}
  else{V4.act=null;if(V4.pre){URL.revokeObjectURL(V4.pre.url);V4.pre=null}}
  if(host._h!==h){host._h=h;host.innerHTML=h}}
{const _l=v4ChatLayout;v4ChatLayout=function(){_l();v4SyncSheets()}}
/* tap (or long-press / right-click) on a message → options */
function v4MsgTap(e){const b=e.target.closest&&e.target.closest(".msg[data-mid]");if(!b||e.target.closest("button,a,input,label,.v4quote"))return;if(String(b.dataset.mid).startsWith("tmp"))return;
  e.preventDefault();V4.act={kind:b.dataset.k,id:b.dataset.mid};render()}
document.addEventListener("click",v4MsgTap);
document.addEventListener("contextmenu",e=>{if(e.target.closest&&e.target.closest(".msg[data-mid]"))v4MsgTap(e)});
/* classmates: live updates (deleted, reactions, read ticks, opened) */
{const _ps=peerStart;peerStart=function(){const was=!!PR.un;_ps();if(!was&&PR.un&&window.__peer&&window.__peer.listenUpd&&!PR.unU)PR.unU=window.__peer.listenUpd(m=>{const i=PR.inbox.findIndex(x=>x.id===m.id);if(i>=0){PR.inbox[i]={...PR.inbox[i],...m};render()}})}}
/* moderation: deleted messages and view once photos stay visible for teachers */
{const _pm=peerModView;peerModView=function(){const h=_pm();if(V4.arch===undefined&&window.__peer&&window.__peer.archive){V4.arch=null;window.__peer.archive().then(r=>{V4.arch=r;render()}).catch(()=>{V4.arch=[]})}
  const L=V4.arch||[];if(!L.length)return h;const nm=id=>(person(id)||{}).name||"Student";
  return h+`<div class="section"><div><span class="eyebrow">Safety copy</span><h2>Deleted messages and view once photos</h2><p class="sub">Students can delete their messages and send view once photos. A copy stays here for you, so you can act if there is a problem.</p></div><div class="glass list">${L.slice(0,100).map(x=>`<div class="it"><div class="txt"><b>${esc(nm(x.sender))} → ${esc(nm(x.receiver))} <span class="chip ${x.kind==="once"?"warn":"bad"}">${x.kind==="once"?"View once":"Deleted"}</span></b><span>${msgBodyHTML(x.body||"",x.att&&x.att.p?{...x.att,o:undefined}:null)}</span><small class="muted">${fmtTime(+new Date(x.sent_at||x.created_at))}</small></div></div>`).join("")}</div></div>`}}
{const st=document.createElement("style");st.textContent=`
.v4day{display:flex;justify-content:center;margin:6px 0}.v4day span{font-size:.72rem;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--line);color:var(--muted);opacity:1;margin:0;display:inline-block}
.msg[data-mid]{cursor:pointer;-webkit-user-select:text;user-select:text;position:relative}
.msg.hasrx{margin-bottom:12px}
.msg .v4tick{font-style:normal;margin-left:6px;letter-spacing:-2px;font-weight:700}.msg .v4tick.rd{color:#34B7F1;opacity:1}
.v4del{font-style:italic;opacity:.75}
.msg.del{opacity:.85}
.v4quote{display:grid;gap:1px;border-left:4px solid #8B7CFF;background:rgba(127,127,160,.16);border-radius:10px;padding:5px 9px;margin-bottom:6px;cursor:pointer;max-width:100%;min-width:0}
.v4q-w{font-size:.75rem;font-weight:800;color:#8B7CFF}.v4q-t{font-size:.84rem;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v4replybar{display:flex;align-items:center;gap:8px;padding:8px 10px 0;background:var(--surface)}.v4replybar .v4quote{flex:1;margin:0}
.v4rx{position:absolute;bottom:-14px;right:10px;display:flex;align-items:center;gap:2px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:1px 7px;font-size:.95rem;box-shadow:var(--shadow)}.msg:not(.mine) .v4rx{right:auto;left:10px}.v4rx b{font-size:.7rem;margin-left:2px;color:var(--muted)}.v4rx .e3d{width:18px;height:18px}
.v4once{display:flex;align-items:center;gap:8px;border:0;background:none;color:inherit;font:inherit;padding:2px 0;cursor:pointer;text-align:left}.v4once small{opacity:.7;margin-left:4px}.v4once.off{opacity:.6;cursor:default}
.v4one{font-style:normal;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:2px dashed currentColor;font-size:.72rem;font-weight:800;line-height:1}
.v4sheet-bg{position:fixed;inset:0;background:rgba(5,8,20,.45);z-index:80}
.v4sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(440px,100%);z-index:81;background:var(--surface);color:var(--fg);border-radius:22px 22px 0 0;padding:12px 12px calc(14px + env(safe-area-inset-bottom,0px));display:grid;gap:4px;box-shadow:0 -10px 40px rgba(0,0,0,.35);animation:v4up .18s ease-out}
@keyframes v4up{from{transform:translate(-50%,30px);opacity:0}}
.v4sheet>button{display:flex;align-items:center;gap:12px;border:0;background:none;color:inherit;font:inherit;font-weight:600;padding:13px 12px;border-radius:12px;cursor:pointer;text-align:left}.v4sheet>button:hover{background:var(--surface2)}.v4sheet>button svg{width:20px;height:20px}
.v4sheet>button.danger{color:#E5484D}.v4sheet .v4cancel{justify-content:center;color:var(--muted)}
.v4rxrow{display:flex;justify-content:space-around;padding:4px 0 8px;border-bottom:1px solid var(--line);margin-bottom:4px}.v4rxrow button{border:0;background:none;font-size:1.7rem;cursor:pointer;border-radius:50%;width:48px;height:48px;display:grid;place-items:center}.v4rxrow button[aria-pressed=true]{background:var(--ink-soft)}.v4rxrow .e3d{width:32px;height:32px}
.v4pre img{max-width:100%;max-height:52vh;object-fit:contain;border-radius:14px;margin:0 auto;display:block;background:#000}
.v4pre-row{display:flex;gap:8px;align-items:center;margin-top:8px}.v4pre-row input{flex:1;min-width:0}
.v4onebtn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--surface2);color:var(--fg);display:grid;place-items:center;cursor:pointer;flex:none}.v4onebtn.on{background:#25D366;color:#fff;border-color:transparent}
.v4onceview{position:fixed;inset:0;z-index:90;background:#000;display:grid;place-items:center;color:#fff}.v4onceview img{max-width:100vw;max-height:88vh;object-fit:contain;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.v4onceview .iconbtn{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:12px;background:rgba(255,255,255,.15);color:#fff}.v4onceview p{position:absolute;bottom:calc(16px + env(safe-area-inset-bottom,0px));margin:0;font-size:.85rem;opacity:.8}
.msg.v4flash{animation:v4fl 1.2s}@keyframes v4fl{30%{box-shadow:0 0 0 4px #8B7CFF}}
`;document.head.appendChild(st)}

/* =====================================================================
   19. Community: posts (like Facebook) and 24-hour stories (like WhatsApp)
   ===================================================================== */
const F={posts:[],likes:{},comments:{},stories:[],views:[],reacts:[],seen:new Set(),pick:null,share:null,loaded:false,loading:false,err:"",busy:false,files:[],open:{},more:true,sv:null,sc:null,at:0};
const SBG=["linear-gradient(135deg,#6C80FF,#9A7CFF)","linear-gradient(135deg,#FF7A59,#FFB443)","linear-gradient(135deg,#11998E,#38EF7D)","linear-gradient(135deg,#E94057,#8A2387)","linear-gradient(135deg,#1E3C72,#2A5298)","linear-gradient(135deg,#232526,#414345)"];
const sbg=k=>SBG[+String(k||"g0").slice(1)||0]||SBG[0];
const feedOn=()=>!!window.__feed&&(S.mode==="teacher"?!!(S.isOwner||S.isStaff):(S.mode==="student"&&!!S.me&&!isParent(S.me)&&stOf(S.me)==="active"&&S.me.profile!=="primaire"&&S.settings.feed!==false&&!devBlocked()));
const fStaff=()=>S.mode==="teacher"&&(S.isOwner||S.isStaff);
function whoAva(who,uid,size){who=who||{};const z=size?`width:${size}px;height:${size}px;`:"";
  if(who.photo&&/^https:\/\/[^/]+\/storage\/v1\/object\/public\/avatars\//.test(who.photo))return`<span class="av photo" style="${z}"><img src="${esc(who.photo)}" alt="" loading="lazy" onerror="this.remove()"></span>`;
  if(who.ava)return`<span class="av ava" style="background:${avTone(uid)};${z}${size?`font-size:${size/1.9}px`:""}">${avaHTML(who.ava)}</span>`;
  return`<span class="av" style="background:${avTone(uid)};${z}${size?`font-size:${size/2.6}px`:""}">${esc(initials(who.name||"?"))}</span>`}
function myWho(){if(S.mode==="student"&&S.me)return{name:S.me.name,photo:S.me.photo,ava:S.me.ava,classe:S.me.classe,role:"student"};const d=(S.staff||[]).find(x=>x.id===S.uid)||{};return{name:d.name||"Teacher",role:"teacher"}}
function fText(t){const x=v4Split(t);return x?v4FixHTML(x[0],x[1],x[2]):`<div class="ftext">${E(String(t||""))}</div>`}
function fPackN(fr,en,k,max){const mk=k==="fix"?V4MK2:V4MK;return fr.length+mk.length+en.length<=max?fr+mk+en:fr}
async function fFix(t,max){t=String(t||"").trim();if(!t||!v4NeedFix(t))return t;const r=await v4Check(t);return r?fPackN(t,r.en,r.k,max):t}
async function feedLoad(more){if(!feedOn()||F.loading)return;F.loading=true;
  try{const before=more&&F.posts.length?F.posts[F.posts.length-1].created_at:null;
    const[p,st,vw,rx]=await Promise.all([window.__feed.posts(before),more?Promise.resolve(F.stories):window.__feed.stories(),more?Promise.resolve(F.views):window.__feed.storyViews(),more||!window.__feed.storyReactions?Promise.resolve(F.reacts):window.__feed.storyReactions()]);F.reacts=rx||[];
    const ids=p.map(x=>x.id);const[lk,cm]=await Promise.all([window.__feed.likes(ids),window.__feed.comments(ids)]);
    for(const id of ids){F.likes[id]=[];F.comments[id]=[]}for(const l of lk)(F.likes[l.post_id]=F.likes[l.post_id]||[]).push(l);for(const c of cm)(F.comments[c.post_id]=F.comments[c.post_id]||[]).push(c);
    F.posts=more?[...F.posts,...p.filter(x=>!F.posts.some(y=>y.id===x.id))]:p;F.more=p.length>=30;F.stories=st;F.views=vw;for(const v of vw)if(v.uid===S.uid)F.seen.add(v.story_id);
    F.loaded=true;F.err="";F.at=Date.now();fCleanMyMedia()}
  catch(e){F.loaded=true;F.err=(e&&e.message)||"Cannot load the Community right now."}
  F.loading=false;render()}
setInterval(()=>{if(feedOn()&&document.visibilityState==="visible"&&(S.view?.type==="feed"||S.msgsTab==="community"||(S.mode==="student"&&S.tab==="home"&&!S.view))&&Date.now()-F.at>60000)feedLoad()},15000);
/* stories grouped by person */
function fGroups(){const g={};for(const s of F.stories){if(s.deleted_at&&!fStaff())continue;(g[s.author]=g[s.author]||{uid:s.author,who:s.who,list:[]}).list.push(s)}
  const L=Object.values(g);for(const x of L){x.last=+new Date(x.list[x.list.length-1].created_at);x.unseen=x.uid!==S.uid&&x.list.some(s=>!F.seen.has(s.id))}
  return L.sort((a,b)=>(b.uid===S.uid)-(a.uid===S.uid)||(b.unseen-a.unseen)||(b.last-a.last))}
function feedRailHTML(withLink){if(!feedOn())return"";if(!F.loaded&&!F.loading)feedLoad();const G=fGroups(),mine=G.find(x=>x.uid===S.uid);
  const newPosts=F.posts.filter(p=>+new Date(p.created_at)>(+localStorage.getItem("ec_feed_seen_"+S.uid)||0)&&p.author!==S.uid&&!p.deleted_at).length;
  return`<div class="section frail-wrap"><div class="frail">
  <button type="button" class="fst add" data-v4="${mine?"fOpenStory":"fNewStory"}" data-id="${S.uid}"><span class="fring${mine?" seen":""}">${whoAva(myWho(),S.uid,56)}${mine?"":`<i class="fplus">+</i>`}</span><small>${mine?"My story":"Add story"}</small></button>
  ${G.filter(x=>x.uid!==S.uid).map(x=>`<button type="button" class="fst" data-v4="fOpenStory" data-id="${x.uid}"><span class="fring${x.unseen?"":" seen"}">${whoAva(x.who,x.uid,56)}</span><small>${esc(String(x.who?.name||"").split(" ")[0])}</small></button>`).join("")}
  ${withLink?`<button type="button" class="fst link" data-v4="fFeed"><span class="fring seen"><span class="fcomm">${ic("users")}</span></span><small>Posts${newPosts?` <b class="fnew">${newPosts>9?"9+":newPosts}</b>`:""}</small></button>`:""}
  </div></div>`}
function fPostHTML(p){const lk=F.likes[p.id]||[],cm=(F.comments[p.id]||[]).filter(c=>!c.deleted_at||fStaff()),liked=lk.some(l=>l.uid===S.uid),mine=p.author===S.uid,canDel=(mine||fStaff())&&!p.deleted_at,open=F.open[p.id];
  const media=Array.isArray(p.media)?p.media:[];const shown=open?cm:cm.slice(-2);
  return`<article class="glass fpost${p.deleted_at?" fdel":""}" id="p-${esc(p.id)}">
  <header>${whoAva(p.who,p.author,42)}<div class="fwho"><b>${esc(p.who?.name||"Student")}</b>${p.who?.role==="teacher"?` <span class="chip ok">Teacher</span>`:""}<small>${p.who?.classe?esc(CL(p.who.classe))+" · ":""}${ago(+new Date(p.created_at))}</small></div>
  ${canDel?`<button type="button" class="iconbtn sm" data-v4="fDel" data-id="${esc(p.id)}" aria-label="Delete this post" title="Delete">${ic("trash")}</button>`:""}</header>
  ${p.deleted_at?`<span class="chip bad">Deleted · only teachers see it</span>`:""}
  ${p.body?fText(p.body):""}
  ${fMediaHTML(media)}
  ${p.shared?fSharedHTML(p.shared):""}
  <div class="fcount">${lk.length?`<span>${[...new Set(lk.map(l=>l.e||"❤️"))].slice(0,3).map(e=>E(e)).join("")} ${lk.length}</span>`:"<span></span>"}${cm.length?`<button type="button" class="linkbtn" data-v4="fCom" data-id="${esc(p.id)}">${cm.length} comment${cm.length>1?"s":""}</button>`:""}</div>
  ${p.deleted_at?"":`${F.pick===p.id?`<div class="fpick">${FRE.map(e=>`<button type="button" data-v4="fLikeE" data-id="${esc(p.id)}" data-e="${e}" aria-label="React ${e}">${E(e)}</button>`).join("")}</div>`:""}<div class="factions"><button type="button" class="${liked?"on":""}" data-v4="fLike" data-id="${esc(p.id)}" aria-pressed="${liked}">${E(liked?(lk.find(l=>l.uid===S.uid).e||"❤️"):"🤍")} ${liked?"Liked":"Like"}</button><button type="button" class="fmore" data-v4="fPick" data-id="${esc(p.id)}" aria-label="More reactions" title="More reactions">${E("😊")}</button><button type="button" data-v4="fCom" data-id="${esc(p.id)}">${ic("chat")} Comment</button><button type="button" data-v4="fShare" data-k="post" data-id="${esc(p.id)}">${ic("send")} Share</button></div>`}
  ${shown.length||open?`<div class="fcoms">${cm.length>shown.length?`<button type="button" class="linkbtn" data-v4="fCom" data-id="${esc(p.id)}">See all ${cm.length} comments</button>`:""}${shown.map(c=>`<div class="fc">${whoAva(c.who,c.author,30)}<div class="fcb"><b>${esc(c.who?.name||"Student")}</b>${fText(c.body)}<small>${ago(+new Date(c.created_at))}${c.deleted_at?" · deleted":""}${!c.deleted_at&&(c.author===S.uid||mine||fStaff())?` · <button type="button" class="linkbtn" data-v4="fComDel" data-id="${esc(c.id)}">Delete</button>`:""}</small></div></div>`).join("")}
  ${open&&!p.deleted_at?`<form class="fcform" data-ff="com" data-id="${esc(p.id)}"><input id="fc_${esc(p.id)}" placeholder="Write a comment in English…" maxlength="1000" autocomplete="off"><button class="btn sm" type="submit" aria-label="Send">${ic("send")}</button></form>`:""}</div>`:""}
  </article>`}
function feedView(embedded){if(!F.loaded&&!F.loading)feedLoad();try{localStorage.setItem("ec_feed_seen_"+S.uid,String(Date.now()))}catch(e){}
  const vis=F.posts.filter(p=>!p.deleted_at||fStaff());
  return`${embedded?"":`<div class="section" style="max-width:640px;margin-inline:auto">${backBtn()}</div>`}
  <div class="section fwrap"><div><span class="eyebrow">Your school</span><h2>Community</h2><p class="sub">Share news, photos and stories with your school, in English! Stories disappear after 24 hours.</p></div>
  ${fStaff()&&S.isOwner?`<div class="glass row between fset"><span class="small">Community for students: <b>${S.settings.feed===false?"off":"on"}</b></span><button type="button" class="btn ghost sm" data-v4="fToggle">${S.settings.feed===false?"Turn on":"Turn off"}</button></div>`:""}
  </div>
  ${feedRailHTML(false)}
  <div class="section fwrap"><form class="glass card fcomp" data-ff="post"><div class="row" style="align-items:flex-start">${whoAva(myWho(),S.uid,42)}<textarea id="f_text" rows="2" maxlength="4000" placeholder="What's new? Write in English…">${esc(S.drafts.f_text||"")}</textarea></div>
  ${F.files.length?`<div class="fthumbs">${F.files.map((f,i)=>`<span>${f.kind==="video"?`<video src="${f.url}" muted playsinline preload="metadata"></video><i class="fvbadge">▶ ${fmtDur(f.d||0)}</i>`:`<img src="${f.url}" alt="">`}<button type="button" data-v4="fFileX" data-i="${i}" aria-label="Remove">×</button></span>`).join("")}</div>`:""}
  <div class="row between"><div class="row"><label class="btn ghost sm">${ic("camera")}Photo / video<input type="file" id="f_files" accept="image/*,video/*" multiple hidden></label><button type="button" class="btn ghost sm" data-v4="fNewStory">${ic("plus")}Story</button></div><button class="btn sm" type="submit" ${F.busy?"disabled":""}>${F.busy?"Posting…":"Post"}</button></div></form>
  ${F.err?`<div class="glass card small">${esc(F.err)}</div>`:""}
  ${!F.loaded?`<div class="empty">Loading…</div>`:vis.length?vis.map(fPostHTML).join(""):`<div class="empty">No posts yet. Be the first to share something!</div>`}
  ${F.loaded&&F.more&&vis.length?`<div style="text-align:center"><button type="button" class="btn ghost sm" data-v4="fMore">See older posts</button></div>`:""}
  </div>`}
/* story viewer */
function fOpenStory(uid){const G=fGroups(),gi=G.findIndex(x=>x.uid===uid);if(gi<0)return;const g=G[gi];let si=g.list.findIndex(s=>!F.seen.has(s.id));if(si<0||uid===S.uid)si=0;F.sv={G,gi,si,t0:Date.now(),views:false};fShow()}
function fCur(){const v=F.sv;if(!v)return null;const g=v.G[v.gi];return g?{g,s:g.list[v.si]}:null}
function fShow(){const c=fCur();if(!c){F.sv=null;feedSync();return}const s=c.s;F.sv.t0=Date.now();
  if(c.g.uid!==S.uid&&!F.seen.has(s.id)){F.seen.add(s.id);window.__feed.viewStory(s.id).catch(()=>{})}
  clearTimeout(F.svT);if(!F.sv.views&&!F.sv.typing&&!F.share)F.svT=setTimeout(()=>fStep(1),fSdur(s)*1000+(fIsVid(s)?2500:0));feedSync();fVidStart();
  if(s.media&&s.media.p&&!fIsVid(s)&&!V4.obj[s.media.p])srcBlob({k:"m",id:s.media.p,t:s.media.t}).then(b=>{V4.obj[s.media.p]=URL.createObjectURL(b);if(fCur()&&fCur().s.id===s.id)fShow()}).catch(()=>{})}
function fStep(d){const v=F.sv;if(!v)return;const g=v.G[v.gi];v.si+=d;if(v.si>=g.list.length){v.gi++;v.si=0}else if(v.si<0){v.gi--;if(v.gi<0){v.gi=0;v.si=0}else v.si=v.G[v.gi].list.length-1}
  if(v.gi>=v.G.length){fCloseStory();return}fShow()}
function fCloseStory(){clearTimeout(F.svT);F.sv=null;feedSync();render()}
function fStoryHTML(){const c=fCur();if(!c)return"";const{g,s}=c,mine=g.uid===S.uid,v=F.sv,dur=fSdur(s);
  const views=F.views.filter(x=>x.story_id===s.id),rxs=F.reacts.filter(x=>x.story_id===s.id&&x.uid!==S.uid);const img=s.media&&s.media.p?V4.obj[s.media.p]:null;
  return`<div class="fsv" style="${s.media?"":`background:${sbg(s.bg)}`}">
  <div class="fsv-bars">${g.list.map((x,i)=>`<i class="${i<v.si?"done":i===v.si?(v.views||v.typing?"run paused":"run"):""}" style="--d:${dur}s"></i>`).join("")}</div>
  <div class="fsv-top">${whoAva(g.who,g.uid,36)}<div><b>${esc(mine?"My story":g.who?.name||"Student")}</b><small>${ago(+new Date(s.created_at))}</small></div><button type="button" class="iconbtn" data-v4="fSvClose" aria-label="Close">${ic("x")}</button></div>
  ${s.media?`<div class="fsv-media">${fIsVid(s)?(F.svUrl&&F.svUrl.id===s.id?`<video id="fsvVid" src="${F.svUrl.url}" autoplay playsinline ${F.svMute?"muted":""}></video>${F.svMute?`<button type="button" class="fsv-snd" data-v4="fSvSnd">🔇 Tap for sound</button>`:""}`:`<div class="v4spin"></div>`):img?`<img src="${img}" alt="Story photo">`:`<div class="v4spin"></div>`}</div>`:""}
  ${s.body?`<div class="fsv-text${s.media?" cap":""}">${fText(s.body)}</div>`:""}
  <button type="button" class="fsv-nav l" data-v4="fSvPrev" aria-label="Previous"></button><button type="button" class="fsv-nav r" data-v4="fSvNext" aria-label="Next"></button>
  <div class="fsv-bot">${mine||fStaff()?`<button type="button" class="btn ghost sm" data-v4="fSvViews">${ic("eye")}${views.length}${rxs.length?` · ${[...new Set(rxs.map(x=>x.e))].slice(0,3).map(e=>E(e)).join("")} ${rxs.length}`:""}</button>${mine?"":fSvReactBtns(s)}<button type="button" class="btn ghost sm" data-v4="fShare" data-k="story" data-id="${esc(s.id)}">${ic("send")}Share</button><button type="button" class="btn ghost sm" data-v4="fSvDel">${ic("trash")}Delete</button>`
    :`${fSvReactBtns(s)}${S.mode==="student"&&peerOn()&&g.who?.role==="student"?`<form class="fsv-reply" data-ff="srep"><input id="fsv_rep" placeholder="Reply to ${esc(String(g.who?.name||"").split(" ")[0])}…" maxlength="1000" autocomplete="off"><button class="btn sm" type="submit" aria-label="Send">${ic("send")}</button></form>`:""}<button type="button" class="btn ghost sm fsv-sh" data-v4="fShare" data-k="story" data-id="${esc(s.id)}" aria-label="Share">${ic("send")}</button>`}</div>
  ${v.views?`<div class="v4sheet fsv-views"><b>Seen by ${views.length}</b>${views.length?views.map(x=>{const r=rxs.find(y=>y.uid===x.uid);return`<div class="row">${whoAva(x.who,x.uid,30)}<span>${esc(x.who?.name||"Student")}</span>${r?`<span class="fsv-vr">${E(r.e)}</span>`:""}<small class="muted" style="margin-left:auto">${ago(+new Date(x.at))}</small></div>`}).join(""):`<p class="small muted">Nobody yet.</p>`}<button type="button" class="v4cancel" data-v4="fSvViewsX">Close</button></div>`:""}
  </div>`}
/* story composer */
function fComposerHTML(){const c=F.sc;return`<div class="fsv fsc" style="${c.url?"":`background:${sbg(c.bg)}`}">
  <div class="fsv-top"><b style="flex:1">New story</b><button type="button" class="iconbtn" data-v4="fScX" aria-label="Close">${ic("x")}</button></div>
  ${c.url?`<div class="fsv-media">${c.video?`<video src="${c.url}" autoplay muted loop playsinline></video>`:`<img src="${c.url}" alt="">`}</div>`:""}
  <textarea id="fsc_text" class="${c.url?"cap":""}" maxlength="300" placeholder="${c.url?"Add a caption…":"Type your story in English…"}">${esc(c.text||"")}</textarea>
  <div class="fsv-bot">${c.url?"":`<div class="fbgs">${SBG.map((b,i)=>`<button type="button" style="background:${b}" data-v4="fScBg" data-i="${i}" aria-pressed="${c.bg==="g"+i}" aria-label="Colour ${i+1}"></button>`).join("")}</div>`}
  <label class="btn ghost sm">${ic("camera")}${c.url?"Change":"Photo / video"}<input type="file" id="fsc_file" accept="image/*,video/*" hidden></label>
  <button type="button" class="btn sm" data-v4="fScPost" ${c.busy?"disabled":""}>${c.busy?"Posting…":"Share story"}</button></div></div>`}
function feedSync(){let host=document.getElementById("fsvhost");if(!host){host=document.createElement("div");host.id="fsvhost";document.body.appendChild(host)}
  const h=(F.sc?fComposerHTML():F.sv?fStoryHTML():"")+(F.share?fShareHTML():"");if(host._h!==h){const ta=document.activeElement&&document.activeElement.id,val=ta&&document.getElementById(ta)?document.getElementById(ta).value:null;host._h=h;host.innerHTML=h;
    if(ta&&val!=null){const n=document.getElementById(ta);if(n){n.value=val;n.focus()}}}
  document.body.classList.toggle("fsv-on",!!h)}
async function fUpload(file,d){if(/^video\//.test(file.type)){const poster=await fPoster(file).catch(()=>null);let pp=null;if(poster){const u2=await window.__chatFiles.upload(poster,"poster.jpg");V4.obj[u2.p]=URL.createObjectURL(poster);pp={p:u2.p,t:u2.t}}
    const up=await window.__chatFiles.upload(file,file.name||"video.mp4");return{p:up.p,t:up.t,d:Math.round(d||0),...(pp?{poster:pp}:{})}}
  const f=/gif/.test(file.type)?file:await shrinkImg(file,1440,.78);const up=await window.__chatFiles.upload(f,file.name||"photo.jpg");V4.obj[up.p]=URL.createObjectURL(f);fcPut("m:"+up.p,f);return{p:up.p,t:up.t}}
async function fPost(){if(F.busy)return;const ta=document.getElementById("f_text"),text=((ta&&ta.value)||"").trim();if(!text&&!F.files.length){toast("Write something or add a photo.","x");return}
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
  F.busy=true;render();
  try{const media=[];if(F.files.some(f=>f.kind==="video"))toast("Uploading the video… keep the app open.","clock");for(const f of F.files)media.push(await fUpload(f.file,f.d));const body=await fFix(text,4000);
    await window.__feed.create(body,media);for(const f of F.files)URL.revokeObjectURL(f.url);F.files=[];delete S.drafts.f_text;if(ta)ta.value="";toast("Posted!","rocket");await feedLoad()}
  catch(e){toast((e&&e.message)||"Could not publish","x")}F.busy=false;render()}
async function fComment(id,inp){const t=(inp.value||"").trim();if(!t)return;inp.value="";delete S.drafts[inp.id];
  try{const body=await fFix(t,1000);const cid=await window.__feed.comment(id,body);(F.comments[id]=F.comments[id]||[]).push({id:cid||("tmp"+Date.now()),post_id:id,author:S.uid,who:myWho(),body,created_at:new Date().toISOString()});F.open[id]=true;render();const n=document.getElementById("fc_"+id);if(n)n.focus()}
  catch(e){toast((e&&e.message)||"Could not comment","x");inp.value=t}}
async function fLike(id,e){const L=F.likes[id]=F.likes[id]||[],i=L.findIndex(l=>l.uid===S.uid);e=e||(i>=0?L[i].e:"❤️")||"❤️";F.pick=null;if(i>=0&&L[i].e===e)L.splice(i,1);else if(i>=0)L[i].e=e;else L.push({post_id:id,uid:S.uid,e});render();try{await window.__feed.like(id,e)}catch(er){toast(er.message||"Could not react","x");feedLoad()}}
async function fStoryPost(){const c=F.sc;if(!c||c.busy)return;const t=((document.getElementById("fsc_text")||{}).value||"").trim();if(!t&&!c.file){toast("Write something or add a photo.","x");return}
  c.busy=true;c.text=t;feedSync();try{if(c.video)toast("Uploading the video… keep the app open.","clock");const media=c.file?await fUpload(c.file,c.d):null;const body=await fFix(t,300);await window.__feed.story(media,body,c.url?"":c.bg);if(media)fRememberMedia(media);if(c.url)URL.revokeObjectURL(c.url);F.sc=null;feedSync();toast("Story shared! It stays 24 hours.","rocket");await feedLoad()}
  catch(e){c.busy=false;feedSync();toast((e&&e.message)||"Could not share","x")}}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4,id=el.dataset.id;
  switch(a){
  case"fFeed":S.view={type:"feed"};S.animate=true;scrollTo(0,0);render();return;
  case"fMore":feedLoad(true);return;
  case"fLike":fLike(id);return;
  case"fCom":F.open[id]=!F.open[id]||el.closest(".fcount,.fcoms")?true:false;render();if(F.open[id]){const n=document.getElementById("fc_"+id);if(n)n.focus()}return;
  case"fDel":if(confirm("Delete this post?"))window.__feed.del(id).then(()=>{toast("Post deleted","trash");feedLoad()}).catch(er=>toast(er.message,"x"));return;
  case"fComDel":window.__feed.delComment(id).then(()=>{for(const k in F.comments)F.comments[k]=F.comments[k].filter(c=>c.id!==id);render();feedLoad()}).catch(er=>toast(er.message,"x"));return;
  case"fFileX":{const f=F.files.splice(+el.dataset.i,1)[0];if(f)URL.revokeObjectURL(f.url);render();return}
  case"fToggle":write(()=>S.db.doc("settings/main").set({...S.settings,feed:S.settings.feed===false})).then(()=>toast("Saved","check")).catch(()=>{});return;
  case"fNewStory":F.sc={bg:"g0",text:"",file:null,url:null};feedSync();setTimeout(()=>document.getElementById("fsc_text")?.focus(),50);return;
  case"fOpenStory":fOpenStory(id);return;
  case"fSvClose":fCloseStory();return;
  case"fSvNext":fStep(1);return;case"fSvPrev":fStep(-1);return;
  case"fSvViews":F.sv.views=true;clearTimeout(F.svT);feedSync();return;
  case"fSvViewsX":F.sv.views=false;fShow();return;
  case"fSvDel":{const c=fCur();if(c&&confirm("Delete this story?")){clearTimeout(F.svT);window.__feed.delStory(c.s.id).then(()=>{F.stories=F.stories.filter(x=>x.id!==c.s.id);fCloseStory();toast("Story deleted","trash")}).catch(er=>toast(er.message,"x"))}return}
  case"fScX":if(F.sc&&F.sc.url)URL.revokeObjectURL(F.sc.url);F.sc=null;feedSync();return;
  case"fScBg":F.sc.text=(document.getElementById("fsc_text")||{}).value||"";F.sc.bg="g"+el.dataset.i;feedSync();return;
  case"fScPost":fStoryPost();return;
  }},true);
document.addEventListener("change",e=>{const el=e.target;if(!el||!el.id)return;
  if(el.id==="f_files"){const fl=[...(el.files||[])];el.value="";e.stopPropagation();(async()=>{for(const f of fl){if(F.files.length>=4){toast("4 photos or videos maximum.","x");break}
      if(/^video\//.test(f.type)){if(F.files.some(x=>x.kind==="video")){toast("One video per post.","x");continue}const chk=await fVideoCheck(f,180);if(!chk)continue;F.files.push({file:f,url:URL.createObjectURL(f),kind:"video",d:chk.d})}
      else if(/^image\//.test(f.type))F.files.push({file:f,url:URL.createObjectURL(f),kind:"img"})}render()})()}
  if(el.id==="fsc_file"){const f=el.files&&el.files[0];el.value="";e.stopPropagation();if(!f||!F.sc)return;(async()=>{let d=0;if(/^video\//.test(f.type)){const chk=await fVideoCheck(f,60);if(!chk)return;d=chk.d}else if(!/^image\//.test(f.type))return;
      if(F.sc.url)URL.revokeObjectURL(F.sc.url);F.sc.text=(document.getElementById("fsc_text")||{}).value||"";F.sc.file=f;F.sc.url=URL.createObjectURL(f);F.sc.video=/^video\//.test(f.type);F.sc.d=d;feedSync()})()}},true);
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset||!["post","com","srep"].includes(f.dataset.ff))return;e.preventDefault();e.stopImmediatePropagation();
  if(f.dataset.ff==="post")fPost();
  else if(f.dataset.ff==="com")fComment(f.dataset.id,f.querySelector("input"));
  else if(f.dataset.ff==="srep"){const c=fCur(),inp=document.getElementById("fsv_rep"),t=(inp&&inp.value||"").trim();if(!c||!t)return;inp.value="";
    const what=c.s.body?v4Plain(c.s.body).slice(0,100):"📷 Photo";
    (async()=>{try{let text=t;if(v4NeedFix(t)){const r=await v4Check(t);if(r)text=v4Pack(t,r.en,r.k)}await window.__peer.send(c.g.uid,text,null,{re:{id:"story",t:"Story: "+what,w:c.g.uid}});toast("Reply sent","send")}catch(er){toast(er.message||"Could not send","x")}F.sv&&(F.sv.typing=false);fShow()})()}},true);
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="fsv_rep"&&F.sv){F.sv.typing=true;clearTimeout(F.svT);feedSync()}});
document.addEventListener("keydown",e=>{if(!F.sv&&!F.sc)return;if(e.key==="Escape"){if(F.sc){F.sc=null;feedSync()}else fCloseStory()}else if(F.sv&&!F.sv.typing&&e.key==="ArrowRight")fStep(1);else if(F.sv&&!F.sv.typing&&e.key==="ArrowLeft")fStep(-1)});
{const _l=v4ChatLayout;v4ChatLayout=function(){_l();if(F.sv||F.sc||F.share||document.getElementById("fsvhost")?._h)feedSync();nBell()}}
/* where it appears */
{const _sv=studentView;studentView=function(){if(S.view?.type==="feed"&&feedOn())return feedView(false);return _sv()}}
{const _hm3=homeView;homeView=function(){const h=_hm3();return S.mode==="student"&&feedOn()?feedRailHTML(true)+h:h}}
{const _tabs2=msgsTabsHTML;msgsTabsHTML=()=>{const h=_tabs2();if(!feedOn())return h;return h.replace(/<\/div><\/div>$/,`<button data-a="msgsTab" data-k="community" aria-pressed="${S.msgsTab==="community"}">Community</button></div></div>`)}}
{const _mv2=msgsView;msgsView=function(){if(S.msgsTab==="community"&&feedOn())return msgsTabsHTML()+feedView(true);return _mv2()}}
{const st=document.createElement("style");st.textContent=`
.frail-wrap{margin-bottom:10px}.frail{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none}.frail::-webkit-scrollbar{display:none}
.fst{border:0;background:none;color:inherit;font:inherit;display:grid;justify-items:center;gap:5px;cursor:pointer;flex:none;width:70px;padding:0}
.fst small{font-size:.74rem;font-weight:600;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fring{position:relative;display:grid;place-items:center;width:66px;height:66px;border-radius:50%;background:conic-gradient(#FF7A59,#E94057,#9A7CFF,#6C80FF,#25D366,#FF7A59);padding:3px}
.fring.seen{background:var(--line)}.fring>.av{border:3px solid var(--bg);width:60px!important;height:60px!important}
.fplus{position:absolute;right:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;background:#25D366;color:#fff;font-style:normal;font-weight:800;display:grid;place-items:center;border:2px solid var(--bg);line-height:1}
.fcomm{display:grid;place-items:center;width:60px;height:60px;border-radius:50%;border:3px solid var(--bg);background:var(--surface2);color:var(--fg)}.fcomm svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8}
.fnew{background:#E5484D;color:#fff;border-radius:999px;padding:0 6px;font-size:.68rem}
.fwrap{max-width:640px;margin-inline:auto;display:grid;gap:14px}
.fset{padding:10px 14px;border-radius:14px}
.fcomp{display:grid;gap:10px}.fcomp textarea{flex:1;min-height:52px;resize:vertical}
.fthumbs{display:flex;gap:8px;flex-wrap:wrap}.fthumbs span{position:relative}.fthumbs img{width:72px;height:72px;object-fit:cover;border-radius:12px;display:block}.fthumbs button{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:0;background:#E5484D;color:#fff;cursor:pointer;line-height:1}
.fpost{padding:14px;display:grid;gap:10px;border-radius:20px}.fpost header{display:flex;align-items:center;gap:10px}.fwho{display:grid;flex:1;min-width:0}.fwho small{color:var(--muted);font-size:.78rem}
.fpost.fdel{opacity:.7;outline:2px dashed #E5484D}
.ftext{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}
.fmedia{display:grid;gap:4px;border-radius:14px;overflow:hidden}.fmedia.n2,.fmedia.n4{grid-template-columns:1fr 1fr}.fmedia.n3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr}.fmedia.n3>:first-child{grid-row:span 2}
.fmedia .v4img img{width:100%;height:100%;max-width:none;max-height:420px;min-height:120px;object-fit:cover;border-radius:0}.fmedia.n1 .v4img img{max-height:520px;object-fit:contain;background:rgba(0,0,0,.25)}.fmedia .v4img{width:100%}
.fcount{display:flex;justify-content:space-between;font-size:.85rem;color:var(--muted)}.fcount .e3d{width:16px;height:16px;vertical-align:-3px}
.linkbtn{border:0;background:none;color:var(--muted);font:inherit;font-size:.82rem;cursor:pointer;padding:0;text-decoration:underline}
.factions{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line);padding-top:6px}.factions button{border:0;background:none;color:inherit;font:inherit;font-weight:700;padding:8px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}.factions button:hover{background:var(--surface2)}.factions button.on{color:#E5484D}.factions .e3d{width:20px;height:20px}.factions svg{width:18px;height:18px}
.fcoms{display:grid;gap:8px}.fc{display:flex;gap:8px;align-items:flex-start}.fcb{background:var(--surface2);border-radius:14px;padding:7px 11px;display:grid;gap:2px;min-width:0}.fcb b{font-size:.82rem}.fcb small{font-size:.72rem;color:var(--muted)}
.fcform{display:flex;gap:8px}.fcform input{flex:1;min-width:0}
body.fsv-on{overflow:hidden}
.fsv{position:fixed;inset:0;z-index:95;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.fsv-bars{position:absolute;top:calc(8px + env(safe-area-inset-top,0px));left:10px;right:10px;display:flex;gap:4px;z-index:3}.fsv-bars i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden;position:relative}
.fsv-bars i.done{background:#fff}.fsv-bars i.run::after{content:"";position:absolute;inset:0;background:#fff;transform-origin:left;animation:fsvp var(--d) linear forwards}.fsv-bars i.paused::after{animation-play-state:paused}
@keyframes fsvp{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.fsv-top{position:absolute;top:calc(20px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;align-items:center;gap:10px;z-index:3}.fsv-top div{display:grid;flex:1}.fsv-top small{opacity:.75;font-size:.75rem}.fsv-top .iconbtn{background:rgba(255,255,255,.15);color:#fff}
.fsv-media{width:100%;height:100%;display:grid;place-items:center}.fsv-media img{max-width:100%;max-height:100%;object-fit:contain}
.fsv-text{font-size:clamp(1.4rem,6vw,2.2rem);font-weight:800;text-align:center;padding:0 28px;max-width:640px;line-height:1.3;z-index:1}.fsv-text.cap{position:absolute;bottom:calc(84px + env(safe-area-inset-bottom,0px));font-size:1.05rem;font-weight:600;background:rgba(0,0,0,.45);border-radius:14px;padding:10px 14px}
.fsv-text .v4fr,.fsv-text .v4en{font-size:.75em}
.fsv-nav{position:absolute;top:80px;bottom:90px;width:35%;border:0;background:none;z-index:2;cursor:pointer}.fsv-nav.l{left:0}.fsv-nav.r{right:0}
.fsv-bot{position:absolute;bottom:calc(16px + env(safe-area-inset-bottom,0px));left:12px;right:12px;display:flex;gap:8px;justify-content:center;align-items:center;z-index:3;flex-wrap:wrap}.fsv-bot .btn.ghost{background:rgba(255,255,255,.15);color:#fff;border-color:transparent}
.fsv-reply{display:flex;gap:8px;width:100%;max-width:520px}.fsv-reply input{flex:1;min-width:0;background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3)}
.fsv-views{z-index:5;color:var(--fg)}.fsv-views .row{gap:10px}
.fsc textarea{background:transparent;border:0;color:#fff;font-size:clamp(1.4rem,6vw,2rem);font-weight:800;text-align:center;width:min(640px,92vw);min-height:30vh;resize:none;outline:none}.fsc textarea::placeholder{color:rgba(255,255,255,.7)}
.fsc textarea.cap{position:absolute;bottom:calc(84px + env(safe-area-inset-bottom,0px));min-height:0;height:56px;font-size:1rem;font-weight:600;background:rgba(0,0,0,.45);border-radius:14px;padding:12px}
.fbgs{display:flex;gap:6px}.fbgs button{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.6);cursor:pointer}.fbgs button[aria-pressed=true]{border-color:#fff;box-shadow:0 0 0 2px #fff}
`;document.head.appendChild(st)}

/* =====================================================================
   20. Reactions on posts and stories, sharing, videos, notifications
   ===================================================================== */
const FRE=["👍","❤️","😂","😮","😢","😡"],SRE=["❤️","😂","😮","😢","👏","🔥"];
const BELL=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
const SITE_URL=()=>location.protocol.startsWith("http")&&!/localhost|127\.0\.0\.1/.test(location.host)?location.origin+location.pathname.replace(/index\.html$/,""):"https://grace-shop.github.io/ma-classe-anglais/";
const fIsVid=s=>!!(s&&s.media&&/^video\//.test(s.media.t||""));
const fSdur=s=>fIsVid(s)?Math.min(60,Math.max(3,s.media.d||15)):s&&s.media?6:5;
function fVidTile(m){return`<button type="button" class="fvid" data-v4="vplay" data-p="${esc(m.p)}" data-t="${esc(m.t||"video/mp4")}" aria-label="Play the video">${m.poster?`<img data-chatp="${esc(m.poster.p)}" data-t="${esc(m.poster.t||"image/jpeg")}" alt="">`:""}<span class="fplay">▶</span>${m.d?`<small>${fmtDur(m.d)}</small>`:""}</button>`}
function fMediaHTML(media){media=Array.isArray(media)?media:[];if(!media.length)return"";
  return`<div class="fmedia n${Math.min(media.length,4)}">${media.slice(0,4).map((m,i)=>/^video\//.test(m.t||"")?fVidTile(m):`<button type="button" class="v4img" data-v4="doc" data-k="m" data-id="${esc(m.p)}" data-t="${esc(m.t||"image/jpeg")}" data-n="photo-${i+1}.jpg" aria-label="See the photo"><img data-chatp="${esc(m.p)}" data-t="${esc(m.t||"")}" alt="Photo"></button>`).join("")}</div>`}
function fSharedHTML(sh){return`<div class="fshared" data-v4="fJump" data-id="${esc(sh.id||"")}"><header>${whoAva(sh.who,sh.author,28)}<b>${esc(sh.who?.name||"Student")}</b><small>${sh.at?ago(+new Date(sh.at)):""}</small></header>${sh.body?fText(sh.body):""}${fMediaHTML(sh.media)}</div>`}
/* video helpers */
function fVideoCheck(f,maxSec){return new Promise(res=>{if(f.size>50*1024*1024){toast("Video too big: 50 MB maximum. Record a shorter video or a lower quality.","x");res(null);return}
  const v=document.createElement("video"),u=URL.createObjectURL(f);v.preload="metadata";v.muted=true;
  const done=r=>{URL.revokeObjectURL(u);res(r)};v.onloadedmetadata=()=>{const d=v.duration||0;if(d>maxSec+0.5){toast(`Video too long: ${maxSec>=120?Math.round(maxSec/60)+" minutes":maxSec+" seconds"} maximum.`,"x");done(null)}else done({d})};
  v.onerror=()=>done({d:0});setTimeout(()=>done({d:0}),8000);v.src=u})}
function fPoster(f){return new Promise((res,rej)=>{const v=document.createElement("video"),u=URL.createObjectURL(f);v.muted=true;v.playsInline=true;v.preload="auto";
  const fin=b=>{URL.revokeObjectURL(u);b?res(b):rej(new Error("poster"))};
  v.onloadeddata=()=>{try{v.currentTime=Math.min(0.6,(v.duration||1)/3)}catch(e){fin(null)}};
  v.onseeked=()=>{try{const w=Math.min(720,v.videoWidth||640),h=Math.round(w*(v.videoHeight||360)/(v.videoWidth||640));const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(v,0,0,w,h);c.toBlob(b=>fin(b),"image/jpeg",.72)}catch(e){fin(null)}};
  v.onerror=()=>fin(null);setTimeout(()=>fin(null),10000);v.src=u})}
async function vPlay(p,t){let ov=document.getElementById("vplayer");if(ov)ov.remove();ov=document.createElement("div");ov.id="vplayer";ov.className="v4onceview";
  ov.innerHTML=`<div class="v4spin"></div><button type="button" class="iconbtn" aria-label="Close">${ic("x")}</button>`;document.body.appendChild(ov);
  const close=()=>{const v=ov.querySelector("video");if(v){v.pause();v.removeAttribute("src");v.load()}ov.remove()};ov.querySelector("button").onclick=close;
  try{const u=await srcURL({k:"m",id:p,t});const v=document.createElement("video");v.controls=true;v.autoplay=true;v.playsInline=true;v.src=u;v.className="vplayer-v";ov.querySelector(".v4spin").replaceWith(v);v.play().catch(()=>{})}
  catch(e){ov.querySelector(".v4spin").replaceWith(Object.assign(document.createElement("p"),{textContent:navigator.onLine?"Cannot play this video.":"No network: the video needs internet."}))}}
/* story video */
async function fVidStart(){const c=fCur();if(!c||!fIsVid(c.s))return;const s=c.s;
  if(!F.svUrl||F.svUrl.id!==s.id){F.svMute=false;try{const u=await srcURL({k:"m",id:s.media.p,t:s.media.t});if(fCur()?.s.id!==s.id)return;F.svUrl={id:s.id,url:u};feedSync()}catch(e){return}}
  const v=document.getElementById("fsvVid");if(!v||v._ok)return;v._ok=1;v.onended=()=>{if(fCur()?.s.id===s.id&&!F.sv.views&&!F.share)fStep(1)};
  v.play().catch(()=>{if(!F.svMute){F.svMute=true;feedSync();const v2=document.getElementById("fsvVid");if(v2){v2._ok=1;v2.muted=true;v2.onended=v.onended;v2.play().catch(()=>{})}}})}
function fSvReactBtns(s){const my=(F.reacts.find(x=>x.story_id===s.id&&x.uid===S.uid)||{}).e;
  return`<div class="fsv-rx">${SRE.map(e=>`<button type="button" class="${my===e?"on":""}" data-v4="fSvLike" data-e="${e}" aria-pressed="${my===e}" aria-label="React ${e}">${E(e)}</button>`).join("")}</div>`}
async function fSvLike(e){const c=fCur();if(!c)return;const s=c.s,i=F.reacts.findIndex(x=>x.story_id===s.id&&x.uid===S.uid);
  if(i>=0&&F.reacts[i].e===e)F.reacts.splice(i,1);else if(i>=0)F.reacts[i].e=e;else F.reacts.push({story_id:s.id,uid:S.uid,e,who:myWho()});
  const pop=document.createElement("div");pop.className="fsv-pop";pop.innerHTML=E(e);document.body.appendChild(pop);setTimeout(()=>pop.remove(),1000);
  F.svH=null;const host=document.getElementById("fsvhost");if(host)host._h="";feedSync();try{await window.__feed.reactStory(s.id,e)}catch(er){toast(er.message||"Could not react","x")}}
/* story media cleanup (saves storage space): my story files are removed after 3 days */
function fRememberMedia(m){try{const k="ec_smedia_"+S.uid,L=JSON.parse(localStorage.getItem(k)||"[]");L.push({ps:[m.p,m.poster&&m.poster.p].filter(Boolean),at:Date.now()});localStorage.setItem(k,JSON.stringify(L.slice(-200)))}catch(e){}}
function fCleanMyMedia(){if(fCleanMyMedia.done||!window.__chatFiles||!window.__chatFiles.remove)return;fCleanMyMedia.done=1;
  try{const k="ec_smedia_"+S.uid,L=JSON.parse(localStorage.getItem(k)||"[]"),old=L.filter(x=>Date.now()-x.at>72*3600e3);if(!old.length)return;
    window.__chatFiles.remove(old.flatMap(x=>x.ps)).then(()=>localStorage.setItem(k,JSON.stringify(L.filter(x=>Date.now()-x.at<=72*3600e3)))).catch(()=>{})}catch(e){}}
/* sharing */
function fShareItem(){const sh=F.share;if(!sh)return null;if(sh.k==="post"){const p=F.posts.find(x=>x.id===sh.id);if(!p)return null;const o=p.shared||{id:p.id,author:p.author,who:p.who,body:p.body,media:p.media};return{k:"post",id:o.id||p.id,author:o.author,who:o.who,body:v4Plain(o.body||""),media:o.media||[]}}
  const s=F.stories.find(x=>x.id===sh.id);if(!s)return null;return{k:"story",id:s.id,author:s.author,who:s.who,body:v4Plain(s.body||""),media:s.media?[s.media]:[]}}
function fShareHTML(){const sh=F.share,it=fShareItem();if(!it)return"";const nm=esc(it.who?.name||"Student");
  if(sh.step==="feed")return`<div class="v4sheet-bg fz" data-v4="fShareX"></div><div class="v4sheet fz"><b>Share ${nm}'s post to your feed</b><textarea id="fsh_text" rows="2" maxlength="1000" placeholder="Say something about it (in English)…"></textarea><div class="fshared mini"><header>${whoAva(it.who,it.author,24)}<b>${nm}</b></header>${it.body?`<div class="ftext">${esc(it.body.slice(0,160))}</div>`:""}</div><button type="button" class="btn" data-v4="fShareFeed" ${sh.busy?"disabled":""}>${sh.busy?"Sharing…":"Share now"}</button><button type="button" class="v4cancel" data-v4="fShareX">Cancel</button></div>`;
  if(sh.step==="friends"){const q=(sh.q||"").toLowerCase(),L=PR.dir.filter(x=>!q||x.name.toLowerCase().includes(q)).slice(0,60);
    return`<div class="v4sheet-bg fz" data-v4="fShareX"></div><div class="v4sheet fz fsh-list"><b>Send to a classmate</b><input id="fsh_q" type="search" placeholder="Search…" value="${esc(sh.q||"")}" autocomplete="off">${L.length?L.map(x=>`<button type="button" data-v4="fShareTo" data-id="${x.uid}" ${sh.busy?"disabled":""}>${avatar(x.uid,x.name,34)}<span>${esc(x.name)}</span>${sh.sent&&sh.sent[x.uid]?`<span class="chip ok" style="margin-left:auto">Sent</span>`:""}</button>`).join(""):`<p class="small muted">${PR.loaded?"No classmate found.":"Loading…"}</p>`}<button type="button" class="v4cancel" data-v4="fShareX">Done</button></div>`}
  return`<div class="v4sheet-bg fz" data-v4="fShareX"></div><div class="v4sheet fz"><b>Share</b>
  ${it.k==="post"?`<button type="button" data-v4="fShareStep" data-k="feed">${ic("users")}Share to my feed</button>`:""}
  ${S.mode==="student"&&peerOn()?`<button type="button" data-v4="fShareStep" data-k="friends">${ic("chat")}Send to a classmate</button>`:""}
  <button type="button" data-v4="fShareOut">${ic("send")}Share outside the app</button>
  <button type="button" class="v4cancel" data-v4="fShareX">Cancel</button></div>`}
function fShareClose(){F.share=null;feedSync();if(F.sv)fShow();render()}
async function fShareTo(uid){const sh=F.share,it=fShareItem();if(!sh||!it||sh.busy)return;sh.busy=true;feedSync();
  try{const ex=(it.body||"").slice(0,300),hasVid=it.media.some(m=>/^video\//.test(m.t||""));let att=null;
    const img=it.media.find(m=>/^image\//.test(m.t||""));if(img&&window.__chatFiles){try{const b=await srcBlob({k:"m",id:img.p,t:img.t});const up=await window.__chatFiles.upload(b,"photo.jpg");att={k:"img",p:up.p,t:up.t,n:up.n,s:up.s}}catch(e){}}
    const text=`📢 ${it.k==="post"?"Post":"Story"} by ${it.who?.name||"a student"}${ex?`:\n${ex}`:""}${hasVid?"\n🎬 (video in the Community)":""}`;
    await window.__peer.send(uid,text,att,{re:{id:it.k+":"+it.id,t:(it.k==="post"?"Post: ":"Story: ")+(ex.slice(0,100)||"📷"),w:it.author}});
    sh.sent=sh.sent||{};sh.sent[uid]=1;toast("Sent!","send")}
  catch(e){toast((e&&e.message)||"Could not send","x")}sh.busy=false;feedSync()}
async function fShareOut(){const it=fShareItem();if(!it)return;const text=`${it.who?.name||"A student"} on English Classes${it.body?`: “${it.body.slice(0,280)}”`:""}`,url=SITE_URL();
  try{const P=window.Capacitor?.Plugins?.Share;if(P&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){await P.share({title:"English Classes",text,url,dialogTitle:"Share"});return}
    if(navigator.share){await navigator.share({title:"English Classes",text,url});return}
    await navigator.clipboard.writeText(text+"\n"+url);toast("Copied: paste it where you want","copy")}catch(e){if(e&&e.name!=="AbortError")toast("Sharing is not available here.","x")}}
/* chat: videos too */
{const _mb=msgBodyHTML;msgBodyHTML=function(text,a){if(a&&typeof a==="object"&&a.p&&/^video\//.test(a.t||"")&&a.k!=="img")return fVidTile({p:a.p,t:a.t,d:a.d})+_mb(text,null);return _mb(text,a)}}
/* ---------------- notifications ---------------- */
const N={list:[],loaded:false,un:null,uid:null,at:0,markT:null};
const nOn=()=>!!window.__notif&&!!S.uid&&(S.mode==="teacher"?!!(S.isOwner||S.isStaff):!!S.me);
async function nLoad(){if(!nOn())return;N.at=Date.now();try{N.list=await window.__notif.list();N.loaded=true}catch(e){N.loaded=true}render()}
function nStart(){if(!nOn())return;if(N.uid&&N.uid!==S.uid){try{N.un&&N.un()}catch(e){}N.un=null;N.list=[]}if(N.un)return;N.uid=S.uid;nLoad();
  N.un=window.__notif.listen(n=>{if(N.list.some(x=>x.id===n.id))return;N.list.unshift(n);nArrive(n);render()})}
setInterval(()=>{if(!nOn())return;if(!N.un||N.uid!==S.uid)nStart();else if(document.visibilityState==="visible"&&Date.now()-N.at>90000)nLoad()},4000);
const nName=n=>(n.who&&n.who.name)||"Someone";
function nTitle(n){const m=nName(n);return({msg:m,story_reply:m,comment:m,like:m,share:m,story_like:m,tmsg:n.who?.role==="teacher"?m:"Your teacher",smsg:m,staff:m})[n.kind]||"English Classes"}
function nBody(n){const b=n.body||"";return({msg:`Message: “${b}”`,story_reply:`Replied to your story: “${b}”`,comment:`Commented on your post: “${b}”`,like:`Reacted ${b} to your post`,share:"Shared your post",story_like:`Reacted ${b} to your story`,tmsg:`Message: “${b}”`,smsg:`Message: “${b}”`,staff:`Message: “${b}”`})[n.kind]||b}
function nViewing(n){const r=n.ref||"";if(r.startsWith("peer:"))return S.view?.type==="peer"&&S.view.id===r.slice(5)&&!document.hidden;if(r==="chat")return S.view?.type==="chat"&&!document.hidden;if(r.startsWith("chat:"))return S.view?.type==="chat"&&S.view.id===r.slice(5)&&!document.hidden;if(r.startsWith("staff:"))return S.view?.type==="staffchat"&&S.view.id===r.slice(6)&&!document.hidden;return false}
function nArrive(n){if(nViewing(n))return;const peerHandled=(n.kind==="msg"||n.kind==="story_reply")&&!!PR.un;
  if(!peerHandled&&!document.hidden)toast(`${nTitle(n)}: ${nBody(n)}`.slice(0,120),n.kind.includes("like")?"heart":"chat");
  if(document.hidden||!document.hasFocus())nSys(nTitle(n),nBody(n),n.ref||n.kind,peerHandled)}
async function nSys(title,body,tag,skipNative){try{
  if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){if(!skipNative&&typeof notifyNow==="function")notifyNow(title,body);return}
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();const o={body,tag:"ec-"+tag,renotify:true,icon:"icons/icon-192.png",badge:"icons/icon-192.png"};
  if(r&&r.showNotification)r.showNotification(title,o);else new Notification(title,o)}catch(e){}}
function nPermState(){if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())return typeof notifOn==="function"&&notifOn()?"granted":"default";return"Notification"in window?Notification.permission:"unsupported"}
function nBell(){const h=document.getElementById("hdr");if(!h)return;let b=h.querySelector('[data-v4="nOpen"]');if(!nOn()){if(b)b.remove();return}
  const n=N.list.filter(x=>!x.read_at).length;if(!b){h.insertAdjacentHTML("afterbegin",`<button class="iconbtn nbell" data-v4="nOpen" aria-label="Notifications" title="Notifications">${BELL}<span class="nbadge" hidden></span></button>`);b=h.querySelector('[data-v4="nOpen"]')}
  const sp=b.querySelector(".nbadge"),t=n?(n>9?"9+":String(n)):"";if(sp.textContent!==t){sp.textContent=t;sp.hidden=!n}}
function nView(){if(!N.loaded)nLoad();
  if(N.list.some(x=>!x.read_at)&&!N.markT)N.markT=setTimeout(()=>{N.markT=null;if(S.view?.type!=="notifs")return;window.__notif.read(null).catch(()=>{});setTimeout(()=>{for(const x of N.list)if(!x.read_at)x.read_at=new Date().toISOString();render()},4000)},1500);
  const perm=nPermState();
  return`<div class="section" style="max-width:640px;margin-inline:auto">${backBtn()}<div class="row"><span class="nbig">${BELL}</span><div><span class="eyebrow">Activity</span><h2>Notifications</h2></div></div>
  ${perm==="default"?`<div class="glass card row between" style="gap:12px"><span class="small">Get a notification on your phone when someone writes to you or reacts to your posts.</span><button class="btn sm" data-v4="nPerm">Turn on</button></div>`:perm==="denied"?`<p class="hint">Notifications are blocked for this site: allow them in your browser settings.</p>`:""}
  ${!N.loaded?`<div class="empty">Loading…</div>`:N.list.length?`<div class="glass list">${N.list.map(n=>`<div class="it click${n.read_at?"":" nun"}" data-v4="nGo" data-id="${n.id}" tabindex="0">${n.actor?whoAva(n.who,n.actor,42):`<span class="av">🔔</span>`}<div class="txt"><b>${esc(nTitle(n))}</b><span>${E(nBody(n))}</span><small class="muted">${ago(+new Date(n.created_at))}</small></div>${n.read_at?"":`<i class="ndot" aria-label="New"></i>`}</div>`).join("")}</div>`:`<div class="empty">No notifications yet. When someone writes to you, comments or reacts, you will see it here.</div>`}
  </div>`}
function nGo(id){const n=N.list.find(x=>String(x.id)===String(id));if(!n)return;if(!n.read_at){n.read_at=new Date().toISOString();window.__notif.read([n.id]).catch(()=>{})}const r=n.ref||"";S.animate=true;
  if(r.startsWith("peer:")&&S.mode==="student"&&peerOn()){const u=r.slice(5);S.view={type:"peer",id:u};PR.with=u;peerStart();peerMarkRead(u)}
  else if(r==="chat"&&S.mode==="student"){S.view={type:"chat",id:S.uid};subChat(S.uid)}
  else if(r.startsWith("chat:")&&S.mode==="teacher"){const sid=r.slice(5);S.view={type:"chat",id:sid};subChat(sid)}
  else if(r.startsWith("staff:")&&S.mode==="teacher"){S.tab="msgs";S.msgsTab="staff";staffOpen(r.slice(6));return}
  else if(r.startsWith("post:")){const pid=r.slice(5);if(S.mode==="teacher"){S.view=null;S.tab="msgs";S.msgsTab="community"}else S.view={type:"feed"};F.open[pid]=true;feedLoad();setTimeout(()=>{const el=document.getElementById("p-"+pid);if(el){el.scrollIntoView({block:"start",behavior:"smooth"});el.classList.add("v4flash")}},900)}
  else if(r.startsWith("story:")){if(S.mode==="teacher"){S.view=null;S.tab="msgs";S.msgsTab="community"}else S.view={type:"feed"};feedLoad().then(()=>fOpenStory(S.uid))}
  scrollTo(0,0);render()}
{const _sv2=studentView;studentView=function(){if(S.view?.type==="notifs"&&nOn())return nView();return _sv2()}}
{const _tv2=teacherView;teacherView=function(){if(S.view?.type==="notifs"&&nOn())return nView();return _tv2()}}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4,id=el.dataset.id;
  switch(a){
  case"fPick":F.pick=F.pick===id?null:id;render();return;
  case"fLikeE":fLike(id,el.dataset.e);return;
  case"fShare":F.share={k:el.dataset.k,id,step:"menu"};clearTimeout(F.svT);feedSync();return;
  case"fShareX":fShareClose();return;
  case"fShareStep":F.share.step=el.dataset.k;if(el.dataset.k==="friends"&&!PR.loaded&&peerOn())peerRefresh().then(()=>{const h=document.getElementById("fsvhost");if(h)h._h="";feedSync()});feedSync();if(el.dataset.k==="feed")setTimeout(()=>document.getElementById("fsh_text")?.focus(),60);return;
  case"fShareFeed":{const sh=F.share,it=fShareItem();if(!sh||!it||sh.busy)return;const t=((document.getElementById("fsh_text")||{}).value||"").trim();sh.busy=true;feedSync();
    (async()=>{try{const body=await fFix(t,1000);await window.__feed.create(body,[],sh.id);toast("Shared to your feed!","rocket");F.share=null;feedSync();await feedLoad()}catch(er){sh.busy=false;feedSync();toast(er.message||"Could not share","x")}})();return}
  case"fShareTo":fShareTo(id);return;
  case"fShareOut":fShareOut();return;
  case"fJump":{const t=document.getElementById("p-"+id);if(t){t.scrollIntoView({block:"start",behavior:"smooth"});t.classList.add("v4flash");setTimeout(()=>t.classList.remove("v4flash"),1200)}return}
  case"fSvLike":fSvLike(el.dataset.e);return;
  case"fSvSnd":{F.svMute=false;const v=document.getElementById("fsvVid");if(v){v.muted=false;v.play().catch(()=>{})}const h=document.getElementById("fsvhost");const b=h&&h.querySelector(".fsv-snd");if(b)b.remove();return}
  case"vplay":vPlay(el.dataset.p,el.dataset.t);return;
  case"nOpen":S.view={type:"notifs"};S.animate=true;scrollTo(0,0);render();return;
  case"nGo":nGo(id);return;
  case"nPerm":nAskPerm();return;
  }},true);
document.addEventListener("input",e=>{if(e.target&&e.target.id==="fsh_q"&&F.share){F.share.q=e.target.value;const h=document.getElementById("fsvhost");if(h)h._h="";feedSync()}});
{const st=document.createElement("style");st.textContent=`
.fpick{display:flex;gap:4px;justify-content:center;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px 8px;width:fit-content;margin:0 auto;box-shadow:var(--shadow);animation:v4up .15s ease-out}
.fpick button{border:0;background:none;font-size:1.6rem;width:44px;height:44px;border-radius:50%;cursor:pointer;display:grid;place-items:center;transition:transform .12s}.fpick button:hover{transform:scale(1.25)}.fpick .e3d{width:30px;height:30px}
.factions{grid-template-columns:1fr auto 1fr 1fr!important}.factions .fmore{padding:8px 6px}
.fvid{position:relative;border:0;padding:0;background:#000;cursor:pointer;display:block;width:100%;min-height:180px;border-radius:0;overflow:hidden}
.fvid img{width:100%;height:100%;max-height:460px;object-fit:cover;display:block;opacity:.9}
.fplay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:1.5rem;display:grid;place-items:center;border:2px solid rgba(255,255,255,.85);padding-left:4px}
.fvid small{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.6);color:#fff;border-radius:8px;padding:2px 7px;font-size:.75rem;font-family:var(--f-mono)}
.msg .fvid{width:min(260px,62vw);min-height:150px;border-radius:14px;margin-bottom:4px}.msg .fvid small{display:block}
.fthumbs video{width:72px;height:72px;object-fit:cover;border-radius:12px;display:block;background:#000}.fvbadge{position:absolute;left:4px;bottom:4px;font-style:normal;font-size:.68rem;background:rgba(0,0,0,.65);color:#fff;border-radius:6px;padding:1px 5px}
.vplayer-v{max-width:100vw;max-height:86vh;width:100%;background:#000}
.fshared{border:1px solid var(--line);border-radius:16px;padding:10px;display:grid;gap:8px;cursor:pointer;background:var(--surface2)}.fshared header{display:flex;align-items:center;gap:8px}.fshared header small{color:var(--muted);font-size:.75rem;margin-left:auto}.fshared .fmedia{border-radius:10px}
.fshared.mini{cursor:default}.fshared.mini .ftext{font-size:.88rem;opacity:.85}
.v4sheet.fz{z-index:100}.v4sheet-bg.fz{z-index:99}.v4sheet textarea,.v4sheet input{width:100%}
.fsh-list{max-height:80vh;overflow:auto}.fsh-list>button{gap:10px}
.fsv-rx{display:flex;gap:4px;justify-content:center;width:100%}.fsv-rx button{border:0;background:rgba(255,255,255,.12);border-radius:50%;width:42px;height:42px;font-size:1.35rem;cursor:pointer;display:grid;place-items:center;transition:transform .12s}.fsv-rx button.on{background:rgba(255,255,255,.4);transform:scale(1.12)}.fsv-rx .e3d{width:26px;height:26px}
.fsv-sh{padding-inline:12px}
.fsv-vr{margin-left:6px}.fsv-vr .e3d{width:20px;height:20px}
.fsv-pop{position:fixed;left:50%;top:45%;z-index:120;font-size:5rem;pointer-events:none;animation:fsvpop 1s ease-out forwards}.fsv-pop .e3d{width:110px;height:110px}
@keyframes fsvpop{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}30%{transform:translate(-50%,-50%) scale(1.2);opacity:1}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
.fsv-media video{max-width:100%;max-height:100%;width:100%;object-fit:contain}
.fsv-snd{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:4;border:0;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font:inherit;font-weight:700;padding:10px 16px;cursor:pointer}
#hdr .nbell{position:relative}.nbadge{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#E5484D;color:#fff;font-size:.68rem;font-weight:800;display:grid;place-items:center;line-height:1}
@media (max-width:430px){#hdr{gap:4px!important;flex-wrap:nowrap!important}#hdr .iconbtn{width:34px!important;height:34px!important;min-width:34px}#hdr .pill{padding-inline:7px!important}#hdr [data-a="toggleLite"],#hdr [data-a="skinNext"]{display:none!important}}
.fsv-bot{row-gap:10px}
.nbig{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--surface2)}
.it.nun{background:color-mix(in srgb,var(--ink-soft) 55%,transparent)}.ndot{width:10px;height:10px;border-radius:50%;background:#34B7F1;flex:none;margin-left:auto;align-self:center}
`;document.head.appendChild(st)}

/* =====================================================================
   21. Sounds for notifications, Settings & security, block, report
   ===================================================================== */
const NP_DEF={sound:"1",vib:"1",push:"1"};
const nPref=k=>{try{const v=localStorage.getItem("ec_np_"+k);return(v==null?NP_DEF[k]:v)==="1"}catch(e){return NP_DEF[k]==="1"}};
const nPrefSet=(k,on)=>{try{localStorage.setItem("ec_np_"+k,on?"1":"0")}catch(e){}};
function nAudio(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;V4.ac=V4.ac||new C();if(V4.ac.state==="suspended")V4.ac.resume();return V4.ac}catch(e){return null}}
document.addEventListener("pointerdown",()=>{nAudio()},{once:true,capture:true});
function nTone(ctx,f,t0,len,vol){const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(f,t0);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t0+len);o.connect(g).connect(ctx.destination);o.start(t0);o.stop(t0+len+0.05)}
function nSound(kind,soft){if(nPref("vib")&&!soft&&navigator.vibrate){try{navigator.vibrate(/msg|story_reply|staff/.test(kind)?[70,50,70]:90)}catch(e){}}
  if(!nPref("sound"))return;const ctx=nAudio();if(!ctx)return;const t=ctx.currentTime+0.02;
  if(soft){nTone(ctx,1046,t,0.12,0.08);return}
  if(/msg|story_reply|staff/.test(kind)){nTone(ctx,880,t,0.16,0.22);nTone(ctx,1318,t+0.13,0.22,0.2)}       // message: two quick notes
  else if(kind==="report"){nTone(ctx,660,t,0.2,0.22);nTone(ctx,660,t+0.25,0.2,0.22)}
  else{nTone(ctx,1174,t,0.28,0.16);nTone(ctx,1568,t+0.06,0.32,0.08)}}                                  // reactions, comments: soft chime
{const _na=nArrive;nArrive=function(n){try{nSound(n.kind,nViewing(n))}catch(e){}return _na(n)}}
{const _t=nTitle,_b=nBody;nTitle=n=>n.kind==="report"?(nName(n)+" reported something"):_t(n);nBody=n=>n.kind==="report"?(`Reason: ${n.body||"—"} · tap to check`):_b(n)}
{const _g=nGo;nGo=function(id){const n=N.list.find(x=>String(x.id)===String(id));if(n&&String(n.ref||"").startsWith("report:")&&S.mode==="teacher"){if(!n.read_at){n.read_at=new Date().toISOString();window.__notif.read([n.id]).catch(()=>{})}S.view=null;S.tab="msgs";S.msgsTab="community";SF.rep=null;scrollTo(0,0);render();return}return _g(id)}}
/* phone notifications with sound (Android app: its own "Messages" channel) */
const isNat=()=>!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
async function nNativeInit(ask){const P=typeof LN==="function"?LN():null;if(!P)return"unsupported";try{let r=await P.checkPermissions();if(r.display!=="granted"&&ask)r=await P.requestPermissions();N.nperm=r.display;
  if(r.display==="granted"&&!N.chan){N.chan=1;try{await P.createChannel({id:"messages",name:"Messages and activity",description:"Messages, comments and reactions",importance:5,visibility:1,vibration:true,lights:true})}catch(e){}}return r.display}catch(e){return"unsupported"}}
if(isNat())setTimeout(()=>nNativeInit(false),3000);
nSys=async function(title,body,tag){try{if(!nPref("push"))return;
  if(isNat()){const P=LN();if(!P)return;if(N.nperm!=="granted")await nNativeInit(false);if(N.nperm!=="granted")return;await P.schedule({notifications:[{id:nid(tag+title+body+Date.now()),title,body,channelId:"messages",schedule:{at:new Date(Date.now()+300)}}]});return}
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();const o={body,tag:"ec-"+tag,renotify:true,icon:"icons/icon-192.png",badge:"icons/icon-192.png",vibrate:nPref("vib")?[80,50,80]:undefined,silent:!nPref("sound")};
  if(r&&r.showNotification)r.showNotification(title,o);else new Notification(title,o)}catch(e){}};
nPermState=function(){if(isNat())return N.nperm==="granted"?"granted":N.nperm==="denied"?"denied":"default";return"Notification"in window?Notification.permission:"unsupported"};
async function nAskPerm(){if(isNat()){const r=await nNativeInit(true);if(r==="granted"){nPrefSet("push",true);toast("Phone notifications are on","check")}else toast("Allow notifications for English Classes in your phone settings.","x")}
  else if("Notification"in window){const p=await Notification.requestPermission();if(p==="granted"){nPrefSet("push",true);toast("Notifications are on","check")}}render()}
/* ---------------- blocked people ---------------- */
const BL={set:new Set(),loaded:false,uid:null};
async function blLoad(){if(!window.__safety||!S.uid)return;BL.uid=S.uid;try{const r=await window.__safety.blocks();BL.set=new Set(r.map(x=>x.blocked));BL.loaded=true;fApplyBlocks();render()}catch(e){}}
setInterval(()=>{if(S.uid&&(!BL.loaded||BL.uid!==S.uid)&&window.__safety)blLoad()},5000);
function fApplyBlocks(){if(!BL.set.size)return;F.posts=F.posts.filter(p=>!BL.set.has(p.author));F.stories=F.stories.filter(s=>!BL.set.has(s.author));for(const k in F.comments)F.comments[k]=F.comments[k].filter(c=>!BL.set.has(c.author))}
{const _fl=feedLoad;feedLoad=async function(more){await _fl(more);if(BL.set.size){fApplyBlocks();render()}}}
async function blSet(uid,on,name){try{await window.__safety.block(uid,on);if(on)BL.set.add(uid);else BL.set.delete(uid);try{const k="ec_bln_"+S.uid,m=JSON.parse(localStorage.getItem(k)||"{}");if(on)m[uid]=name||m[uid]||"";localStorage.setItem(k,JSON.stringify(m))}catch(e){}
  toast(on?`${name||"This person"} is blocked`:`${name||"This person"} is unblocked`,on?"lock":"check");if(on){fApplyBlocks();if(S.view?.type==="peer"&&S.view.id===uid){S.view={type:"peers"};PR.with=null}peerRefresh&&peerOn()&&peerRefresh()}render()}
  catch(e){toast(e.message||"Could not change it","x")}}
const blName=uid=>{try{return JSON.parse(localStorage.getItem("ec_bln_"+S.uid)||"{}")[uid]||""}catch(e){return""}};
/* ---------------- reports ---------------- */
const SF={rep:null,reports:null,repLoading:false,safety:null,pw:false};
const REASONS=["Bullying or insults","Inappropriate photo or video","Spam or fake","Something else"];
function repHTML(){const r=SF.safety;if(!r)return"";
  if(r.step==="menu")return`<div class="v4sheet-bg fz" data-v4="sfX"></div><div class="v4sheet fz"><b>${esc(r.name||"Options")}</b>
    <button type="button" data-v4="sfReport">${ic("shield")}Report to the teachers</button>
    ${r.target&&r.target!==S.uid&&S.mode==="student"?`<button type="button" class="danger" data-v4="sfBlock">${ic("lock")}Block ${esc(String(r.name||"this person").split(" ")[0])}</button>`:""}
    <button type="button" class="v4cancel" data-v4="sfX">Cancel</button></div>`;
  return`<div class="v4sheet-bg fz" data-v4="sfX"></div><form class="v4sheet fz" data-ff="rep"><b>Why are you reporting this?</b><p class="small muted" style="margin:0">Only the teachers will see your report. ${esc(r.name||"The person")} will not know it was you.</p>
    ${REASONS.map((x,i)=>`<label class="sfr"><input type="radio" name="sf_reason" value="${esc(x)}" ${i===0?"checked":""}> ${esc(x)}</label>`).join("")}
    <textarea id="sf_more" rows="2" maxlength="300" placeholder="Tell us more (optional)"></textarea>
    <button class="btn" type="submit" ${r.busy?"disabled":""}>${r.busy?"Sending…":"Send the report"}</button><button type="button" class="v4cancel" data-v4="sfX">Cancel</button></form>`}
{const _fs=feedSync;feedSync=function(){_fs();let h=document.getElementById("sfhost");if(!h){h=document.createElement("div");h.id="sfhost";document.body.appendChild(h)}const x=repHTML();if(h._h!==x){h._h=x;h.innerHTML=x}}}
{const _l2=v4ChatLayout;v4ChatLayout=function(){_l2();if(SF.safety||document.getElementById("sfhost")?._h)feedSync()}}
function sfOpen(o){SF.safety={step:"menu",...o};clearTimeout(F.svT);feedSync()}
/* post menu (⋯) for other people's posts, and story / message options */
{const _ph=fPostHTML;fPostHTML=function(p){let h=_ph(p);if(p.author!==S.uid&&!p.deleted_at){const b=`<button type="button" class="iconbtn sm" data-v4="sfPost" data-id="${esc(p.id)}" aria-label="More options" title="More">⋯</button>`;h=h.replace(/(<\/div>)(<\/header>|\s*<\/header>)/,`$1${b}$2`)}return h}}
{const _sh=fStoryHTML;fStoryHTML=function(){let h=_sh();const c=fCur();if(c&&c.g.uid!==S.uid)h=h.replace('<button type="button" class="iconbtn" data-v4="fSvClose"',`<button type="button" class="iconbtn" data-v4="sfStory" aria-label="More options">⋯</button><button type="button" class="iconbtn" data-v4="fSvClose"`);return h}}
{const _as=v4ActSheet;v4ActSheet=function(kind,list,c){let h=_as(kind,list,c);const raw=list.find(x=>x.id===(V4.act&&V4.act.id));if(kind==="peer"&&raw&&raw.sender!==S.uid)h=h.replace('<button type="button" class="v4cancel"',`<button type="button" data-v4="sfMsg">${ic("shield")}Report or block</button><button type="button" class="v4cancel"`);return h}}
/* teachers: reports list at the top of the Community tab */
async function repLoad(){if(SF.repLoading||!window.__safety)return;SF.repLoading=true;SF.reports=await window.__safety.reports().catch(()=>[]);SF.repLoading=false;render()}
function repListHTML(){if(!fStaff())return"";if(SF.reports===null&&!SF.repLoading)repLoad();const L=(SF.reports||[]).filter(r=>!r.done_at);if(!L.length)return"";
  return`<div class="section fwrap"><div class="glass card frep"><div class="row between"><b>${ic("shield")} Reports to check · ${L.length}</b></div>${L.slice(0,30).map(r=>`<div class="frep-it"><div><b>${esc(r.who?.name||"A student")}</b> reported ${r.target_who?.name?`<b>${esc(r.target_who.name)}</b>`:"something"} <span class="chip warn">${esc(r.kind)}</span><small class="muted"> · ${ago(+new Date(r.created_at))}</small></div><div class="small">${esc(r.reason||"")}</div>${r.excerpt?`<div class="small muted">“${esc(r.excerpt)}”</div>`:""}<div class="row">${r.kind==="post"?`<button type="button" class="btn ghost sm" data-v4="fJump" data-id="${esc(r.ref_id)}">See the post</button>`:""}<button type="button" class="btn ghost sm" data-v4="repDone" data-id="${r.id}">${ic("check")}Done</button></div></div>`).join("")}</div></div>`}
{const _fv=feedView;feedView=function(emb){const h=_fv(emb);const r=repListHTML();if(!r)return h;const i=h.indexOf('<div class="section frail-wrap">');return i>0?h.slice(0,i)+r+h.slice(i):r+h}}
/* ---------------- Settings & security page ---------------- */
function devName(){const u=navigator.userAgent||"";const os=/android/i.test(u)?"Android":/iphone|ipad/i.test(u)?"iPhone":/windows/i.test(u)?"Windows":/mac os/i.test(u)?"Mac":/linux/i.test(u)?"Linux":"Device";return isNat()?`English Classes app · ${os}`:`${/edg/i.test(u)?"Edge":/chrome|crios/i.test(u)?"Chrome":/firefox/i.test(u)?"Firefox":/safari/i.test(u)?"Safari":"Browser"} · ${os}`}
function pwScore(p){let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/i.test(p)&&/\d/.test(p))s++;if(/[^a-z0-9]/i.test(p)||(/[a-z]/.test(p)&&/[A-Z]/.test(p)))s++;return Math.min(s,4)}
const swHTML=(k,on,label,sub)=>`<div class="secrow"><div><b>${label}</b>${sub?`<small>${sub}</small>`:""}</div><button type="button" class="v4sw${on?" on":""}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-v4="secTog" data-k="${k}"><i></i></button></div>`;
function secView(){const A=window.__account?window.__account.info():{},me=S.mode==="student"?S.me:null,student=S.mode==="student"&&me&&!isParent(me),perm=nPermState(),bl=[...BL.set];
  return`<div class="section" style="max-width:640px;margin-inline:auto">${backBtn()}<div class="row"><span class="nbig">${ic("shield")}</span><div><span class="eyebrow">Your account</span><h2>Settings & security</h2></div></div></div>
  <div class="section secwrap">
  <div class="glass card sec"><h3>${ic("user")} Account</h3>
    <div class="secrow"><div><b>Name</b><small>${esc((me&&me.name)||(S.staff||[]).find(x=>x.id===S.uid)?.name||S.who?.name||"—")}</small></div></div>
    <div class="secrow"><div><b>${A.phone?"Phone number":"E-mail"}</b><small>${esc(A.phone?("+228 "+A.phone.replace(/^228/,"").replace(/(\d{2})(?=\d)/g,"$1 ")):A.email||"—")}</small></div></div>
    <div class="secrow"><div><b>Member since</b><small>${A.created?new Date(A.created).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"—"}</small></div><div><b>Last login</b><small>${A.last?ago(+new Date(A.last)):"—"}</small></div></div></div>
  <form class="glass card sec" data-ff="pwd"><h3>${ic("lock")} Change my password</h3>
    <label>Current password<input id="pw_cur" type="${SF.pw?"text":"password"}" autocomplete="current-password" required></label>
    <label>New password<input id="pw_new" type="${SF.pw?"text":"password"}" autocomplete="new-password" minlength="8" required></label>
    <div class="pwbar" id="pw_bar"><i></i><i></i><i></i><i></i><span>Use 8 characters or more, with letters and numbers.</span></div>
    <label>Repeat the new password<input id="pw_new2" type="${SF.pw?"text":"password"}" autocomplete="new-password" minlength="8" required></label>
    <label class="seccheck"><input type="checkbox" id="pw_others" checked> Log me out of my other phones and computers</label>
    <div class="row between"><button type="button" class="btn ghost sm" data-v4="pwShow">${ic("eye")}${SF.pw?"Hide":"Show"}</button><button class="btn" type="submit" ${SF.pwBusy?"disabled":""}>${SF.pwBusy?"Saving…":"Change password"}</button></div>
    <p class="small muted" style="margin:0">Forgot your current password? ${S.mode==="student"?"Ask your teacher: she can give you a new one from your profile.":"Log out and use “Forgot password?” on the login page."}</p></form>
  <div class="glass card sec"><h3>${ic("users")} Where you are logged in</h3>
    <div class="secrow"><div><b>This device</b><small>${esc(devName())} · active now</small></div><span class="chip ok">Now</span></div>
    <div class="secrow"><div><b>Other phones and computers</b><small>Someone else knows your password? Log them out now, then change your password.</small></div></div>
    <button type="button" class="btn ghost sm" data-v4="secOthers">${ic("x")}Log out of all other devices</button></div>
  <div class="glass card sec"><h3>${BELL} Notifications</h3>
    ${swHTML("sound",nPref("sound"),"Sound","Play a sound for new messages and activity")}
    ${swHTML("vib",nPref("vib"),"Vibration","The phone vibrates for new messages")}
    ${perm==="unsupported"?"":perm==="granted"?swHTML("push",nPref("push"),"Phone notifications","Show notifications when the app is in the background"):`<div class="secrow"><div><b>Phone notifications</b><small>${perm==="denied"?"Blocked: allow them in your phone or browser settings.":"Get notified even when you use another app."}</small></div>${perm==="denied"?"":`<button type="button" class="btn sm" data-v4="nPerm">Turn on</button>`}</div>`}
    <button type="button" class="btn ghost sm" data-v4="secTest">${ic("speaker")}Test the sound</button></div>
  ${student?`<div class="glass card sec"><h3>${ic("shield")} Privacy</h3>
    ${swHTML("peer",me.peerOff!==true,"Classmates can send me messages","If you turn this off, classmates cannot write to you")}
    <div class="secrow"><div><b>Who sees my posts and stories</b><small>Students and teachers of your school. Parents cannot see them.</small></div></div>
    <div><b class="small">Blocked people</b>${bl.length?bl.map(u=>`<div class="secrow"><div class="row">${avatar(u,blName(u)||"?",32)}<span>${esc(blName(u)||"Blocked person")}</span></div><button type="button" class="btn ghost sm" data-v4="secUnblock" data-id="${u}">Unblock</button></div>`).join(""):`<p class="small muted" style="margin:4px 0 0">Nobody. To block someone, open their message or post and choose “Report or block”.</p>`}</div></div>`:""}
  <div class="glass card sec sectips"><h3>${ic("star")} Stay safe</h3><ul class="small"><li>Never give your password to anyone, not even a friend.</li><li>Do not share your phone number or address in posts.</li><li>Someone is mean to you? Block them and report it: your teachers will help.</li></ul></div>
  </div>`}
{const _sv3=studentView;studentView=function(){if(S.view?.type==="security")return secView();return _sv3()}}
{const _tv3=teacherView;teacherView=function(){if(S.view?.type==="security")return secView();return _tv3()}}
{const _th=themeHTML;themeHTML=function(){return`<div class="section"><button type="button" class="glass card secentry" data-v4="secOpen"><span class="nbig">${ic("shield")}</span><span><b>Settings & security</b><small>Password, devices, notifications${S.mode==="student"&&S.me&&!isParent(S.me)?", privacy and blocked people":""}</small></span>${ic("right")}</button></div>`+_th()}}
async function pwSubmit(f){const cur=f.querySelector("#pw_cur").value,n1=f.querySelector("#pw_new").value,n2=f.querySelector("#pw_new2").value,oth=f.querySelector("#pw_others").checked;
  if(n1.length<8){toast("The new password needs at least 8 characters.","x");return}if(pwScore(n1)<2){toast("Too easy to guess: mix letters and numbers.","x");return}if(n1!==n2){toast("The two new passwords are not the same.","x");return}if(n1===cur){toast("Choose a new password, different from the old one.","x");return}
  SF.pwBusy=true;render();try{await window.__account.changePassword(cur,n1,oth);toast("Password changed! Remember it well.","lock");for(const id of["pw_cur","pw_new","pw_new2"])delete S.drafts[id];SF.pw=false}catch(e){toast(e.message||"Cannot change the password.","x")}SF.pwBusy=false;render()}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="pw_new"){const s=pwScore(e.target.value),b=document.getElementById("pw_bar");if(b){b.dataset.s=s;b.querySelector("span").textContent=!e.target.value?"Use 8 characters or more, with letters and numbers.":["Too weak","Weak","OK","Good","Strong"][s]}}});
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset)return;
  if(f.dataset.ff==="pwd"){e.preventDefault();e.stopImmediatePropagation();pwSubmit(f)}
  else if(f.dataset.ff==="rep"){e.preventDefault();e.stopImmediatePropagation();const r=SF.safety;if(!r||r.busy)return;const reason=(f.querySelector('input[name="sf_reason"]:checked')||{}).value||"",more=(f.querySelector("#sf_more")||{}).value||"";r.busy=true;feedSync();
    window.__safety.report(r.kind,r.ref,r.target,reason+(more?": "+more.trim():""),r.excerpt||"").then(()=>{SF.safety=null;feedSync();toast("Thank you. Your teachers will check it.","shield");if(F.sv)fShow()}).catch(er=>{r.busy=false;feedSync();toast(er.message||"Could not send","x")})}},true);
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4,id=el.dataset.id;
  switch(a){
  case"secOpen":S.view={type:"security"};S.animate=true;scrollTo(0,0);render();return;
  case"pwShow":SF.pw=!SF.pw;render();return;
  case"secOthers":if(confirm("Log out of all your other phones and computers?"))window.__account.signOutOthers().then(()=>toast("Done: only this device is logged in","check")).catch(er=>toast(er.message,"x"));return;
  case"secTog":{const k=el.dataset.k;if(k==="peer"){const on=!(S.me&&S.me.peerOff!==true);S.me.peerOff=!on;render();write(()=>S.db.doc("students/"+S.uid).update({peerOff:!on})).then(()=>toast(on?"Classmates can write to you":"Classmates cannot write to you any more","check")).catch(()=>{});return}
    const on=!nPref(k);nPrefSet(k,on);if(k==="sound"&&on)nSound("msg");if(k==="vib"&&on&&navigator.vibrate)navigator.vibrate(80);render();return}
  case"secTest":nAudio();nSound("msg");setTimeout(()=>nSound("like"),700);return;
  case"secUnblock":blSet(id,false,blName(id));return;
  case"sfX":SF.safety=null;feedSync();if(F.sv)fShow();return;
  case"sfPost":{const p=F.posts.find(x=>x.id===id);if(p)sfOpen({kind:"post",ref:p.id,target:p.author,name:p.who?.name,excerpt:v4Plain(p.body||"").slice(0,200)});return}
  case"sfStory":{const c=fCur();if(c)sfOpen({kind:"story",ref:c.s.id,target:c.g.uid,name:c.g.who?.name,excerpt:v4Plain(c.s.body||"").slice(0,200)});return}
  case"sfMsg":{const x=v4ActMsg();V4.act=null;if(x)sfOpen({kind:"message",ref:x.raw.id,target:x.raw.sender,name:peerName(x.raw.sender),excerpt:v4Plain(x.raw.body||"").slice(0,200)||attLabel(x.raw.att)});render();return}
  case"sfReport":SF.safety.step="report";feedSync();return;
  case"sfBlock":{const r=SF.safety;if(r&&confirm(`Block ${r.name||"this person"}? You will not see their posts and stories, and you cannot write to each other.`)){SF.safety=null;feedSync();if(F.sv)fCloseStory();blSet(r.target,true,r.name)}return}
  case"repDone":window.__safety.closeReport(+id).then(()=>{const r=(SF.reports||[]).find(x=>String(x.id)===String(id));if(r)r.done_at=new Date().toISOString();render()}).catch(er=>toast(er.message,"x"));return;
  }},true);
{const st=document.createElement("style");st.textContent=`
.secwrap{max-width:640px;margin-inline:auto;display:grid;gap:14px}
.sec{display:grid;gap:12px}.sec h3{display:flex;align-items:center;gap:8px;margin:0}.sec h3 svg{width:20px;height:20px}
.secrow{display:flex;align-items:center;justify-content:space-between;gap:12px}.secrow>div{display:grid;gap:2px;min-width:0}.secrow small{color:var(--muted);font-size:.8rem}
.sec label{display:grid;gap:6px;font-weight:600}.seccheck{display:flex!important;align-items:center;gap:8px;font-weight:500}.seccheck input{width:20px!important;height:20px;flex:none;margin:0}.sfr input{width:18px!important;flex:none;margin:0}
.v4sw{flex:none;width:50px;height:30px;border-radius:999px;border:0;background:var(--line);position:relative;cursor:pointer;transition:background .2s}.v4sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}.v4sw.on{background:#25D366}.v4sw.on i{transform:translateX(20px)}
.pwbar{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;align-items:center}.pwbar i{height:5px;border-radius:3px;background:var(--line)}.pwbar span{grid-column:1/-1;font-size:.78rem;color:var(--muted)}
.pwbar[data-s="1"] i:nth-child(-n+1){background:#E5484D}.pwbar[data-s="2"] i:nth-child(-n+2){background:#F5A524}.pwbar[data-s="3"] i:nth-child(-n+3){background:#7CC24E}.pwbar[data-s="4"] i{background:#25A55F}
.secentry{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;color:inherit;font:inherit}.secentry>span:nth-child(2){display:grid;flex:1}.secentry small{color:var(--muted)}.secentry>svg{width:20px;height:20px;opacity:.6}
.sectips ul{margin:0;padding-left:18px;display:grid;gap:4px}
.sfr{display:flex!important;align-items:center;gap:10px;padding:8px 4px;font-weight:500;cursor:pointer}
.frep{display:grid;gap:10px;border-color:#F5A524!important}.frep-it{display:grid;gap:4px;padding-top:10px;border-top:1px solid var(--line)}
`;document.head.appendChild(st)}
