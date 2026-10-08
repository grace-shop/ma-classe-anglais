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
const fmtSize=b=>!b?"":b<1024*1024?Math.max(1,Math.round(b/1024))+" Ko":(b/1048576).toFixed(1).replace(".",",")+" Mo";

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
.v4rec{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--line);background:var(--surface)}
.v4rec b{white-space:nowrap}.v4rec-dot{width:12px;height:12px;border-radius:50%;background:#E5484D;animation:v4blink 1s infinite}
@keyframes v4blink{50%{opacity:.25}}
.v4wave{display:flex;gap:3px;align-items:center;flex:1;height:24px;color:#E5484D;overflow:hidden}
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
const offChip=key=>V4.cached.has(key)?`<span class="chip ok offchip">${ic("check")}Hors ligne</span>`:"";
const EXT={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","audio/webm":"webm","audio/mp4":"m4a","audio/ogg":"ogg","audio/mpeg":"mp3","application/msword":"doc","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","text/plain":"txt"};
function fileNameOf(label,type){const m=String(label||"").match(/\(([^()]+\.[a-z0-9]{2,5})\)\s*$/i);if(m)return m[1];const base=String(label||"document").replace(/^Ouvrir (le |la )?/i,"").replace(/[\\/:*?"<>|]+/g,"").trim().slice(0,60)||"document";const ext=EXT[type]||"";return ext&&!base.toLowerCase().endsWith("."+ext)?base+"."+ext:base}
async function loadPdfJs(){if(window.pdfjsLib)return window.pdfjsLib;
  const tries=window.__STANDALONE?[["vendor/pdf.js","vendor/pdf.worker.js"],["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js","https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"]]:[["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js","https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"]];
  for(const[js,wk]of tries){try{await new Promise((res,rej)=>{const s=document.createElement("script");s.src=js;s.onload=res;s.onerror=rej;document.head.appendChild(s)});if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=wk;return window.pdfjsLib}}catch(e){}}
  throw new Error("pdfjs")}
function closeDoc(){const o=document.getElementById("docv");if(o)o.remove();document.documentElement.style.overflow="";if(V4.docUrl){try{URL.revokeObjectURL(V4.docUrl)}catch(e){}V4.docUrl=null}V4.doc=null;V4.pdf=null}
async function openDoc(src,label){closeDoc();const name=fileNameOf(label,src.t);
  const o=document.createElement("div");o.id="docv";o.className="docv";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label",name);
  o.innerHTML=`<div class="docv-top"><button class="x" data-v4="docClose" aria-label="Fermer">${ic("left")}</button><b>${esc(name)}</b><span id="docvZoom"></span><button data-v4="docSave" aria-label="Enregistrer sur l'appareil">${ic("download")}<span>Enregistrer</span></button></div><div class="docv-body" id="docvBody"><div class="docv-wait"><span class="v4spin"></span>Ouverture…</div></div>`;
  document.body.appendChild(o);document.documentElement.style.overflow="hidden";
  let b;try{b=await srcBlob(src)}catch(e){const body=document.getElementById("docvBody");if(body)body.innerHTML=`<div class="docv-msg">${ic("wifi")}<p>${navigator.onLine?"Impossible d'ouvrir ce fichier pour le moment. Réessaie dans un instant.":"Pas de connexion, et ce fichier n'est pas encore enregistré sur cet appareil.<br>Ouvre-le une fois avec Internet : il restera ensuite disponible <b>hors ligne</b>."}</p></div>`;return}
  if(!document.getElementById("docv"))return;V4.doc={blob:b,name};render();
  const body=document.getElementById("docvBody"),t=b.type||src.t||"";
  if(/^image\//.test(t)){const u=URL.createObjectURL(b);V4.docUrl=u;body.innerHTML=`<img class="docv-img" src="${u}" alt="${esc(name)}">`;return}
  if(/^audio\//.test(t)){const u=URL.createObjectURL(b);V4.docUrl=u;body.innerHTML=`<div class="docv-msg"><audio controls src="${u}" style="width:min(420px,90vw)"></audio></div>`;return}
  if(t==="application/pdf"||/\.pdf$/i.test(name)){try{const lib=await loadPdfJs();const doc=await lib.getDocument({data:new Uint8Array(await b.arrayBuffer()),isEvalSupported:false}).promise;if(!document.getElementById("docv"))return;V4.pdf={doc,zoom:1};drawPdf()}
    catch(e){body.innerHTML=`<div class="docv-msg">${ic("file")}<p>Ce PDF ne peut pas s'afficher ici. Enregistre-le pour l'ouvrir avec une autre application.</p><button class="btn" data-v4="docSave">${ic("download")}Enregistrer le fichier</button></div>`}return}
  body.innerHTML=`<div class="docv-msg">${ic(/word|msword/.test(t)?"word":"file")}<p><b>${esc(name)}</b><br>Ce type de fichier s'ouvre avec une autre application (Word, WPS…).</p><button class="btn" data-v4="docSave">${ic("download")}Enregistrer le fichier</button></div>`}
async function drawPdf(){const P=V4.pdf,body=document.getElementById("docvBody");if(!P||!body)return;const my=P.run=(P.run||0)+1;
  const z=document.getElementById("docvZoom");if(z)z.innerHTML=`<button data-v4="docZoom" data-k="-1" aria-label="Réduire">${ic("zout")}</button> <button data-v4="docZoom" data-k="1" aria-label="Agrandir">${ic("zin")}</button>`;
  body.innerHTML=`<div id="docvPages" style="display:grid;gap:10px;justify-items:center"></div>`;const box=document.getElementById("docvPages");
  const w=Math.min(body.clientWidth-16,980)*P.zoom,dpr=Math.min(2,window.devicePixelRatio||1),n=Math.min(P.doc.numPages,120);
  for(let i=1;i<=n;i++){if(P.run!==my||!document.getElementById("docvPages"))return;const page=await P.doc.getPage(i),v0=page.getViewport({scale:1}),sc=w/v0.width,vp=page.getViewport({scale:sc*dpr});
    const c=document.createElement("canvas");c.className="docv-page";c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);c.style.width=Math.floor(vp.width/dpr)+"px";box.appendChild(c);
    try{await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise}catch(e){}}
  if(P.doc.numPages>n)box.insertAdjacentHTML("beforeend",`<p class="docv-msg">Les ${P.doc.numPages-n} dernières pages ne sont pas affichées : enregistre le fichier pour tout voir.</p>`)}
async function docSave(){const d=V4.doc;if(!d)return;try{if(S.dl&&S.dl.save){await S.dl.save({filename:d.name,data:d.blob});toast("Fichier enregistré","download")}else{const a=document.createElement("a");a.href=URL.createObjectURL(d.blob);a.download=d.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}}catch(e){toast("Enregistrement impossible.","x")}}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById("docv"))closeDoc()});
addEventListener("popstate",()=>{if(document.getElementById("docv"))closeDoc()});
openCopy=function(p,t){openDoc({k:"c",id:p,t},isImg(t)?"copie.jpg":"copie.pdf")};

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
function attLabel(a){if(!a)return"";return a.k==="voice"?"🎤 Message vocal":a.k==="img"?"📷 Photo":a.k==="sticker"?"Sticker":"📎 "+(a.n||"Fichier")}
const onlyEmoji=t=>{const s=String(t||"").trim();if(!s||s.length>16)return false;try{return/^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(s)}catch(e){return false}};
function voiceHTML(a){const on=V4.playing===a.p;return`<div class="v4voice${on?" on":""}"><button type="button" data-v4="play" data-p="${esc(a.p)}" data-t="${esc(a.t||"audio/webm")}" aria-label="${on?"Pause":"Écouter le message vocal"}">${ic(on?"pause":"play")}</button><span class="v4bars" aria-hidden="true">${[5,9,14,8,18,11,6,15,20,9,13,7,16,10,5,12].map(h=>`<span class="v4b" style="height:${h}px"></span>`).join("")}</span><small>${fmtDur(a.d)}</small></div>`}
function msgBodyHTML(text,a){let h="";
  if(a&&typeof a==="object"){if(a.k==="sticker")h+=`<img class="v4stk" src="img/${esc(a.e)}.webp" alt="Sticker" loading="lazy" draggable="false">`;
    else if(a.k==="voice")h+=voiceHTML(a);
    else if(a.k==="img"){const u=V4.obj[a.p];h+=`<button type="button" class="v4img" data-v4="doc" data-k="m" data-id="${esc(a.p)}" data-t="${esc(a.t||"image/jpeg")}" data-n="${esc(a.n||"photo.jpg")}" aria-label="Voir la photo"><img ${u?`src="${u}"`:`data-chatp="${esc(a.p)}" data-t="${esc(a.t||"")}"`} alt="Photo"></button>`}
    else if(a.p)h+=`<button type="button" class="v4file" data-v4="doc" data-k="m" data-id="${esc(a.p)}" data-t="${esc(a.t||"")}" data-n="${esc(a.n||"fichier")}">${ic(/word/.test(a.t||"")?"word":"file")}<span><b>${esc(a.n||"Fichier")}</b><small>${fmtSize(a.s)}${V4.cached.has("m:"+a.p)?" · hors ligne":""}</small></span></button>`}
  if(text)h+=`<div class="${onlyEmoji(text)?"msg-emo":""}" style="white-space:pre-wrap">${E(text)}</div>`;
  return h}
const msgHTML=(mine,text,a,at)=>`<div class="msg ${mine?"mine":""}${a&&a.k==="sticker"&&!text?" stk":""}">${msgBodyHTML(text,a)}<span>${fmtTime(at)}</span></div>`;
async function hydrateChat(){for(const img of document.querySelectorAll("img[data-chatp]:not([data-ok])")){img.dataset.ok="1";const p=img.dataset.chatp;
  try{let u=V4.obj[p];if(!u){const b=await srcBlob({k:"m",id:p,t:img.dataset.t});u=V4.obj[p]=URL.createObjectURL(b)}img.src=u}catch(e){img.alt="Photo indisponible hors ligne"}}}
document.addEventListener("load",e=>{const t=e.target;if(t&&t.tagName==="IMG"&&t.closest&&t.closest("#chatScroll")){const cs=document.getElementById("chatScroll");if(cs&&cs.scrollHeight-cs.scrollTop-cs.clientHeight<400)cs.scrollTop=cs.scrollHeight}},true);
new MutationObserver(()=>{clearTimeout(hydrateChat._t);hydrateChat._t=setTimeout(hydrateChat,60)}).observe(document.body,{childList:true,subtree:true});
async function v4Play(p,t){const A=V4.audio||(V4.audio=new Audio());if(V4.playing===p){A.pause();V4.playing=null;render();return}
  try{let u=V4.obj[p];if(!u){V4.playing=p;render();const b=await srcBlob({k:"m",id:p,t});u=V4.obj[p]=URL.createObjectURL(b)}A.src=u;A.onended=()=>{V4.playing=null;render()};V4.playing=p;await A.play();render()}
  catch(e){V4.playing=null;render();toast(navigator.onLine?"Lecture impossible sur cet appareil.":"Ce vocal n'est pas encore enregistré sur l'appareil.","x")}}
function v4PanelHTML(kind,t){return`<div class="v4panel glass"><div class="v4tabs seg"><button type="button" data-v4="panel" data-k="${kind}" data-t="emo" aria-pressed="${t==="emo"}">Emojis</button><button type="button" data-v4="panel" data-k="${kind}" data-t="stk" aria-pressed="${t==="stk"}">Stickers 3D</button><button type="button" class="iconbtn sm" data-v4="panelClose" aria-label="Fermer">${ic("x")}</button></div>
  ${t==="emo"?`<div class="v4grid emo">${V4EMO.map(x=>`<button type="button" data-v4="emo" data-k="${kind}" data-e="${x}" aria-label="${x}">${E(x)}</button>`).join("")}</div>`:`<div class="v4grid stk">${v4Stickers().map(c=>`<button type="button" data-v4="stk" data-k="${kind}" data-e="${c}" aria-label="Envoyer ce sticker"><img src="img/${c}.webp" alt="" loading="lazy"></button>`).join("")}${v4LockedPacks().map(pk=>`<button type="button" class="lockpk" data-v4="packInfo" data-id="${pk.id}" aria-label="Pack ${esc(pk.t)} à débloquer" title="À débloquer dans la boutique"><img src="img/${pk.e[0]}.webp" alt="" loading="lazy"></button>`).join("")}</div>${v4LockedPacks().length&&S.mode==="student"?`<span class="small muted">${v4LockedPacks().length} pack${v4LockedPacks().length>1?"s":""} de stickers à débloquer dans la boutique (grisés).</span>`:""}`}</div>`}
const v4Stickers=()=>{const own=(S.me&&S.me.owned)||{},all=[...V4STK];if(typeof SH_PACKS!=="undefined")for(const pk of SH_PACKS)if(own[pk.id]||S.mode==="teacher")for(const c of pk.e)if(!all.includes(c))all.push(c);return all};
const v4LockedPacks=()=>{if(typeof SH_PACKS==="undefined"||S.mode!=="student")return[];const own=(S.me&&S.me.owned)||{};return SH_PACKS.filter(pk=>!own[pk.id])};
const V4IN=k=>({peer:"peerInput",chat:"chatInput",staff:"staffInput"})[k]||"chatInput",V4F=k=>({peer:"peerchat",chat:"chat",staff:"staffchat"})[k]||"chat";
function v4Bar(kind,target,ph){const inId=V4IN(kind),files=!!window.__chatFiles,rec=V4.rec&&V4.rec.kind===kind?V4.rec:null,pan=V4.panel&&V4.panel.kind===kind?V4.panel.t:null,busy=V4.sending||(kind==="peer"&&PR.sending);
  if(rec)return`<div class="v4rec" role="status"><span class="v4rec-dot" aria-hidden="true"></span><b>Enregistrement <span id="v4recT">${fmtDur(rec.sec)}</span></b><span class="v4wave" aria-hidden="true">${"<i></i>".repeat(18)}</span><button type="button" class="iconbtn" data-v4="recCancel" aria-label="Annuler le vocal" title="Annuler">${ic("trash")}</button><button type="button" class="btn sm" data-v4="recSend" aria-label="Envoyer le vocal">${ic("send")}</button></div>`;
  return`${pan?v4PanelHTML(kind,pan):""}${V4.upl===kind?`<div class="v4upl"><span class="v4spin"></span>Envoi en cours…</div>`:""}<form class="chatbar v4bar" data-f="${V4F(kind)}" data-s="${esc(target)}">
  <button type="button" class="iconbtn${pan?" on":""}" data-v4="panel" data-k="${kind}" data-t="${pan||"emo"}" aria-label="Emojis et stickers" title="Emojis et stickers">${ic("smile")}</button>
  <input id="${inId}" placeholder="${esc(ph||"Écris un message…")}" maxlength="1000" autocomplete="off" aria-label="Message">
  ${files?`<label class="iconbtn" title="Envoyer une photo ou un fichier" aria-label="Envoyer une photo ou un fichier">${ic("clip")}<input type="file" id="v4f_${kind}" hidden accept="image/*,application/pdf,audio/*,.doc,.docx,.ppt,.pptx,.txt"></label>${V4.canRec?`<button type="button" class="iconbtn" data-v4="rec" data-k="${kind}" aria-label="Enregistrer un message vocal" title="Message vocal">${ic("mic")}</button>`:""}`:""}
  <button class="btn" type="submit" aria-label="Envoyer" ${busy?"disabled":""}>${ic("send")}</button></form>`}
async function v4Deliver(kind,target,text,att){
  if(kind==="staff")return staffSend(target,text,att);
  if(kind==="peer"){const id=await window.__peer.send(target,text||"",att||null);PR.inbox.unshift({id:id||("tmp"+Date.now()),sender:S.uid,receiver:target,body:text||"",att:att||null,created_at:new Date().toISOString(),read_at:null});render();return}
  const at=Date.now(),from=S.mode==="teacher"?"teacher":"student",pv=(text||attLabel(att)).slice(0,80);
  await write(()=>S.db.collection("students/"+target+"/msgs").add({from,text:text||"",at,...(att?{att}:{})}));
  await write(()=>S.db.doc("students/"+target).update(from==="teacher"?{lastMsgAt:at,lastMsgFrom:"teacher",lastMsgText:pv,teacherReadAt:at}:{lastMsgAt:at,lastMsgFrom:"student",lastMsgText:pv,studentReadAt:at,lastActive:at,activity:"A écrit à la prof"}));
  if(from==="student")presence("Écrit un message")}
function v4Target(kind){const f=document.querySelector(`form.v4bar[data-f="${V4F(kind)}"]`);return f?f.dataset.s:(V4.rec&&V4.rec.target)||(V4.panel&&V4.panel.target)||""}
async function v4SendFile(kind,target,file,name,k,dur){if(!window.__chatFiles){toast("L'envoi de fichiers n'est pas disponible ici.","x");return}
  if(!navigator.onLine){toast("Pas de réseau : réessaie quand tu es connecté.","x");return}
  if(!target)return;if(file.size>10*1024*1024){toast("Fichier trop lourd (10 Mo maximum).","x");return}
  let f=file;if(/^image\//.test(f.type)&&!/gif/.test(f.type))f=await shrinkImg(f,1280,.72);
  const kk=k||(/^image\//.test(f.type)?"img":"file");V4.sending=true;V4.upl=kind;render();
  try{const up=await window.__chatFiles.upload(f,name||f.name||"fichier");const att={k:kk,p:up.p,t:up.t,n:up.n,s:up.s,...(dur?{d:dur}:{})};
    if(kk!=="file")V4.obj[up.p]=URL.createObjectURL(f);fcPut("m:"+up.p,f);
    let text="";if(kk!=="voice"){const inp=document.getElementById(V4IN(kind));text=(inp&&inp.value||"").trim();if(inp){inp.value="";delete S.drafts[inp.id]}}
    await v4Deliver(kind,target,text,att)}
  catch(e){toast((e&&e.message)||"Envoi impossible pour le moment.","x")}
  V4.sending=false;V4.upl=null;render()}
async function recStart(kind,target){if(V4.rec||!target)return;let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
  catch(e){toast(e&&(e.name==="NotAllowedError"||e.name==="SecurityError")?"Autorise le micro pour envoyer un vocal : touche le cadenas à côté de l'adresse (ou Paramètres du téléphone → Applications → English Classes → Autorisations → Micro).":"Micro indisponible sur cet appareil.","x");return}
  const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}})||"";
  let mr;try{mr=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:24000}:undefined)}catch(e){stream.getTracks().forEach(t=>t.stop());toast("L'enregistrement vocal n'est pas possible sur cet appareil.","x");return}
  const chunks=[];V4.panel=null;V4.rec={kind,target,mr,stream,chunks,start:Date.now(),sec:0,cancel:false};
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const r=V4.rec;V4.rec=null;if(r)clearInterval(r.timer);render();if(!r||r.cancel)return;const sec=Math.round((Date.now()-r.start)/1000);if(sec<1){toast("Message vocal trop court.","x");return}
    const type=String(mr.mimeType||mime||"audio/webm").split(";")[0],blob=new Blob(chunks,{type});v4SendFile(r.kind,r.target,blob,"vocal."+(EXT[type]||"webm"),"voice",sec)};
  mr.start(250);V4.rec.timer=setInterval(()=>{const r=V4.rec;if(!r)return;r.sec=Math.round((Date.now()-r.start)/1000);const el=document.getElementById("v4recT");if(el)el.textContent=fmtDur(r.sec);if(r.sec>=180)recStop(false)},400);render()}
function recStop(cancel){const r=V4.rec;if(!r)return;r.cancel=!!cancel;try{r.mr.stop()}catch(e){V4.rec=null;render()}}

/* conversation privée prof ↔ élève / parent */
chatHTML=function(sid,me){const ready=S.chatFor===sid&&S.msgsReady;
  return`<div class="glass chat"><div class="msgs" id="chatScroll">${!ready?`<div class="muted" style="margin:auto">Chargement…</div>`:S.msgs.length?S.msgs.map(m=>msgHTML(m.from===me,m.text,m.att,m.at)).join(""):`<div class="muted" style="margin:auto;text-align:center">Aucun message pour l'instant.<br>${me==="student"?"Pose ta question à ta professeure, en français ou en anglais. Tu peux aussi lui envoyer un vocal ou une photo.":"Écris le premier message, ou envoie un vocal, une photo ou un fichier."}</div>`}</div>
  ${v4Bar("chat",sid,me==="student"?"Écris à ta prof…":"Écris un message…")}</div>`};
/* camarades */
peerChatView=function(){const id=S.view.id,me=S.uid,nm=peerName(id),msgs=PR.inbox.filter(m=>(m.sender===me&&m.receiver===id)||(m.sender===id&&m.receiver===me)).slice().reverse();
  return`<div class="section" style="max-width:720px;margin-inline:auto"><div><button class="back" data-a="peerBack">${ic("left")}Camarades</button></div><div class="row">${avatar(id,nm,48)}<div><span class="eyebrow">Camarade</span><h2>${esc(nm)}${S.peers[id]?` <span class="chip ok">En ligne</span>`:""}</h2></div></div>
  <div class="glass chat"><div class="msgs" id="chatScroll">${msgs.length?msgs.map(m=>msgHTML(m.sender===me,m.body,m.att,+new Date(m.created_at))).join(""):`<div class="muted" style="margin:auto;text-align:center">Aucun message pour l'instant.<br>Dis bonjour à ${esc(nm.split(" ")[0])} ! Tu peux écrire, envoyer un vocal, une photo, un fichier ou un sticker.</div>`}</div>
  ${v4Bar("peer",id,"Écris un message…")}</div>
  <p class="hint">Reste poli et respectueux avec tes camarades. Pour pratiquer, essaie d'écrire en anglais !</p></div>`};

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
  return`<div class="section"><div><span class="eyebrow">Historique</span><h2>Mes conversations</h2><p class="sub">Touche une conversation pour la relire et la continuer là où tu t'es arrêté.</p></div><div class="glass list">
  ${logs.map(l=>{const sc=TALK_SC.find(x=>x.k===l.sc),last=[...l.turns].reverse()[0];return`<div class="it click talk-h" data-v4="talkResume" data-id="${esc(l.id)}" tabindex="0" role="button" aria-label="Continuer la conversation ${esc(l.title)}"><span class="talk-h-ic" aria-hidden="true">${E(sc?sc.e:"💬")}</span><div class="txt" style="min-width:0"><b>${esc(l.title)}</b><span class="small muted">${fmtTime(l.upd)} · ${l.n} message${l.n>1?"s":""} · ${l.fixes} correction${l.fixes>1?"s":""}${l.summary?" · bilan fait":""}</span>${last?`<span class="small talk-h-last">${last.role==="me"?"Toi : ":"Nova : "}${esc(String(last.text).slice(0,80))}</span>`:""}</div><span class="chip lvl">${ic("chat")}Continuer</span><button class="iconbtn sm" data-v4="talkDel" data-id="${esc(l.id)}" aria-label="Supprimer cette conversation" title="Supprimer">${ic("trash")}</button></div>`}).join("")}
  ${old.map(h=>{const sc=TALK_SC.find(x=>x.k===h.sc);return`<div class="it click talk-h" data-a="talkStart" data-k="${esc(h.sc||(TALK_SC[0]||{}).k||"")}" tabindex="0" role="button"><span class="talk-h-ic" aria-hidden="true">${E(sc?sc.e:"💬")}</span><div class="txt"><b>${esc(h.title)}</b><span class="small muted">${fmtDate(h.at)} · ${h.n} message${h.n>1?"s":""} · ancienne conversation</span></div><span class="chip">${ic("refresh")}Refaire</span></div>`}).join("")}</div></div>`}
function talkResume(id){const l=(V4.talkLogs||[]).find(x=>x.id===id)||talkLocal()[id];if(!l)return;
  S.talk={id:l.id,sc:l.sc,turns:l.turns.map(t=>({...t})),busy:false,strict:!!l.strict,at:l.at||Date.now(),paidN:l.paidN||0};
  S.view=null;S.tab="talk";S.animate=true;render();talkScroll();try{touch("Reprend sa conversation avec Nova : "+(l.en||l.title))}catch(e){}
  const last=S.talk.turns[S.talk.turns.length-1];if(!last||last.role==="me")talkAsk(!last)}
function talkDel(id){try{const all=talkLocal();delete all[id];localStorage.setItem(TALK_LS(),JSON.stringify(all))}catch(e){}
  if(V4.talkLogs)V4.talkLogs=V4.talkLogs.filter(x=>x.id!==id);try{S.db.doc("students/"+S.uid+"/talklog/"+id).delete().catch(()=>{})}catch(e){}toast("Conversation supprimée","trash");render()}
{const _ts=talkStart;talkStart=function(k){_ts(k);if(S.talk&&!S.talk.id)S.talk.id="t"+v4uid()}}
{const _ta=talkAsk;talkAsk=async function(start){const T=S.talk;await _ta(start);if(T&&T.turns&&T.turns.length)talkSave(T)}}
{const _tp=talkPickerHTML;talkPickerHTML=function(){const m=S.me;if(!m)return _tp();const keep=m.talks;m.talks=[];let h;try{h=_tp()}finally{m.talks=keep}return h+talkHistHTML()}}
talkReward=function(T){const n=T.turns.filter(t=>t.role==="me").length,paid=T.paidN||0;if(n<=paid){talkSave(T);return 0}
  const nn=n-paid;T.paidN=n;T.rewarded=true;const fixes=T.turns.filter(t=>t.corr).length,xp=Math.min(nn,10)*5+(nn>=5?20:0),sc=TALK_SC.find(x=>x.k===T.sc);if(!T.id)T.id="t"+v4uid();
  const entry={id:T.id,sc:T.sc,title:sc?.t||"Conversation",at:Date.now(),n,fixes,score:T.summary?.score||null,level:T.summary?.level||"",mistakes:T.turns.filter(t=>t.corr).slice(-3).map(t=>({wrong:t.corr.you||"",right:t.corr.better}))};
  const talks=[...(S.me?.talks||[]).filter(x=>x.id!==T.id),entry].slice(-40);
  gain(xp,`A parlé anglais avec Nova (${sc?.en||"chat"}) : ${nn} message${nn>1?"s":""}`,{talks});talkSave(T);return xp};

/* =====================================================================
   4. Dossiers d'élèves (par classe) pour les longues listes
   ===================================================================== */
const V4FOLD_MIN=12;
const v4FolderOf=s=>isParent(s)?"__parents":(String(s.classe||"").trim()||"__none");
const v4FName=k=>k==="__none"?"Sans classe":k==="__parents"?"Parents":k;
function v4Folders(list){const m=new Map();for(const s of list){const k=v4FolderOf(s),f=m.get(k)||{k,n:0,on:0,un:0};f.n++;if(online(s))f.on++;if(teacherUnread(s))f.un++;m.set(k,f)}
  return[...m.values()].sort((a,b)=>(a.k.startsWith("__")-b.k.startsWith("__"))||a.k.localeCompare(b.k,"fr",{numeric:true}))}
function v4FolderGrid(list,act,sel){return`<div class="v4folders">${v4Folders(list).map(f=>`<button class="v4folder${sel===f.k?" on":""}" data-v4="${act}" data-k="${esc(f.k)}"><span class="v4folder-ic" aria-hidden="true">${ic("folder")}</span><b>${esc(v4FName(f.k))}</b><small>${f.n} ${f.k==="__parents"?"parent":"élève"}${f.n>1?"s":""}${f.on?` · <span class="dot on"></span>${f.on} en ligne`:""}</small>${f.un?`<span class="chip bad">${f.un}</span>`:""}</button>`).join("")}</div>`}
const v4UseFolders=list=>list.length>V4FOLD_MIN&&v4Folders(list).length>1;
const v4DashFoldersOnly=st=>v4UseFolders(st)&&!S.drafts.st_cls&&!(S.drafts.st_q||"").trim()&&!stOnOff();
stFiltered=function(st){const q=(S.drafts.st_q||"").trim().toLowerCase(),cl=S.drafts.st_cls||"",on=stOnOff();if(v4DashFoldersOnly(st))return[];
  return[...st].filter(s=>(!q||(s.name||"").toLowerCase().includes(q))&&(!cl||v4FolderOf(s)===cl||(s.classe||"")===cl)&&(!on||online(s))).sort((a,b)=>(b.lastActive||0)-(a.lastActive||0))};
stToolbar=function(st,n){const useF=v4UseFolders(st),cl=S.drafts.st_cls||"";
  const top=`<div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px"><input id="st_q" type="search" placeholder="Chercher un élève…" value="${esc(S.drafts.st_q||"")}" style="flex:1;min-width:170px"><label class="row small" style="gap:6px;flex-wrap:nowrap"><input id="st_on" type="checkbox"${stOnOff()?" checked":""}>En ligne</label><span class="chip">${v4DashFoldersOnly(st)?st.length+" élèves":n+" / "+st.length}</span></div>`;
  if(!useF){const cls=[...new Set(st.map(s=>s.classe).filter(Boolean))].sort();return top.replace(`<label class="row small"`,`${cls.length>1?`<select id="st_cls"><option value="">Toutes les classes</option>${cls.map(c=>`<option value="${esc(c)}"${cl===c?" selected":""}>${esc(c)}</option>`).join("")}</select>`:""}<label class="row small"`)}
  if(cl)return top+`<div class="v4crumb"><button class="back" data-v4="dashFold" data-k="">${ic("left")}Tous les dossiers</button><span class="chip">${ic("folder")}${esc(v4FName(cl))}</span></div>`;
  return top+(v4DashFoldersOnly(st)?`<p class="sub small" style="margin:0 0 8px">Tes ${st.length} élèves sont rangés par classe. Ouvre un dossier, ou cherche un nom ci-dessus.</p>`+v4FolderGrid(st,"dashFold",""):"")};
/* conversations de la prof : dossiers aussi */
{const _mv=msgsView0;msgsView0=function(){const all=[...S.students,...S.parents];if(!v4UseFolders(all))return _mv();
  const sel=S.v4msgFold||"",q=(S.drafts.fq_msgs||"").trim().toLowerCase(),un=all.filter(teacherUnread);
  const list=(q?all.filter(s=>(s.name||"").toLowerCase().includes(q)):sel?all.filter(s=>v4FolderOf(s)===sel):[]).sort((a,b)=>(b.lastMsgAt||0)-(a.lastMsgAt||0));
  const row=s=>`<div class="thread" data-a="openChat" data-id="${s.id}" tabindex="0">${avatar(s.id,s.name)}<div class="txt"><b>${esc(s.name)}${isParent(s)?` <span class="chip">Parent${s.childName?" de "+esc(s.childName):""}</span>`:""}</b><span>${s.lastMsgAt?esc((s.lastMsgFrom==="teacher"?"Toi : ":"")+(s.lastMsgText||"Nouveau message")):"Aucun message"}</span></div><div class="row small muted">${s.lastMsgAt?fmtTime(s.lastMsgAt):""}${teacherUnread(s)?`<span class="chip bad">Nouveau</span>`:""}</div></div>`;
  return`<div class="section"><div><span class="eyebrow">Messagerie</span><h2>Conversations</h2><p class="sub">Chaque conversation est privée entre toi et l'élève ou le parent. Les élèves sont rangés par classe.</p></div>
  <input id="fq_msgs" type="search" placeholder="Chercher un élève ou un parent…" value="${esc(S.drafts.fq_msgs||"")}" style="margin-bottom:12px">
  ${!q&&!sel&&un.length?`<div><span class="eyebrow">Non lus · ${un.length}</span></div><div class="glass list" style="margin:8px 0 16px">${un.sort((a,b)=>(b.lastMsgAt||0)-(a.lastMsgAt||0)).slice(0,20).map(row).join("")}</div>`:""}
  ${q?"":sel?`<div class="v4crumb"><button class="back" data-v4="msgFold" data-k="">${ic("left")}Tous les dossiers</button><span class="chip">${ic("folder")}${esc(v4FName(sel))} · ${list.length}</span></div>`:v4FolderGrid(all,"msgFold","")}
  ${q||sel?(list.length?`<div class="glass list">${list.slice(0,S.v4msgLim||40).map(row).join("")}</div>${moreBtn(Math.min(list.length,S.v4msgLim||40),list.length,"v4msgMore")}`:`<div class="empty">Personne ne correspond.</div>`):""}</div>`}}

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
    if(!body.trim()&&!imgs.length)throw{code:"empty",message:"Le sujet est vide : ajoute le texte ou un fichier."};
    const prompt=`Tu es un professeur d'anglais expérimenté au Togo (programme APC). Rédige le CORRIGÉ COMPLET et détaillé de ${kind==="epreuves"?"cette épreuve":"ce devoir"} pour des élèves de niveau ${x.level||"A2"}${x.exam?" ("+x.exam+")":""}.
Titre : ${x.title}
${body.trim()?"Sujet (texte) :\n"+body.slice(0,12000):"Le sujet est dans les images jointes."}
Consignes de rédaction :
- Reprends chaque partie et chaque question dans l'ordre (I, II, Item 1, question 1…), avec la bonne réponse.
- Pour les questions ouvertes ou la production écrite, propose une réponse modèle en anglais correct, du niveau attendu, puis 2 ou 3 critères de réussite en français.
- Ajoute une courte explication en français quand c'est utile (grammaire, vocabulaire, traduction).
- Indique le barème si le sujet en donne un.
- Format : texte simple. Titres de parties sur une ligne seule commençant par "## ". Mots importants entre **double astérisques**. Pas de tableau, pas de HTML.`;
    const r=await AI.sample(prompt,{modelTier:"complex",cache:false,...(imgs.length?{images:imgs}:{})});
    if(!V4.cor||V4.cor.id!==id)return;V4.cor.text=String(r.text||"").trim();V4.cor.busy=false;if(!V4.cor.text)V4.cor.err="Nova n'a rien répondu. Réessaie."}
  catch(e){if(V4.cor&&V4.cor.id===id){V4.cor.busy=false;V4.cor.err=(e&&e.code==="empty")?e.message:aiErr(e&&e.code)}}
  v4CorModal()}
function v4CorModal(){let m=document.getElementById("v4cor");const C=V4.cor;if(!C){if(m)m.remove();return}const x=corItem(C.kind,C.id);
  if(!m){m=document.createElement("div");m.id="v4cor";m.className="v4modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");document.body.appendChild(m)}
  const pub=C.kind==="epreuves"?x?.corrigeVisible:x?.corrigeVisible;
  m.innerHTML=`<div class="glass"><div class="row between" style="flex-wrap:nowrap"><div><span class="eyebrow">${ic("spark")} Corrigé rédigé par Nova</span><h2 style="margin:4px 0 0">${esc(x?.title||"")}</h2></div><button class="iconbtn" data-v4="corClose" aria-label="Fermer">${ic("x")}</button></div>
  ${C.busy?`<div class="row" style="gap:12px;padding:30px 0"><span class="v4spin"></span><span>Nova lit le sujet et rédige le corrigé… (jusqu'à une minute)</span></div>`:C.err?`<div class="note">${esc(C.err)}</div><div><button class="btn" data-v4="aiCor" data-k="${C.kind}" data-id="${C.id}">${ic("refresh")}Réessayer</button></div>`:`
  <div class="note small">Relis toujours le corrigé : Nova peut se tromper. Tu peux le modifier ci-dessous avant de l'enregistrer.</div>
  <textarea id="v4corTxt" style="min-height:300px;font-family:var(--f-body)">${esc(C.text)}</textarea>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-v4="corDl" data-k="pdf">${ic("download")}PDF</button><button class="btn ghost sm" data-v4="corDl" data-k="doc">${ic("word")}Word</button><button class="btn ghost sm" data-v4="corDl" data-k="png">${ic("image")}Image</button></div>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-v4="corSave" data-k="0">${ic("lock")}Enregistrer (visible par moi seule)</button><button class="btn" data-v4="corSave" data-k="1">${ic("eye")}${pub?"Mettre à jour le corrigé publié":"Publier pour les élèves"}</button><button class="btn ghost sm" data-v4="aiCor" data-k="${C.kind}" data-id="${C.id}">${ic("refresh")}Nouvelle version</button></div>`}</div>`}
const corText=()=>{const t=document.getElementById("v4corTxt");return(t?t.value:(V4.cor&&V4.cor.text)||"").trim()};
async function corSave(publish){const C=V4.cor;if(!C)return;const text=corText();if(!text){toast("Le corrigé est vide.","x");return}V4.cor.text=text;
  if(C.kind==="epreuves"){const prev=S.corriges[C.id]||{},corr={...prev,text,by:"nova",at:Date.now()};await write(()=>S.db.doc("corriges/"+C.id).set(corr));
    const e=S.eps.find(x=>x.id===C.id);if(publish)await write(()=>S.db.doc("epreuves/"+C.id).update({corrigeVisible:true,corrigePublic:{text,fileId:prev.fileId||"",fileName:prev.fileName||"",fileType:prev.fileType||""}}));else if(e&&e.corrigeVisible)await write(()=>S.db.doc("epreuves/"+C.id).update({corrigePublic:{text,fileId:prev.fileId||"",fileName:prev.fileName||"",fileType:prev.fileType||""}}))}
  else{await write(()=>S.db.doc("corriges/hw_"+C.id).set({text,by:"nova",at:Date.now()}));const h=S.homework.find(x=>x.id===C.id);
    if(publish||(h&&h.corrigeVisible))await write(()=>S.db.doc("homework/"+C.id).update({corrigeVisible:true,corrigePublic:{text}}))}
  toast(publish?"Corrigé publié pour les élèves":"Corrigé enregistré (privé)","check");V4.cor=null;v4CorModal();render()}
/* fichiers : PDF (sans bibliothèque), Word (.doc), image (.png) */
const cleanMd=t=>String(t||"").replace(/\r/g,"");
function toCp1252(str){const map={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
  let o="";for(const ch of str){const c=ch.codePointAt(0);let b=c<128||(c>=160&&c<256)?c:map[ch];if(b===undefined)b=63;const s=String.fromCharCode(b);o+=s==="("||s===")"||s==="\\"?"\\"+s:s}return o}
function makePdf(title,text){const W=595,H=842,M=50,lines=[];const wrap=(s,size,bold)=>{const max=Math.floor((W-2*M)/(size*(bold?.56:.52)));const words=s.split(/\s+/);let cur="";const out=[];for(const w of words){if((cur+" "+w).trim().length>max&&cur){out.push(cur);cur=w}else cur=(cur+" "+w).trim()}out.push(cur);return out};
  lines.push({t:title,s:16,b:true,gap:8});lines.push({t:"Corrigé · English Classes",s:9,b:false,gap:14});
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
  return new Blob([`﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt}h1{font-size:18pt;color:#1E2558}h2{font-size:14pt;color:#1E2558;margin-top:14pt}p{margin:4pt 0}</style></head><body><h1>${esc(title)}</h1><p><i>Corrigé · English Classes</i></p>${body}</body></html>`],{type:"application/msword"})}
async function makePng(title,text){const W=1240,pad=70,c=document.createElement("canvas"),g=c.getContext("2d");const font=(s,b)=>`${b?"700":"400"} ${s}px Manrope, Arial, sans-serif`;
  const items=[];const wrap=(t,s,b)=>{g.font=font(s,b);const out=[];let cur="";for(const w of t.split(/\s+/)){const tt=(cur+" "+w).trim();if(g.measureText(tt).width>W-2*pad&&cur){out.push(cur);cur=w}else cur=tt}out.push(cur);return out};
  for(const l of wrap(title,46,true))items.push({t:l,s:46,b:true,c:"#1E2558"});items.push({t:"Corrigé · English Classes",s:22,b:false,c:"#8A8FA8",gap:24});
  for(let raw of cleanMd(text).split("\n")){raw=raw.replace(/\*\*/g,"").replace(/^\s*[-*•]\s+/,"• ");if(!raw.trim()){items.push({t:"",s:14});continue}const h=/^#{1,3}\s+/.test(raw),t=raw.replace(/^#{1,3}\s+/,"");for(const l of wrap(t,h?32:27,h))items.push({t:l,s:h?32:27,b:h,c:h?"#1E2558":"#1B1F33",gap:h?6:0})}
  const H=Math.min(16000,pad*2+items.reduce((n,i)=>n+i.s*1.45+(i.gap||0),0));c.width=W;c.height=H;g.fillStyle="#fff";g.fillRect(0,0,W,H);g.fillStyle="#4B6BD6";g.fillRect(0,0,W,14);
  let y=pad;for(const i of items){y+=i.s*1.2;g.font=font(i.s,i.b);g.fillStyle=i.c||"#000";if(i.t)g.fillText(i.t,pad,y);y+=i.s*.25+(i.gap||0)}
  return await new Promise(r=>c.toBlob(r,"image/png"))}
async function corDownload(kind){const C=V4.cor;if(!C)return;const x=corItem(C.kind,C.id),title="Corrigé - "+(x?.title||"devoir"),text=corText(),base=title.replace(/[\\/:*?"<>|]+/g,"").slice(0,70);
  try{const blob=kind==="pdf"?makePdf(title,text):kind==="doc"?makeDoc(title,text):await makePng(title,text);const name=base+"."+(kind==="doc"?"doc":kind);
    if(S.dl&&S.dl.save)await S.dl.save({filename:name,data:blob});else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}toast("Fichier enregistré","download")}
  catch(e){toast("Création du fichier impossible.","x")}}

/* =====================================================================
   6. Devoirs : la prof peut joindre des fichiers ou des photos
   ===================================================================== */
function v4HwFilesHTML(){const ed=S.editing&&S.editing.kind==="homework"?S.homework.find(x=>x.id===S.editing.id):null,old=(ed&&ed.files)||[];
  return`<div class="scanbox"><div class="row"><label class="btn ghost sm filebtn" style="cursor:pointer">${ic("clip")}Joindre un fichier ou une photo<input type="file" id="v4hwf" multiple accept="image/*,application/pdf,.doc,.docx" hidden></label><span class="hint">Facultatif · PDF, Word ou photos (5 maximum).</span></div>
  ${old.length||V4.hwFiles.length?`<div class="hwfiles">${old.map((f,i)=>`<span class="chip">${ic("file")}${esc(f.name)}<button type="button" class="iconbtn sm" data-v4="hwOldRm" data-i="${i}" aria-label="Retirer">${ic("x")}</button></span>`).join("")}${V4.hwFiles.map((f,i)=>`<span class="chip ok">${ic("clip")}${esc(f.name)}<button type="button" class="iconbtn sm" data-v4="hwRm" data-i="${i}" aria-label="Retirer">${ic("x")}</button></span>`).join("")}</div>`:""}</div>`}
async function hwSubmit(f){const v=id=>(document.getElementById(id)?.value||"").trim();const btn=f.querySelector('button[type=submit]');
  const instr=(document.getElementById("h_body")?.value||"").trim(),ed=S.editing&&S.editing.kind==="homework"?S.homework.find(x=>x.id===S.editing.id):null;
  let files=[...((ed&&ed.files)||[])].filter((_,i)=>!(V4.hwOldRm||[]).includes(i));
  if(!instr&&!files.length&&!V4.hwFiles.length){toast("Écris les consignes ou joins un fichier.","x");return}
  if(V4.hwFiles.length&&!S.assets){toast("L'envoi de fichiers n'est pas disponible ici.","x");return}
  if(btn)btn.disabled=true;
  try{for(const file of V4.hwFiles){let b=file;if(isImg(b.type))b=await shrinkImg(b,2000,.85);const up=await S.assets.upload(b,{type:b.type||"application/octet-stream"});files.push({id:up.id,name:file.name.slice(0,80),type:b.type||up.contentType||""})}
    const ed2=await saveContent("homework",{title:v("h_title"),level:v("h_level"),audience:v("h_aud")||"tous",due:v("h_due"),instructions:instr,files:files.slice(0,8),autoCorrect:!!document.getElementById("h_auto")?.checked,autoMode:S.drafts.h_amode==="draft"?"draft":"live"});
    FORM_FIELDS.hw.forEach(i=>delete S.drafts[i]);try{f.reset()}catch(e){}V4.hwFiles=[];V4.hwOldRm=[];toast(ed2?"Devoir modifié":"Devoir publié","pen")}
  catch(e){toast((e&&e.code)==="too_large"?"Fichier trop lourd.":(e&&e.code)==="unsupported_type"?"Format non accepté pour ce fichier.":"Envoi impossible pour le moment.","x")}
  if(btn)btn.disabled=false;render()}
const hwFilesBlock=h=>(h.files||[]).length?`<div class="hwfiles">${h.files.map(f=>`<button type="button" class="btn ghost sm docbtn" data-v4="doc" data-k="a" data-id="${esc(f.id)}" data-t="${esc(f.type||"")}" data-n="${esc(f.name||"document")}">${ic(isImg(f.type)?"image":/word/.test(f.type||"")?"word":"file")}${esc(f.name||"Document")}${offChip("a:"+f.id)}</button>`).join("")}</div>`:"";
{const _hv=hwView;hwView=function(){let h=_hv();const x=S.homework.find(y=>y.id===S.view?.id);if(!x)return h;const t=`<h2>${esc(x.title)}</h2>`;
  if((x.files||[]).length)h=h.replace(t,t+`<div><span class="eyebrow">Documents du devoir</span>${hwFilesBlock(x)}</div>`);
  if(x.corrigeVisible&&x.corrigePublic&&x.corrigePublic.text){const i=h.lastIndexOf("</div>");h=h.slice(0,i)+`<div class="glass card" style="border-color:#BFE3D0"><span class="eyebrow">${ic("check")} Corrigé de ta professeure</span><div class="lesson-body">${lessonHTML(x.corrigePublic.text)}</div></div>`+h.slice(i)}
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
    const r=await AI.sample.json(`Tu prépares des quiz en images pour une application d'anglais au Togo (élèves du primaire au lycée et adultes). Voici la banque d'images disponibles, au format numéro|mot anglais|type :
${bank.map((b,i)=>i+"|"+b.en+"|"+b.kind).join("\n")}
Crée 3 NOUVELLES séries thématiques de 8 questions (thèmes variés et utiles au Togo : marché, école, maison, métiers, santé, transports, émotions, météo, sport, cuisine…), différentes de : ${[...used].filter(Boolean).slice(0,30).join(", ")||"aucune"}.
Chaque question utilise UNE image de la banque (son numéro) et la réponse doit correspondre exactement à l'image. Questions variées et naturelles (What is it? / What is she doing? / Where can you buy it? / What does this person do?…).
Réponds uniquement en JSON : {"sets":[{"title":"titre court en français","level":"A1|A2|B1","items":[{"i":numéro,"q":"question en anglais","a":"bonne réponse en anglais, phrase courte","alt":["autres réponses acceptées"],"fr":"traduction française de la réponse"}]}]}`,{modelTier:"complex",cache:false});
    const sets=(Array.isArray(r?.sets)?r.sets:[]).map(s=>({id:v4uid(),title:cleanStr(s.title,60)||"Quiz en images",level:["A1","A2","B1","B2"].includes(s.level)?s.level:"A1",
      items:(Array.isArray(s.items)?s.items:[]).filter(it=>bank[+it.i]&&cleanStr(it.a)).slice(0,10).map(it=>{const b=bank[+it.i];return{emo:b.pic,kind:["noun","action","job","place"].includes(b.kind)?b.kind:"free",q:cleanStr(it.q,120),a:cleanStr(it.a,140),alt:(Array.isArray(it.alt)?it.alt:[]).map(x=>cleanStr(x,80)).filter(Boolean).slice(0,4),fr:cleanStr(it.fr,120)}})})).filter(s=>s.items.length>=4);
    if(!sets.length)throw{code:"invalid_json"};
    const keep=(V4.aipics?.sets||[]).filter(s=>!s.done).slice(-6);V4.aipics={sets:[...keep,...sets],at:Date.now()};await write(()=>S.db.doc("aipics/"+S.uid).set(V4.aipics))}
  catch(e){V4.aipErr=aiErr(e&&e.code)}V4.aipBusy=false;render()}
async function aipPublish(id,aud){const A=V4.aipics,s=(A?.sets||[]).find(x=>x.id===id);if(!s)return;s.busy=true;render();
  try{for(const it of s.items)await write(()=>S.db.collection("pictures").add({emo:it.emo,kind:it.kind,prompt:it.q,answer:it.a,alt:it.alt,fr:it.fr,level:s.level,audience:aud||"tous",set:s.title,teacherId:S.uid,createdAt:Date.now(),by:"nova"}));
    s.done=true;s.busy=false;await write(()=>S.db.doc("aipics/"+S.uid).set(A));toast(`« ${s.title} » publié : ${s.items.length} images`,"camera");aipAuto()}
  catch(e){s.busy=false;toast("Publication impossible pour le moment.","x")}render()}
function aipHTML(){if(S.mode!=="teacher"||!AI.sample||AI.disabled)return"";if(V4.aipics===undefined){aipLoad();return""}const sets=(V4.aipics?.sets||[]).filter(s=>!s.done);
  return`<div class="section"><div class="head"><div><span class="eyebrow">${ic("spark")} Préparés par Nova</span><h2>Nouveaux quiz en images</h2><p class="sub">Nova prépare chaque jour de nouvelles séries avec les images 3D de l'application. Regarde, puis publie : elles rejoignent les jeux d'images de tes élèves.</p></div><button class="btn ghost sm" data-v4="aipGen" ${V4.aipBusy?"disabled":""}>${ic("refresh")}${V4.aipBusy?"Nova prépare…":"Autres propositions"}</button></div>
  ${V4.aipBusy&&!sets.length?`<div class="glass card row" style="gap:12px"><span class="v4spin"></span>Nova prépare de nouvelles séries d'images…</div>`:""}
  ${!V4.aipBusy&&!sets.length&&V4.aipErr?`<div class="note small">${esc(V4.aipErr)}</div>`:""}
  ${sets.map(s=>`<div class="glass card" style="gap:12px"><div class="row between"><div><h3 style="margin:0">${esc(s.title)}</h3><span class="small muted">${s.items.length} images · niveau ${esc(s.level)}</span></div><div class="row" style="gap:8px"><select id="aipAud_${s.id}" aria-label="Public visé">${Object.entries(AUDIENCES).map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><button class="btn sm" data-v4="aipPub" data-id="${s.id}" ${s.busy?"disabled":""}>${ic("rocket")}${s.busy?"Publication…":"Publier"}</button><button class="iconbtn" data-v4="aipDrop" data-id="${s.id}" aria-label="Écarter cette série" title="Écarter">${ic("trash")}</button></div></div>
    <div class="aip-grid">${s.items.map(it=>`<div class="aip">${E(it.emo)}<b>${esc(it.a)}</b><span class="muted">${esc(it.q)}</span></div>`).join("")}</div></div>`).join("")}</div>`}
{const _cv=contentView0;contentView0=function(){const h=_cv(),a=aipHTML();if(!a)return h;const k=h.indexOf('<div class="section"><div><span class="eyebrow">Jeux d\'images</span>');return k>0?h.slice(0,k)+a+h.slice(k):h+a}}
{const _ev=epView;epView=function(){let h=_ev();const e=S.eps.find(x=>x.id===S.view?.id);if(S.mode==="teacher"&&e&&AI.sample&&!AI.disabled){const k=h.indexOf('<div class="row"><button class="btn ghost sm" data-a="editItem" data-k="epreuves"');if(k>0)h=h.slice(0,k)+`<div><button class="btn sm" data-v4="aiCor" data-k="epreuves" data-id="${e.id}">${ic("spark")}Nova rédige le corrigé</button> <span class="hint">PDF, Word ou image, à garder pour toi ou à publier.</span></div>`+h.slice(k)}return h}}
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
      const r=await AI.sample.json(`Choisis ${need} mots ou expressions anglais NOUVEAUX et utiles pour un apprenant au Togo : ${PROFILES[m.profile]||"élève"}${m.classe?" en "+m.classe:""}, niveau ${m.level||"A2"}. Suis le programme togolais d'anglais (APC) de sa classe et la vie quotidienne au Togo. Évite ces mots déjà vus : ${known.join(", ")||"aucun"}.
Réponds uniquement en JSON : {"words":[{"en":"mot ou expression","fr":"traduction française","ex":"phrase d'exemple courte en anglais, de son niveau","ex_fr":"traduction de l'exemple"}]}`,{modelTier:"quick",cache:false});
      add=(Array.isArray(r?.words)?r.words:[]).filter(w=>cleanStr(w.en)&&cleanStr(w.fr)).slice(0,need).map(w=>({en:cleanStr(w.en,60),fr:cleanStr(w.fr,80),ex:cleanStr(w.ex,160),exfr:cleanStr(w.ex_fr,160),added:today(),known:false}))}
    const items=[...(d.items||[]).filter(w=>!w.known||w.day===today()),...add].slice(-20);
    await write(()=>meRef().update({dailyWords:{day:today(),items}}))}catch(e){}
  V4.words=false}
function wdHTML(compact){if(!S.me||isParent(S.me)||S.mode!=="student")return"";const d=wdOf(),items=d.items||[],pend=items.filter(w=>!w.known);
  if(d.day!==today()&&AI.sample&&!AI.disabled)setTimeout(wdGen,400);if(!items.length||(compact&&!pend.length))return"";const show=compact?pend.slice(0,3):items;
  return`<div class="section"><div class="glass card" style="gap:12px;border-color:var(--sky-soft)"><div class="row between"><div class="row"><span class="ic t-cyan">${ic("spark")}</span><div><span class="eyebrow">Choisis pour toi par Nova</span><h3 style="margin:0">Mes mots du jour</h3></div></div>${pend.length?`<span class="chip warn">${pend.length} à apprendre</span>`:`<span class="chip ok">${ic("check")}Tout est appris</span>`}</div>
  ${compact?"":`<p class="muted small" style="margin:0">Chaque jour, Nova ajoute de nouveaux mots pour toi. Un mot reste ici tant que tu ne l'as pas réussi au test.</p>`}
  <div class="v4wl">${show.map(w=>`<div class="v4w${w.known?" known":""}"><button class="iconbtn" data-say="${esc(w.en)}" aria-label="Écouter ${esc(w.en)}">${ic("speaker")}</button><div><b>${esc(w.en)}</b> <span class="muted">· ${esc(w.fr)}</span>${w.ex&&!compact?`<span class="small">${esc(w.ex)}${w.exfr?` <span class="muted">(${esc(w.exfr)})</span>`:""}</span>`:""}</div>${w.known?`<span class="chip ok">${ic("check")}Appris</span>`:""}</div>`).join("")}</div>
  ${compact&&pend.length>3?`<span class="small muted">+ ${pend.length-3} autres mots</span>`:""}
  ${pend.length?`<div class="row"><button class="btn sm" data-v4="wdTest">${ic("bolt")}Tester mes mots</button>${compact?`<button class="btn ghost sm" data-a="tab" data-k="learn">Voir tout</button>`:""}</div>`:""}</div></div>`}
function wdTest(){const pend=wdPending();if(!pend.length)return;const all=(wdOf().items||[]),pool=[...all.map(w=>w.en),"house","school","market","teacher","friend","water","family","book"];
  const qs=shuffle([...pend]).slice(0,10).map(w=>{const others=shuffle(pool.filter(x=>x!==w.en)).slice(0,3),ch=shuffle([w.en,...others]);return{q:`Comment dit-on « ${w.fr} » en anglais ?`,choices:ch,answer:ch.indexOf(w.en),explain:w.ex?`${w.en} = ${w.fr}. Exemple : ${w.ex}`:`${w.en} = ${w.fr}`,say:w.en,_w:w.en}});
  S.view=null;S.run={temp:{id:"nova-words",title:"Mes mots du jour",questions:qs},quizId:"nova-words",i:0,picked:null,score:0,answers:[],wrong:[],combo:0,best:0};S.animate=true;scrollTo(0,0);try{touch("Teste ses mots du jour")}catch(e){}render()}
{const _fq=finishQuiz;finishQuiz=function(q){const r=S.run;_fq(q);try{if(r&&q&&q.id==="nova-words"&&S.me){const ok=new Set(q.questions.filter((x,i)=>!r.wrong.includes(i)&&r.answers[i]!==undefined).map(x=>x._w));
  if(ok.size){const d=wdOf(),items=(d.items||[]).map(w=>ok.has(w.en)?{...w,known:true,day:today()}:w);write(()=>meRef().update({dailyWords:{...d,items},wordsKnown:[...(S.me.wordsKnown||[]),...ok].slice(-400)}))}}}catch(e){}}}
{const _lv=learnView;learnView=function(){return wdHTML(false)+_lv()}}
{const _hm=homeView;homeView=function(){const h=_hm(),w=wdHTML(true);if(!w)return h;const i=h.indexOf('<div class="section"',10);return i>0?h.slice(0,i)+w+h.slice(i):h+w}}


/* =====================================================================
   10. Pages d'accueil après connexion (inscription, attente, accès suspendu…) :
       bouton « Retour à la connexion » pour changer de compte
   ===================================================================== */
const v4BackLogin=()=>window.__appLogout?`<div class="section v4back" style="max-width:640px;margin:0 auto 12px"><button class="back" data-v4="toLogin">${ic("left")}Retour à la connexion</button></div>`:"";
for(const n of["joinView","waitingView","blockedView","refusedView","closedView","pendingTeacherView","noAccessView"]){const f=window[n];if(typeof f!=="function")continue;
  window[n]=function(){return v4BackLogin()+f.apply(this,arguments)}}

/* =====================================================================
   11. Professeure : réinitialiser le mot de passe d'un élève (utile pour les
       comptes créés avec un numéro de téléphone, sans e-mail)
   ===================================================================== */
{const _sd=studentDetail;studentDetail=function(){const h=_sd();const s=S.students.find(x=>x.id===S.view?.id);if(!s||!window.__resetPwd||!(S.isOwner||S.isStaff))return h;
  const R=V4.pwd&&V4.pwd.id===s.id?V4.pwd:null;
  return h+`<div class="section"><div class="glass card" style="gap:10px"><div class="row"><span class="ic t-gold">${ic("lock")}</span><div><h3 style="margin:0">Mot de passe oublié ?</h3><p class="sub small" style="margin:0">Crée un mot de passe provisoire pour ${esc(String(s.name||"").split(" ")[0])}, à lui donner en main propre. Il pourra ensuite se connecter avec.</p></div></div>
  ${R&&R.pw?`<div class="note"><b>Nouveau mot de passe : <span class="mono" style="font-size:1.2rem;letter-spacing:1px">${esc(R.pw)}</span></b><br><span class="small">Donne-le uniquement à l'élève. L'ancien mot de passe ne marche plus.</span></div>`:R&&R.err?`<div class="note small">${esc(R.err)}</div>`:""}
  <div class="row">${R&&R.ask?`<button class="btn danger sm" data-v4="pwdGo" data-id="${s.id}" ${R.busy?"disabled":""}>${R.busy?"Patiente…":"Oui, réinitialiser"}</button><button class="btn ghost sm" data-v4="pwdCancel">Annuler</button>`:`<button class="btn ghost sm" data-v4="pwdAsk" data-id="${s.id}">${ic("refresh")}Réinitialiser le mot de passe</button>`}</div></div></div>`}}

/* =====================================================================
   12. Photo de profil (vraie photo de l'apprenant) + la prof peut la retirer
   ===================================================================== */
async function squareJpeg(file,size=400){const bmp=await createImageBitmap(file),m=Math.min(bmp.width,bmp.height),c=document.createElement("canvas");c.width=c.height=size;
  c.getContext("2d").drawImage(bmp,(bmp.width-m)/2,(bmp.height-m)/2,m,m,0,0,size,size);return await new Promise(r=>c.toBlob(r,"image/jpeg",.82))}
async function photoSet(file){if(!window.__avatarUpload){toast("Les photos de profil ne sont pas disponibles ici.","x");return}if(!isImg(file.type)){toast("Choisis une photo (JPG ou PNG).","x");return}
  if(!navigator.onLine){toast("Pas de réseau : réessaie quand tu es connecté.","x");return}V4.photoBusy=true;render();
  try{const b=await squareJpeg(file);const url=await window.__avatarUpload(b);await write(()=>meRef().update({photo:url}));try{await write(()=>S.db.doc("board/"+S.uid).update({photo:url}))}catch(e){}toast("Photo de profil enregistrée","camera")}
  catch(e){toast((e&&e.message)||"Envoi impossible.","x")}V4.photoBusy=false;render()}
function photoCardHTML(){const m=S.me;if(!m||!window.__avatarUpload)return"";
  return`<div class="section"><div class="glass card" style="grid-template-columns:auto 1fr;align-items:center;gap:16px"><div>${avatar(S.uid,m.name,84)}</div><div style="display:grid;gap:8px"><div><h3 style="margin:0">Ma photo de profil</h3><p class="sub small" style="margin:0">Mets une vraie photo de toi : tes camarades et ta professeure la verront. Une photo correcte et respectueuse, s'il te plaît.</p></div>
  <div class="row" style="gap:8px"><label class="btn sm" style="cursor:pointer">${ic("camera")}${V4.photoBusy?"Envoi…":m.photo?"Changer ma photo":"Ajouter ma photo"}<input type="file" id="v4photo" accept="image/*" hidden ${V4.photoBusy?"disabled":""}></label>${m.photo?`<button class="btn ghost sm" data-v4="photoRm">${ic("trash")}Retirer</button>`:""}</div>
  ${m.photo?`<span class="hint">Ta photo s'affiche à la place de ton avatar de la boutique.</span>`:""}</div></div></div>`}
{const _pv=profileView;profileView=function(){const h=_pv();const c=photoCardHTML();if(!c)return h;const i=h.indexOf('<div class="section"',10);return i>0?h.slice(0,i)+c+h.slice(i):c+h}}
{const _sd2=studentDetail;studentDetail=function(){const h=_sd2();const s=S.students.find(x=>x.id===S.view?.id);if(!s||!s.photo)return h;
  return h+`<div class="section"><div class="glass card row between"><div class="row">${avatar(s.id,s.name,56)}<div><h3 style="margin:0">Photo de profil</h3><p class="sub small" style="margin:0">Si la photo n'est pas convenable, tu peux la retirer.</p></div></div><button class="btn ghost sm" data-v4="photoRmFor" data-id="${s.id}">${ic("trash")}Retirer la photo</button></div></div>`}}
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
async function staffSend(to,text,att){const at=Date.now();
  await write(()=>S.db.collection(staffBase(to)+"/msgs").add({from:S.uid,text:text||"",at,...(att?{att}:{})}));
  const m=SC.meta[to]||{};await write(()=>S.db.doc(staffBase(to)).set({...m,members:[S.uid,to],last:{from:S.uid,text:(text||attLabel(att)).slice(0,80),at},read:{...(m.read||{}),[S.uid]:at}}))}
function staffListHTML(){const L=staffPeers();
  return`<div class="section"><div><span class="eyebrow">Entre collègues</span><h2>Professeurs</h2><p class="sub">Discute avec les autres professeurs de l'école : messages, vocaux, photos et fichiers. Les élèves et les parents n'y ont pas accès.</p></div>
  ${L.length?`<div class="glass list">${L.sort((a,b)=>((SC.meta[b.id]||{}).last?.at||0)-((SC.meta[a.id]||{}).last?.at||0)).map(d=>{const m=SC.meta[d.id]||{},l=m.last;return`<div class="thread" data-v4="staffOpen" data-id="${d.id}" tabindex="0">${avatar(d.id,d.name||"Professeur")}<div class="txt"><b>${esc(d.name||"Professeur")} <small class="muted" style="font-weight:600">· ${d.role==="principal"?"Prof principale":"Professeur"}</small></b><span>${l?esc((l.from===S.uid?"Toi : ":"")+l.text):"Aucun message"}</span></div><div class="row small muted">${l?fmtTime(l.at):""}${staffUnread(d.id)?`<span class="chip bad">Nouveau</span>`:""}</div></div>`}).join("")}</div>`:`<div class="empty">Aucun autre professeur pour l'instant. Quand la prof principale accepte un professeur (onglet Classe), il apparaît ici.</div>`}</div>`}
function staffChatView(){const id=S.view.id,d=(S.staff||[]).find(x=>x.id===id)||{},nm=d.name||"Professeur";
  return`<div class="section" style="max-width:760px;margin-inline:auto"><div><button class="back" data-v4="staffBack">${ic("left")}Professeurs</button></div><div class="row">${avatar(id,nm,48)}<div><span class="eyebrow">Entre professeurs · privé</span><h2>${esc(nm)}</h2></div></div>
  <div class="glass chat"><div class="msgs" id="chatScroll">${!SC.ready?`<div class="muted" style="margin:auto">Chargement…</div>`:SC.msgs.length?SC.msgs.map(m=>msgHTML(m.from===S.uid,m.text,m.att,m.at)).join(""):`<div class="muted" style="margin:auto;text-align:center">Aucun message pour l'instant.<br>Écris le premier message à ${esc(nm.split(" ")[0])}.</div>`}</div>
  ${v4Bar("staff",id,"Écris à ton collègue…")}</div></div>`}
{const _tabs=msgsTabsHTML;msgsTabsHTML=()=>{const h=_tabs();if(!staffOn())return h;const n=staffUnreadCount();return h.replace('</div></div>',`<button data-a="msgsTab" data-k="staff" aria-pressed="${S.msgsTab==="staff"}">Professeurs${n?` <span class="chip bad">${n}</span>`:""}</button></div></div>`)}}
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
 {id:"stk-animals",t:"Animaux de la savane",price:200,e:["1f418","1f42f","1f43c","1f43b","1f98a","1f984","1f989","1f99c","1f9a9","1f422","1f42c","1f433","1f434","1f438","1f430","1f425","1f40a","1f419"]},
 {id:"stk-food",t:"Fête et gourmandises",price:250,e:["1f370","1f36c","1f349","1f34c","1f34d","1f353","1f96d","1f965","1f35a","1f372","1f36f","1f951","1f381","1f388"]},
 {id:"stk-fun",t:"Champions et musique",price:300,e:["1f3c5","1f3af","1f3ae","1f3b8","1f3a7","1f3a8","1f3b9","1f941","1f6b2","1f3d3","1f451","1f48e","1f3a4","1f3c6"]}];
SH_PACKS.forEach(pk=>{pk.e=pk.e.filter(c=>{try{return EMO_SET.has(c)}catch(e){return false}})});
const JOKER_PRICE=80,JOKER_MAX=5,SPOT_PRICE=350,SPOT_DAYS=7;
const BOOSTS=[{id:"boost30",t:"Turbo XP ×2 · 30 min",min:30,price:250},{id:"boost60",t:"Turbo XP ×2 · 1 heure",min:60,price:400}];
const boostLeft=()=>Math.max(0,((S.me&&S.me.boostUntil)||0)-Date.now());
const spotLeft=m=>Math.max(0,((m&&m.spotUntil)||0)-Date.now());
const shCoins=()=>coinsOf(S.me);
function shSpend(price,patch,msg){const m=S.me;if(!m)return false;if(shCoins()<price){toast("Pas assez d'XP pour l'instant : continue à travailler !","x");return false}
  meWrite({spent:(m.spent||0)+price,...patch});beep("win");if(!LITE)confetti();toast(msg+` (−${price} XP)`,"bag");return true}
/* XP doublés pendant le turbo */
{const _g=gain;gain=function(xp,activity,extra,anchor){if(xp>0&&boostLeft()>0)xp=xp*2;return _g(xp,activity,extra,anchor)}}
/* coffre du jour : s'ouvre quand l'objectif du jour est atteint */
const CHEST=[{k:"joker",t:"1 joker 50/50"},{k:"xp",t:"+40 XP bonus"},{k:"freeze",t:"1 gel de série"},{k:"boost",t:"Turbo XP ×2 pendant 15 min"}];
const chestToday=()=>CHEST[(Math.floor(Date.now()/864e5))%CHEST.length];
const chestReady=()=>{const m=S.me;return!!m&&m.lastDay===today()&&(m.dayXp||0)>=DAILY_GOAL&&m.chestDay!==today()};
function chestOpen(){const m=S.me;if(!chestReady())return;const r=chestToday();let k=r.k;if(k==="freeze"&&(m.freezes||0)>=FREEZE_MAX)k="xp";
  if(k==="xp"){meWrite({chestDay:today()});gain(40,"A ouvert le coffre du jour")}
  else if(k==="joker")meWrite({chestDay:today(),jokers:Math.min(JOKER_MAX,(m.jokers||0)+1)});
  else if(k==="freeze")meWrite({chestDay:today(),freezes:(m.freezes||0)+1});
  else meWrite({chestDay:today(),boostUntil:Math.max(Date.now(),m.boostUntil||0)+15*60000});
  beep("win");if(!LITE)confetti();celebrate&&setTimeout(()=>{try{celebrate("Coffre du jour",(CHEST.find(x=>x.k===k)||r).t+" ! Reviens demain pour un nouveau coffre.","gift")}catch(e){toast("Coffre ouvert : "+(CHEST.find(x=>x.k===k)||r).t,"gift")}},300)}
function chestHTML(compact){const m=S.me;if(!m||isParent(m))return"";const done=m.chestDay===today(),ready=chestReady(),dx=m.lastDay===today()?(m.dayXp||0):0,r=chestToday();
  if(compact&&!ready)return"";
  return`<div class="section"><div class="glass card shx-chest ${ready?"ready":""}"><span class="shx-chest-ic" aria-hidden="true">${E("🎁")}</span><div style="display:grid;gap:4px;min-width:0"><span class="eyebrow">Coffre du jour · gratuit</span><h3 style="margin:0">${done?"Coffre ouvert ! Reviens demain":ready?"Ton coffre est prêt !":"Gagne "+DAILY_GOAL+" XP aujourd'hui pour l'ouvrir"}</h3><span class="small muted">Aujourd'hui : ${esc(r.t)}</span>${!done&&!ready?`<div class="bar" style="max-width:260px"><i style="width:${Math.min(100,Math.round(dx/DAILY_GOAL*100))}%"></i></div><span class="small muted">${dx} / ${DAILY_GOAL} XP</span>`:""}</div>${ready?`<button class="btn" data-v4="chest">${ic("gift")}Ouvrir</button>`:done?`<span class="chip ok">${ic("check")}Ouvert</span>`:""}</div></div>`}
function shopExtraHTML(){const m=S.me,c=shCoins(),own=m.owned||{},bl=boostLeft(),jk=m.jokers||0,sp=spotLeft(m);
  const nextLock=Object.entries(SH_LOCK).filter(([id,x])=>(m.xp||0)<x).sort((a,b)=>a[1]-b[1])[0],nl=nextLock&&shopItem(nextLock[0]);
  return`${chestHTML(false)}
  ${nl?`<div class="section"><div class="glass card row" style="gap:14px;flex-wrap:nowrap"><span class="shop-ava" style="flex:none">${avaHTML(nl.v)}</span><div style="display:grid;gap:6px;flex:1;min-width:0"><span class="eyebrow">Prochain avatar légendaire</span><b>${esc(nl.label)} · se débloque à ${nextLock[1]} XP gagnés</b><div class="bar"><i style="width:${Math.min(100,Math.round((m.xp||0)/nextLock[1]*100))}%"></i></div><span class="small muted">Encore ${nextLock[1]-(m.xp||0)} XP : chaque leçon, quiz ou devoir te rapproche !</span></div></div></div>`:""}
  <div class="section"><div><span class="eyebrow">Pour aller plus vite</span><h2>Bonus de travail</h2><p class="sub">Des coups de pouce qui récompensent ceux qui travaillent.</p></div><div class="shx-grid">
   ${BOOSTS.map(b=>`<div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("🚀")}</span><b>${b.t}</b><span class="small muted">Tous les XP gagnés comptent double pendant ${b.min} minutes. Idéal avant de réviser !</span>${bl?`<span class="chip ok">${ic("bolt")}Actif · encore ${Math.ceil(bl/60000)} min</span>`:`<button class="btn sm" data-v4="buyBoost" data-k="${b.id}" ${c<b.price?"disabled":""}>${ic("bolt")}${b.price}</button>`}</div>`).join("")}
   <div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("🃏")}</span><b>Joker 50/50</b><span class="small muted">Dans un quiz, il retire deux mauvaises réponses. Tu en as <b>${jk}</b> / ${JOKER_MAX}.</span>${jk>=JOKER_MAX?`<span class="chip">Maximum atteint</span>`:`<button class="btn sm" data-v4="buyJoker" ${c<JOKER_PRICE?"disabled":""}>${ic("bolt")}${JOKER_PRICE}</button>`}</div>
   <div class="glass card shx"><span class="shx-ic" aria-hidden="true">${E("👑")}</span><b>En vedette au classement</b><span class="small muted">Ton nom brille en or avec une couronne dans le classement de la classe pendant ${SPOT_DAYS} jours.</span>${sp?`<span class="chip ok">${ic("check")}Actif · ${Math.ceil(sp/864e5)} j</span>`:`<button class="btn sm" data-v4="buySpot" ${c<SPOT_PRICE?"disabled":""}>${ic("bolt")}${SPOT_PRICE}</button>`}</div>
  </div></div>
  <div class="section"><div><span class="eyebrow">Pour les messageries</span><h2>Packs de stickers 3D</h2><p class="sub">Débloque de nouveaux stickers à envoyer à tes camarades et à ta professeure.</p></div><div class="shx-grid">
   ${SH_PACKS.map(pk=>`<div class="glass card shx"><div class="shx-stk">${pk.e.slice(0,6).map(c=>`<img src="img/${c}.webp" alt="" loading="lazy">`).join("")}</div><b>${esc(pk.t)}</b><span class="small muted">${pk.e.length} stickers</span>${own[pk.id]?`<span class="chip ok">${ic("check")}Débloqué</span>`:`<button class="btn sm" data-v4="buyPack" data-id="${pk.id}" ${c<pk.price?"disabled":""}>${ic("bolt")}${pk.price}</button>`}</div>`).join("")}
  </div></div>`}
{const _sv=shopView;shopView=function(){let h=_sv();const m=S.me;if(!m)return h;
  // avatars légendaires : verrouillés tant que l'XP gagné n'est pas suffisant
  for(const[id,need]of Object.entries(SH_LOCK)){if((m.xp||0)>=need||(m.owned||{})[id])continue;
    h=h.replace(new RegExp(`<button class="btn sm" data-a="buy" data-id="${id}"[^>]*>[\\s\\S]*?</button>`),`<span class="chip">${ic("lock")}${need} XP gagnés</span>`)}
  const k=h.indexOf('<div class="section"><div><span class="eyebrow">Dans la vraie vie</span>');const x=shopExtraHTML();return k>0?h.slice(0,k)+x+h.slice(k):h+x}}
/* jokers dans les quiz */
{const _qr=quizRunView;quizRunView=function(){let h=_qr();const r=S.run,q=curQuiz&&curQuiz();if(!r||!q||S.mode!=="student"||!S.me)return h;const cur=(q.questions||[])[r.i];
  if(!cur||!Array.isArray(cur.choices)||cur.type==="type")return h;const hid=(r.fifty||{})[r.i];
  if(hid)for(const i of hid)h=h.replace(`data-a="pick" data-i="${i}" `,`data-a="pick" data-i="${i}" disabled style="opacity:.18;pointer-events:none" `);
  if(r.picked==null&&!r.exam&&!hid&&cur.choices.length>=3&&(S.me.jokers||0)>0)h=h.replace('<div class="choices">',`<div><button class="btn ghost sm" data-v4="joker">${E("🃏")} Joker 50/50 · ${S.me.jokers} restant${S.me.jokers>1?"s":""}</button></div><div class="choices">`);
  return h}}
/* classement : élèves en vedette */
leaderboardHTML=function(rows,meId){let h=leaderboardHTML0(rows,meId);const now=Date.now();
  const spot=id=>{const p=(S.board||[]).find(x=>x.id===id)||(typeof personOf==="function"?personOf(id):null);return p&&(p.spotUntil||0)>now};
  rows=[...rows].sort((a,b)=>(b.xp||0)-(a.xp||0)).slice(0,20);const parts=h.split('<div class="it ');
  return parts.map((seg,i)=>i===0?seg:(rows[i-1]&&spot(rows[i-1].id)?'<div class="it lb-spot '+seg.replace("</b>",` <span class="lb-crown">${E("👑")}</span></b>`):'<div class="it '+seg)).join("")};
/* idées de récompenses pour la prof */
const RW_IDEAS=[["Choisir sa place pendant une semaine",500],["+1 point à la prochaine interrogation",800],["Choisir la chanson d'anglais du vendredi",300],["Être le « teacher assistant » d'un cours",600],["Sortir 5 minutes plus tôt en récréation",700],["Un devoir en moins (au choix)",1200],["Certificat « English Star » remis devant la classe",1000],["Lire son texte en anglais devant la classe",250]];
{const _rh=rewardsHTML;rewardsHTML=function(){const h=_rh();const k=h.indexOf('<p class="hint" style="margin:0">Idées');const ideas=`<div style="display:grid;gap:6px"><span class="small muted">Idées en un clic :</span><div class="row" style="gap:6px;flex-wrap:wrap">${RW_IDEAS.map(([t,c],i)=>`<button type="button" class="chip" data-v4="rwIdea" data-i="${i}" style="cursor:pointer">${esc(t)} · ${c} XP</button>`).join("")}</div></div>`;
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
   9. Événements
   ===================================================================== */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const a=el.dataset.v4;e.preventDefault();e.stopPropagation();
  switch(a){
  case"doc":openDoc({k:el.dataset.k,id:el.dataset.id,t:el.dataset.t},el.dataset.n||"document");return;
  case"docClose":closeDoc();return;case"docSave":docSave();return;
  case"docZoom":if(V4.pdf){V4.pdf.zoom=Math.max(.6,Math.min(3,V4.pdf.zoom*(+el.dataset.k>0?1.35:1/1.35)));drawPdf()}return;
  case"keepOff":{const it={k:"a",id:el.dataset.id,t:el.dataset.t};el.disabled=true;srcBlob(it).then(()=>{toast("Disponible hors ligne sur cet appareil","check");render()}).catch(()=>{el.disabled=false;toast("Téléchargement impossible pour le moment.","x")});return}
  case"panel":{const k=el.dataset.k,t=el.dataset.t;V4.panel=V4.panel&&V4.panel.kind===k&&V4.panel.t===t&&!el.closest(".v4panel")?null:{kind:k,t,target:v4Target(k)};render();return}
  case"panelClose":V4.panel=null;render();return;
  case"emo":{const id=V4IN(el.dataset.k),inp=document.getElementById(id),cur=(inp?inp.value:S.drafts[id])||"";S.drafts[id]=(cur+el.dataset.e).slice(0,1000);render();return}
  case"stk":{const k=el.dataset.k,t=v4Target(k)||(V4.panel&&V4.panel.target);V4.panel=null;render();if(!t)return;if(!navigator.onLine){toast("Pas de réseau : réessaie quand tu es connecté.","x");return}
    v4Deliver(k,t,"",{k:"sticker",e:el.dataset.e}).catch(err=>toast((err&&err.message)||"Envoi impossible","x"));return}
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
  case"photoRm":write(()=>meRef().update({photo:""})).then(()=>{try{S.db.doc("board/"+S.uid).update({photo:""}).catch(()=>{})}catch(e){}toast("Photo retirée","trash")});return;
  case"photoRmFor":write(()=>S.db.doc("students/"+el.dataset.id).update({photo:""})).then(()=>{try{S.db.doc("board/"+el.dataset.id).update({photo:""}).catch(()=>{})}catch(e){}toast("Photo retirée","trash")});return;
  case"staffOpen":staffOpen(el.dataset.id);return;
  case"staffBack":SC.unsub?.();SC.unsub=null;SC.with=null;S.view=null;S.tab="msgs";S.msgsTab="staff";S.animate=true;render();return;
  case"iosGuide":window.__iosGuide&&window.__iosGuide();return;
  case"chest":chestOpen();return;
  case"buyBoost":{const b=BOOSTS.find(x=>x.id===el.dataset.k);if(!b||boostLeft()>0)return;shSpend(b.price,{boostUntil:Date.now()+b.min*60000},"Turbo activé : XP ×2 pendant "+b.min+" min");return}
  case"buyJoker":{const n=S.me.jokers||0;if(n>=JOKER_MAX)return;shSpend(JOKER_PRICE,{jokers:n+1},"Joker 50/50 ajouté");return}
  case"buySpot":if(spotLeft(S.me))return;if(shSpend(SPOT_PRICE,{spotUntil:Date.now()+SPOT_DAYS*864e5},"Tu es en vedette au classement pour "+SPOT_DAYS+" jours")){try{S.db.doc("board/"+S.uid).update({spotUntil:Date.now()+SPOT_DAYS*864e5}).catch(()=>{})}catch(e){}}return;
  case"buyPack":{const pk=SH_PACKS.find(x=>x.id===el.dataset.id);if(!pk||(S.me.owned||{})[pk.id])return;shSpend(pk.price,{owned:{...(S.me.owned||{}),[pk.id]:Date.now()}},"Pack « "+pk.t+" » débloqué");return}
  case"packInfo":toast("Débloque ce pack dans la boutique des XP (bouton XP en haut).","gift");return;
  case"joker":{const r=S.run,q=curQuiz();if(!r||!q||(S.me.jokers||0)<1)return;const cur=q.questions[r.i];const wrong=shuffle(cur.choices.map((_,i)=>i).filter(i=>i!==cur.answer)).slice(0,Math.min(2,cur.choices.length-2));
    r.fifty=r.fifty||{};r.fifty[r.i]=wrong;meWrite({jokers:(S.me.jokers||0)-1});beep("ok");render();return}
  case"rwIdea":{const it=RW_IDEAS[+el.dataset.i];if(!it)return;S.drafts.rw_title=it[0];S.drafts.rw_cost=String(it[1]);render();return}
  case"toLogin":{el.disabled=true;Promise.resolve(window.__appLogout&&window.__appLogout()).catch(()=>location.reload());return}
  }},true);
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest('[data-a="v4msgMore"]');if(el){e.stopPropagation();S.v4msgLim=(S.v4msgLim||40)+40;render()}},true);
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("[data-v4][tabindex]")){e.preventDefault();e.target.click()}});
document.addEventListener("change",e=>{const el=e.target;if(!el||!el.id)return;
  if(el.id.startsWith("v4f_")){const kind=el.id.slice(4),file=el.files&&el.files[0],t=el.closest("form")?.dataset.s;el.value="";if(file&&t)v4SendFile(kind,t,file,file.name);e.stopPropagation();return}
  if(el.id==="v4hwf"){const fl=[...(el.files||[])];el.value="";for(const f of fl){if(V4.hwFiles.length>=5){toast("5 fichiers maximum.","x");break}if(f.size>20*1024*1024){toast(f.name+" : trop lourd (20 Mo maximum).","x");continue}V4.hwFiles.push(f)}render();e.stopPropagation()}},true);
document.addEventListener("input",e=>{const el=e.target;if(el&&el.id==="fq_msgs"){S.drafts.fq_msgs=el.value;S.v4msgLim=40;render()}});
document.addEventListener("submit",e=>{const f=e.target;if(!f||!f.dataset)return;
  if(f.dataset.f==="hw"){e.preventDefault();e.stopImmediatePropagation();hwSubmit(f)}
  if(f.dataset.f==="staffchat"){e.preventDefault();e.stopImmediatePropagation();const inp=document.getElementById("staffInput"),text=(inp&&inp.value||"").trim();if(!text)return;if(inp)inp.value="";delete S.drafts.staffInput;staffSend(f.dataset.s,text,null).catch(()=>{})}},true);
