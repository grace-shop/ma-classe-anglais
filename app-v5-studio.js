/* =====================================================================
   v5 · studio: a new look for stories, music and avatars
   - Story composer: calm glass controls, icons instead of emoji
   - Music: clean sheet, real waveform, drag the window to choose the part to play
   - Avatar: woman or man, hair styles, outfits, accessories, 3D-look and gentle animation
   Keeps the same actions and saved data as before (no server change needed).
   ===================================================================== */

/* ---------- icons (stroke, 24 px) ---------- */
const SX_I={
  note:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  play:'<path d="M8 5v14l11-7z" fill="currentColor"/>',
  wave:'<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>',
  chev:'<path d="M9 6l6 6-6 6"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  up:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  selfie:'<circle cx="12" cy="10" r="4"/><path d="M5 4h3M16 4h3M5 20h3M16 20h3M4 8V4h4M16 4h4v4M4 16v4h4M20 16v4h-4"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  text:'<path d="M5 19L10 5h4l5 14M7.5 14h9"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};
const sxIc=(n,cls)=>n==="selfie"?camIcon3D(cls):`<svg class="sx-svg ${cls||""}" viewBox="0 0 24 24" aria-hidden="true">${SX_I[n]||""}</svg>`;

/* ---------- story composer ---------- */
function fComposerHTML(){const c=F.sc;const media=!!c.url;
  const tools=`<div class="sx-tools" role="group" aria-label="Story tools">
     <label class="sx-tool"><span class="sx-tool-ic">${sxIc("camera")}</span><span>${media?"Change":"Photo / video"}</span><input type="file" id="fsc_file" accept="image/*,video/*" hidden></label>
     <button type="button" class="sx-tool" data-v4="mdSelfie" data-to="story"><span class="sx-tool-ic">${sxIc("selfie")}</span><span>Selfie</span></button>
     <button type="button" class="sx-tool" data-v4="mdMusic"><span class="sx-tool-ic">${sxIc("music")}</span><span>Music</span></button>
     <button type="button" class="sx-tool" data-v4="mdText" data-to="story"><span class="sx-tool-ic">${sxIc("text")}</span><span>Text</span></button>
   </div>`;
  const track=MD.music&&!MD.music.b?`<div class="sx-track"><span class="sx-track-ic">${sxIc("note")}</span><b>${mdEsc(sxName(MD.music,0))}</b><button type="button" class="sx-track-x" data-v4="mdMusRm" aria-label="Remove music">${sxIc("x")}</button></div>`:"";
  return`<div class="fsv fsc sx-comp" style="${media?"":`background:${sbg(c.bg)}`}">
    <div class="sx-top"><button type="button" class="sx-glass" data-v4="fScX" aria-label="Close">${sxIc("x")}</button><b>New story</b><span class="sx-top-sp"></span></div>
    ${media?`<div class="fsv-media sx-media">${c.video?`<video src="${c.url}" autoplay muted loop playsinline></video>`:`<img src="${c.url}" alt="">`}</div>`:""}
    ${track}
    <textarea id="fsc_text" class="sx-text ${media?"cap":""}" maxlength="300" placeholder="${media?"Add a caption…":"Type your story in English…"}">${esc(c.text||"")}</textarea>
    ${media?"":`<div class="sx-bgs">${SBG.map((b,i)=>`<button type="button" style="background:${b}" data-v4="fScBg" data-i="${i}" aria-pressed="${c.bg==="g"+i}" aria-label="Background ${i+1}"></button>`).join("")}</div>`}
    ${scOptsHTML(c,media)}
    ${tools}
    <button type="button" class="sx-share" data-v4="fScPost" ${c.busy?"disabled":""}>${c.busy?"Posting…":"Share story"}</button>
  </div>`}

/* ---------- story options: how long it stays on screen, and who must not see it ---------- */
const SC_DURS=[5,10,15,30];
function scOptsHTML(c,media){
  const dur=media&&c.video?"":`<div class="sx-opt">
      <span class="sx-opt-l">${sxIc("spark")}Show for</span>
      <div class="sx-seg" role="group" aria-label="How long">${SC_DURS.map(n=>`<button type="button" class="sx-seg-b ${(c.dur||5)===n?"on":""}" data-v4="scDur" data-n="${n}" aria-pressed="${(c.dur||5)===n}">${n} s</button>`).join("")}</div>
    </div>`;
  const aud=`<div class="sx-opt">
      <span class="sx-opt-l">${sxIc("up")}Who sees it</span>
      <div class="sx-seg" role="group" aria-label="Who sees it">
        <button type="button" class="sx-seg-b ${c.aud!=="hide"?"on":""}" data-v4="scAud" data-a="all" aria-pressed="${c.aud!=="hide"}">Everyone</button>
        <button type="button" class="sx-seg-b ${c.aud==="hide"?"on":""}" data-v4="scAud" data-a="hide" aria-pressed="${c.aud==="hide"}">All except one</button>
      </div>
    </div>
    ${c.aud==="hide"?`<label class="sx-hide"><span>Hide from</span>
      <select id="sc_hide"><option value="">${c.peers?"Choose a classmate…":"Loading classmates…"}</option>${(c.peers||[]).map(p=>`<option value="${esc(p.uid)}" ${c.hide===p.uid?"selected":""}>${esc(p.name||"Student")}</option>`).join("")}</select>
      <small>This person will not see the story at all.</small></label>`:""}`;
  return`<div class="sx-opts">${dur}${aud}</div>`;
}
/* the options buttons and the classmate choice (listened to on the page itself) */
document.addEventListener("click",async e=>{
  const el=e.target.closest&&e.target.closest("[data-v4]");if(!el||!F.sc)return;const a=el.dataset.v4;
  if(a==="scDur"){F.sc.dur=+el.dataset.n;F.sc.text=(document.getElementById("fsc_text")||{}).value||F.sc.text;feedSync();return}
  if(a==="scAud"){F.sc.aud=el.dataset.a;F.sc.text=(document.getElementById("fsc_text")||{}).value||F.sc.text;
    if(F.sc.aud==="hide"&&!F.sc.peers){F.sc.peers=[];feedSync();
      try{F.sc.peers=(await window.__peer.dir()).filter(p=>p.uid!==S.uid)}catch(er){F.sc.peers=[];toast(er.message||"Could not load classmates","x")}}
    feedSync();return}
},true);
document.addEventListener("change",e=>{if(e.target&&e.target.id==="sc_hide"&&F.sc)F.sc.hide=e.target.value||null});

/* ---------- song names: hide raw file codes ---------- */
function sxName(s,i){const t=String((s&&s.title)||"").trim();
  if(!t||/^[0-9a-f]{8,}$/i.test(t)||/^(VID|IMG|AUD|PTT|WA|PXL)[-_ ]?/i.test(t)||/\d{6,}/.test(t))return"My song "+((i||0)+1);
  return t.replace(/\.[a-z0-9]{2,4}$/i,"")}

/* ---------- real waveform of an uploaded song ---------- */
const SX_PK={};
async function sxPeaks(m){const key=m.l||m.p;if(!key||key in SX_PK)return;SX_PK[key]=null;
  try{
    const src=m.l?URL.createObjectURL(await fcGet("song:"+m.l)):((await window.__chatFiles.url(m.p).catch(()=>null))||(await window.__signedAsset(m.p).catch(()=>null)));
    if(!src)throw new Error("no source");
    const buf=await (await fetch(src)).arrayBuffer();
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const ab=await ctx.decodeAudioData(buf.slice(0));ctx.close&&ctx.close();
    const ch=ab.getChannelData(0),N=96,step=Math.max(1,Math.floor(ch.length/N)),out=[];let max=0;
    for(let i=0;i<N;i++){let s=0;const a=i*step;for(let j=0;j<step;j+=Math.max(1,Math.floor(step/160))){const v=Math.abs(ch[a+j]||0);if(v>s)s=v}out.push(s);if(s>max)max=s}
    SX_PK[key]=out.map(v=>max?v/max:0);
    if(MD.music&&(MD.music.l||MD.music.p)===key){MD.music.peaks=SX_PK[key];mdSync()}
  }catch(e){delete SX_PK[key];console.warn("waveform",e)}}
/* a shape for the built-in beats (they have no file) */
const sxFake=(seed,i)=>0.3+0.7*Math.abs(Math.sin(i*1.31+seed)*Math.cos(i*0.47+seed*0.7));

/* ---------- trim: waveform with a window you drag ---------- */
function sxCutHTML(){const m=MD.music;if(!m||m.b)return"";
  if(!m.dur){mdCutProbe(m);return`<div class="sx-card sx-cut"><b>Trim the song</b><div class="sx-wf sx-loading">Loading the song…</div></div>`}
  if(m.p||m.l){if(m.peaks||SX_PK[m.l||m.p])m.peaks=m.peaks||SX_PK[m.l||m.p];else sxPeaks(m)}
  const dur=m.dur,L=Math.max(1,Math.min(m.d||15,dur,60)),st=Math.max(0,Math.min(m.start||0,dur-L));
  m.d=L;m.start=st;
  const pk=m.peaks||null,seed=(m.title||"x").length;
  const bars=Array.from({length:72},(_,i)=>{const v=pk?pk[Math.floor(i*pk.length/72)]:sxFake(seed,i);return`<i style="height:${Math.max(8,Math.round(v*100))}%"></i>`}).join("");
  const pct=v=>(v/dur*100).toFixed(3)+"%";
  const opts=[5,10,15,30,60].filter(x=>x<=Math.ceil(dur)||x===5);
  return`<div class="sx-card sx-cut">
    <div class="sx-row"><b>Trim the song</b><span class="sx-time"><span id="sxS">${mdFmtSec(st)}</span><i>→</i><span id="sxE">${mdFmtSec(st+L)}</span></span></div>
    <div class="sx-wf" id="sxWf" data-dur="${dur}">
      <div class="sx-bars" aria-hidden="true">${bars}</div>
      <div class="sx-sel" id="sxSel" style="left:${pct(st)};width:${pct(L)}"><i class="sx-h l"></i><i class="sx-h r"></i></div>
    </div>
    <div class="sx-lens">${opts.map(x=>`<button type="button" class="sx-len ${Math.round(L)===x?"on":""}" data-sx="len" data-n="${x}">${x}s</button>`).join("")}</div>
    <p class="sx-hint">Drag the window onto the part you want. It plays again and again with your photo or video.</p>
  </div>`}
let SX_DRAG=null;
function sxPaint(){const m=MD.music;if(!m||m.b)return;const dur=m.dur;
  const sel=document.getElementById("sxSel");if(sel){sel.style.left=(m.start/dur*100).toFixed(3)+"%";sel.style.width=(m.d/dur*100).toFixed(3)+"%"}
  const s=document.getElementById("sxS"),e=document.getElementById("sxE");if(s)s.textContent=mdFmtSec(m.start);if(e)e.textContent=mdFmtSec(m.start+m.d)}
document.addEventListener("pointerdown",e=>{const wf=e.target.closest&&e.target.closest("#sxWf");if(!wf||!MD.music||!MD.music.dur)return;
  const m=MD.music,r=wf.getBoundingClientRect(),dur=m.dur,toX=t=>r.left+t/dur*r.width;
  const xl=toX(m.start),xr=toX(m.start+m.d);
  const mode=Math.abs(e.clientX-xl)<22?"l":Math.abs(e.clientX-xr)<22?"r":(e.clientX>xl&&e.clientX<xr)?"m":"new";
  SX_DRAG={mode,x0:e.clientX,st:m.start,d:m.d,r,dur};
  if(mode==="new"){const t=(e.clientX-r.left)/r.width*dur;m.start=Math.max(0,Math.min(dur-m.d,t-m.d/2));sxPaint()}
  try{wf.setPointerCapture(e.pointerId)}catch(_){}
  e.preventDefault()},{passive:false});
document.addEventListener("pointermove",e=>{if(!SX_DRAG||!MD.music)return;const m=MD.music,D=SX_DRAG,dx=(e.clientX-D.x0)/D.r.width*D.dur;
  if(D.mode==="m")m.start=Math.max(0,Math.min(D.dur-D.d,D.st+dx));
  else if(D.mode==="l"){const end=D.st+D.d;const ns=Math.max(0,Math.min(end-1,D.st+dx));m.start=ns;m.d=Math.min(60,end-ns)}
  else if(D.mode==="r"){m.d=Math.max(1,Math.min(60,D.d+dx,D.dur-m.start))}
  else if(D.mode==="new"){const t=(e.clientX-D.r.left)/D.r.width*D.dur;m.start=Math.max(0,Math.min(D.dur-m.d,t-m.d/2))}
  m.start=Math.max(0,Math.min(m.start,D.dur-m.d));sxPaint()});
document.addEventListener("pointerup",()=>{if(!SX_DRAG)return;SX_DRAG=null;if(MD.music)mdSync()});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-sx="len"]');if(!b||!MD.music)return;
  const m=MD.music,n=+b.dataset.n;m.d=Math.max(1,Math.min(n,m.dur));m.start=Math.max(0,Math.min(m.start,m.dur-m.d));mdSync()});

/* ---------- music sheet ---------- */
function mdMusicHTML(){
  const beats=MD.built.map((b,i)=>`<div class="sx-beat" role="button" tabindex="0" data-v4="mdMusPick" data-b="${b.id}">
      <span class="sx-disc" style="--h:${(i*67)%360}">${sxIc("note")}</span>
      <span class="sx-bt"><b>${mdEsc(b.title)}</b><small>${b.bpm} BPM</small></span>
      <button type="button" class="sx-play" data-v4="mdPrev" data-b="${b.id}" aria-label="Preview ${mdEsc(b.title)}">${sxIc("play")}</button></div>`).join("");
  const mine=MD.songs.map((s,i)=>`<button type="button" class="sx-song" data-v4="mdMusPick" data-i="${i}">
      <span class="sx-disc mine">${sxIc("wave")}</span><span class="sx-bt"><b>${mdEsc(sxName(s,i))}</b><small>Your song</small></span>${sxIc("chev","sx-go")}</button>`).join("");
  return`<div class="md-sheet sx-sheet" role="dialog" aria-label="Add music">
    <div class="sx-head"><div><span class="sx-eyebrow">Music</span><b class="sx-title">Add music</b></div><button type="button" class="sx-glass" data-v4="mdMusX" aria-label="Close">${sxIc("x")}</button></div>
    <p class="sx-sub">Music plays with your photo or video. Choose a beat, one of your songs, or upload your own.</p>
    ${sxCutHTML()}
    <div class="sx-sec"><span class="sx-lab">Beats</span><div class="sx-grid">${beats}</div></div>
    ${MD.songs.length?`<div class="sx-sec"><span class="sx-lab">My songs</span><div class="sx-list">${mine}</div></div>`:""}
    <div class="sx-actions">
      <button type="button" class="sx-pill" data-v4="mdBeat">${sxIc("spark")}<span>Make my own song</span></button>
      <label class="sx-pill alt">${sxIc("up")}<span>Upload a song</span><input type="file" id="mdSongFile" accept="audio/*,video/*" hidden></label>
    </div></div>`}

/* ---------- avatar: drawing ---------- */
const sxShade=(hex,p)=>{const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(p<0?v*(1+p):v+(255-v)*p)));return"#"+[n>>16&255,n>>8&255,n&255].map(c=>f(c).toString(16).padStart(2,"0")).join("")};
Object.assign(AV,{
  skin:["#FBE3CF","#F5D0B2","#E8B48F","#D29A70","#B57B52","#9A6240","#7B4A2D","#55301C"],
  hair:["#1A1412","#3B2A22","#6B3F24","#A0672F","#D9A441","#E9E1CF","#B8402F","#7C5CFF"],
  outfit:["#4A5FD0","#E5484D","#25D366","#F5A524","#9A7CFF","#14B8A6","#111827","#F472B6"],
  bg:[["#FFFFFF","#DDE6FF"],["#FFFFFF","#FFD9C7"],["#FFFFFF","#CFF5E2"],["#FFFFFF","#E4D6FF"],["#FFFBEA","#FFE08A"],["#3A3F78","#141633"]]
});
Object.assign(AV_DEF,{g:0,skin:2,hair:0,hairCol:1,eyes:1,brow:0,mouth:0,cut:0,outfit:0,acc:0,bg:0});
const SX_NM_W=["Long wavy","Bob","Bun","Curls","Ponytail","Braids","Pixie","Long straight"];
const SX_NM_M=["Short","Fade","Undercut","Curly","Afro","Spiky","Buzz","Side part"];
const SX_HW=[
 {b:`<path fill="HF" d="M29 60 Q22 104 34 110 Q60 118 86 110 Q98 104 91 60 Q88 20 60 19 Q32 20 29 60Z"/>`,f:`<path fill="HF" d="M34 50 Q34 24 60 22 Q86 24 86 50 Q76 36 60 38 Q44 36 34 50Z"/>`},
 {b:`<path fill="HF" d="M31 50 Q29 94 40 100 L80 100 Q91 94 89 50 Q87 21 60 20 Q33 21 31 50Z"/>`,f:`<path fill="HF" d="M32 52 Q33 22 60 21 Q88 22 88 52 Q86 42 80 40 Q70 46 60 40 Q50 46 40 40 Q34 42 32 52Z"/>`},
 {b:`<circle fill="HF" cx="60" cy="18" r="11"/>`,f:`<path fill="HF" d="M35 50 Q35 25 60 24 Q85 25 85 50 Q75 37 60 38 Q45 37 35 50Z"/>`},
 {b:`<g fill="HF"><circle cx="36" cy="34" r="13"/><circle cx="60" cy="24" r="15"/><circle cx="84" cy="34" r="13"/><circle cx="27" cy="54" r="11"/><circle cx="93" cy="54" r="11"/></g>`,f:`<path fill="HF" d="M36 48 Q36 30 60 29 Q84 30 84 48 Q74 40 60 40 Q46 40 36 48Z"/>`},
 {b:`<path fill="HF" d="M80 34 Q106 52 98 98 Q94 104 90 94 Q98 62 78 44Z"/>`,f:`<path fill="HF" d="M34 50 Q34 24 60 22 Q86 24 86 50 Q74 36 60 37 Q46 36 34 50Z"/>`},
 {b:`<path fill="none" stroke="HF" stroke-width="8" stroke-linecap="round" d="M37 50 Q30 80 36 108 M83 50 Q90 80 84 108"/>`,f:`<path fill="HF" d="M35 50 Q35 24 60 22 Q85 24 85 50 Q75 36 60 37 Q45 36 35 50Z"/>`},
 {b:"",f:`<path fill="HF" d="M35 48 Q35 25 60 24 Q85 25 85 48 Q78 34 66 36 Q60 30 50 36 Q40 36 35 48Z"/>`},
 {b:`<path fill="HF" d="M31 56 L29 106 Q60 112 91 106 L89 56 Q87 22 60 21 Q33 22 31 56Z"/>`,f:`<path fill="HF" d="M34 50 Q34 24 60 22 Q86 24 86 50 L84 60 Q72 40 60 40 Q48 40 36 60Z"/>`}
];
const SX_HM=[
 {b:"",f:`<path fill="HF" d="M35 50 Q33 24 60 23 Q87 24 85 50 Q80 38 66 36 Q56 34 46 38 Q40 40 35 50Z"/>`},
 {b:`<path fill="HF" opacity=".35" d="M34 48 Q34 60 36 66 L84 66 Q86 60 86 48 L84 46 L36 46Z"/>`,f:`<path fill="HF" d="M36 48 Q36 25 60 24 Q84 25 84 48 Q74 36 60 36 Q46 36 36 48Z"/>`},
 {b:"",f:`<path fill="HF" d="M34 46 Q36 22 62 22 Q88 24 86 48 Q80 40 70 36 Q56 30 40 40 Q36 42 34 46Z"/>`},
 {b:`<g fill="HF"><circle cx="42" cy="30" r="10"/><circle cx="60" cy="24" r="12"/><circle cx="78" cy="30" r="10"/><circle cx="34" cy="42" r="8"/><circle cx="86" cy="42" r="8"/></g>`,f:`<path fill="HF" d="M36 46 Q36 26 60 25 Q84 26 84 46 Q74 36 60 37 Q46 36 36 46Z"/>`},
 {b:`<circle fill="HF" cx="60" cy="34" r="25"/>`,f:`<path fill="HF" d="M35 50 Q35 26 60 25 Q85 26 85 50 Q74 38 60 38 Q46 38 35 50Z"/>`},
 {b:"",f:`<path fill="HF" d="M36 44 L40 22 L48 36 L56 18 L62 34 L72 18 L76 36 L84 44 Q84 34 60 34 Q36 34 36 44Z"/>`},
 {b:"",f:`<path fill="HF" opacity=".55" d="M36 46 Q36 27 60 26 Q84 27 84 46 Q74 36 60 37 Q46 36 36 46Z"/>`},
 {b:"",f:`<path fill="HF" d="M34 50 Q34 22 62 22 Q88 24 86 50 Q80 34 66 30 Q54 40 34 50Z"/>`}
];
const SX_EYES=[
 `<circle cx="49" cy="58" r="3.4" fill="#1A1412"/><circle cx="71" cy="58" r="3.4" fill="#1A1412"/><circle cx="50" cy="57" r="1.1" fill="#fff"/><circle cx="72" cy="57" r="1.1" fill="#fff"/>`,
 `<ellipse cx="49" cy="58" rx="6.5" ry="4.2" fill="#fff"/><ellipse cx="71" cy="58" rx="6.5" ry="4.2" fill="#fff"/><circle cx="49" cy="58" r="3.2" fill="#2A1A14"/><circle cx="71" cy="58" r="3.2" fill="#2A1A14"/><circle cx="50" cy="56.8" r="1" fill="#fff"/><circle cx="72" cy="56.8" r="1" fill="#fff"/><path d="M42 55 Q49 49 56 55 M64 55 Q71 49 78 55" stroke="#1A1412" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
 `<path d="M43 60 Q49 52 55 60 M65 60 Q71 52 77 60" stroke="#1A1412" stroke-width="3" fill="none" stroke-linecap="round"/>`,
 `<ellipse cx="49" cy="58" rx="5.2" ry="6.2" fill="#1A1412"/><ellipse cx="71" cy="58" rx="5.2" ry="6.2" fill="#1A1412"/><circle cx="51" cy="55.5" r="2" fill="#fff"/><circle cx="73" cy="55.5" r="2" fill="#fff"/><path d="M43 52 Q49 48 55 52 M65 52 Q71 48 77 52" stroke="#1A1412" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
];
const SX_BROW=["",`<path d="M42 47 Q49 43 56 46 M64 46 Q71 43 78 47" stroke="HC" stroke-width="2.6" fill="none" stroke-linecap="round"/>`];
const SX_MOUTH=[
 `<path d="M51 73 Q60 83 69 73" stroke="#7A2E2E" stroke-width="3" fill="none" stroke-linecap="round"/>`,
 `<ellipse cx="60" cy="76" rx="6" ry="5" fill="#7A2E2E"/>`,
 `<path d="M50 72 Q60 86 70 72Z" fill="#fff" stroke="#7A2E2E" stroke-width="2.4" stroke-linejoin="round"/>`,
 `<ellipse cx="60" cy="75" rx="3.2" ry="3.8" fill="#D2536B"/>`
];
const SX_ACC=[
 "",
 `<g fill="rgba(255,255,255,.14)" stroke="#1A1412" stroke-width="1.8"><rect x="41" y="52" width="16" height="12" rx="5"/><rect x="63" y="52" width="16" height="12" rx="5"/></g><path d="M57 57 Q60 55 63 57" stroke="#1A1412" stroke-width="1.8" fill="none"/>`,
 `<path d="M31 56 Q31 21 60 21 Q89 21 89 56" stroke="#2D2F3A" stroke-width="4" fill="none"/><rect x="26" y="50" width="9" height="16" rx="4" fill="#2D2F3A"/><rect x="85" y="50" width="9" height="16" rx="4" fill="#2D2F3A"/>`,
 `<circle cx="33" cy="68" r="2.8" fill="#F5C451"/><circle cx="87" cy="68" r="2.8" fill="#F5C451"/>`
];
function sxAvt(raw,gest,size){
  const a=avtOf(raw),G=+a.g?1:0;
  const sk=AV.skin[a.skin%8],hc=AV.hair[a.hairCol%8],oc=AV.outfit[a.outfit%8],bg=AV.bg[a.bg%6];
  const hs=(G?SX_HM:SX_HW)[a.hair%8];
  const hid=`avh${a.hairCol%8}`,sid=`avs${a.skin%8}`,oid=`avo${a.outfit%8}`,bid=`avb${a.bg%6}`;
  const fix=s=>s.replace(/HF/g,`url(#${hid})`);
  const body=G?"M14 120 Q14 90 60 84 Q106 90 106 120Z":"M22 120 Q22 92 60 86 Q98 92 98 120Z";
  const cut=+a.cut%4;
  const outfitDetail=[
    `<path d="M49 86 Q60 98 71 86 Q60 92 49 86Z" fill="${sxShade(sk,-.18)}"/>`,
    `<path d="M38 92 Q60 76 82 92 L86 102 Q60 88 34 102Z" fill="${sxShade(oc,-.25)}"/><path d="M56 92 L55 106 M64 92 L65 106" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>`,
    `<path d="M46 86 L60 104 L74 86 L70 84 L60 96 L50 84Z" fill="#fff" fill-opacity=".92"/><circle cx="60" cy="104" r="1.4" fill="#2A2A2A"/><circle cx="60" cy="111" r="1.4" fill="#2A2A2A"/>`,
    G?`<path d="M44 88 L60 114 L76 88" stroke="${sxShade(oc,-.4)}" stroke-width="2.4" fill="none"/><path d="M60 92 L56 100 L60 116 L64 100Z" fill="${sxShade(oc,.25)}"/>`
     :`<path d="M46 86 Q60 100 74 86" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none"/>`
  ][cut];
  const gestArm=gest==="wave"?`<g class="av3-arm av3-wave" style="transform-origin:90px 92px"><path d="M88 94 Q100 72 96 52" stroke="url(#${sid})" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="96" cy="48" r="7" fill="url(#${sid})"/></g>`
    :gest==="cheer"?`<g class="av3-arm av3-cheer" style="transform-origin:90px 92px"><path d="M88 94 Q100 80 96 46" stroke="url(#${sid})" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="95" cy="42" r="7" fill="url(#${sid})"/></g>`
    :gest==="peace"?`<g class="av3-arm av3-peace" style="transform-origin:90px 92px"><path d="M88 94 Q102 82 100 64" stroke="url(#${sid})" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M98 58 L96 42 M103 58 L106 43" stroke="url(#${sid})" stroke-width="5" stroke-linecap="round"/></g>`
    :"";
  return`<svg viewBox="0 0 120 120" width="${size||120}" height="${size||120}" role="img" aria-label="Avatar" xmlns="http://www.w3.org/2000/svg" class="sx-av-svg">
<defs>
 <radialGradient id="${bid}" cx="50%" cy="28%" r="78%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
 <linearGradient id="${sid}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${sxShade(sk,.22)}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${sxShade(sk,-.16)}"/></linearGradient>
 <linearGradient id="${hid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sxShade(hc,.18)}"/><stop offset="1" stop-color="${sxShade(hc,-.22)}"/></linearGradient>
 <linearGradient id="${oid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sxShade(oc,.12)}"/><stop offset="1" stop-color="${sxShade(oc,-.28)}"/></linearGradient>
 <radialGradient id="avhl" cx="36%" cy="22%" r="62%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <radialGradient id="avsh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="60" cy="60" r="58" fill="url(#${bid})"/>
<ellipse cx="60" cy="110" rx="36" ry="7" fill="url(#avsh)"/>
<g class="av6-body"><path d="${body}" fill="url(#${oid})"/>${outfitDetail}</g>
${gestArm}
<g class="av6-head">
 ${hs.b?fix(hs.b):""}
 <rect x="52" y="76" width="16" height="14" rx="5" fill="url(#${sid})"/>
 <ellipse cx="34.5" cy="58" rx="4.2" ry="5.2" fill="url(#${sid})"/><ellipse cx="85.5" cy="58" rx="4.2" ry="5.2" fill="url(#${sid})"/>
 <ellipse cx="60" cy="54" rx="26" ry="29" fill="url(#${sid})"/>
 <ellipse cx="60" cy="54" rx="26" ry="29" fill="url(#avhl)"/>
 <path d="M38 70 Q60 92 82 70" stroke="#000" stroke-opacity=".08" stroke-width="5" fill="none"/>
 <ellipse cx="60" cy="54" rx="26" ry="29" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/>
 ${fix(hs.f)}
 <ellipse cx="48" cy="30" rx="11" ry="3.6" fill="#fff" opacity=".18" transform="rotate(-16 48 30)"/>
 ${SX_BROW[a.brow%2].replace(/HC/g,hc)}
 <g class="av6-eyes">${SX_EYES[a.eyes%4]}</g>
 <ellipse cx="41" cy="70" rx="5" ry="3" fill="#FF8A8A" opacity=".42"/><ellipse cx="79" cy="70" rx="5" ry="3" fill="#FF8A8A" opacity=".42"/>
 ${SX_MOUTH[a.mouth%4]}
 ${SX_ACC[G&&a.acc===3?1:a.acc%4]}
</g></svg>`}
/* the figure: breathing and blinking, gently */
function avtSVG(raw,gest,size){return sxAvt(raw,gest,size)}

/* ---------- avatar builder ---------- */
function avtView(){
  const me=S.me||{};
  const d=AV.draft||(AV.draft={...avtOf(me.avt),bio:me.bio||""});
  const G=+d.g?1:0;
  const chips=(k,names)=>`<div class="sx-opts">${names.map((x,i)=>`<button type="button" class="sx-opt ${d[k]===i?"on":""}" data-v4="avPart" data-k="${k}" data-n="${i}" aria-pressed="${d[k]===i}">${esc(x)}</button>`).join("")}</div>`;
  const sw=(k,cols,label)=>`<div class="sx-swatches">${cols.map((c,i)=>`<button type="button" class="sx-sw ${d[k]===i?"on":""}" style="background:${typeof c==="string"?c:`linear-gradient(135deg,${c[0]},${c[1]})`}" data-v4="avPart" data-k="${k}" data-n="${i}" aria-label="${label} ${i+1}" aria-pressed="${d[k]===i}"></button>`).join("")}</div>`;
  const sec=(t,body)=>`<section class="sx-sec2"><span class="sx-lab">${t}</span>${body}</section>`;
  return`<div class="section sx-av" style="max-width:720px;margin-inline:auto">
    <button class="back" data-v4="avBack">${ic("left")}Back</button>
    <div class="sx-stage"><div class="sx-halo"></div><div class="sx-figure" id="avStage">${avtHTML(d,210,true)}</div><p class="sx-gest">Your avatar moves: wave, peace and cheer</p></div>
    <div class="sx-form">
      ${sec("Gender",`<div class="sx-gender">${["Woman","Man"].map((x,i)=>`<button type="button" class="sx-gbtn ${G===i?"on":""}" data-v4="avPart" data-k="g" data-n="${i}" aria-pressed="${G===i}">${x}</button>`).join("")}</div>`)}
      ${sec("Hair style",chips("hair",G?SX_NM_M:SX_NM_W))}
      ${sec("Hair colour",sw("hairCol",AV.hair,"Hair colour"))}
      ${sec("Skin tone",sw("skin",AV.skin,"Skin tone"))}
      ${sec("Eyes",chips("eyes",["Dots","Almond","Happy","Sparkle"]))}
      ${sec("Eyebrows",chips("brow",["None","Bold"]))}
      ${sec("Smile",chips("mouth",["Smile","Open","Grin","Kiss"]))}
      ${sec("Outfit",chips("cut",G?["Tee","Hoodie","Shirt","Suit"]:["Tee","Hoodie","Blouse","Dress"]))}
      ${sec("Outfit colour",sw("outfit",AV.outfit,"Outfit colour"))}
      ${sec("Accessories",chips("acc",G?["None","Glasses","Headphones"]:["None","Glasses","Headphones","Earrings"]))}
      ${sec("Background",sw("bg",AV.bg,"Background"))}
      <label class="sx-bio"><span class="sx-lab">Bio</span><textarea id="avBio" maxlength="150" placeholder="A few words about you">${esc(d.bio||"")}</textarea></label>
      <button type="button" class="sx-pill big" data-v4="avSave">${sxIc("spark")}<span>Save my avatar and bio</span></button>
    </div></div>`}

/* ---------- style ---------- */
{const st=document.createElement("style");st.id="studiocss";st.textContent=`
.sx-comp{box-sizing:border-box;justify-content:flex-start;padding:calc(12px + env(safe-area-inset-top,0px)) 16px calc(16px + env(safe-area-inset-bottom,0px))}
.sx-top{display:flex;align-items:center;width:100%;gap:10px;margin-bottom:10px}
.sx-top>b{flex:1;text-align:center;font-size:17px;font-weight:700;letter-spacing:.2px;color:#fff}
.sx-top-sp{width:42px;flex:none}
.sx-glass{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(20,22,40,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none}
.sx-svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.sx-media{flex:1;min-height:0;width:100%;max-width:520px;border-radius:26px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.14)}
.sx-media img,.sx-media video{width:100%;height:100%;object-fit:cover;display:block}
.sx-text{width:100%;max-width:520px;box-sizing:border-box;min-height:120px;border-radius:24px;border:1px solid rgba(255,255,255,.18);background:rgba(10,12,30,.28);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font-weight:700;font-size:24px;line-height:1.3;padding:18px 20px;resize:none;outline:none;text-align:center}
.sx-text::placeholder{color:rgba(255,255,255,.72)}
.sx-text.cap{min-height:56px;font-size:16px;text-align:left;margin-top:10px}
.sx-bgs{display:flex;gap:10px;justify-content:center;margin:12px 0}
.sx-bgs button{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.5);cursor:pointer}
.sx-bgs button[aria-pressed="true"]{border-color:#fff;transform:scale(1.15);box-shadow:0 0 0 3px rgba(255,255,255,.25)}
.sx-track{display:flex;align-items:center;gap:8px;margin:10px 0 0;padding:6px 6px 6px 8px;border-radius:999px;background:rgba(10,12,30,.5);color:#fff;border:1px solid rgba(255,255,255,.2);max-width:90%}
.sx-track b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
.sx-track-ic{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#5EEAD4,#818CF8);display:grid;place-items:center;color:#06201C;flex:none}
.sx-track-x{border:0;background:rgba(255,255,255,.15);color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;display:grid;place-items:center;flex:none}
.sx-tools{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:14px 0 12px}
.sx-tool{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:70px;padding:10px 8px;border-radius:18px;border:1px solid rgba(255,255,255,.2);background:rgba(10,12,30,.34);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font-size:12px;font-weight:700;cursor:pointer}
.sx-tool-ic{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#5EEAD4,#818CF8);color:#06201C}
.sx-share{width:100%;max-width:420px;height:54px;border:0;border-radius:999px;background:linear-gradient(100deg,#5EEAD4,#818CF8);color:#06201C;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 14px 34px rgba(94,234,212,.35)}
.sx-share:disabled{opacity:.6}
.md-over .sx-sheet{width:min(440px,100%);max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;padding:18px 16px 20px;border-radius:30px;background:linear-gradient(170deg,rgba(24,28,58,.97),rgba(12,14,34,.97));border:1px solid rgba(129,140,248,.28);box-shadow:0 30px 80px rgba(0,0,0,.6);color:#EEF4FF;margin:0 auto}
.sx-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.sx-eyebrow{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#5EEAD4;font-weight:700}
.sx-title{font-size:22px;font-weight:800;letter-spacing:-.01em}
.sx-sub{margin:6px 0 14px;color:#A9B8E0;font-size:13.5px;line-height:1.5}
.sx-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:14px;margin-bottom:14px}
.sx-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.sx-time{font-variant-numeric:tabular-nums;font-size:13px;color:#A9B8E0;display:flex;gap:6px;align-items:center}
.sx-time i{font-style:normal;color:#5EEAD4}
.sx-wf{position:relative;height:96px;border-radius:16px;background:rgba(0,0,0,.28);overflow:hidden;touch-action:none;user-select:none;cursor:grab}
.sx-loading{display:grid;place-items:center;color:#8FA0C9;font-size:13px;height:96px}
.sx-bars{position:absolute;inset:12px 8px;display:flex;align-items:center;gap:2px}
.sx-bars i{flex:1;border-radius:3px;background:linear-gradient(180deg,#5EEAD4,#818CF8);opacity:.5;min-height:6px}
.sx-sel{position:absolute;top:0;bottom:0;border-radius:14px;background:rgba(94,234,212,.14);border:2px solid #5EEAD4;box-shadow:0 0 22px rgba(94,234,212,.35);box-sizing:border-box}
.sx-sel .sx-bars,.sx-sel{pointer-events:none}
.sx-h{position:absolute;top:50%;width:10px;height:46px;margin-top:-23px;border-radius:6px;background:#5EEAD4;box-shadow:0 0 0 3px rgba(0,0,0,.3)}
.sx-h.l{left:-7px}.sx-h.r{right:-7px}
.sx-lens{display:flex;gap:8px;margin-top:12px}
.sx-len{flex:1;min-width:0;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EEF4FF;font-weight:700;cursor:pointer}
.sx-len.on{background:linear-gradient(100deg,#5EEAD4,#818CF8);color:#06201C;border-color:transparent}
.sx-hint{margin:10px 2px 0;color:#8FA0C9;font-size:12.5px;line-height:1.45}
.sx-sec{margin:14px 0}
.sx-lab{display:block;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:#8FA0C9;font-weight:700;margin-bottom:8px}
.sx-grid{display:grid;grid-template-columns:1fr;gap:10px}
.sx-beat{display:flex;align-items:center;gap:10px;padding:12px;border-radius:20px;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);cursor:pointer;min-width:0}
.sx-beat:hover,.sx-beat:focus-visible{border-color:rgba(94,234,212,.6);outline:none}
.sx-disc{width:44px;height:44px;border-radius:50%;flex:none;display:grid;place-items:center;color:#06201C;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.7),transparent 42%),conic-gradient(from 200deg,hsl(var(--h,160) 85% 62%),#818CF8,hsl(calc(var(--h,160) + 60) 85% 66%),hsl(var(--h,160) 85% 62%));box-shadow:0 8px 18px rgba(0,0,0,.35),inset 0 -6px 12px rgba(0,0,0,.2)}
.sx-disc.mine{background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.7),transparent 42%),linear-gradient(135deg,#5EEAD4,#818CF8 60%,#F472B6)}
.sx-disc .sx-svg{width:20px;height:20px}
.sx-bt{display:flex;flex-direction:column;min-width:0;flex:1;text-align:left}
.sx-bt b{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sx-bt small{color:#8FA0C9;font-size:12px;margin-top:2px}
.sx-play{width:34px;height:34px;border-radius:50%;border:0;background:rgba(94,234,212,.16);color:#5EEAD4;display:grid;place-items:center;cursor:pointer;flex:none}
.sx-play .sx-svg{width:14px;height:14px;fill:#5EEAD4;stroke:none}
.sx-list{display:grid;gap:8px}
.sx-song{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#EEF4FF;text-align:left;cursor:pointer;width:100%;min-width:0}
.sx-go{color:#8FA0C9;width:18px;height:18px}
.sx-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.sx-pill{flex:1 1 170px;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 14px;border-radius:999px;border:1px solid rgba(94,234,212,.4);background:rgba(94,234,212,.12);color:#5EEAD4;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;box-sizing:border-box}
.sx-pill.alt{border-color:rgba(129,140,248,.45);background:rgba(129,140,248,.14);color:#C7D2FE}
.sx-pill.big{width:100%;flex:none;background:linear-gradient(100deg,#5EEAD4,#818CF8);color:#06201C;border:0;height:54px;margin-top:12px}
.sx-pill .sx-svg{width:18px;height:18px}
.sx-av .sx-stage{position:relative;display:grid;place-items:center;padding:18px 0 8px;border-radius:32px;overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,rgba(129,140,248,.35),transparent 60%),linear-gradient(180deg,rgba(20,24,52,.92),rgba(10,12,30,.92));border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 60px rgba(0,0,0,.35)}
.sx-halo{position:absolute;width:260px;height:260px;border-radius:50%;background:conic-gradient(from 0deg,#5EEAD4,#818CF8,#F472B6,#5EEAD4);filter:blur(60px);opacity:.35;animation:sxSpin 12s linear infinite}
@keyframes sxSpin{to{transform:rotate(360deg)}}
.sx-figure{position:relative;filter:drop-shadow(0 18px 24px rgba(0,0,0,.45))}
.sx-gest{margin:6px 0 4px;color:#8FA0C9;font-size:12.5px}
.sx-sec2{margin:0 0 20px}.sx-sec2 .sx-lab{margin-bottom:10px}.sx-av>.back{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#EEF4FF;border-radius:14px;padding:8px 14px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;margin:4px 0 10px}
.sx-form{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:26px;padding:16px;margin-top:14px}
.sx-opts{display:flex;flex-wrap:wrap;gap:8px}
.sx-opt{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EEF4FF;font-weight:600;font-size:13.5px;cursor:pointer}
.sx-opt.on{background:linear-gradient(100deg,#5EEAD4,#818CF8);color:#06201C;border-color:transparent;box-shadow:0 8px 20px rgba(94,234,212,.3)}
.sx-swatches{display:flex;flex-wrap:wrap;gap:10px}
.sx-sw{width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,.15);cursor:pointer;box-shadow:inset 0 -6px 10px rgba(0,0,0,.25),inset 0 4px 8px rgba(255,255,255,.3)}
.sx-sw.on{border-color:#fff;box-shadow:0 0 0 3px rgba(94,234,212,.7)}
.sx-gender{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sx-gbtn{height:52px;border-radius:20px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EEF4FF;font-weight:800;font-size:15px;cursor:pointer}
.sx-gbtn.on{background:linear-gradient(100deg,#F472B6,#818CF8);border-color:transparent;color:#fff}
.sx-bio{display:block;margin:14px 0 0}
.sx-bio textarea{width:100%;box-sizing:border-box;min-height:70px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EEF4FF;padding:12px;font:inherit}
.av6-head{animation:av6bob 4.2s ease-in-out infinite}
.av6-eyes{transform-box:fill-box;transform-origin:center;animation:av6blink 5.5s infinite}
@keyframes av6bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
@keyframes av6blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}
@media (prefers-reduced-motion:reduce){.av6-head,.av6-eyes,.sx-halo{animation:none!important}}
.sx-opts{display:grid;gap:8px;margin:10px 0 0}
.sx-opt{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}
.sx-opt-l{display:inline-flex;align-items:center;gap:6px;color:#fff;font-size:.82rem;font-weight:700;opacity:.9}
.sx-opt-l .sx-svg{width:16px;height:16px}
.sx-seg{display:inline-flex;padding:3px;border-radius:999px;background:rgba(10,12,30,.5);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sx-seg-b{border:0;background:transparent;color:rgba(255,255,255,.8);font:inherit;font-size:.8rem;font-weight:700;padding:7px 12px;border-radius:999px;cursor:pointer;white-space:nowrap}
.sx-seg-b.on{background:linear-gradient(120deg,#5EEAD4,#818CF8);color:#06201C;box-shadow:0 6px 16px -8px rgba(94,234,212,.8)}
.sx-hide{display:grid;gap:4px;color:#fff;font-size:.82rem;font-weight:700}
.sx-hide select{font:inherit;color:#fff;background:rgba(10,12,30,.55);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:10px 12px}
.sx-hide select option{color:#111}
.sx-hide small{font-weight:500;opacity:.7}
`;document.head.appendChild(st)}
