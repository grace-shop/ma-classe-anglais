/* =====================================================================
   v5 · video cut, Snap style: a timeline with thumbnails, a window you
   drag by its edges (or by the middle), and a moving playhead.
   The window keeps at most 60 seconds. It uses the same ED5.s / ED5.e
   values as before, so the posting part does not change.
   (Loads after app-v5-editor.js, so it replaces the video screen only.)
   ===================================================================== */
{const st=document.createElement("style");st.id="tlcss";st.textContent=`
.tl-card{display:grid;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:12px}
.tl-head{display:flex;align-items:center;gap:10px;color:#fff}
.tl-head b{font-size:.92rem;font-variant-numeric:tabular-nums}
.tl-head span{flex:1;font-size:.84rem;opacity:.85;font-variant-numeric:tabular-nums}
.tl{position:relative;height:66px;border-radius:14px;overflow:hidden;background:#0B0D22;touch-action:none;user-select:none;-webkit-user-select:none}
.tl-thumbs{position:absolute;inset:0;display:flex;gap:1px}
.tl-th{flex:1 1 0;min-width:0;height:100%;object-fit:cover;opacity:.9}
.tl-dim{position:absolute;top:0;bottom:0;background:rgba(3,4,14,.72);pointer-events:none}
.tl-win{position:absolute;top:0;bottom:0;border-top:3px solid #5EEAD4;border-bottom:3px solid #5EEAD4;border-radius:6px;box-shadow:0 0 0 1px rgba(94,234,212,.2);cursor:grab;min-width:24px}
.tl-win:active{cursor:grabbing}
.tl-h{position:absolute;top:-3px;bottom:-3px;width:18px;background:linear-gradient(180deg,#5EEAD4,#818CF8);cursor:ew-resize;display:grid;place-items:center}
.tl-h.l{left:-2px;border-radius:10px 0 0 10px}
.tl-h.r{right:-2px;border-radius:0 10px 10px 0}
.tl-h::after{content:"";width:3px;height:22px;border-radius:3px;background:rgba(6,32,28,.7)}
.tl-play{position:absolute;top:0;bottom:0;width:2px;background:#fff;box-shadow:0 0 8px rgba(255,255,255,.9);pointer-events:none;left:0}
.tl-hint{margin:0;font-size:.8rem;opacity:.72;text-align:center;color:#fff}
`;document.head.appendChild(st)}

const TL={max:60,bar:null,drag:null,pvT:0,thumbsFor:null};

/* the video screen with the timeline (replaces the old start/end sliders) */
function ed5TLRender(){
  const h=ed5Host();h.hidden=false;
  h.innerHTML=`<div class="edt5-top"><button type="button" class="edt5-btn" data-ed="x">Use as is</button><b>Cut video</b><button type="button" class="edt5-btn go" data-ed="ok">Done</button></div>
    <div class="edt5-stage"><div class="edt5-box" style="width:${Math.min(window.innerWidth-24,380)}px;max-height:50vh;aspect-ratio:9/16"><video id="edt5vid" muted playsinline></video></div></div>
    <div class="tl-card">
      <div class="tl-head"><b id="tlFrom">0:00.0</b><span id="tlLab"></span><button type="button" class="edt5-btn" data-ed="play">${ic("speaker")}Play the part</button></div>
      <div class="tl" id="tlBar"><div class="tl-thumbs" id="tlThumbs"></div>
        <div class="tl-dim" id="tlDl" style="left:0"></div><div class="tl-dim" id="tlDr" style="right:0"></div>
        <div class="tl-win" id="tlWin"><span class="tl-h l" data-tl="l"></span><span class="tl-h r" data-tl="r"></span></div>
        <div class="tl-play" id="tlPlay" style="display:none"></div></div>
      <p class="tl-hint" id="tlHint">Drag the edges to choose the part. Drag the middle to move it. 60 seconds at most.</p>
    </div>`;
  const v=document.getElementById("edt5vid");if(!v)return;
  ED5.vid=v;v.src=ED5.url;
  v.onloadedmetadata=()=>{
    let d=v.duration;
    if(!isFinite(d)||d<=0){v.currentTime=1e8;v.ontimeupdate=()=>{v.ontimeupdate=null;v.currentTime=0;d=v.duration;tlInit(isFinite(d)&&d>0?d:0)}}
    else tlInit(d);
  };
  TL.bar=document.getElementById("tlBar");tlBind();
}
function tlInit(d){
  ED5.dur=d;ED5.s=0;ED5.e=Math.min(d,TL.max);
  if(!d){const l=document.getElementById("tlLab");if(l)l.textContent="This video cannot be cut here. It will be posted as it is.";const hn=document.getElementById("tlHint");if(hn)hn.style.display="none";return}
  tlSync();tlThumbs(d,ED5.url);
  clearInterval(TL.pvT);TL.pvT=setInterval(tlPlayhead,80);
}
/* the window, the labels and the preview position */
function tlSync(){
  const d=ED5.dur;if(!d)return;
  const L=ED5.s/d*100,R=(d-ED5.e)/d*100;
  const w=document.getElementById("tlWin"),dl=document.getElementById("tlDl"),dr=document.getElementById("tlDr");
  if(w){w.style.left=L+"%";w.style.width=((ED5.e-ED5.s)/d*100)+"%"}
  if(dl)dl.style.width=L+"%";if(dr)dr.style.width=R+"%";
  const f=document.getElementById("tlFrom"),lab=document.getElementById("tlLab");
  if(f)f.textContent=ed5Fmt(ED5.s);
  if(lab)lab.textContent=`to ${ed5Fmt(ED5.e)} · keeps ${Math.max(0,ED5.e-ED5.s).toFixed(1)} s`;
  const v=ED5.vid;if(v&&(v.paused||TL.drag))try{v.currentTime=ED5.s}catch(e){}
}
function tlPlayhead(){
  const d=ED5.dur,p=document.getElementById("tlPlay"),v=ED5.vid;
  if(!d||!p||!v){return}
  const playing=!v.paused&&v.currentTime>=ED5.s-0.05&&v.currentTime<=ED5.e+0.05;
  p.style.display=playing?"block":"none";
  if(playing)p.style.left=(v.currentTime/d*100)+"%";
}
/* thumbnails of the video: a few frames across the whole length */
async function tlThumbs(d,url){
  const row=document.getElementById("tlThumbs");if(!row)return;
  const N=Math.max(6,Math.min(14,Math.round(d/3)));
  const tv=document.createElement("video");tv.muted=true;tv.playsInline=true;tv.preload="auto";tv.src=url;
  await new Promise(r=>{tv.onloadeddata=()=>r();tv.onerror=()=>r();setTimeout(r,4000)});
  const W=96,H=96;
  for(let i=0;i<N;i++){
    if(ED5.url!==url||!document.getElementById("tlThumbs"))break;
    const c=document.createElement("canvas");c.width=W;c.height=H;c.className="tl-th";row.appendChild(c);
    const t=Math.min(d-0.05,(i+0.5)*d/N);
    await new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;tv.removeEventListener("seeked",fin);res()};
      tv.addEventListener("seeked",fin);try{tv.currentTime=t}catch(e){fin()}setTimeout(fin,1500)});
    try{const vw=tv.videoWidth||9,vh=tv.videoHeight||16,k=Math.max(W/vw,H/vh);
      c.getContext("2d").drawImage(tv,(W-vw*k)/2,(H-vh*k)/2,vw*k,vh*k)}catch(e){}
  }
  tv.removeAttribute("src");try{tv.load()}catch(e){}
}
/* drag: the handles change the start or the end, the middle moves the window */
function tlBind(){
  const bar=TL.bar;if(!bar||bar._b)return;bar._b=true;
  const tAt=x=>{const r=bar.getBoundingClientRect();return Math.max(0,Math.min(ED5.dur,(x-r.left)/r.width*ED5.dur))};
  bar.addEventListener("pointerdown",e=>{
    if(!ED5.dur)return;
    const hd=e.target.closest&&e.target.closest("[data-tl]");const win=e.target.closest&&e.target.closest("#tlWin");
    const t=tAt(e.clientX);
    if(hd)TL.drag={m:hd.dataset.tl};
    else if(win)TL.drag={m:"m",off:t-ED5.s};
    else{const len=ED5.e-ED5.s;ED5.s=Math.max(0,Math.min(ED5.dur-len,t-len/2));ED5.e=ED5.s+len;TL.drag={m:"m",off:len/2}}
    bar.setPointerCapture(e.pointerId);e.preventDefault();tlSync();
  });
  bar.addEventListener("pointermove",e=>{
    if(!TL.drag)return;const t=tAt(e.clientX),dd=ED5.dur,k=TL.drag.m;
    if(k==="l"){ED5.s=Math.max(0,Math.min(t,ED5.e-0.5));ED5.s=Math.max(ED5.s,ED5.e-TL.max)}
    else if(k==="r"){ED5.e=Math.min(dd,Math.max(t,ED5.s+0.5));ED5.e=Math.min(ED5.e,ED5.s+TL.max)}
    else{const len=ED5.e-ED5.s;ED5.s=Math.max(0,Math.min(dd-len,t-TL.drag.off));ED5.e=ED5.s+len}
    tlSync();
  });
  const up=()=>{TL.drag=null;const v=ED5.vid;if(v&&v.paused)try{v.currentTime=ED5.s}catch(e){}};
  bar.addEventListener("pointerup",up);bar.addEventListener("pointercancel",up);
}

/* the editor keeps the timeline for videos; photos keep their own screen */
{const _r=ed5Render;ed5Render=function(){if(ED5.kind==="image")return _r();return ed5TLRender()}}
