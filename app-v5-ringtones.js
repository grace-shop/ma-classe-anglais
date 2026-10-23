/* =====================================================================
   v5 · Ringtones. 5 call tones (repeating ring) and 5 notification
   sounds (1 to 3 s), all made at runtime with the Web Audio API, so they
   work offline and need no audio files. The choice is kept per device.
   ===================================================================== */
const RT_KEY={call:"ec_rt_call",notif:"ec_rt_notif"};
const RT_DEF={call:"classic",notif:"two"};

/* one note: an oscillator from f0 (to f1 if given) over len seconds, with a short attack and a smooth release */
function rtNote(ctx,t0,f0,len,vol,opt){
  opt=opt||{};
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=opt.type||"sine";
  o.frequency.setValueAtTime(f0,t0);
  if(opt.f1)o.frequency.exponentialRampToValueAtTime(opt.f1,t0+len);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(vol,t0+(opt.attack||0.012));
  g.gain.exponentialRampToValueAtTime(0.0001,t0+len);
  o.connect(g).connect(ctx.destination);
  o.start(t0);o.stop(t0+len+0.05)}

/* call tones: play(ctx,t) schedules ONE ring starting at t; the ring repeats every `period` seconds */
const RT_CALL=[
  {id:"classic",name:"Classic",period:1.5,play(c,t){rtNote(c,t,880,0.6,0.25,{attack:0.05})}},
  {id:"dual",name:"Phone ring",period:3,play(c,t){for(const s of[0,0.6]){rtNote(c,t+s,440,0.4,0.18);rtNote(c,t+s,480,0.4,0.18)}}},
  {id:"rise",name:"Rising",period:2,play(c,t){[523,659,784,1047].forEach((f,i)=>rtNote(c,t+i*0.12,f,0.3,0.2,{type:"triangle"}))}},
  {id:"chimes",name:"Chimes",period:2.6,play(c,t){for(const[s,f]of[[0,1397],[0.9,1319]]){rtNote(c,t+s,f,1,0.2);rtNote(c,t+s,f*2,0.5,0.05)}}},
  {id:"pulse",name:"Pulse",period:1.4,play(c,t){for(const s of[0,0.14,0.28])rtNote(c,t+s,1200,0.09,0.08,{type:"square",attack:0.004})}}
];

/* notification sounds: play(ctx,t) plays one sound of 1 to 1.6 s */
const RT_NOTIF=[
  {id:"two",name:"Two notes",play(c,t){rtNote(c,t,880,0.5,0.22);rtNote(c,t+0.13,1318,0.9,0.2)}},
  {id:"bubble",name:"Bubble",play(c,t){rtNote(c,t,400,0.35,0.22,{f1:1200});rtNote(c,t+0.3,600,0.7,0.2,{f1:1600})}},
  {id:"ding",name:"Ding",play(c,t){rtNote(c,t,1760,1.4,0.22);rtNote(c,t,3520,0.6,0.05)}},
  {id:"harp",name:"Harp",play(c,t){[1047,880,698,523].forEach((f,i)=>rtNote(c,t+i*0.1,f,0.9,0.18))}},
  {id:"low",name:"Low tone",play(c,t){rtNote(c,t,330,0.5,0.25,{type:"triangle"});rtNote(c,t+0.45,262,0.9,0.25,{type:"triangle"})}}
];
const RT_LIST={call:RT_CALL,notif:RT_NOTIF};

/* the saved choice (per device); falls back to the default if storage is blocked or the id is unknown */
function rtGet(kind){
  try{const v=localStorage.getItem(RT_KEY[kind]);if(v&&RT_LIST[kind].some(x=>x.id===v))return v}catch(e){}
  return RT_DEF[kind]}
function rtSet(kind,id){try{localStorage.setItem(RT_KEY[kind],id)}catch(e){}}
function rtTone(kind){const id=rtGet(kind);return RT_LIST[kind].find(x=>x.id===id)||RT_LIST[kind][0]}

/* used by the app: the ring of an incoming call, and a notification sound */
function rtCallPlay(ctx,t){try{rtTone("call").play(ctx,t)}catch(e){}}
function rtCallPeriod(){return rtTone("call").period*1000}
function rtNotifPlay(ctx,t){try{rtTone("notif").play(ctx,t)}catch(e){}}

/* settings: two pickers, each row with a preview button */
function rtPickersHTML(){
  const group=(kind,title)=>{const cur=rtGet(kind);
    return `<div class="rt-group"><b class="small">${title}</b>`+RT_LIST[kind].map(t=>{const on=t.id===cur;
      return `<div class="secrow rt-row"><button type="button" class="linkbtn rt-pick" data-rt-pick="${kind}" data-id="${t.id}" aria-pressed="${on}">${on?ic("check"):""}<span>${esc(t.name)}${on?" (selected)":""}</span></button><button type="button" class="btn ghost sm" data-rt-play="${kind}" data-id="${t.id}" aria-label="Preview ${esc(t.name)}">${ic("speaker")}Preview</button></div>`}).join("")+`</div>`};
  return group("call","Call ringtone")+group("notif","Notification sound")}

document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-rt-pick],[data-rt-play]");if(!b)return;
  e.preventDefault();
  const kind=b.dataset.rtPick||b.dataset.rtPlay,id=b.dataset.id;
  if(!RT_LIST[kind]||!RT_LIST[kind].some(x=>x.id===id))return;
  if(b.dataset.rtPick){rtSet(kind,id);render();return}
  /* preview: play one ring or one sound now, even if sound is off */
  try{const ctx=nAudio();if(!ctx)return;const T=RT_LIST[kind].find(x=>x.id===id);T.play(ctx,ctx.currentTime+0.02)}catch(er){}
},false);
