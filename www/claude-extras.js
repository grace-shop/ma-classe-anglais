/* =====================================================================
   claude-extras.js — ajouts légers, sans toucher au reste de l'application
   1) une seule vidéo / un seul son AUDIBLE à la fois (YouTube, vidéos, vocaux)
   2) en-tête : le bloc des boutons ne peut plus recouvrir le logo de l'école
   3) petites touches de design (lumière, relief, retour tactile)
   ===================================================================== */
(function () {
  "use strict";
  if (window.__cxExtras) return; window.__cxExtras = true;

  /* ---------- 2) + 3) styles ---------- */
  const CSS = `
header.top .brand{position:relative;z-index:3;flex:none}
header.top #hdr{min-width:0;flex:0 1 auto;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-x:contain;padding:8px 8px 4px 4px;margin:-8px -8px -4px -4px}
header.top #hdr::-webkit-scrollbar{display:none}
header.top #hdr>*{flex:none}
html{overflow-x:clip}body{overflow-x:clip;overscroll-behavior-y:none}
.btn,.iconbtn,.chip{-webkit-tap-highlight-color:transparent}
.btn:active,.iconbtn:active{transform:scale(.96)}
:focus-visible{outline:2px solid rgba(94,234,212,.85);outline-offset:2px;border-radius:12px}
:root[data-skin="nuit"] .glass{box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 22px 55px -22px rgba(0,0,0,.75),0 0 0 1px rgba(124,156,255,.13)}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
  :root[data-skin="nuit"] .glass.card{transition:transform .25s ease,box-shadow .25s ease}
  :root[data-skin="nuit"] .glass.card:hover{transform:translateY(-2px);box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 28px 60px -22px rgba(0,0,0,.8),0 0 0 1px rgba(94,234,212,.28)}
}
`;
  const st = document.createElement("style"); st.id = "cx-extras-css"; st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);

  /* ---------- 1) une seule source sonore à la fois ---------- */
  const seen = new Set();                                   // sons lancés par le code (vocaux, musique…)
  const docs = () => {
    const out = [document];
    document.querySelectorAll("iframe").forEach((f) => { try { if (f.contentDocument && f.contentDocument !== document) out.push(f.contentDocument); } catch (e) {} });
    return out;
  };
  const ytFrames = () => [...document.querySelectorAll("iframe")].filter((f) => /youtube(-nocookie)?\.com\/embed/.test(f.src || ""));
  const ytCmd = (f, func) => { try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: "" }), "*"); } catch (e) {} };
  // les vidéos muettes (flux, stories), les appels (flux en direct) et les boucles de l'éditeur ne comptent pas
  const audible = (m) => !!m && !m.paused && !m.ended && !m.muted && m.volume > 0 && !m.srcObject && !m.loop;
  const mixing = () => { try { return typeof MD !== "undefined" && MD && MD.nodes && MD.nodes.length > 0; } catch (e) { return false; } };

  function pauseOthers(except, exceptFrame) {
    if (mixing()) return;
    docs().forEach((d) => d.querySelectorAll("video,audio").forEach((m) => { if (m !== except && audible(m)) { try { m.pause(); } catch (e) {} } }));
    seen.forEach((a) => { if (a.paused || a.ended) { seen.delete(a); return; } if (a !== except && audible(a)) { try { a.pause(); } catch (e) {} } });
    ytFrames().forEach((f) => { if (f !== exceptFrame) ytCmd(f, "pauseVideo"); });
  }
  const check = (m) => { if (audible(m)) pauseOthers(m, null); };

  const hooked = new WeakSet();
  function hookDoc(d) {
    if (!d || hooked.has(d)) return; hooked.add(d);
    const h = (e) => { const t = e.target; if (t && t.tagName && /^(VIDEO|AUDIO)$/.test(t.tagName)) check(t); };
    d.addEventListener("play", h, true);
    d.addEventListener("volumechange", h, true);            // « Touche pour le son » : la vidéo devient audible
  }
  hookDoc(document);

  const _play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    seen.add(this);
    const r = _play.apply(this, arguments);
    try { Promise.resolve(r).then(() => check(this)).catch(() => {}); } catch (e) {}
    return r;
  };

  /* YouTube : on active l'API pour pouvoir mettre en pause et être prévenu quand une vidéo démarre */
  function prepFrame(f) {
    const src = f.getAttribute("src") || "";
    if (!/youtube(-nocookie)?\.com\/embed/.test(src)) { if (!f.dataset.cxm) { f.dataset.cxm = "1"; f.addEventListener("load", () => { try { hookDoc(f.contentDocument); } catch (e) {} }); try { hookDoc(f.contentDocument); } catch (e) {} } return; }
    if (!/[?&]enablejsapi=1/.test(src)) {
      let u; try { u = new URL(src, location.href); } catch (e) { return; }
      u.searchParams.set("enablejsapi", "1");
      if (/^https?:$/.test(location.protocol)) u.searchParams.set("origin", location.origin);
      pauseOthers(null, f);                                 // la vidéo YouTube démarre toute seule : on coupe le reste
      f.setAttribute("src", u.toString());
      return;
    }
    if (!f.dataset.cxm) {
      f.dataset.cxm = "1";
      f.addEventListener("load", () => { try { f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (e) {} });
    }
  }
  addEventListener("message", (e) => {
    let host; try { host = new URL(e.origin).hostname; } catch (x) { return; }
    if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return;
    let d = e.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (x) { return; } }
    if (!d) return;
    const state = d.event === "onStateChange" ? d.info : d.info && d.info.playerState;
    if (state !== 1) return;                                // 1 = en lecture
    pauseOthers(null, ytFrames().find((f) => f.contentWindow === e.source) || null);
  });
  const scan = () => document.querySelectorAll("iframe").forEach(prepFrame);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
  window.__cxMedia = { pauseOthers };
})();
