/* =====================================================================
   v5 · pro layer (loads last, so its functions replace the earlier ones)
   - Story composer: a clear full-screen layout. The photo or video is
     shown whole (never zoomed), the tools sit in a dock at the bottom,
     nothing covers the face, and every control is tappable.
   - Music sheet: choosing a song keeps the sheet open, so you can cut it
     right away with the same timeline as the video cut. "Done" closes it.
   - Safe areas: the top bars of full-screen editors sit below the phone's
     status bar.
   ===================================================================== */

{const st=document.createElement("style");st.id="zprocss";st.textContent=`
@keyframes zcOrb{0%{transform:translate3d(-4%,-2%,0) scale(1)}100%{transform:translate3d(5%,4%,0) scale(1.12)}}
@keyframes zcFloat{0%,100%{transform:perspective(1000px) rotateX(5deg) rotateY(-3deg) translateY(0)}50%{transform:perspective(1000px) rotateX(3deg) rotateY(3deg) translateY(-6px)}}
@keyframes zcShine{0%{background-position:-120% 0}100%{background-position:220% 0}}
@keyframes zcIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* ---------- story composer ---------- */
.zc{position:fixed;inset:0;z-index:96;display:flex;flex-direction:column;color:#fff;background:#060817;overflow:hidden;animation:zcIn .35s cubic-bezier(.2,.8,.2,1) both}
.zc::before{content:"";position:absolute;inset:-25%;pointer-events:none;z-index:0;filter:blur(40px);opacity:.9;
  background:radial-gradient(38% 30% at 18% 14%,rgba(94,234,212,.42),transparent 70%),radial-gradient(42% 34% at 88% 26%,rgba(129,140,248,.46),transparent 70%),radial-gradient(52% 40% at 50% 100%,rgba(244,114,182,.28),transparent 70%);animation:zcOrb 16s ease-in-out infinite alternate}
.zc>*{position:relative;z-index:1}
.zc-top{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 44px) 16px 10px}
.zc-title{flex:1;text-align:center;font-size:1.02rem;font-weight:800;letter-spacing:.01em;text-shadow:0 2px 14px rgba(94,234,212,.35)}
.zc-glass{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.04));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 12px 24px -12px #000;flex:none}
.zc-glass .sx-svg{width:20px;height:20px}
.zc-glass-sp{width:46px;flex:none}
.zc-stage{flex:1;min-height:0;display:grid;place-items:center;padding:4px 18px 12px;perspective:1100px}
.zc-card{position:relative;height:min(100%,60vh);max-width:100%;aspect-ratio:9/16;border-radius:30px;overflow:hidden;background:#0A0D20;isolation:isolate;
  box-shadow:0 0 0 1px rgba(255,255,255,.16),0 40px 80px -30px rgba(0,0,0,.95),0 0 70px -12px rgba(94,234,212,.4);animation:zcFloat 8s ease-in-out infinite;transform-style:preserve-3d}
.zc-under{position:absolute;inset:-12%;background-size:cover;background-position:center;filter:blur(26px) saturate(1.5);opacity:.75;z-index:0}
.zc-main{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1;display:block;background:transparent}
.zc-gloss{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(125deg,rgba(255,255,255,.22),transparent 36%,transparent 64%,rgba(255,255,255,.12));background-size:250% 100%;animation:zcShine 6s linear infinite}
.zc-over{position:absolute;left:12px;right:12px;bottom:14px;z-index:3;width:auto;min-height:48px;max-height:30%;resize:none;border:1px solid rgba(255,255,255,.22);border-radius:18px;padding:12px 14px;font:inherit;font-size:.95rem;color:#fff;background:rgba(8,10,28,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-sizing:border-box;outline:none}
.zc-over::placeholder,.zc-big::placeholder{color:rgba(255,255,255,.6)}
.zc-textcard{aspect-ratio:9/16}
.zc-big{position:absolute;inset:0;z-index:3;width:100%;height:100%;padding:28% 26px;border:0;outline:none;resize:none;background:transparent;color:#fff;font:inherit;font-size:1.55rem;font-weight:800;line-height:1.3;text-align:center;box-sizing:border-box;text-shadow:0 6px 24px rgba(0,0,0,.35)}
.zc-dock{margin-top:auto;display:grid;gap:12px;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px);border-radius:30px 30px 0 0;background:linear-gradient(180deg,rgba(26,30,68,.78),rgba(7,9,26,.96));backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,.14);box-shadow:0 -24px 60px -24px rgba(0,0,0,.85);max-height:60vh;overflow:auto}
.zc-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.zc-lab{display:inline-flex;align-items:center;gap:7px;font-size:.8rem;font-weight:800;opacity:.92}
.zc-lab .sx-svg{width:16px;height:16px}
.zc-seg{display:inline-flex;padding:4px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}
.zc-seg button{border:0;background:transparent;color:rgba(255,255,255,.8);font:inherit;font-size:.82rem;font-weight:800;padding:8px 13px;border-radius:999px;cursor:pointer;white-space:nowrap}
.zc-seg button.on{background:linear-gradient(120deg,#5EEAD4,#818CF8);color:#06201C;box-shadow:0 8px 18px -8px rgba(94,234,212,.9),inset 0 1px 0 rgba(255,255,255,.5)}
.zc-hide{display:grid;gap:4px;font-size:.8rem;font-weight:800}
.zc-hide select{font:inherit;color:#fff;background:rgba(8,10,28,.7);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:12px}
.zc-hide select option{color:#111}
.zc-hide small{font-weight:500;opacity:.7}
.zc-track{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 8px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-size:.88rem;font-weight:800}
.zc-track .sx-track-ic{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#5EEAD4,#818CF8);color:#06201C;flex:none}
.zc-track .sx-track-ic .sx-svg{width:16px;height:16px}
.zc-track b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zc-track button{border:0;background:rgba(255,255,255,.15);color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;display:grid;place-items:center;flex:none}
.zc-sw{display:flex;gap:10px;justify-content:center}
.zc-swb{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:var(--c);cursor:pointer;box-shadow:inset 0 2px 4px rgba(255,255,255,.4),0 6px 12px -6px #000;transition:transform .2s}
.zc-swb.on{border-color:#fff;transform:scale(1.15)}
.zc-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.zc-tool{display:grid;justify-items:center;gap:7px;border:0;background:transparent;color:#fff;font:inherit;font-size:.74rem;font-weight:800;cursor:pointer;padding:6px 0;touch-action:manipulation}
.zc-orb{position:relative;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:#06201C;
  background:radial-gradient(circle at 32% 26%,#E8FFFA 0%,#8EF6E4 22%,#5EEAD4 48%,#6D8BFF 82%,#7C6CFF 100%);
  box-shadow:inset 0 -6px 10px rgba(20,30,90,.35),inset 0 3px 6px rgba(255,255,255,.7),0 14px 22px -10px rgba(94,234,212,.9),0 0 0 1px rgba(255,255,255,.2);transition:transform .2s}
.zc-orb .sx-svg{width:22px;height:22px;stroke:#06201C;filter:drop-shadow(0 1px 0 rgba(255,255,255,.5))}
.zc-tool:active .zc-orb{transform:scale(.92) translateY(2px)}
.zc-tool:hover .zc-orb{transform:translateY(-2px)}
.zc-share{position:relative;overflow:hidden;height:58px;border:0;border-radius:22px;font:inherit;font-size:1.02rem;font-weight:900;color:#06201C;cursor:pointer;
  background:linear-gradient(110deg,#5EEAD4 0%,#B8FFF2 30%,#818CF8 60%,#5EEAD4 100%);background-size:220% 100%;animation:zcShine 5s linear infinite;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -6px 12px rgba(20,30,90,.25),0 18px 30px -14px rgba(94,234,212,.95)}
.zc-share:disabled{opacity:.6;cursor:default}
.zc-share:active{transform:translateY(2px)}

/* the story viewer shows a whole video, never a zoomed one */
.fsv-media video,.fsv-media img{object-fit:contain!important}

/* ---------- full-screen editors: below the status bar ---------- */
.edt5{padding-top:calc(env(safe-area-inset-top,0px) + 40px)!important}
.edt5-top .edt5-btn{backdrop-filter:blur(14px)}

/* ---------- music sheet ---------- */
#mdhost>*{z-index:200}
.zs-card{display:grid;gap:10px;padding:14px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.zs-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.86rem}
.zs-head b{flex:1;font-size:.95rem}
.zs-head span{font-variant-numeric:tabular-nums;font-weight:800;color:#8EF6E4}
.tl-music{height:74px;border-radius:16px;background:#0B0D22}
.tl-wave{position:absolute;inset:0;display:flex;align-items:center;gap:2px;padding:8px 6px;box-sizing:border-box;pointer-events:none}
.tl-wave i{flex:1 1 0;min-width:1px;border-radius:3px;background:linear-gradient(180deg,#8EF6E4,#818CF8);opacity:.85}
.tl-music .tl-win{background:rgba(94,234,212,.12)}
.tl-music .tl-dim{background:rgba(3,4,14,.7)}
.tl-loading{display:grid;place-items:center;color:#fff;opacity:.7;font-size:.85rem}
.zs-done{display:grid;margin-top:4px}
`;document.head.appendChild(st)}

/* ---------- story composer: the layout ---------- */
function scDockOpts(c,media){
  const dur=media&&c.video?"":`<div class="zc-row"><span class="zc-lab">${sxIc("spark")}Show for</span>
      <div class="zc-seg" role="group" aria-label="How long">${SC_DURS.map(n=>`<button type="button" class="${(c.dur||5)===n?"on":""}" data-v4="scDur" data-n="${n}" aria-pressed="${(c.dur||5)===n}">${n} s</button>`).join("")}</div></div>`;
  const aud=`<div class="zc-row"><span class="zc-lab">${sxIc("up")}Who sees it</span>
      <div class="zc-seg" role="group" aria-label="Who sees it">
        <button type="button" class="${c.aud!=="hide"?"on":""}" data-v4="scAud" data-a="all" aria-pressed="${c.aud!=="hide"}">Everyone</button>
        <button type="button" class="${c.aud==="hide"?"on":""}" data-v4="scAud" data-a="hide" aria-pressed="${c.aud==="hide"}">All except one</button></div></div>
    ${c.aud==="hide"?`<label class="zc-hide"><span>Hide from</span><select id="sc_hide"><option value="">${c.peers?"Choose a classmate…":"Loading classmates…"}</option>${(c.peers||[]).map(p=>`<option value="${esc(p.uid)}" ${c.hide===p.uid?"selected":""}>${esc(p.name||"Student")}</option>`).join("")}</select><small>This person will not see the story at all.</small></label>`:""}`;
  return dur+aud}

function fComposerHTML(){
  const c=F.sc,media=!!c.url;
  const track=MD.music&&!MD.music.b?`<div class="zc-track"><span class="sx-track-ic">${sxIc("note")}</span><b>${mdEsc(sxName(MD.music,0))}</b><button type="button" data-v4="mdMusRm" aria-label="Remove music">${sxIc("x")}</button></div>`:"";
  const bgs=!media?`<div class="zc-sw">${SBG.map((b,i)=>`<button type="button" class="zc-swb ${c.bg==="g"+i?"on":""}" style="--c:${b}" data-v4="fScBg" data-i="${i}" aria-label="Colour ${i+1}" aria-pressed="${c.bg==="g"+i}"></button>`).join("")}</div>`:"";
  const card=media?`<div class="zc-card">
      <div class="zc-under" style="${c.video?"background:linear-gradient(135deg,#5EEAD4,#818CF8 55%,#F472B6)":`background-image:url('${c.url}')`}"></div>
      ${c.video?`<video class="zc-main" src="${c.url}" autoplay muted loop playsinline></video>`:`<img class="zc-main" src="${c.url}" alt="">`}
      <div class="zc-gloss"></div>
      <textarea id="fsc_text" class="zc-over" maxlength="300" placeholder="Add a caption…">${esc(c.text||"")}</textarea>
    </div>`:`<div class="zc-card zc-textcard" style="background:${sbg(c.bg)}">
      <textarea id="fsc_text" class="zc-big" maxlength="300" placeholder="Type your story in English…">${esc(c.text||"")}</textarea>
      <div class="zc-gloss"></div></div>`;
  return`<div class="zc" role="dialog" aria-label="New story">
    <div class="zc-top"><button type="button" class="zc-glass" data-v4="fScX" aria-label="Close">${sxIc("x")}</button><b class="zc-title">New story</b><span class="zc-glass-sp"></span></div>
    <div class="zc-stage">${card}</div>
    <div class="zc-dock">
      ${scDockOpts(c,media)}
      ${track}
      ${bgs}
      <div class="zc-tools">
        <label class="zc-tool"><span class="zc-orb">${sxIc("camera")}</span><span>${media?"Change":"Photo / video"}</span><input type="file" id="fsc_file" accept="image/*,video/*" hidden></label>
        <button type="button" class="zc-tool" data-v4="mdSelfie" data-to="story"><span class="zc-orb">${sxIc("selfie")}</span><span>Selfie</span></button>
        <button type="button" class="zc-tool" data-v4="mdMusic"><span class="zc-orb">${sxIc("music")}</span><span>Music</span></button>
        <button type="button" class="zc-tool" data-v4="mdText" data-to="story"><span class="zc-orb">${sxIc("text")}</span><span>Text</span></button>
      </div>
      <button type="button" class="zc-share" data-v4="fScPost" ${c.busy?"disabled":""}><span>${c.busy?"Posting…":"Share story"}</span></button>
    </div></div>`}

/* ---------- music: choosing a song keeps the sheet open, so it can be cut ---------- */
function mdPick(m){MD.music=m;mdStop();if(m&&!m.b&&m.start==null)m.start=0;mdSync();render();feedSync()}

function sxCutHTML(){const m=MD.music;if(!m||m.b)return"";
  if(!m.dur){mdCutProbe(m);return`<div class="zs-card"><div class="zs-head"><b>Cut the song</b></div><div class="tl tl-music tl-loading">Loading the song…</div></div>`}
  if(m.p||m.l){if(m.peaks||SX_PK[m.l||m.p])m.peaks=m.peaks||SX_PK[m.l||m.p];else sxPeaks(m)}
  const dur=m.dur,L=Math.max(1,Math.min(m.d||15,dur,60)),st=Math.max(0,Math.min(m.start||0,dur-L));
  m.d=L;m.start=st;
  const pk=m.peaks||null,seed=(m.title||"x").length;
  const bars=Array.from({length:60},(_,i)=>{const v=pk?pk[Math.floor(i*pk.length/60)]:sxFake(seed,i);return`<i style="height:${Math.max(12,Math.round(v*100))}%"></i>`}).join("");
  const pct=v=>(v/dur*100).toFixed(3)+"%";
  const opts=[5,10,15,30,60].filter(x=>x<=Math.ceil(dur)||x===5);
  return`<div class="zs-card">
    <div class="zs-head"><b>Cut the song</b><span id="sxS">${mdFmtSec(st)}</span><span>→</span><span id="sxE">${mdFmtSec(st+L)}</span></div>
    <div class="tl tl-music" id="sxWf" data-dur="${dur}">
      <div class="tl-wave" aria-hidden="true">${bars}</div>
      <div class="tl-win" id="sxSel" style="left:${pct(st)};width:${pct(L)}"><span class="tl-h l"></span><span class="tl-h r"></span></div>
    </div>
    <div class="sx-lens zc-seg" style="justify-self:start">${opts.map(x=>`<button type="button" class="${Math.round(L)===x?"on":""}" data-sx="len" data-n="${x}">${x}s</button>`).join("")}</div>
    <p class="tl-hint" style="margin:0;font-size:.8rem;opacity:.72;color:#fff;text-align:center">Drag the edges to choose the part. Drag the middle to move it.</p>
  </div>`}

function mdMusicHTML(){
  const beats=MD.built.map((b,i)=>`<div class="sx-beat" role="button" tabindex="0" data-v4="mdMusPick" data-b="${b.id}">
      <span class="sx-disc" style="--h:${(i*67)%360}">${sxIc("note")}</span>
      <span class="sx-bt"><b>${mdEsc(b.title)}</b><small>${b.bpm} BPM</small></span>
      <button type="button" class="sx-play" data-v4="mdPrev" data-b="${b.id}" aria-label="Preview ${mdEsc(b.title)}">${sxIc("play")}</button></div>`).join("");
  const mine=MD.songs.map((s,i)=>`<button type="button" class="sx-song ${MD.music&&MD.music.l===s.l?"on":""}" data-v4="mdMusPick" data-i="${i}">
      <span class="sx-disc mine">${sxIc("wave")}</span><span class="sx-bt"><b>${mdEsc(sxName(s,i))}</b><small>Your song</small></span>${sxIc("chev","sx-go")}</button>`).join("");
  return`<div class="md-sheet sx-sheet" role="dialog" aria-label="Add music">
    <div class="sx-head"><div><span class="sx-eyebrow">Music</span><b class="sx-title">Add music</b></div><button type="button" class="sx-glass" data-v4="mdMusX" aria-label="Close">${sxIc("x")}</button></div>
    <p class="sx-sub">Pick a beat or one of your songs. Then cut the part you want.</p>
    ${sxCutHTML()}
    <div class="sx-sec"><span class="sx-lab">Beats</span><div class="sx-grid">${beats}</div></div>
    ${MD.songs.length?`<div class="sx-sec"><span class="sx-lab">My songs</span><div class="sx-list">${mine}</div></div>`:""}
    <div class="sx-actions">
      <button type="button" class="sx-pill" data-v4="mdBeat">${sxIc("spark")}<span>Make my own song</span></button>
      <label class="sx-pill alt">${sxIc("up")}<span>Upload a song</span><input type="file" id="mdSongFile" accept="audio/*,video/*" hidden></label>
    </div>
    <div class="zs-done"><button type="button" class="zc-share" data-v4="mdMusX">Done</button></div></div>`}
