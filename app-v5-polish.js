/* =====================================================================
   v5 polish: 3D icons instead of emoji, red-only corrections, readable
   quiz answers, photos you can enlarge, tap a name to open the profile,
   calls with the teacher, music that plays, and cutting a song
   ===================================================================== */
/* ---- CSS ---- */
{const st=document.createElement("style");st.id="polishcss";st.textContent=`
/* corrections: red only, never struck through */
.v4fr{text-decoration:none!important;color:#B91C1C!important;background:#FFE4E6!important}
/* quiz answers: always dark text on the light answer colours */
.choice.right{color:#0B3D2C!important;background:#DDF7EC!important;border-color:#16A34A!important}
.choice.wrong{color:#7A1126!important;background:#FDE2E7!important;border-color:#DC2626!important}
.choice.right *,.choice.wrong *{color:inherit}
.choice.right .k,.choice.wrong .k{color:#fff!important}
/* 3D icon tiles */
.i3{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:12px;flex:none;color:#fff;
  background:linear-gradient(150deg,var(--c1,#7C8CFF),var(--c2,#4B5BE6));
  box-shadow:0 8px 16px -6px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.22)}
.i3 svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
.i3-gold{--c1:#FFD86B;--c2:#E0931C}.i3-blue{--c1:#7DD3FC;--c2:#2563EB}.i3-rose{--c1:#FDA4AF;--c2:#E11D48}
.i3-green{--c1:#86EFAC;--c2:#16A34A}.i3-violet{--c1:#D8B4FE;--c2:#7C3AED}.i3-slate{--c1:#CBD5E1;--c2:#475569}
.i3.sm{width:26px;height:26px;border-radius:9px}.i3.sm svg{width:14px;height:14px}
.v4sheet button{display:flex!important;align-items:center;gap:12px}
.pv-ic{display:inline-flex}
/* photos you can enlarge */
.pz{position:fixed;inset:0;z-index:9800;background:rgba(3,4,12,.94);display:grid;place-items:center;padding:20px;box-sizing:border-box;animation:pzIn .2s ease-out}
.pz[hidden]{display:none!important}
.pz img{max-width:100%;max-height:86vh;border-radius:22px;box-shadow:0 30px 60px -20px rgba(0,0,0,.7);object-fit:contain}
.pz-x{position:absolute;top:14px;right:14px;width:46px;height:46px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(8px)}
.pz-x svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round}
@keyframes pzIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.hdr-link{cursor:pointer;border-radius:10px}
.hdr-link:hover{text-decoration:underline;text-underline-offset:4px}
/* cutting a song */
.md-cut{display:grid;gap:10px;padding:12px;border-radius:16px;background:var(--surface2);border:1px solid var(--line);margin-bottom:10px}
.md-cut label{display:grid;gap:4px}
.md-cut input[type=range]{width:100%;accent-color:#5EEAD4}
`;document.head.appendChild(st)}

/* ---- icons ---- */
ICONS.pin=ICONS.pin||'<path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/>';
ICONS.archive=ICONS.archive||'<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>';
ICONS.bell=ICONS.bell||'<path d="M6 8a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 21a2 2 0 0 0 4 0"/>';
ICONS.bellOff=ICONS.bellOff||'<path d="M8.7 3.9A6 6 0 0 1 18 8c0 4.5 1.5 6 2 7H6M4 4l16 16M10 21a2 2 0 0 0 4 0"/>';
ICONS.dots=ICONS.dots||'<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>';
const I3=(n,c,sm)=>`<span class="i3 i3-${c}${sm?" sm":""}" aria-hidden="true">${ic(n)}</span>`;

/* ---- conversation menus: 3D icons instead of emoji ---- */
{const _sh=pvSheetHTML;pvSheetHTML=function(){return _sh()
  .replace(/📌\s*/g,I3("pin","gold")+" ").replace(/🗂️\s*/g,I3("archive","blue")+" ")
  .replace(/🔕\s*/g,I3("bellOff","rose")+" ").replace(/🔔\s*/g,I3("bell","green")+" ")
  .replace(/✏️\s*/g,I3("edit","violet")+" ")}}
{const _pv=peersView;peersView=function(){return _pv()
  .replace(/<i class="pv-ic"([^>]*)>📌<\/i>/g,`<i class="pv-ic"$1>${I3("pin","gold",1)}</i>`)
  .replace(/<i class="pv-ic"([^>]*)>🔕<\/i>/g,`<i class="pv-ic"$1>${I3("bellOff","rose",1)}</i>`)
  .replace(/(aria-label="Options for[^"]*"[^>]*>)⋯(<\/button>)/g,`$1${I3("dots","slate",1)}$2`)}}
{const _pcv=peerChatView;peerChatView=function(){return _pcv()
  .replace(/(aria-label="Chat options"[^>]*>)⋯(<\/button>)/g,`$1${I3("dots","slate",1)}$2`)
  /* tap the name to open their profile page */
  .replace(/<h2>/,`<h2 class="hdr-link" data-openprof="${esc(S.view&&S.view.id||"")}" title="See their profile">`)}}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-openprof]");if(!t)return;
  e.preventDefault();e.stopPropagation();S.view={type:"person",id:t.dataset.openprof};S.animate=true;scrollTo(0,0);render()},true);

/* ---- photos: tap a profile photo or cover to see it big ---- */
function pzOpen(src){
  let el=document.getElementById("pzView");
  if(!el){el=document.createElement("div");el.id="pzView";el.className="pz";el.hidden=true;
    el.innerHTML=`<button type="button" class="pz-x" data-pz="x" aria-label="Close">${ic("x")}</button><img alt="">`;
    document.body.appendChild(el);
    el.addEventListener("click",ev=>{if(ev.target!==el.querySelector("img"))el.hidden=true});}
  el.querySelector("img").src=src;el.hidden=false;
}
document.addEventListener("click",e=>{
  const x=e.target.closest&&e.target.closest("[data-pz]");if(x){const v=document.getElementById("pzView");if(v)v.hidden=true;e.stopPropagation();return}
  if(e.target.closest&&e.target.closest("button,label,input,a"))return;
  const im=e.target.closest&&e.target.closest(".av.photo img");
  const cv=e.target.closest&&e.target.closest(".av3-cover");
  if(im&&im.src){e.preventDefault();e.stopPropagation();pzOpen(im.src);return}
  if(cv){const m=/url\(['"]?([^'")]+)['"]?\)/.exec(cv.style.backgroundImage||cv.getAttribute("style")||"");if(m){e.preventDefault();e.stopPropagation();pzOpen(decodeURIComponent(m[1].replace(/%27/g,"'")))}}
},true);

/* ---- calls with the teacher, from her private chat ---- */
{const _sv=studentView;studentView=function(){const h=_sv();
  if(S.view&&S.view.type==="chat"&&S.mode==="student"){const t=myTid();if(t&&typeof callBarHTML==="function")return callBarHTML("duo",t)+h}
  return h}}

/* ---- music: plays again (it used to look in the wrong place), and only the part you chose ---- */
mdPlay=async function(m,key){mdStop();if(!m)return;MD.playId=key||"x";
  const seg=(a)=>{const st=+m.start||0,len=+m.d||0;a.loop=true;a.addEventListener("loadedmetadata",()=>{try{a.currentTime=st}catch(e){}});
    if(len>0)a.addEventListener("timeupdate",()=>{if(a.currentTime>=st+len-0.05||a.currentTime<st-0.05){try{a.currentTime=st}catch(e){}}})};
  try{
    if(m.b){const ctx=mdAC();if(ctx.state==="suspended")await ctx.resume();const buf=await mdBuiltBuffer(m.b);const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const g=ctx.createGain();g.gain.value=.8;s.connect(g).connect(ctx.destination);s.start(0);MD.nodes.push(s);return}
    if(m.l){const blob=await fcGet("song:"+m.l);if(!blob)return;const a=new Audio(URL.createObjectURL(blob));seg(a);a.play().catch(()=>{});MD.nodes.push(a);return}
    if(m.p){
      const url=(await window.__chatFiles.url(m.p).catch(()=>null))||(await window.__signedAsset(m.p).catch(()=>null));
      if(!url){toast("This song cannot be played right now. Check your connection.","mute");return}
      const a=new Audio(url);a.preload="auto";seg(a);
      a.play().catch(()=>toast("Tap play to hear the song","mute"));MD.nodes.push(a);
    }
  }catch(e){}};

/* how long a song is (needed to cut it) */
function mdFmtSec(s){s=Math.max(0,Math.round(+s||0));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function mdCutProbe(m){if(m._probing||m.dur)return;m._probing=true;
  (async()=>{try{
    const src=m.l?URL.createObjectURL(await fcGet("song:"+m.l)):((await window.__chatFiles.url(m.p).catch(()=>null))||(await window.__signedAsset(m.p).catch(()=>null)));
    if(!src)throw new Error("no source");
    const a=new Audio();a.preload="metadata";a.src=src;
    await new Promise((res,rej)=>{a.onloadedmetadata=res;a.onerror=rej;setTimeout(rej,8000)});
    if(isFinite(a.duration)&&a.duration>0)m.dur=Math.round(a.duration*10)/10;
  }catch(e){m.dur=0}finally{m._probing=false;if(MD.open==="music")mdSync()}})()}
function mdCutHTML(){const m=MD.music;if(!m||m.b)return"";
  if(!m.dur){mdCutProbe(m);return`<div class="md-cut"><span class="eyebrow">Cut the song</span><p class="small muted">Loading the song…</p></div>`}
  const len=Math.max(3,Math.min(60,Math.round(m.d||Math.min(15,m.dur))),Math.min(3,Math.floor(m.dur)));
  const lenMax=Math.max(3,Math.min(60,Math.floor(m.dur)));
  const L=Math.min(len,lenMax),max=Math.max(0,Math.floor(m.dur-L)),st=Math.min(max,m.start||0);
  return`<div class="md-cut"><span class="eyebrow">Cut the song</span>
    <label class="small">Start at <b id="mdCutSV">${mdFmtSec(st)}</b> of ${mdFmtSec(m.dur)}<input type="range" id="mdCutS" min="0" max="${max}" step="0.5" value="${st}"></label>
    <label class="small">Length <b id="mdCutLV">${L}s</b><input type="range" id="mdCutL" min="3" max="${lenMax}" step="1" value="${L}"></label>
    <p class="hint">This part of the song plays again and again with your photo or video.</p></div>`}
{const _mm=mdMusicHTML;mdMusicHTML=function(){let h=_mm();
  if(MD.music&&!MD.music.b)h=h.replace('<div class="md-actions"><button type="button" class="btn ghost sm" data-v4="mdBeat">',mdCutHTML()+'<div class="md-actions"><button type="button" class="btn ghost sm" data-v4="mdBeat">');
  return h}}
document.addEventListener("input",e=>{const el=e.target;if(!el||!MD.music)return;
  if(el.id==="mdCutL"){const L=+el.value;MD.music.d=L;const S2=document.getElementById("mdCutS");const max=Math.max(0,Math.floor(MD.music.dur-L));
    if(S2){S2.max=max;if(+S2.value>max){S2.value=max}MD.music.start=+S2.value}
    const lv=document.getElementById("mdCutLV");if(lv)lv.textContent=L+"s";const sv=document.getElementById("mdCutSV");if(sv)sv.textContent=mdFmtSec(MD.music.start||0)}
  if(el.id==="mdCutS"){MD.music.start=+el.value;const sv=document.getElementById("mdCutSV");if(sv)sv.textContent=mdFmtSec(+el.value)}
},true);
