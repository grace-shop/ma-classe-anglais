/* =====================================================================
   v5 · Look from the reference videos
   - Sign-in: "Keep me signed in" row, phone link under the button.
   - Email code screens: light embossed card, boxes, green "Success!".
   - PC: glassy dark sidebar with brand, user block, MENU, bottom group.
   - Phone: dark bar with white bubble over the active tab; dark top bar.
   CSS plus a small DOM addition for the PC sidebar (brand, user, log out).
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzflook")) return;
  var st = document.createElement("style");
  st.id = "zzzzflook";
  st.textContent = `
/* ---- Sign-in extras ---- */
#authGate .lg label.lg-keep{display:flex;align-items:center;gap:8px;font-size:.85rem;font-weight:600;color:#3A3F55;cursor:pointer}
#authGate .lg label.lg-keep input{width:16px;height:16px;margin:0;accent-color:#3D6BF0}
#authGate .lg-idrow{text-align:center;margin-top:-2px}

/* Phone: the sign-in sheet ends with the button, as in the video (download badges are desktop only). */
@media (max-width:720px){#authGate .dlc{display:none!important}}

/* ---- Email code screens (video 2): light embossed card ---- */
#authGate.otpv{background:#E3E7EE!important;display:grid!important;place-items:center;padding:24px 18px!important;overflow:auto}
#authGate .ot-card{width:min(340px,100%);box-sizing:border-box;background:#E3E7EE;border-radius:28px;padding:30px 24px 26px;text-align:center;box-shadow:12px 12px 26px #C5CAD5,-12px -12px 26px #FFFFFF,inset 0 0 0 1px rgba(255,255,255,.6);color:#1F2433;font-family:Manrope,system-ui,sans-serif}
#authGate .ot-h{margin:0 0 8px;font:800 1.35rem/1.2 Manrope,system-ui,sans-serif;color:#1F2433}
#authGate .ot-p{margin:0 0 20px;font-size:.88rem;line-height:1.5;color:#5E6480}
#authGate .ot-form{display:grid;gap:18px;margin:0}
#authGate .ot-boxes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
#authGate .ot-box{width:100%;box-sizing:border-box;height:52px;margin:0;padding:0;text-align:center;font:700 1.25rem Manrope,system-ui,sans-serif;color:#1F2433;background:#E3E7EE;border:0;border-radius:12px;box-shadow:inset 4px 4px 9px #C5CAD5,inset -4px -4px 9px #FFFFFF}
#authGate .ot-box:focus{outline:none;box-shadow:inset 4px 4px 9px #C5CAD5,inset -4px -4px 9px #FFFFFF,0 0 0 2px #7F9CF5}
#authGate .ot-field{position:relative;display:block;margin:0}
#authGate .ot-field input{width:100%;box-sizing:border-box;padding:15px 14px 15px 44px;margin:0;font:inherit;font-size:.95rem;color:#1F2433;background:#E3E7EE;border:0;border-radius:14px;box-shadow:inset 4px 4px 9px #C5CAD5,inset -4px -4px 9px #FFFFFF}
#authGate .ot-field input:focus{outline:none}
#authGate .ot-ic{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#7A8099;display:grid}
#authGate .ot-btn{width:100%;padding:15px;margin:0;border:0;border-radius:16px;font:inherit;font-weight:800;font-size:.98rem;color:#1F2433;background:#E3E7EE;cursor:pointer;box-shadow:6px 6px 14px #C5CAD5,-6px -6px 14px #FFFFFF}
#authGate .ot-btn:active{box-shadow:inset 4px 4px 9px #C5CAD5,inset -4px -4px 9px #FFFFFF}
#authGate .ot-link{margin-top:16px;background:none;border:0;padding:6px;font:inherit;font-size:.85rem;font-weight:700;color:#4F7BF7;cursor:pointer;width:auto}
#authGate .ot-msg{margin-bottom:14px;text-align:left}
#authGate .ot-ok{display:grid;justify-items:center;gap:8px;padding:10px 0 4px}
#authGate .ot-green{color:#16A34A!important;margin-top:6px}
#authGate .ot-card .msg.ok{background:#E7F8EE;color:#1D6B3F}
#authGate .ot-card .msg.err{background:#FBE4E7;color:#8A1F2B}

/* ---- PC sidebar (video 3) ---- */
@media (min-width:1100px){
  body nav.tabs{left:16px!important;top:50%!important;width:212px!important;max-width:212px!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:4px!important;padding:18px 12px 14px!important;border-radius:26px!important;background:linear-gradient(160deg,rgba(44,48,84,.55),rgba(12,14,28,.74))!important;border:1px solid rgba(255,255,255,.12)!important;box-shadow:0 30px 60px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12)!important;backdrop-filter:blur(22px) saturate(1.3)!important;-webkit-backdrop-filter:blur(22px) saturate(1.3)!important;max-height:calc(100vh - 40px)!important;overflow:auto}
  body nav.tabs .lk-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 12px;font:800 1rem/1 Manrope,system-ui,sans-serif;color:#fff;letter-spacing:.01em}
  body nav.tabs .lk-logo{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6C80FF,#9A7CFF);color:#fff;font-weight:800;font-size:.95rem}
  body nav.tabs .lk-user{display:flex;align-items:center;gap:10px;padding:10px;margin:0 0 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
  body nav.tabs .lk-av{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#2A3262;color:#fff;font-weight:800;font-size:.9rem;flex:0 0 auto}
  body nav.tabs .lk-user b{display:block;color:#fff;font-size:.85rem}
  body nav.tabs .lk-user small{display:block;color:#8C94BE;font-size:.72rem;margin-top:2px}
  body nav.tabs .lk-menu{font:700 .66rem/1 Manrope,system-ui,sans-serif;letter-spacing:.18em;color:#7C84AA;padding:4px 10px 8px}
  body nav.tabs button{flex-direction:row!important;justify-content:flex-start;gap:12px!important;padding:11px 12px!important;border-radius:14px!important;font-size:.92rem!important;font-weight:600;color:#C9CEE8!important;background:none!important;box-shadow:none!important;width:100%!important;text-align:left}
  body nav.tabs button:hover{background:rgba(255,255,255,.06)!important;color:#fff!important}
  body nav.tabs button svg{width:20px!important;height:20px!important;flex:0 0 auto}
  body nav.tabs button[aria-current="true"]{color:#fff!important;background:linear-gradient(90deg,rgba(127,140,255,.3),rgba(127,140,255,.07))!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 8px 22px -10px rgba(127,140,255,.6)!important}
  body nav.tabs .count{top:50%!important;right:12px!important;transform:translateY(-50%)}
  body nav.tabs .lk-foot{margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.1);display:grid;gap:4px}
  body nav.tabs .lk-foot button{color:#AEB5DA!important}
  .wrap{margin-left:max(266px,calc((100vw - 1180px)/2))!important;max-width:min(1180px,calc(100vw - 320px))!important}
  body header.top{border-radius:0 0 22px 22px}
}
@media (max-width:1099px){
  body nav.tabs .lk-brand,body nav.tabs .lk-user,body nav.tabs .lk-menu,body nav.tabs .lk-foot{display:none!important}
}

/* ---- Phone bottom bar (video 4): dark rounded bar, bubble over the active tab ---- */
@media (max-width:1099px){
  body nav.tabs{position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;width:calc(100% - 28px)!important;max-width:460px!important;margin:0!important;padding:8px 10px!important;border-radius:22px!important;background:var(--nav-bg)!important;border:0!important;box-shadow:0 18px 40px -12px rgba(0,0,0,.25)!important;justify-content:space-between!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  body nav.tabs button{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0!important;padding:0!important;height:46px;border-radius:0!important;background:none!important;box-shadow:none!important;color:var(--muted)!important;font-size:0!important;position:relative;overflow:visible}
  body nav.tabs button svg{width:22px!important;height:22px!important;transition:transform .25s}
  body nav.tabs button[aria-current="true"]{color:var(--fg)!important;background:none!important}
  body nav.tabs button[aria-current="true"]::before{content:"";position:absolute;top:-26px;left:50%;transform:translateX(-50%);width:48px;height:48px;border-radius:50%;background:var(--ink);box-shadow:0 10px 22px rgba(0,0,0,.25);z-index:-1}
  body nav.tabs button[aria-current="true"] svg{color:var(--on-ink);transform:translateY(-26px)}
  body nav.tabs button[aria-current="true"]::after{content:attr(data-label);position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:.66rem;font-weight:700;white-space:nowrap;color:var(--fg)}
  body nav.tabs .count{top:2px!important;right:calc(50% - 20px)!important}
  body header.top{margin:8px 14px 0!important;border-radius:22px!important;background:var(--header-bg)!important;color:var(--fg);padding:10px 16px!important;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)!important}
  body header.top *{color:inherit}
}
`;
  document.head.appendChild(st);

  /* Opening (video 1): dark screen with the logo, then the sign-in sheet rises from the bottom. */
  var ist = document.createElement("style");
  ist.id = "zzzzfintro";
  ist.textContent = `
#zzIntro{position:fixed;inset:0;z-index:300;background:radial-gradient(90% 60% at 50% 42%,#1D2468 0%,#0A0D24 55%,#030409 100%);display:grid;place-content:center;justify-items:center;overflow:hidden;pointer-events:none;animation:zzOut .6s cubic-bezier(.5,0,.8,.4) 3.9s forwards !important}
#zzIntro .zzring{position:absolute;left:50%;top:50%;border-radius:50%;border:1px solid rgba(127,140,255,.38);box-shadow:0 0 22px rgba(127,140,255,.18);transform:translate(-50%,-50%);opacity:0;animation:zzRing 1.2s ease .15s forwards,zzSpin 14s linear 0s infinite !important}
#zzIntro .r1{width:230px;height:230px}
#zzIntro .r2{width:330px;height:330px;border-style:dashed;border-color:rgba(154,124,255,.32);animation:zzRing 1.2s ease .35s forwards,zzSpinR 20s linear 0s infinite !important}
#zzIntro .zzrow{position:relative;display:flex;align-items:center;gap:16px;perspective:900px;z-index:1}
#zzIntro .zzlg{position:relative;width:84px;height:84px;transform-style:preserve-3d;animation:zzTilt 1.1s cubic-bezier(.2,.7,.2,1) .2s both !important}
#zzIntro .zzlg img{position:absolute;inset:0;width:84px;height:84px;border-radius:24px;opacity:0;filter:drop-shadow(0 0 26px rgba(127,140,255,.6));animation:zzLogo .8s cubic-bezier(.2,.7,.2,1) 1.25s forwards !important}
#zzIntro .zzlg::after{content:"";position:absolute;inset:0;border-radius:24px;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);animation:zzSweep 1.2s ease 1.9s forwards !important}
#zzIntro .zzlg svg{position:absolute;inset:-6px;width:96px;height:96px;overflow:visible;animation:zzFadeOut .45s ease 1.9s forwards !important}
#zzIntro .zzsq,#zzIntro .zze{fill:none;stroke:#A9B8FF;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 6px rgba(127,140,255,.9))}
#zzIntro .zzsq{animation:zzDraw .75s ease .25s forwards !important}
#zzIntro .zze{animation:zzDraw .6s ease .95s forwards !important}
#zzIntro .zzt{display:grid;gap:8px;text-align:left}
#zzIntro b{font:800 2rem/1 Manrope,system-ui,sans-serif;background:linear-gradient(90deg,#FFFFFF,#CFE0FF 45%,#B7A8FF 80%,#7DF7D2);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.01em;opacity:0;animation:zzLetters .9s cubic-bezier(.2,.7,.2,1) 1.8s forwards !important}
#zzIntro span{font:600 .66rem/1.3 Manrope,system-ui,sans-serif;letter-spacing:.14em;white-space:nowrap;text-transform:uppercase;color:#9FB0FF;opacity:0;animation:zzFade .6s 2.5s forwards !important}
#zzIntro .zzbar{position:absolute;bottom:16%;left:50%;width:180px;height:2px;margin-left:-90px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden}
#zzIntro .zzbar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#7DF7D2,#8FA6FF,#FF9AE6);transform:scaleX(0);transform-origin:left;animation:zzFill 2.6s ease .6s forwards !important}
@keyframes zzOut{to{opacity:0;visibility:hidden;transform:scale(1.08);filter:blur(6px)}}
@keyframes zzLogo{from{opacity:0;filter:brightness(0) blur(6px)}to{opacity:1;filter:drop-shadow(0 0 26px rgba(127,140,255,.6))}}
@keyframes zzTilt{from{transform:rotateX(70deg) rotateY(-42deg) scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes zzSweep{to{transform:translateX(120%)}}
@keyframes zzDraw{to{stroke-dashoffset:0}}
@keyframes zzFadeOut{to{opacity:0}}
@keyframes zzFade{to{opacity:1}}
@keyframes zzLetters{from{letter-spacing:.5em;opacity:0;transform:translateY(8px)}to{letter-spacing:-.01em;opacity:1;transform:none}}
@keyframes zzRing{from{opacity:0;transform:translate(-50%,-50%) scale(.6)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes zzSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes zzSpinR{to{transform:translate(-50%,-50%) rotate(-360deg)}}
@keyframes zzFill{to{transform:scaleX(1)}}
html.zzintro #authGate .lg-top{animation:zzFade .6s 4.1s both !important}
html.zzintro #authGate .lg-sheet{animation:zzSheet .7s cubic-bezier(.2,.8,.2,1) 4.2s both !important}
@keyframes zzSheet{from{transform:translateY(100%)}to{transform:none}}
`;
  document.head.appendChild(ist);
  if (!document.hidden && !window.__zzIntroSeen) {
    window.__zzIntroSeen = true;
    document.documentElement.classList.add("zzintro");
    var iv = document.createElement("div");
    iv.id = "zzIntro";
    iv.innerHTML = '<i class="zzring r1"></i><i class="zzring r2"></i><div class="zzrow"><div class="zzlg"><svg viewBox="0 0 96 96" aria-hidden="true"><rect class="zzsq" x="6" y="6" width="84" height="84" rx="26" pathLength="1"/><path class="zze" pathLength="1" d="M31 26H64M31 26V70M31 48H58M31 70H64"/></svg><img src="icons/logo-3d.png" alt="" onerror="this.style.display=\'none\'"></div><div class="zzt"><b>English Classes</b><span>Learn English &middot; one lesson at a time</span></div></div><div class="zzbar"><i></i></div>';
    document.body.appendChild(iv);
    setTimeout(function () { iv.remove(); document.documentElement.classList.remove("zzintro"); }, 4800);
  }

  /* PC sidebar: brand and user at the top, log out at the bottom. Re-added if the menu re-renders. */
  function addSidebarParts() {
    var nav = document.getElementById("tabs");
    if (!nav) return;
    if (!nav.querySelector(".lk-brand")) {
      var br = document.createElement("div");
      br.className = "lk-brand";
      br.innerHTML = '<span class="lk-logo">E</span><span>English Classes</span>';
      var who = document.createElement("div");
      who.className = "lk-user";
      who.innerHTML = '<span class="lk-av">S</span><div><b>Student</b><small>Signed in</small></div>';
      var mn = document.createElement("div");
      mn.className = "lk-menu";
      mn.textContent = "MENU";
      nav.insertBefore(br, nav.firstChild);
      nav.insertBefore(who, br.nextSibling);
      nav.insertBefore(mn, who.nextSibling);
    }
    if (!nav.querySelector(".lk-foot")) {
      var ft = document.createElement("div");
      ft.className = "lk-foot";
      ft.innerHTML = '<button type="button" data-lk="logout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/></svg><span>Log Out</span></button>';
      nav.appendChild(ft);
    }
  }
  function labelTabs() {
    document.querySelectorAll("nav.tabs button").forEach(function (b) {
      var t = Array.prototype.filter.call(b.childNodes, function (n) { return !(n.classList && n.classList.contains("count")); })
        .map(function (n) { return n.textContent; }).join("").trim();
      if (t && b.dataset.label !== t) b.dataset.label = t;
    });
  }
  function refresh() { addSidebarParts(); labelTabs(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('nav.tabs button[data-lk="logout"]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (window.__appLogout) window.__appLogout();
  }, true);
  var nav = document.getElementById("tabs");
  if (nav) { new MutationObserver(refresh).observe(nav, { childList: true, subtree: true, characterData: true }); refresh(); }
})();
