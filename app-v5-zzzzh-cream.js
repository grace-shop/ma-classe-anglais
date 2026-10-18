/* ==== v5 · Sign-in as the cream two-panel card (reference video) ==== */
(function () {
  if (document.getElementById("zzzzhcream")) return;
  var st = document.createElement("style");
  st.id = "zzzzhcream";
  st.textContent = `
#authGate.cream{background:#EFEEE9!important;display:flex!important;flex-direction:column;align-items:center;justify-content:safe center;padding:max(24px,env(safe-area-inset-top,0px)) 16px 24px!important;overflow:auto;box-sizing:border-box;color:#2A2A2A;font-family:Manrope,system-ui,sans-serif}
#authGate.cream .lg{width:min(920px,100%);min-height:0;padding:0;margin:0;display:grid;gap:26px;justify-items:center;color:#2A2A2A}
#authGate.cream .cr-top{display:grid;justify-items:center;gap:8px;text-align:center}
#authGate.cream .lg-logo{width:60px;height:60px;border-radius:18px;overflow:hidden;display:grid;place-items:center;box-shadow:6px 6px 14px #c8c5bb,-6px -6px 14px #fff}
#authGate.cream .lg-brand{font:700 .78rem/1 Manrope,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#7C7A72}
#authGate.cream .cr-title{margin:10px 0 0;font:italic 400 3.2rem/1.05 "Instrument Serif",Georgia,serif;color:#1E1E1E}
#authGate.cream .lg-sub{margin:0;color:#5E5C55;font-size:.95rem;max-width:340px;line-height:1.5}
#authGate.cream .cr-foot{margin:0;color:#8A877D;font-size:.8rem}
#authGate.cream .ag2 .lg-keep{display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:600;color:#4A4A48}
#authGate.cream .ag2 .lg-keep input{width:16px;height:16px;margin:0;accent-color:#3D6BF0}
#authGate.cream .ag2 .lg-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
#authGate.cream .ag2 .lg-link{width:auto;background:none;border:0;color:#3D6BF0;font:inherit;font-weight:700;font-size:.82rem;cursor:pointer;padding:0}
#authGate.cream .ag2-form .lg-idsw{width:auto;background:none;border:0;color:#3D6BF0;font:inherit;font-weight:700;font-size:.82rem;cursor:pointer;padding:0}
#authGate.cream .ag2 .lg-or{margin:4px 0 2px;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#8A877D}
#authGate.cream .ag2 .lg-soc{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#EEECE5;border:0;border-radius:14px;padding:12px;font:inherit;font-weight:700;color:#2A2A2A;cursor:pointer;box-shadow:6px 6px 14px #c8c5bb,-6px -6px 14px #fff}
#authGate.cream .ag2 .eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;padding:0;border:0;background:none;color:#8A877D;display:grid;place-items:center;cursor:pointer}
#authGate.cream .ag2 .pw{position:relative;display:block}
#authGate.cream .ag2 .pw input{padding-right:50px}
#authGate.cream .ag2 .msg.ok{background:#DDF1E4;color:#1D5C3A}
#authGate.cream .ag2 .msg.err{background:#F6DEDE;color:#7A1F26}
#authGate .ag2-wrap{display:grid;gap:18px;width:min(900px,100%);justify-items:center}
#authGate .ag2{position:relative;width:100%;display:grid;grid-template-columns:1fr 1fr;min-height:540px;border-radius:34px;background:#EEECE5;box-shadow:14px 14px 30px #c8c5bb,-14px -14px 30px #fff;overflow:hidden;color:#2A2A2A;font-family:Manrope,system-ui,sans-serif;box-sizing:border-box}
#authGate .ag2-info{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;gap:14px;padding:48px 40px;background:#EEECE5;overflow:hidden}
#authGate .ag2-info::before{content:"";position:absolute;width:200px;height:200px;border-radius:50%;right:-95px;top:-95px;background:#EEECE5;box-shadow:inset 8px 8px 16px #d3cfc3,inset -8px -8px 16px #fff}
#authGate .ag2-info::after{content:"";position:absolute;width:230px;height:230px;border-radius:50%;left:-130px;bottom:-150px;background:#EEECE5;box-shadow:inset 8px 8px 16px #d3cfc3,inset -8px -8px 16px #fff}
#authGate .ag2-info>*{position:relative;z-index:1}
#authGate .ag2-cap{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#8A877D;font-weight:700}
#authGate .ag2-info h2{margin:0;font:800 2rem/1.1 Manrope,system-ui,sans-serif;color:#1E1E1E}
#authGate .ag2-info p{margin:0;max-width:280px;font-size:.95rem;line-height:1.55;color:#4A4A48}
#authGate .ag2-btn{margin-top:8px;width:auto;border:0;cursor:pointer;padding:13px 42px;border-radius:999px;background:#EEECE5;color:#1E1E1E;font-weight:800;letter-spacing:.2em;font-size:.8rem;text-transform:uppercase;box-shadow:6px 6px 14px #c8c5bb,-6px -6px 14px #fff}
#authGate .ag2-btn:active{box-shadow:inset 4px 4px 10px #c8c5bb,inset -4px -4px 10px #fff}
#authGate .ag2-form{display:grid;align-content:center;gap:12px;padding:40px 44px;text-align:center;background:#EEECE5;min-width:0}
#authGate .ag2-form h3{margin:0 0 4px;font:800 1.85rem/1.1 Manrope,system-ui,sans-serif;color:#1E1E1E}
#authGate .ag2-soc{display:flex;justify-content:center;gap:14px}
#authGate .ag2-round{width:50px;height:50px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:#EEECE5;box-shadow:6px 6px 14px #c8c5bb,-6px -6px 14px #fff}
#authGate .ag2-or{margin:4px 0 2px;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#8A877D}
#authGate .ag2 form{display:grid;gap:12px;justify-items:stretch;margin:0}
#authGate .ag2 label{display:grid;gap:6px;font-weight:600;font-size:.78rem;color:#6F6C63;text-align:left}
#authGate .ag2 input{width:100%;box-sizing:border-box;font:inherit;font-size:.95rem;background:#EEECE5;border:0;border-radius:14px;padding:14px 18px;color:#2A2A2A;box-shadow:inset 4px 4px 8px #cdcac0,inset -4px -4px 8px #fff}
#authGate .ag2 input::placeholder{color:#9C998E}
#authGate .ag2 input:focus{outline:none;box-shadow:inset 4px 4px 8px #cdcac0,inset -4px -4px 8px #fff,0 0 0 2px rgba(35,42,59,.25)}
#authGate .ag2 .pw input{padding-right:52px}
#authGate .ag2 .pw .eye{color:#6F6C63;background:none;width:42px;height:42px}
#authGate .ag2 .pw .eye.on{color:#1E1E1E;background:none;box-shadow:none}
#authGate .ag2 .idsw{background:#EEECE5;border:0;border-radius:14px;box-shadow:inset 3px 3px 7px #cdcac0,inset -3px -3px 7px #fff}
#authGate .ag2 .idsw button{background:none;color:#6F6C63;border:0;font-weight:700}
#authGate .ag2 .idsw button[aria-pressed=true]{background:#EEECE5;color:#1E1E1E;border-radius:10px;box-shadow:4px 4px 8px #c8c5bb,-4px -4px 8px #fff}
#authGate .ag2 .ag2-submit{justify-self:center;width:auto;margin-top:6px;border:0;cursor:pointer;padding:15px 52px;border-radius:999px;background:#232A3B;color:#fff;font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:.8rem;box-shadow:8px 8px 18px #c8c5bb,-6px -6px 14px #fff}
#authGate .ag2 .ag2-link{justify-self:center;width:auto;background:none;border:0;color:#6F6C63;cursor:pointer;font-weight:600;font-size:.85rem;padding:4px}
#authGate .ag2 .warn{background:#E6E3DA;color:#4A4A48;border:0;border-radius:14px;box-shadow:inset 3px 3px 7px #cdcac0,inset -3px -3px 7px #fff;text-align:left}
#authGate .ag2 .warn b{color:#232A3B}#authGate .ag2 .warn svg{color:#6F6C63}
#authGate .ag2 .msg{border-radius:14px;text-align:left}
#authGate .ag2 .msg.err{background:#F6DEDE;color:#7A1F26}#authGate .ag2 .msg.ok{background:#DDF1E4;color:#1D5C3A}
#authGate .ag2 button:disabled{opacity:.5}
@media (max-width:720px){#authGate .ag2{grid-template-columns:1fr;min-height:0;border-radius:28px}#authGate .ag2-info{padding:30px 24px 34px}#authGate .ag2-info h2{font-size:1.6rem}#authGate .ag2-info p{font-size:.88rem}#authGate .ag2-info::after{width:170px;height:170px;left:-100px;bottom:-120px}#authGate .ag2-form{padding:26px 22px 30px}#authGate .ag2-form h3{font-size:1.5rem}}
#authGate.cream .ag2-info h2{color:#1E1E1E!important;margin:0;font:800 1.9rem/1.1 Manrope,system-ui,sans-serif;position:relative;z-index:1}
#authGate.cream .ag2-info p{color:#4A4A48!important;position:relative;z-index:1}
#authGate.cream .ag2-info .ag2-btn{position:relative;z-index:1}
@media (max-width:720px){#authGate.cream .ag2{overflow:visible!important;min-height:0!important;display:grid}#authGate.cream .ag2-info{min-height:250px;padding:34px 24px 44px!important;overflow:hidden;align-content:center}#authGate.cream .ag2-info h2{font-size:1.7rem!important}#authGate.cream .ag2-info p{font-size:.9rem}}
#authGate.cream .ag2 .ag2-btn{background:#1F2636!important;color:#FFFFFF!important;box-shadow:0 12px 24px -12px rgba(20,26,40,.75)!important;border-radius:999px!important}
#authGate.cream .ag2 .ag2-btn:hover{background:#2A3349!important}
#authGate.cream .ag2 .ag2-btn:active{transform:scale(.98)}
#authGate.cream .ag2.flip .ag2-info{order:-1}
#authGate.cream .ag2 h3,#authGate.cream .ag2-info h2{font-weight:800!important;letter-spacing:-.01em}
#authGate.cream .ag2 .lg-soc{display:none!important}

`;
  document.head.appendChild(st);
})();
