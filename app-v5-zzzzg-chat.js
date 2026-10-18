/* =====================================================================
   v5 · Chat and photo polish
   - Photos in the teacher chat open in a full-screen viewer inside the app
     (no new browser tab). Tap to zoom, tap outside or × to close.
   - Teacher chat (#profSheet): refined bubbles, auto-reply tag, composer.
   - Classmate photo preview: full-screen, image centred and fully visible.
   - Phone top bar: spans the screen width.
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzgchat")) return;
  var st = document.createElement("style");
  st.id = "zzzzgchat";
  st.textContent = `
/* ---- Full-screen photo viewer ---- */
#zzPhoto{position:fixed;inset:0;z-index:400;background:rgba(3,4,12,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);display:grid;place-items:center;padding:max(64px,env(safe-area-inset-top,0px)+54px) 12px max(24px,env(safe-area-inset-bottom,0px));box-sizing:border-box;animation:zzFade .25s ease both!important}
#zzPhoto img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);transition:transform .25s ease;cursor:zoom-in;user-select:none;-webkit-user-drag:none}
#zzPhoto.z img{transform:scale(2);cursor:zoom-out}
#zzPhoto .zzx{position:absolute;top:max(14px,env(safe-area-inset-top,0px));right:14px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(20,24,48,.75);color:#fff;font-size:1.4rem;line-height:1;cursor:pointer;display:grid;place-items:center}
#zzPhoto .zzcap{position:absolute;left:16px;top:max(24px,env(safe-area-inset-top,0px));color:#C9CEE8;font:600 .9rem Manrope,system-ui,sans-serif;max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ---- Classmate photo: the picture is placed by the viewer, not shifted by a centring offset ---- */
#docvBody.docv-pic .docv-img:not([style*="translate("]){transform:none!important}
/* ---- Teacher chat ---- */
#profSheet{background:radial-gradient(120% 60% at 50% -10%,#1F2A66 0%,#0E1330 55%,#080B1C 100%)!important}
#profSheet .pt-head{background:rgba(14,18,44,.72)!important;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid rgba(140,160,255,.14)!important;padding-top:max(12px,env(safe-area-inset-top,0px))!important;padding-bottom:12px!important}
#profSheet .pt-back{width:44px;height:44px;padding:0!important;border-radius:16px!important;display:grid;place-items:center;background:rgba(110,130,255,.14)!important;border:1px solid rgba(140,160,255,.28)!important}
#profSheet .pt-head b{font-size:1.05rem!important;letter-spacing:.005em}
#profSheet .pt-head small{color:#AEB8E2!important;font-size:.8rem!important;white-space:normal!important}
#profSheet .pt-body{padding:18px 14px 12px!important;gap:12px!important;scroll-behavior:smooth}
#profSheet .pt-row{max-width:84%!important}
#profSheet .pt-bub{font-size:.97rem;letter-spacing:.005em;box-shadow:0 10px 26px -14px rgba(0,0,0,.7);transition:transform .2s}
#profSheet .them .pt-bub{background:linear-gradient(165deg,#222C5E 0%,#171E45 100%)!important;border:1px solid rgba(150,170,255,.22)!important;border-radius:22px 22px 22px 8px!important;padding:12px 15px!important;color:#EEF1FF}
#profSheet .me .pt-bub{background:linear-gradient(135deg,#7BF0D0 0%,#5FD4FF 55%,#8FA6FF 100%)!important;color:#05211B!important;border-radius:22px 22px 8px 22px!important;padding:12px 15px!important;box-shadow:0 14px 34px -12px rgba(91,210,255,.55)!important;font-weight:500}
#profSheet .pt-meta{display:flex;align-items:center;gap:8px;font-size:.72rem!important;color:#8E98C4!important;margin-top:6px!important;padding:0 4px}
#profSheet .pt-auto{margin-left:0!important;padding:3px 10px!important;border-radius:999px!important;background:linear-gradient(135deg,rgba(127,140,255,.35),rgba(143,166,255,.18))!important;color:#E4E9FF!important;font-size:.7rem!important;font-weight:700!important;letter-spacing:.02em;border:1px solid rgba(160,176,255,.3)}
#profSheet .pt-img{width:100%!important;max-width:280px!important;border-radius:18px!important;border:1px solid rgba(150,170,255,.22);box-shadow:0 14px 30px -14px rgba(0,0,0,.7)}
#profSheet .pt-foot{background:rgba(14,18,44,.78)!important;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-top:1px solid rgba(140,160,255,.14)!important;padding:12px 12px max(14px,env(safe-area-inset-bottom,0px))!important;gap:10px!important;align-items:flex-end!important}
#profSheet .pt-foot textarea{border-radius:22px!important;padding:12px 16px!important;background:#0B1028!important;border:1px solid rgba(140,160,255,.26)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);font-size:.97rem;line-height:1.4}
#profSheet .pt-foot textarea:focus{outline:none;border-color:rgba(127,190,255,.7)!important;box-shadow:0 0 0 4px rgba(91,210,255,.14)}
#profSheet .pt-foot .pt-send{width:50px!important;height:50px!important;min-width:50px;padding:0!important;border-radius:50%!important;display:grid;place-items:center;box-shadow:0 12px 26px -10px rgba(91,210,255,.8)}
#profSheet .pt-foot .pt-send:active{transform:scale(.94)}

/* ---- Top bar: the icon row scrolls inside the bar instead of being cut at both edges ---- */
@media (max-width:1099px){
  body header.top .hdr-right{flex:1 1 auto;min-width:0;flex-wrap:nowrap!important;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;justify-content:flex-start;gap:6px;padding:2px 4px 2px 10px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%)}
  body header.top .hdr-right::-webkit-scrollbar{display:none}
  body header.top .hdr-right>*{flex:0 0 auto}
}

/* ---- Teacher chat: glass bubbles, soft light, glowing composer ---- */
#profSheet .pt-body{background:radial-gradient(60% 40% at 92% 8%,rgba(91,210,255,.16),transparent 70%),radial-gradient(55% 35% at 4% 92%,rgba(154,124,255,.18),transparent 70%),radial-gradient(rgba(160,176,255,.10) 1px,transparent 1.4px) 0 0/22px 22px,transparent!important}
#profSheet .them .pt-bub{background:linear-gradient(160deg,rgba(40,50,108,.78),rgba(20,26,66,.82))!important;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 0 1px rgba(140,160,255,.10),0 22px 44px -20px rgba(70,90,255,.55)!important}
#profSheet .me .pt-bub{background:linear-gradient(135deg,#8CF5DA 0%,#5FD4FF 50%,#9AA8FF 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 0 0 1px rgba(255,255,255,.12),0 18px 40px -14px rgba(91,210,255,.7)!important}
#profSheet .pt-head{background:linear-gradient(180deg,rgba(24,30,70,.9),rgba(12,15,36,.78))!important;box-shadow:0 14px 34px -18px rgba(90,120,255,.55)}
#profSheet .pt-head b{background:linear-gradient(90deg,#FFFFFF,#CFE0FF 60%,#B9C7FF);-webkit-background-clip:text;background-clip:text;color:transparent!important}
#profSheet .pt-foot{background:linear-gradient(180deg,rgba(12,15,36,.7),rgba(10,13,30,.94))!important;box-shadow:0 -18px 40px -22px rgba(90,120,255,.45)}
#profSheet .pt-foot textarea{box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 0 1px rgba(140,160,255,.14),0 12px 30px -16px rgba(91,210,255,.35)!important}
#profSheet .pt-foot .pt-send{background:linear-gradient(135deg,#8CF5DA,#5FD4FF 55%,#9AA8FF)!important;box-shadow:0 0 0 4px rgba(91,210,255,.14),0 14px 30px -8px rgba(91,210,255,.85)!important}
#profSheet .pt-auto{box-shadow:0 0 14px -2px rgba(127,140,255,.55);display:inline-flex;align-items:center;gap:5px}
#profSheet .pt-auto::before{content:"";width:6px;height:6px;border-radius:50%;background:#7DF7D2;box-shadow:0 0 8px #7DF7D2}
/* ---- Phone top bar spans the width ---- */
@media (max-width:1099px){
  body header.top{margin:8px 0 0 calc(50% - 50vw + 6px)!important;width:calc(100vw - 12px)!important;max-width:none!important;box-sizing:border-box!important;padding:12px 16px!important;border-radius:22px!important;justify-content:space-between!important;gap:8px}
}
`;
  document.head.appendChild(st);

  function openPhoto(src, alt) {
    var old = document.getElementById("zzPhoto"); if (old) old.remove();
    var v = document.createElement("div");
    v.id = "zzPhoto";
    v.setAttribute("role", "dialog");
    v.setAttribute("aria-modal", "true");
    v.innerHTML = '<button type="button" class="zzx" aria-label="Close">×</button>' +
      (alt ? '<div class="zzcap"></div>' : "") + '<img alt="">';
    var im = v.querySelector("img");
    im.src = src;
    if (alt) v.querySelector(".zzcap").textContent = alt;
    function close() { v.remove(); document.removeEventListener("keydown", onKey, true); }
    function onKey(e) { if (e.key === "Escape") close(); }
    v.addEventListener("click", function (e) {
      if (e.target === im) { v.classList.toggle("z"); return; }
      close();
    });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(v);
  }

  // Teacher chat photos: open here instead of a new browser tab.
  document.addEventListener("click", function (e) {
    var im = e.target.closest && e.target.closest("img.pt-img");
    if (!im) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPhoto(im.currentSrc || im.src, im.alt && im.alt !== "photo" ? im.alt : "");
  }, true);
})();
