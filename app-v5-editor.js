/* =====================================================================
   v5 editor: before a photo or video is posted, you can crop and turn a
   photo, and cut the start and end of a video. The result replaces the
   file you picked, so the posting goes on exactly as before.
   ===================================================================== */
const ED5={open:false,file:null,kind:"img",img:null,url:null,rot:0,zoom:1,dx:0,dy:0,aspect:0,boxW:300,boxH:300,vid:null,dur:0,s:0,e:0,target:null,bypass:false,busy:false};
const ED5_ASPECTS=[[0,"Original"],[1,"Square"],[0.8,"4:5"],[9/16,"Story"],[16/9,"Wide"]];

/* ---- CSS ---- */
{const st=document.createElement("style");st.id="edt5css";st.textContent=`
.edt5{position:fixed;inset:0;z-index:9700;background:radial-gradient(120% 80% at 50% 0%,#1B1F4A,#05060F 70%);color:#fff;display:flex;flex-direction:column;padding:12px;box-sizing:border-box;gap:12px;overflow:auto}
.edt5[hidden]{display:none!important}
.edt5-top{display:flex;align-items:center;gap:10px}
.edt5-top b{flex:1;font-size:1.05rem}
.edt5-btn{border:0;border-radius:999px;padding:10px 16px;font:inherit;font-weight:700;color:#fff;background:rgba(255,255,255,.14);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.edt5-btn.go{background:linear-gradient(120deg,#5EEAD4,#818CF8);color:#06201C;box-shadow:0 10px 20px -10px rgba(94,234,212,.7)}
.edt5-btn.on{background:#fff;color:#111}
.edt5-btn:disabled{opacity:.5}
.edt5-btn svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.edt5-stage{display:grid;place-items:center;min-height:0}
.edt5-box{position:relative;border-radius:22px;overflow:hidden;background:#000;box-shadow:0 30px 60px -25px rgba(0,0,0,.8);touch-action:none;cursor:grab}
.edt5-box canvas,.edt5-box video{display:block;width:100%;height:100%}
.edt5-grid{position:absolute;inset:0;pointer-events:none;border:2px solid rgba(255,255,255,.85);border-radius:22px;box-shadow:0 0 0 999px rgba(0,0,0,.35) inset}
.edt5-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.edt5-panel{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px;display:grid;gap:10px}
.edt5-panel label{display:grid;gap:4px;font-size:.86rem;opacity:.95}
.edt5-panel input[type=range]{width:100%;accent-color:#5EEAD4}
.edt5-hint{font-size:.82rem;opacity:.75;margin:0;text-align:center}
.edt5-busy{position:fixed;inset:0;z-index:9750;background:rgba(3,4,12,.9);display:grid;place-items:center;color:#fff;text-align:center;padding:24px}
.edt5-busy[hidden]{display:none!important}
.edt5-busy .bar{width:min(260px,70vw);height:8px;border-radius:999px;background:rgba(255,255,255,.15);overflow:hidden;margin:14px auto 0}
.edt5-busy .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#5EEAD4,#818CF8);transition:width .2s}
`;document.head.appendChild(st)}
ICONS.rotate=ICONS.rotate||'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>';
ICONS.crop=ICONS.crop||'<path d="M6 2v16h16M2 6h16v16"/>';
ICONS.scissors=ICONS.scissors||'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.8 14.8 20 20M8.1 8.1 12 12"/>';

/* ---- hook: a photo or video picked for a story or a post opens the editor first ---- */
window.addEventListener("change",e=>{
  if(ED5.bypass)return;
  const el=e.target;if(!el||(el.id!=="fsc_file"&&el.id!=="f_files"))return;
  const files=el.files?[...el.files]:[];if(files.length!==1)return;
  const f=files[0];const isImg=/^image\//.test(f.type||""),isVid=/^video\//.test(f.type||"");
  if(!isImg&&!isVid)return;
  e.stopImmediatePropagation();e.stopPropagation();
  ed5Open(f,isVid?"video":"image",el.id);
},true);

/* ---- open / close ---- */
function ed5Host(){let h=document.getElementById("edt5");if(!h){h=document.createElement("div");h.id="edt5";h.className="edt5";h.hidden=true;document.body.appendChild(h)}return h}
function ed5Busy(on,msg,pct){let b=document.getElementById("edt5busy");if(!b){b=document.createElement("div");b.id="edt5busy";b.className="edt5-busy";b.hidden=true;document.body.appendChild(b)}
  if(on){b.innerHTML=`<div><b>${msg||"Working…"}</b><div class="bar"><i style="width:${Math.round((pct||0)*100)}%"></i></div>${ED5.cutting?`<button type="button" class="edt5-btn" data-edcancel="1" style="margin-top:18px">Cancel</button>`:""}</div>`;b.hidden=false}else b.hidden=true}
function ed5Open(file,kind,targetId){
  ED5.open=true;ED5.file=file;ED5.kind=kind;ED5.target=targetId;ED5.rot=0;ED5.zoom=1;ED5.dx=0;ED5.dy=0;ED5.aspect=0;ED5.busy=false;
  if(kind==="image"){
    ED5.url=URL.createObjectURL(file);const im=new Image();im.onload=()=>{ED5.img=im;ed5ImgSync()};im.onerror=()=>ed5Deliver(file);im.src=ED5.url;
  }else{
    ED5.url=URL.createObjectURL(file);
  }
  ed5Render();
}
function ed5Close(deliverOriginal){
  const h=document.getElementById("edt5");if(h)h.hidden=true;
  if(!deliverOriginal)ED5.cb=null;
  if(ED5.vid){try{ED5.vid.pause()}catch(e){}ED5.vid=null}
  if(ED5.url){try{URL.revokeObjectURL(ED5.url)}catch(e){}}
  const f=ED5.file;ED5.open=false;ED5.file=null;ED5.img=null;ED5.url=null;
  if(deliverOriginal&&f)ed5Deliver(f);
}
function ed5Deliver(file){
  const h=document.getElementById("edt5");if(h)h.hidden=true;
  ED5.open=false;
  // a caller that is not an input (the chat preview) takes the result itself
  if(ED5.cb){const cb=ED5.cb;ED5.cb=null;if(file)cb(file);return}
  const el=document.getElementById(ED5.target||"");
  if(!el||!file)return;
  const dt=new DataTransfer();dt.items.add(file);
  el.files=dt.files;
  ED5.bypass=true;try{el.dispatchEvent(new Event("change",{bubbles:true}))}finally{ED5.bypass=false}
}

/* ---- photo: crop box, turn and zoom ---- */
function ed5BoxSize(){
  const maxW=Math.min(window.innerWidth-24,420),maxH=Math.min(window.innerHeight*0.56,520);
  let a=ED5.aspect;
  if(!a&&ED5.img)a=(ED5.rot%180?ED5.img.height/ED5.img.width:ED5.img.width/ED5.img.height);
  if(!a)a=1;
  let w=maxW,h=w/a;if(h>maxH){h=maxH;w=h*a}
  ED5.boxW=Math.round(w);ED5.boxH=Math.round(h);
}
function ed5Paint(ctx,W,H,f){
  /* draws the photo in a W×H box; f = W / box width on screen */
  const im=ED5.img;if(!im)return;
  const rw=ED5.rot%180?im.height:im.width,rh=ED5.rot%180?im.width:im.height;
  const base=Math.max(W/rw,H/rh),sc=base*ED5.zoom;
  const dw=im.width*sc,dh=im.height*sc;
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2+ED5.dx*f,H/2+ED5.dy*f);ctx.rotate(ED5.rot*Math.PI/180);
  ctx.drawImage(im,-dw/2,-dh/2,dw,dh);ctx.restore();
}
function ed5Clamp(){
  const im=ED5.img;if(!im)return;
  const rw=ED5.rot%180?im.height:im.width,rh=ED5.rot%180?im.width:im.height;
  const sc=Math.max(ED5.boxW/rw,ED5.boxH/rh)*ED5.zoom;
  const mx=Math.max(0,(rw*sc-ED5.boxW)/2),my=Math.max(0,(rh*sc-ED5.boxH)/2);
  ED5.dx=Math.max(-mx,Math.min(mx,ED5.dx));ED5.dy=Math.max(-my,Math.min(my,ED5.dy));
}
function ed5ImgSync(){
  const c=document.getElementById("edt5cv");if(!c||!ED5.img)return;
  ed5BoxSize();ed5Clamp();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  c.style.width=ED5.boxW+"px";c.style.height=ED5.boxH+"px";
  c.width=Math.round(ED5.boxW*dpr);c.height=Math.round(ED5.boxH*dpr);
  const ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  ed5Paint(ctx,ED5.boxW,ED5.boxH,1);
}
/* the edited photo, as a JPEG at most 1400 px wide */
function ed5PhotoBlob(){
  const W=Math.min(1400,Math.max(ED5.boxW,800)),k=W/ED5.boxW,H=Math.round(ED5.boxH*k);
  const c=document.createElement("canvas");c.width=W;c.height=H;
  ed5Paint(c.getContext("2d"),W,H,k);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("photo")),"image/jpeg",0.9));
}
function ed5Bind(host){
  const c=document.getElementById("edt5cv");
  if(c&&!c._b){c._b=true;
    let drag=null;
    c.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,dx:ED5.dx,dy:ED5.dy};c.setPointerCapture(e.pointerId)});
    c.addEventListener("pointermove",e=>{if(!drag)return;ED5.dx=drag.dx+(e.clientX-drag.x);ED5.dy=drag.dy+(e.clientY-drag.y);ed5ImgSync()});
    const up=()=>{drag=null};c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
  }
  const z=document.getElementById("edt5z");if(z&&!z._b){z._b=true;z.addEventListener("input",()=>{ED5.zoom=+z.value;ed5ImgSync()})}
  const v=document.getElementById("edt5s"),w=document.getElementById("edt5e");
  if(v&&!v._b){v._b=true;v.addEventListener("input",()=>{ED5.s=Math.min(+v.value,ED5.e-0.5);v.value=ED5.s;ed5VidSync()})}
  if(w&&!w._b){w._b=true;w.addEventListener("input",()=>{ED5.e=Math.max(+w.value,ED5.s+0.5);w.value=ED5.e;ed5VidSync()})}
}

/* ---- video: keep only the part you choose (cut in real time, so it takes as long as the part) ---- */
function ed5VidSync(){
  const sl=document.getElementById("edt5lab");
  if(sl)sl.textContent=`From ${ed5Fmt(ED5.s)} to ${ed5Fmt(ED5.e)} · keeps ${Math.max(0,ED5.e-ED5.s).toFixed(1)} s`;
  const v=ED5.vid;if(v&&!v.paused)return;
}
const ed5Fmt=s=>{s=Math.max(0,+s||0);return Math.floor(s/60)+":"+(s%60).toFixed(1).padStart(4,"0")};
function ed5Preview(){
  const v=ED5.vid;if(!v)return;
  v.muted=false;v.volume=1;v.currentTime=ED5.s;v.play().catch(()=>{});
  clearInterval(ED5.pvT);ED5.pvT=setInterval(()=>{if(v.currentTime>=ED5.e-0.05){v.pause();clearInterval(ED5.pvT)}},50);
}
async function ed5Cut(f,s,e,onp){
  const v=document.createElement("video");v.playsInline=true;v.src=URL.createObjectURL(f);
  await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(new Error("video"))});
  const cap=v.captureStream||v.mozCaptureStream;if(!cap||!window.MediaRecorder)throw new Error("nocap");
  if(s>0.05){v.currentTime=s;await new Promise(r=>{v.onseeked=r;setTimeout(r,1500)});}
  const stream=cap.call(v);
  const types=["video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||"";
  const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);const parts=[];
  rec.ondataavailable=ev=>{if(ev.data&&ev.data.size)parts.push(ev.data)};
  const stopped=new Promise(r=>{rec.onstop=r});
  rec.start(500);await v.play().catch(()=>{});
  const t0=Date.now(),span=Math.max(0.5,e-s);
  await new Promise(res=>{const iv=setInterval(()=>{
    onp&&onp(Math.min(1,(v.currentTime-s)/span));
    if(ED5.cancelCut||v.currentTime>=e-0.05||v.ended||Date.now()-t0>span*1000+4000){clearInterval(iv);res()}},150)});
  v.pause();rec.stop();await stopped;
  try{URL.revokeObjectURL(v.src)}catch(x){}
  if(ED5.cancelCut)throw new Error("cancel");
  const type=(rec.mimeType||mime||"video/webm").split(";")[0];
  return new File(parts,"cut-"+Date.now()+(type.includes("mp4")?".mp4":".webm"),{type});
}

/* ---- the editor screen ---- */
function ed5Render(){
  const h=ed5Host();h.hidden=false;
  if(ED5.kind==="image"){
    h.innerHTML=`<div class="edt5-top"><button type="button" class="edt5-btn" data-ed="x">Use as is</button><b>Edit photo</b><button type="button" class="edt5-btn go" data-ed="ok">Done</button></div>
      <div class="edt5-stage"><div class="edt5-box" style="width:${ED5.boxW||300}px;height:${ED5.boxH||300}px"><canvas id="edt5cv"></canvas><div class="edt5-grid"></div></div></div>
      <div class="edt5-row">${ED5_ASPECTS.map(([a,l])=>`<button type="button" class="edt5-btn ${ED5.aspect===a?"on":""}" data-ed="asp" data-a="${a}">${l}</button>`).join("")}<button type="button" class="edt5-btn" data-ed="rot">${ic("rotate")}Turn</button></div>
      <div class="edt5-panel"><label>Zoom<input id="edt5z" type="range" min="1" max="3" step="0.02" value="${ED5.zoom}"></label><p class="edt5-hint">Drag the photo to place it inside the frame.</p></div>`;
    ed5Bind(h);ed5ImgSync();return;
  }
  h.innerHTML=`<div class="edt5-top"><button type="button" class="edt5-btn" data-ed="x">Use as is</button><b>Cut video</b><button type="button" class="edt5-btn go" data-ed="ok">Done</button></div>
    <div class="edt5-stage"><div class="edt5-box" style="width:${Math.min(window.innerWidth-24,420)}px;max-height:52vh;aspect-ratio:9/16"><video id="edt5vid" muted playsinline></video></div></div>
    <div class="edt5-panel"><span id="edt5lab" class="edt5-hint"></span>
      <label>Start<input id="edt5s" type="range" min="0" max="1" step="0.1" value="0"></label>
      <label>End<input id="edt5e" type="range" min="0" max="1" step="0.1" value="1"></label>
      <div class="edt5-row"><button type="button" class="edt5-btn" data-ed="play">${ic("speaker")}Play the part</button></div>
      <p class="edt5-hint">The part you keep is recorded again, so it takes as long as the part.</p></div>`;
  ed5Bind(h);
  const v=document.getElementById("edt5vid");if(!v)return;
  ED5.vid=v;v.src=ED5.url;
  v.onloadedmetadata=()=>{
    let d=v.duration;
    if(!isFinite(d)||d<=0){v.currentTime=1e8;v.ontimeupdate=()=>{v.ontimeupdate=null;v.currentTime=0;d=v.duration;ed5SetDur(isFinite(d)&&d>0?d:0)}}
    else ed5SetDur(d);
  };
}
function ed5SetDur(d){
  ED5.dur=d;ED5.s=0;ED5.e=d;
  const s=document.getElementById("edt5s"),e=document.getElementById("edt5e");
  if(s){s.max=d;s.value=0}if(e){e.max=d;e.value=d}
  if(!d){const l=document.getElementById("edt5lab");if(l)l.textContent="This video cannot be cut here. It will be posted as it is.";return}
  ed5VidSync();
}

/* ---- cancel while the video is being cut: stop, and leave without adding anything ---- */
function ed5CancelCut(){if(!ED5.cutting)return false;ED5.cancelCut=true;ED5.cutting=false;ed5Busy(false);return true}
document.addEventListener("click",e=>{
  const c=e.target.closest&&e.target.closest("[data-edcancel]");if(!c)return;
  e.preventDefault();e.stopPropagation();ed5CancelCut();
},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")ed5CancelCut()});
window.ed5CancelCut=ed5CancelCut;

/* ---- buttons ---- */
document.addEventListener("click",async e=>{
  const b=e.target.closest&&e.target.closest("[data-ed]");if(!b||!ED5.open)return;
  e.preventDefault();e.stopPropagation();
  const a=b.dataset.ed;
  if(a==="x"){ed5Close(true);return}
  if(a==="asp"){ED5.aspect=+b.dataset.a;ED5.dx=0;ED5.dy=0;ed5Render();return}
  if(a==="rot"){ED5.rot=(ED5.rot+90)%360;ED5.dx=0;ED5.dy=0;ed5Render();return}
  if(a==="play"){ed5Preview();return}
  if(a==="ok"){
    if(ED5.busy)return;ED5.busy=true;
    try{
      if(ED5.kind==="image"){
        if(!ED5.img){ed5Close(true);return}
        const blob=await ed5PhotoBlob();
        const base=(ED5.file.name||"photo").replace(/\.[^.]+$/,"");
        const out=new File([blob],base+".jpg",{type:"image/jpeg"});
        ed5Deliver(out);
      }else{
        const full=ED5.dur>0&&(ED5.s>0.1||ED5.e<ED5.dur-0.1);
        if(!full||!window.MediaRecorder){ed5Deliver(ED5.file);return}
        const h=document.getElementById("edt5");if(h)h.hidden=true;
        ED5.cancelCut=false;ED5.cutting=true;
        ed5Busy(true,"Cutting the video…",0);
        const f=ED5.file,s=ED5.s,en=ED5.e;
        try{const out=await ed5Cut(f,s,en,p=>{if(!ED5.cancelCut)ed5Busy(true,"Cutting the video…",p)});ED5.cutting=false;ed5Busy(false);ed5Deliver(out)}
        catch(err){ED5.cutting=false;ed5Busy(false);
          if(ED5.cancelCut){ED5.cancelCut=false;ed5Close(false);return}
          toast("The video could not be cut here. It will be posted as it is.","mute");ed5Deliver(f)}
      }
    }catch(err){toast("The photo could not be edited. It will be posted as it is.","mute");ed5Deliver(ED5.file)}
    finally{ED5.busy=false}
  }
},true);

/* ---- videos recorded in the app (and cut ones) have no length written in the file: find it, so they are not wrongly refused ---- */
fVideoCheck=function(f,maxSec){return new Promise(res=>{
  if(f.size>50*1024*1024){toast("Video too big: 50 MB maximum. Record a shorter video or a lower quality.","x");res(null);return}
  const v=document.createElement("video"),u=URL.createObjectURL(f);v.preload="metadata";v.muted=true;
  let fin=false;
  const done=r=>{if(fin)return;fin=true;try{URL.revokeObjectURL(u)}catch(e){}res(r)};
  const check=d=>{if(d>maxSec+0.5){toast(`Video too long: ${maxSec>=120?Math.round(maxSec/60)+" minutes":maxSec+" seconds"} maximum.`,"x");done(null)}else done({d:Math.round(d)||0})};
  v.onloadedmetadata=()=>{
    if(isFinite(v.duration)&&v.duration>0){check(v.duration);return}
    v.ondurationchange=()=>{if(isFinite(v.duration)&&v.duration>0){v.ondurationchange=null;v.currentTime=0;check(v.duration)}};
    try{v.currentTime=1e101}catch(e){done({d:0})}
  };
  v.onerror=()=>done({d:0});setTimeout(()=>done({d:0}),8000);v.src=u})};
