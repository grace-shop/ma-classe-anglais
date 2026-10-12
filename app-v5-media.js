/* =====================================================================
   v5 media: selfies, text on photos, music for stories and posts, beat maker
   - Selfie: front camera in chats, groups and story composer (photo sent like any photo)
   - Text on a photo before posting (font, colour, size, position, background pill)
   - Music: built-in beats (made on the phone, no file), my own songs (beat maker, saved as WAV),
     or an audio file. Plays in stories and posts (like Snapchat / Instagram)
   - Images of the app load through short-lived links (protected exam papers and pictures)
   Server: supabase/musique.sql (music), supabase/protection.sql (private files, run last)
   ===================================================================== */
const MD={open:null,cam:null,ed:null,mus:null,beat:null,music:null,playId:null,nodes:[],bufs:{},urls:{},songs:[],
  built:[{id:"sunny",title:"Sunny Beat",bpm:110,kick:[0,4,8,12],clap:[4,12],hat:[2,6,10,14],bass:[0,8],note:55},
         {id:"night",title:"Night Drive",bpm:90,kick:[0,6,10],clap:[8],hat:[0,2,4,6,8,10,12,14],bass:[0,6,10],note:45},
         {id:"clap",title:"Clap Along",bpm:125,kick:[0,4,8,12],clap:[4,12],hat:[1,3,5,7,9,11,13,15],bass:[0,4,8,12],note:65},
         {id:"lofi",title:"Lo-fi Study",bpm:80,kick:[0,7,10],clap:[4,12],hat:[2,6,10,14],bass:[0,3,8,11],note:49}]};
const MD_FONTS=["Manrope, sans-serif","Georgia, serif","'Courier New', monospace"];
const MD_COLS=["#FFFFFF","#111827","#FFD166","#6C80FF","#EF476F","#06D6A0"];
const mdEsc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mdSongsKey=()=>"ec_songs_"+(S.uid||"x");
function mdLoadSongs(){try{MD.songs=JSON.parse(localStorage.getItem(mdSongsKey())||"[]")||[]}catch(e){MD.songs=[]}}
function mdSaveSongs(){try{localStorage.setItem(mdSongsKey(),JSON.stringify(MD.songs.slice(0,30)))}catch(e){}}

/* ---------- sound: one synthesizer for playback, export (WAV) and built-in tracks ---------- */
function mdSchedule(ctx,dest,pat,t0,steps,beat){
  const st=60/pat.bpm/4;const N=(hz,t,d,type,vol)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||"triangle";o.frequency.value=hz;g.gain.setValueAtTime(vol||.25,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(dest);o.start(t);o.stop(t+d+.05)};
  const noise=(t,d,hp,vol)=>{const len=Math.floor(ctx.sampleRate*d),b=ctx.createBuffer(1,len,ctx.sampleRate),c=b.getChannelData(0);for(let i=0;i<len;i++)c[i]=Math.random()*2-1;const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=b;f.type="highpass";f.frequency.value=hp;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(g).connect(dest);s.start(t)};
  const chords=[1,1.2,1.5,1.33];
  for(let i=0;i<steps;i++){const t=t0+i*st,k=i%16,bar=Math.floor(i/16)%4;
    if(beat.kick&&pat.kick.includes(k)){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(dest);o.start(t);o.stop(t+.3)}
    if(beat.clap&&pat.clap.includes(k))noise(t,.16,1200,.6);
    if(beat.hat&&pat.hat.includes(k))noise(t,.05,7000,.22);
    if(beat.bass&&pat.bass.includes(k))N(pat.note*chords[bar]*(k>=8?1.5:1),t,st*1.6,"sawtooth",.12);
  }
}
const mdLen=(pat,bars)=>bars*16*(60/pat.bpm/4);
/* a built-in track as a loop buffer (rendered once, then reused) */
async function mdBuiltBuffer(id){if(MD.bufs[id])return MD.bufs[id];const pat=MD.built.find(x=>x.id===id)||MD.built[0];
  const dur=mdLen(pat,4),ctx=new OfflineAudioContext(2,Math.ceil(44100*dur),44100);mdSchedule(ctx,ctx.destination,pat,0,64,{kick:1,clap:1,hat:1,bass:1});
  MD.bufs[id]=await ctx.startRendering();return MD.bufs[id]}

/* video to sound: reads the sound track of a video, mono, 22 kHz, at most 4 minutes */
async function mdVideoToAudio(file){
  if(file.size>250*1024*1024)throw new Error("This video is too big (over 250 MB). Use a shorter video.");
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw new Error("This phone cannot read the sound of a video.");
  const ab=await file.arrayBuffer();
  const ctx=new AC();let src;
  try{src=await ctx.decodeAudioData(ab)}catch(e){throw new Error("The sound of this video cannot be read. Try an MP4 video.")}
  finally{try{ctx.close()}catch(e){}}
  const secs=Math.min(src.duration,240);
  const off=new OfflineAudioContext(1,Math.max(1,Math.ceil(secs*22050)),22050);
  const b=off.createBufferSource();b.buffer=src;b.connect(off.destination);b.start(0);
  const out=await off.startRendering();
  return{blob:mdWav(out),secs:Math.min(secs,out.duration)};
}
/* WAV encoder for songs made in the beat maker */
function mdWav(buf){const ch=buf.numberOfChannels,sr=buf.sampleRate,len=buf.length,out=new DataView(new ArrayBuffer(44+len*ch*2));let p=0;const w=(s)=>{for(let i=0;i<s.length;i++)out.setUint8(p++,s.charCodeAt(i))};
  w("RIFF");out.setUint32(p,36+len*ch*2,true);p+=4;w("WAVE");w("fmt ");out.setUint32(p,16,true);p+=4;out.setUint16(p,1,true);p+=2;out.setUint16(p,ch,true);p+=2;out.setUint32(p,sr,true);p+=4;out.setUint32(p,sr*ch*2,true);p+=4;out.setUint16(p,ch*2,true);p+=2;out.setUint16(p,16,true);p+=2;w("data");out.setUint32(p,len*ch*2,true);p+=4;
  const chans=[];for(let c=0;c<ch;c++)chans.push(buf.getChannelData(c));for(let i=0;i<len;i++)for(let c=0;c<ch;c++){const v=Math.max(-1,Math.min(1,chans[c][i]));out.setInt16(p,v<0?v*0x8000:v*0x7FFF,true);p+=2}
  return new Blob([out],{type:"audio/wav"})}

/* ---------- playing music (preview, stories, posts) ---------- */
function mdStop(){for(const n of MD.nodes){try{n.stop?n.stop():n.pause&&n.pause()}catch(e){}}MD.nodes=[];MD.playId=null}
let mdCtx=null;const mdAC=()=>mdCtx||(mdCtx=new (window.AudioContext||window.webkitAudioContext)());
async function mdPlay(m,key){mdStop();if(!m)return;MD.playId=key||"x";
  try{
    if(m.b){const ctx=mdAC();if(ctx.state==="suspended")await ctx.resume();const buf=await mdBuiltBuffer(m.b);const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const g=ctx.createGain();g.gain.value=.8;s.connect(g).connect(ctx.destination);s.start(0);MD.nodes.push(s);return}
    if(m.l){const blob=await fcGet("song:"+m.l);if(!blob)return;const a=new Audio(URL.createObjectURL(blob));a.loop=true;a.play().catch(()=>{});MD.nodes.push(a);return}
    if(m.p){const url=await window.__signedAsset(m.p).catch(()=>null)||await srcURL({k:"m",id:m.p,t:m.t});const a=new Audio(url);a.loop=true;a.currentTime=+m.start||0;a.play().catch(()=>{});MD.nodes.push(a)}
  }catch(e){}}

/* ---------- selfie camera ---------- */
async function mdCamStart(){const c=MD.cam;if(!c)return;if(c.stream)c.stream.getTracks().forEach(t=>t.stop());
  try{c.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:c.facing,width:{ideal:720},height:{ideal:720}},audio:false});c.err="";const v=document.getElementById("mdVid");if(v){v.srcObject=c.stream;v.play().catch(()=>{})}}
  catch(e){c.err="The camera is not available. Allow the camera in your phone settings, then try again."}mdSync()}
function mdCamStop(){if(MD.cam&&MD.cam.stream)MD.cam.stream.getTracks().forEach(t=>t.stop())}
async function mdShot(){const c=MD.cam;const v=document.getElementById("mdVid");if(!c||!v||!v.videoWidth)return;
  const s=Math.min(v.videoWidth,v.videoHeight),cv=document.createElement("canvas");cv.width=720;cv.height=720;const x=cv.getContext("2d");
  const sx=(v.videoWidth-s)/2,sy=(v.videoHeight-s)/2;x.save();if(c.facing==="user"){x.translate(720,0);x.scale(-1,1)}x.drawImage(v,sx,sy,s,s,0,0,720,720);x.restore();
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));mdCamStop();MD.cam=null;MD.open=null;mdSync();
  mdUseSelfie(c,blob)}
function mdUseSelfie(c,blob){if(c.to==="chat"){v4SendFile(c.kind,c.target,blob,"selfie.jpg");return}
  if(c.to==="story"){const url=URL.createObjectURL(blob);F.sc={...(F.sc||{bg:"g0",text:""}),file:blob,url,video:false,d:0};feedSync();if(typeof render==="function")render();return}
  if(c.to==="post"){F.files.push({file:blob,url:URL.createObjectURL(blob),kind:"img"});render()}}

/* ---------- text on a photo ---------- */
async function mdEdOpen(src,to){const img=new Image();img.src=URL.createObjectURL(src);await img.decode().catch(()=>{});
  MD.ed={src,img,to,text:"",font:0,col:0,size:1,pos:2,pill:0,url:img.src};MD.open="ed";mdSync()}
function mdEdDraw(){const e=MD.ed;const cv=document.getElementById("mdEdCv");if(!e||!cv)return;const W=cv.width,H=cv.height,x=cv.getContext("2d");
  x.clearRect(0,0,W,H);const r=Math.min(W/e.img.naturalWidth,H/e.img.naturalHeight);const iw=e.img.naturalWidth*r,ih=e.img.naturalHeight*r;x.drawImage(e.img,(W-iw)/2,(H-ih)/2,iw,ih);
  if(e.text.trim()){const px=[46,64,88][e.size];x.font=`800 ${px}px ${MD_FONTS[e.font]}`;x.textAlign="center";x.textBaseline="middle";
    const words=e.text.split(/\s+/),lines=[];let cur="";for(const w of words){const t=cur?cur+" "+w:w;if(x.measureText(t).width>W*.82&&cur){lines.push(cur);cur=w}else cur=t}lines.push(cur);
    const lh=px*1.18,y0=e.pos===0?H*.22:e.pos===1?H/2:H*.8-(lines.length-1)*lh;
    if(e.pill){const w=Math.max(...lines.map(l=>x.measureText(l).width))+px*.9,h=lines.length*lh+px*.5;x.fillStyle="rgba(0,0,0,.45)";x.beginPath();x.roundRect?x.roundRect(W/2-w/2,y0-lh/2-px*.25,w,h,px*.4):x.rect(W/2-w/2,y0-lh/2-px*.25,w,h);x.fill()}
    x.lineWidth=Math.max(4,px/8);x.strokeStyle=e.col===1?"#fff":"rgba(0,0,0,.5)";x.fillStyle=MD_COLS[e.col];
    lines.forEach((l,i)=>{const y=y0+i*lh;if(!e.pill){x.strokeText(l,W/2,y);}x.fillText(l,W/2,y)})}}
async function mdEdDone(){const e=MD.ed;if(!e)return;const cv=document.getElementById("mdEdCv");mdEdDraw();
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));const url=URL.createObjectURL(blob);
  if(e.to==="story"&&F.sc){if(F.sc.url)URL.revokeObjectURL(F.sc.url);F.sc={...F.sc,file:blob,url,video:false}}
  else if(e.to==="post"){const last=[...F.files].reverse().find(f=>f.kind==="img");if(last){URL.revokeObjectURL(last.url);last.file=blob;last.url=url}}
  MD.ed=null;MD.open=null;mdSync();feedSync();render()}

/* ---------- music picker and beat maker ---------- */
function mdMusicHTML(){const built=MD.built.map((b,i)=>`<button type="button" class="md-song" data-v4="mdMusPick" data-b="${b.id}"><span class="md-disc">♪</span><b>${mdEsc(b.title)}</b><small class="muted">${b.bpm} BPM · English Classes Beats</small><span class="md-play" data-v4="mdPrev" data-b="${b.id}" role="button" aria-label="Preview">▶</span></button>`).join("");
  const mine=MD.songs.map((s,i)=>`<button type="button" class="md-song" data-v4="mdMusPick" data-i="${i}"><span class="md-disc">🎵</span><b>${mdEsc(s.title)}</b><small class="muted">My song</small></button>`).join("");
  return`<div class="md-sheet glass"><div class="md-top"><b>Add music</b><button type="button" class="iconbtn" data-v4="mdMusX" aria-label="Close">${ic("x")}</button></div>
  <p class="small muted">Music plays with your photo or video. Choose a beat, your own song, or upload a song.</p>
  <div class="md-sec"><span class="eyebrow">Beats</span>${built}</div>
  ${MD.songs.length?`<div class="md-sec"><span class="eyebrow">My songs</span>${mine}</div>`:""}
  <div class="md-actions"><button type="button" class="btn ghost sm" data-v4="mdBeat">${ic("spark")}Make my own song</button>
  <label class="btn ghost sm" style="cursor:pointer">${ic("file")}Upload a song<input type="file" id="mdSongFile" accept="audio/*,video/*" hidden></label></div></div>`}
function mdBeatHTML(){const b=MD.beat;const rows=[["kick","Kick"],["clap","Clap"],["hat","Hi-hat"],["bass","Bass"]];
  return`<div class="md-sheet glass md-beat"><div class="md-top"><b>Make my own song</b><button type="button" class="iconbtn" data-v4="mdBtX" aria-label="Close">${ic("x")}</button></div>
  <div class="md-tempo"><label class="small muted">Tempo <select id="mdBpm" data-v4="mdBpm">${[80,90,110,125].map(v=>`<option value="${v}" ${b.bpm===v?"selected":""}>${v} BPM</option>`).join("")}</select></label>
  <label class="small muted">Bass note <select id="mdNote" data-v4="mdNote">${[[55,"Low"],[65,"Mid"],[82,"High"],[49,"Deep"]].map(([v,l])=>`<option value="${v}" ${b.note===v?"selected":""}>${l}</option>`).join("")}</select></label></div>
  ${rows.map(([k,l])=>`<div class="md-row"><span>${l}</span><div class="md-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="md-step ${b.p[k].includes(i)?"on":""} ${i%4===0?"beat":""}" data-v4="mdBt" data-k="${k}" data-i="${i}" aria-pressed="${b.p[k].includes(i)}" aria-label="${l} step ${i+1}"></button>`).join("")}</div></div>`).join("")}
  <div class="md-actions"><button type="button" class="btn ghost sm" data-v4="mdBtPlay">${ic("speaker")}${b.playing?"Stop":"Listen"}</button>
  <input id="mdSongName" maxlength="30" placeholder="Song name" value="${mdEsc(b.name||"")}" aria-label="Song name" class="md-name">
  <button type="button" class="btn sm" data-v4="mdBtSave" ${b.busy?"disabled":""}>${ic("check")}${b.busy?"Saving…":"Save song"}</button></div></div>`}
function mdBeatPat(){const p=MD.beat.p;return{bpm:MD.beat.bpm,kick:p.kick,clap:p.clap,hat:p.hat,bass:p.bass,note:MD.beat.note}}
async function mdBeatPlay(){const b=MD.beat;if(b.playing){mdStop();b.playing=false;mdSync();return}
  const ctx=mdAC();if(ctx.state==="suspended")await ctx.resume();mdStop();b.playing=true;const s=ctx.createBufferSource();
  const off=new OfflineAudioContext(2,44100*mdLen(mdBeatPat(),2),44100);mdSchedule(off,off.destination,mdBeatPat(),0,32,{kick:1,clap:1,hat:1,bass:1});
  const buf=await off.startRendering();s.buffer=buf;s.loop=true;s.connect(ctx.destination);s.start();MD.nodes.push(s);mdSync()}
async function mdBeatSave(){const b=MD.beat;if(b.busy)return;const name=(document.getElementById("mdSongName")||{}).value||"My song";
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
  b.busy=true;mdSync();
  try{const off=new OfflineAudioContext(2,Math.ceil(44100*mdLen(mdBeatPat(),2)),44100);mdSchedule(off,off.destination,mdBeatPat(),0,32,{kick:1,clap:1,hat:1,bass:1});
    const buf=await off.startRendering();const wav=mdWav(buf);const title=name.trim().slice(0,60)||"My song",d=Math.round(buf.duration);
    let entry=null;
    if(navigator.onLine&&window.__chatFiles){try{const up=await window.__chatFiles.upload(wav,"song.wav");entry={title,p:up.p,t:up.t||"audio/wav",d,bpm:b.bpm}}catch(e){}}
    if(!entry){const id="l"+Date.now().toString(36);await fcPut("song:"+id,wav);entry={title,l:id,t:"audio/wav",d,bpm:b.bpm}}
    MD.songs.unshift(entry);mdSaveSongs();MD.beat=null;MD.open="music";toast(entry.p?"Song saved in My songs":"Saved on this phone: it is sent when you post it","check")}
  catch(e){b.busy=false;toast((e&&e.message)||"Could not save the song","x")}mdSync()}
function mdPick(m){MD.music=m;MD.open=null;mdStop();mdSync();render();feedSync()}

/* ---------- one host for all the overlays ---------- */
function mdHost(){let h=document.getElementById("mdhost");if(!h){h=document.createElement("div");h.id="mdhost";document.body.appendChild(h)}return h}
function mdSync(){const h=mdHost();let html="";
  if(MD.open==="cam"&&MD.cam){html=`<div class="md-over" role="dialog" aria-label="Selfie"><div class="md-cam glass"><div class="md-top"><b>Selfie</b><button type="button" class="iconbtn" data-v4="mdCamX" aria-label="Close">${ic("x")}</button></div>
    <div class="md-camv ${MD.cam.facing==="user"?"mir":""}">${MD.cam.err?`<p class="md-err">${mdEsc(MD.cam.err)}</p>`:`<video id="mdVid" autoplay playsinline muted></video>`}</div>
    <div class="md-actions"><button type="button" class="iconbtn" data-v4="mdFlip" aria-label="Switch camera">${ic("refresh")}</button><button type="button" class="md-shot" data-v4="mdShot" aria-label="Take the selfie"></button><span style="width:44px"></span></div></div></div>`}
  else if(MD.open==="ed"&&MD.ed){const e=MD.ed;const sw=(k,arr,lab)=>`<div class="md-sw">${arr.map((x,i)=>`<button type="button" class="${e[k]===i?"on":""}" data-v4="mdEdSet" data-k="${k}" data-n="${i}" aria-pressed="${e[k]===i}" aria-label="${lab} ${i+1}" ${k==="col"?`style="background:${x}"`:""}>${k==="col"?"":esc2(x)}</button>`).join("")}</div>`;
    html=`<div class="md-over" role="dialog" aria-label="Add text"><div class="md-ed glass"><div class="md-top"><b>Add text</b><button type="button" class="iconbtn" data-v4="mdEdX" aria-label="Close">${ic("x")}</button></div>
    <canvas id="mdEdCv" width="540" height="540"></canvas>
    <textarea id="mdEdTxt" maxlength="120" rows="2" placeholder="Type your words…" aria-label="Text on the photo">${mdEsc(e.text)}</textarea>
    ${sw("font",["Modern","Classic","Typewriter"],"Font")}${sw("col",MD_COLS,"Colour")}${sw("size",["S","M","L"],"Size")}${sw("pos",["Top","Middle","Bottom"],"Position")}
    <div class="md-actions"><button type="button" class="btn ghost sm" data-v4="mdEdPill">${e.pill?"Plain text":"Text on a background"}</button><button type="button" class="btn sm" data-v4="mdEdDone">${ic("check")}Done</button></div></div></div>`}
  else if(MD.open==="music"){html=`<div class="md-over" role="dialog" aria-label="Music">${mdMusicHTML()}</div>`}
  else if(MD.open==="beat"&&MD.beat){html=`<div class="md-over" role="dialog" aria-label="Beat maker">${mdBeatHTML()}</div>`}
  if(h._h!==html){h._h=html;h.innerHTML=html;h.classList.toggle("on",!!html);if(MD.open==="ed")mdEdDraw();if(MD.open==="cam"){if(MD.cam&&MD.cam.stream){const v=document.getElementById("mdVid");if(v){v.srcObject=MD.cam.stream;v.play().catch(()=>{})}}mdCamStart_v()}}
}
function esc2(s){return mdEsc(s)}
function mdCamStart_v(){if(!MD.cam||MD.cam.stream)return;mdCamStart()}

/* ---------- click + input wiring ---------- */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-v4]");if(!el)return;const k=el.dataset.v4;if(!/^md[A-Z]/.test(k)&&k!=="mdPrev")return;
  e.stopPropagation();
  switch(k){
    case"mdSelfie":{mdCamStop();MD.cam={to:el.dataset.to||"chat",kind:el.dataset.k,target:el.dataset.s,facing:"user",stream:null,err:""};MD.open="cam";mdSync();return}
    case"mdCamX":mdCamStop();MD.cam=null;MD.open=null;mdSync();return;
    case"mdFlip":if(MD.cam){MD.cam.facing=MD.cam.facing==="user"?"environment":"user";MD.cam.stream=null;mdCamStart()}return;
    case"mdShot":mdShot();return;
    case"mdText":{const to=el.dataset.to;let src=null;if(to==="story"&&F.sc&&F.sc.file&&!F.sc.video)src=F.sc.file;if(to==="post"){const im=[...F.files].reverse().find(f=>f.kind==="img");if(im)src=im.file}
      if(!src){toast("Add a photo first.","x");return}mdEdOpen(src,to);return}
    case"mdEdSet":{const ed=MD.ed;if(!ed)return;const n=+el.dataset.n;ed[el.dataset.k]=n;mdSync();return}
    case"mdEdPill":if(MD.ed){MD.ed.pill=MD.ed.pill?0:1;mdSync()}return;
    case"mdEdDone":mdEdDone();return;
    case"mdEdX":MD.ed=null;MD.open=null;mdSync();return;
    case"mdMusic":MD.open="music";mdSync();return;
    case"mdMusX":MD.open=null;mdStop();mdSync();return;
    case"mdMusPick":{if(el.dataset.b)return mdPick({b:el.dataset.b,title:(MD.built.find(x=>x.id===el.dataset.b)||{}).title||"Music",start:0,d:15});
      const s=MD.songs[+el.dataset.i];if(s)return mdPick(s.l?{l:s.l,t:s.t,title:s.title,start:0,d:Math.min(60,s.d||15)}:{p:s.p,t:s.t,title:s.title,start:0,d:Math.min(60,s.d||15)});return}
    case"mdPrev":{e.stopPropagation();const id=el.dataset.b;const cur=MD.playId==="prev:"+id;if(cur){mdStop();return}mdPlay({b:id},"prev:"+id);return}
    case"mdMusRm":MD.music=null;render();feedSync();return;
    case"mdBeat":MD.beat={bpm:110,note:55,p:{kick:[0,4,8,12],clap:[4,12],hat:[2,6,10,14],bass:[0]},playing:false,busy:false,name:""};MD.open="beat";mdSync();return;
    case"mdBtX":mdStop();MD.beat=null;MD.open="music";mdSync();return;
    case"mdBt":{const b=MD.beat;if(!b)return;const kk=el.dataset.k,i=+el.dataset.i,a=b.p[kk];const at=a.indexOf(i);if(at>=0)a.splice(at,1);else a.push(i);a.sort((x,y)=>x-y);mdSync();return}
    case"mdBtPlay":mdBeatPlay();return;
    case"mdBtSave":mdBeatSave();return;
    case"mdPlayPost":{const id=el.dataset.id,m=el.dataset.m?JSON.parse(el.dataset.m):null;if(MD.playId===id){mdStop();render();return}mdPlay(m,id);render();return}
  }},true);
document.addEventListener("change",e=>{const el=e.target;if(!el||el.id!=="mdSongFile")return;const f=el.files&&el.files[0];el.value="";if(!f)return;
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
  (async()=>{try{const name=String(f.name||"My song").replace(/\.[^.]+$/,"").slice(0,60);
    const isVid=/^video\//.test(f.type||"")||/\.(mp4|mov|webm|3gp|mkv|m4v)$/i.test(f.name||"");
    if(isVid){
      /* a video: keep only its sound, as a light mono WAV, to use as the music of a photo or video */
      toast("Turning the video into sound…","clock");
      const r=await mdVideoToAudio(f);
      toast("Uploading the sound…","clock");
      const up=await window.__chatFiles.upload(r.blob,"song.wav");
      MD.songs.unshift({title:name,p:up.p,t:"audio/wav",d:Math.max(1,Math.round(r.secs))});
    }else{
      toast("Uploading the song…","clock");const up=await window.__chatFiles.upload(f,f.name||"song.mp3");
      MD.songs.unshift({title:name,p:up.p,t:up.t||f.type||"audio/mpeg",d:30});
    }
    mdSaveSongs();MD.open="music";mdSync();toast("Song uploaded: pick it in My songs","check")}
  catch(err){toast((err&&err.message)||"Could not upload","x")}})()},true);
document.addEventListener("input",e=>{const el=e.target;if(el&&el.id==="mdEdTxt"&&MD.ed){MD.ed.text=el.value;mdEdDraw()}},true);
document.addEventListener("change",e=>{const el=e.target;if(el&&el.id==="mdBpm"&&MD.beat){MD.beat.bpm=+el.value;mdSync()}if(el&&el.id==="mdNote"&&MD.beat){MD.beat.note=+el.value;mdSync()}},true);
document.addEventListener("input",e=>{const el=e.target;if(el&&el.id==="mdSongName"&&MD.beat){MD.beat.name=el.value}},true);

/* ---------- composers: buttons added to the post and story composers ---------- */
const MD_TOOLS=(to)=>`<div class="md-tools" role="group" aria-label="Media tools">
  <button type="button" class="md-tool" data-v4="mdSelfie" data-to="${to}" aria-label="Take a selfie"><span>🤳</span>Selfie</button>
  <button type="button" class="md-tool" data-v4="mdMusic" aria-label="Add music"><span>🎵</span>Music</button>
  <button type="button" class="md-tool" data-v4="mdText" data-to="${to}" aria-label="Add text to the photo"><span>Aa</span>Text</button>
  ${MD.music?`<span class="md-chip-on">🎵 ${mdEsc(MD.music.title)} <button type="button" class="iconbtn sm" data-v4="mdMusRm" aria-label="Remove music">${ic("x")}</button></span>`:""}</div>`;
{const _fv=feedView;feedView=function(embedded){let h=_fv(embedded);const anchor='<div class="row between"><div class="row"><label class="btn ghost sm">';
  if(h.indexOf(anchor)>=0)h=h.replace(anchor,MD_TOOLS("post")+anchor);return h}}
{const _fc=fComposerHTML;fComposerHTML=function(){let h=_fc();const btn='<button type="button" class="btn sm" data-v4="fScPost"';
  if(h.indexOf(btn)>=0)h=h.replace(btn,MD_TOOLS("story")+btn);return h}}
/* chat composers (classmates and groups): a selfie button before the file button */
{const _bar=v4Bar;v4Bar=function(kind,target,ph){let h=_bar(kind,target,ph);
  const anchor='<span class="v4att">';if(h.indexOf(anchor)>=0&&(kind==="peer"||kind==="group")){
    h=h.replace(anchor,`<button type="button" class="iconbtn" data-v4="mdSelfie" data-to="chat" data-k="${kind}" data-s="${mdEsc(target)}" aria-label="Take a selfie" title="Selfie">🤳</button>`+anchor)}
  return h}}

/* ---------- music in the feed: posts show a player, stories play their song while they are shown ---------- */
{const _fp=fPostHTML;fPostHTML=function(p){const h=_fp(p);if(!p||!p.music)return h;
  const m=p.music,chip=`<div class="md-post-music"><button type="button" class="md-play-btn" data-v4="mdPlayPost" data-id="${p.id}" data-m="${mdEsc(JSON.stringify(m))}" aria-label="Play ${mdEsc(m.title||"music")}">${MD.playId===p.id?"❚❚":"▶"}</button><span>🎵 ${mdEsc(m.title||"Music")}</span></div>`;
  return h.replace(/^(<[^>]+>)/,`$1${chip}`)}}
{const _fs=fStoryHTML;fStoryHTML=function(){const h=_fs();return h}}
setInterval(()=>{if(!F.sv){if(MD.playId&&String(MD.playId).indexOf("story:")===0)mdStop();return}
  const c=fCur();const s=c&&c.s;if(!s)return;const key="story:"+(s.id||"");if(MD.playId===key)return;
  mdStop();if(s.music)mdPlay(s.music,key)},400);

/* ---------- posting: the music goes with the story or the post ---------- */
async function mdMusicReady(){if(!MD.music||!MD.music.l)return;const blob=await fcGet("song:"+MD.music.l);if(!blob)throw new Error("This song is not saved on this phone any more.");const up=await window.__chatFiles.upload(blob,"song.wav");MD.music={title:MD.music.title,p:up.p,t:up.t||"audio/wav",start:0,d:MD.music.d||15}}
{const _cr=window.__feed.create;window.__feed.create=async function(body,media,shared){
  if(!MD.music)return _cr(body,media,shared);await mdMusicReady();
  const up={p_body:body||"",p_media:media&&media.length?media:null,p_music:MD.music};if(shared)up.p_shared=shared;
  const { data, error }=await window.__sb.rpc("create_post",up);if(error)throw new Error(/create_post|music|schema/i.test(error.message||"")?"The teacher must first run supabase/musique.sql in Supabase.":(error.message||"Could not post"));MD.music=null;return data}}
{const _st=window.__feed.story;window.__feed.story=async function(media,body,bg,o){
  if(!MD.music)return _st(media,body,bg,o);await mdMusicReady();const o2=o||{};
  const { data, error }=await window.__sb.rpc("create_story",{p_media:media||null,p_body:body||"",p_bg:bg||"",p_music:MD.music,p_dur:o2.dur||5,p_aud:o2.aud||"all",p_hide:o2.hide||null});if(error)throw new Error(/create_story|music|schema/i.test(error.message||"")?"The teacher must first run supabase/musique.sql in Supabase.":(error.message||"Could not share the story"));MD.music=null;return data}}

/* ---------- images of the app: loaded through short-lived links ---------- */
const mdSigCache={};
function mdResolveImgs(root){(root||document).querySelectorAll("img[data-sig]:not([data-ok])").forEach(img=>{const id=img.dataset.sig;img.dataset.ok="1";
  if(!id||!window.__signedAsset)return;const go=u=>{img.src=u};
  if(mdSigCache[id])return go(mdSigCache[id]);window.__signedAsset(id).then(u=>{mdSigCache[id]=u;go(u)}).catch(()=>{})})}
new MutationObserver(()=>mdResolveImgs(document)).observe(document.body,{childList:true,subtree:true});
mdLoadSongs();
setTimeout(()=>mdResolveImgs(document),600);

{const st=document.createElement("style");st.textContent=`
#mdhost{position:fixed;inset:0;z-index:260;display:none}
#mdhost.on{display:grid;place-items:center;background:rgba(6,8,20,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:16px}
.md-over{width:100%;max-width:420px;max-height:92vh;overflow:auto}
.md-cam,.md-ed,.md-sheet{padding:16px;border-radius:26px;display:grid;gap:12px;background:linear-gradient(160deg,rgba(30,36,70,.96),rgba(14,17,36,.96));border:1px solid rgba(140,160,255,.25);box-shadow:0 30px 80px -20px rgba(60,80,220,.6),inset 0 1px 0 rgba(255,255,255,.08)}
.md-top{display:flex;align-items:center;gap:8px}.md-top b{flex:1;font-size:1.1rem}
.md-camv{position:relative;aspect-ratio:1;border-radius:22px;overflow:hidden;background:#0b0e1f;box-shadow:inset 0 0 40px rgba(0,0,0,.6)}
.md-camv video{width:100%;height:100%;object-fit:cover}.md-camv.mir video{transform:scaleX(-1)}
.md-err{padding:20px;text-align:center;color:#FFB4B4}
.md-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.md-shot{width:70px;height:70px;border-radius:50%;border:5px solid #fff;background:radial-gradient(circle at 35% 30%,#fff,#c9d2ff);box-shadow:0 0 0 4px rgba(108,128,255,.45),0 12px 30px rgba(108,128,255,.6);cursor:pointer}
.md-shot:active{transform:scale(.92)}
#mdEdCv{width:100%;height:auto;aspect-ratio:1;border-radius:20px;background:#111;box-shadow:0 18px 40px -16px #000}
#mdEdTxt,#mdSongName,#mdBpm,#mdNote{width:100%;border-radius:14px;padding:10px 12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit;font:inherit}
.md-sw{display:flex;gap:6px;flex-wrap:wrap}.md-sw button{min-width:38px;height:34px;padding:0 10px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;cursor:pointer;font:inherit;font-size:.82rem}
.md-sw button.on{box-shadow:0 0 0 3px rgba(108,128,255,.5);border-color:#8fa2ff}
.md-song{display:grid;grid-template-columns:auto 1fr auto;gap:2px 12px;align-items:center;width:100%;padding:10px 12px;margin-bottom:8px;border-radius:18px;background:linear-gradient(120deg,rgba(108,128,255,.18),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.1);color:inherit;font:inherit;text-align:left;cursor:pointer}
.md-song small{grid-column:2}
.md-disc{grid-row:span 2;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#6C80FF,#9A7CFF,#06D6A0,#6C80FF);box-shadow:0 8px 18px rgba(108,128,255,.5);font-size:1rem}
.md-play{grid-row:span 2;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);cursor:pointer}
.md-sec{display:grid;gap:4px}.md-sec .eyebrow{margin-bottom:4px}
.md-tempo{display:flex;gap:12px;flex-wrap:wrap}.md-tempo select{margin-left:6px;border-radius:10px;padding:6px 8px;background:rgba(255,255,255,.08);color:inherit;border:1px solid rgba(255,255,255,.15)}
.md-row{display:grid;grid-template-columns:54px 1fr;gap:6px;align-items:center}.md-row>span{font-size:.78rem;color:#aab3d6}
.md-steps{display:grid;grid-template-columns:repeat(16,1fr);gap:3px}
.md-step{height:26px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;padding:0}
.md-step.beat{border-color:rgba(255,255,255,.28)}
.md-step.on{background:linear-gradient(180deg,#8fa2ff,#5b6fe0);box-shadow:0 0 12px rgba(108,128,255,.7);border-color:#b7c3ff}
.md-name{flex:1;min-width:120px}
.md-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
.md-tool{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;border:1px solid var(--line,#d9deee);background:linear-gradient(160deg,#fff,#EEF2FF);font:inherit;font-size:.85rem;font-weight:700;cursor:pointer;box-shadow:0 6px 14px -8px rgba(60,80,200,.6);transition:transform .15s}
.md-tool:hover{transform:translateY(-2px)}.md-tool span{font-size:1rem}
.md-chip-on{display:inline-flex;align-items:center;gap:6px;padding:4px 6px 4px 12px;border-radius:999px;background:#6C80FF;color:#fff;font-weight:700;font-size:.85rem}
.md-post-music{display:flex;align-items:center;gap:10px;margin:8px 0;padding:8px 12px;border-radius:16px;background:linear-gradient(120deg,#EEF2FF,#F8F4FF);color:#222;font-weight:700}
.md-play-btn{width:36px;height:36px;border-radius:50%;border:0;background:linear-gradient(135deg,#6C80FF,#9A7CFF);color:#fff;cursor:pointer;box-shadow:0 8px 16px rgba(108,128,255,.45)}
.md-song .md-play{color:inherit}
`;document.head.appendChild(st)}
