/* =====================================================================
   v5 · Photos and videos: a small arrow on the bubble to reply or forward.
   - The arrow sits on each photo, video or file. Tapping it opens the
     message menu, where "Transférer" is added next to "Reply".
   - "Transférer" lists your classmates and your groups; the same photo or
     video is sent to the one you choose.
   ===================================================================== */
(function () {
  function hasMedia(m) {
    return !!m.querySelector("img,video,.fvid,.v4file");
  }

  // the arrow on each photo / video bubble
  function addArrows() {
    document.querySelectorAll(".msgs .msg[data-mid]").forEach(function (m) {
      if (m.classList.contains("del") || m.querySelector(":scope > .zz-fwd")) return;
      if (!hasMedia(m) || String(m.dataset.mid).indexOf("tmp") === 0) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "zz-fwd";
      b.dataset.v4 = "fwdArrow";
      b.dataset.mid = m.dataset.mid;
      b.dataset.k = m.dataset.k || "peer";
      b.setAttribute("aria-label", "Répondre ou transférer");
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 6l6 6-6 6"/><path d="M4 12h15"/></svg>';
      m.appendChild(b);
    });
  }

  // in the message menu of a photo / video: add "Transférer" after "Reply"
  function addForwardButton() {
    var sheet = document.querySelector(".v4sheet");
    if (!sheet || sheet.querySelector('[data-v4="fwd"]')) return;
    var reply = sheet.querySelector('[data-v4="reply"]');
    var x = typeof v4ActMsg === "function" ? v4ActMsg() : null;
    if (!reply || !x || !x.raw || !x.raw.att) return;
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.v4 = "fwd";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 6l6 6-6 6"/><path d="M4 12h15"/></svg>Transférer';
    reply.parentNode.insertBefore(b, reply.nextSibling);
  }

  // ---- the list of who to send to ----
  var fwd = null;
  function targets() {
    var out = [];
    var me = ((typeof S !== "undefined" ? S : undefined) && S.uid) || "";
    ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).forEach(function (p) {
      if (p.uid && p.uid !== me) out.push({ k: "peer", id: p.uid, name: p.name || "Camarade", sub: "Camarade" });
    });
    ((typeof GR !== "undefined" ? GR : undefined) && GR.list || []).forEach(function (g) {
      out.push({ k: "group", id: g.id, name: g.name || "Groupe", sub: "Groupe" });
    });
    return out;
  }

  function openFwd() {
    var x = typeof v4ActMsg === "function" ? v4ActMsg() : null;
    if (!x || !x.raw || !x.raw.att) { toast("Ce message ne peut pas être transféré.", "x"); return; }
    closeFwd();
    var list = targets();
    fwd = document.createElement("div");
    fwd.id = "zzFwd";
    fwd.innerHTML = '<div class="zz-ab" data-x="1"></div><div class="zz-ap"><div class="zz-agrip"></div>' +
      '<div class="zz-fh">Transférer à…</div>' +
      (list.length ? '<div class="zz-fl2">' + list.map(function (t, i) {
        return '<button type="button" class="zz-fi" data-i="' + i + '"><span class="zz-fa">' + esc((t.name || "?").trim().charAt(0).toUpperCase()) + '</span><span class="zz-fn">' + esc(t.name) + '</span><small>' + t.sub + '</small></button>';
      }).join("") + '</div>' : '<p class="zz-fempty">Aucun camarade ni groupe pour l’instant.</p>') +
      '</div>';
    document.body.appendChild(fwd);
    fwd._list = list;
    fwd.addEventListener("click", function (e) {
      if (e.target.dataset && e.target.dataset.x) return closeFwd();
      var b = e.target.closest && e.target.closest(".zz-fi");
      if (b) sendFwd(fwd._list[+b.dataset.i]);
    });
  }
  function closeFwd() { if (fwd) { fwd.remove(); fwd = null; } }

  function sendFwd(t) {
    var x = typeof v4ActMsg === "function" ? v4ActMsg() : null;
    closeFwd();
    if (!x || !x.raw || !x.raw.att || !t) return;
    var text = String(x.raw.body || x.raw.text || "");
    var p;
    if (t.k === "group") {
      p = typeof grSend === "function" ? Promise.resolve(grSend(t.id, text, x.raw.att, null)) : Promise.reject(new Error("groupes indisponibles"));
    } else {
      p = Promise.resolve(v4Deliver("peer", t.id, text, x.raw.att, null));
    }
    V4.act = null;
    try { render(); } catch (e) {}
    p.then(function () { toast("Transféré à " + t.name, "check"); })
      .catch(function () { toast("Transfert impossible.", "x"); });
  }

  // capture: these buttons have their own behaviour
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var arrow = t.closest('[data-v4="fwdArrow"]');
    if (arrow) {
      e.preventDefault();
      e.stopImmediatePropagation();
      V4.act = { kind: arrow.dataset.k, id: arrow.dataset.mid };
      render();
      return;
    }
    var fb = t.closest('[data-v4="fwd"]');
    if (fb) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openFwd();
    }
  }, true);

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      try { addArrows(); addForwardButton(); } catch (e) {}
    });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzwForward";
  st.textContent = `
.msgs .msg[data-mid]{position:relative}
.msgs .msg .zz-fwd{position:absolute;top:50%;right:-42px;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,12,28,.75);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;padding:0}
.msgs .msg.mine .zz-fwd{right:auto;left:-42px}
#zzFwd{position:fixed;inset:0;z-index:9997}
#zzFwd .zz-ab{position:absolute;inset:0;background:rgba(0,0,0,.45)}
#zzFwd .zz-ap{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#1B1D24;color:#EDEEF3;border-radius:22px 22px 0 0;padding:10px 14px calc(18px + env(safe-area-inset-bottom,0px));max-height:70vh;overflow-y:auto;animation:zzAttUp .22s ease-out}
#zzFwd .zz-agrip{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 14px}
#zzFwd .zz-fh{font:700 1rem system-ui,sans-serif;margin:0 0 10px}
#zzFwd .zz-fl2{display:flex;flex-direction:column;gap:6px}
#zzFwd .zz-fi{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;cursor:pointer;font:600 .95rem system-ui,sans-serif}
#zzFwd .zz-fa{width:38px;height:38px;border-radius:50%;background:#A78BFA;color:#0B0D18;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}
#zzFwd .zz-fn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zzFwd .zz-fi small{opacity:.6;font-weight:600}
#zzFwd .zz-fempty{opacity:.7;text-align:center;padding:14px 0}
.v4sheet [data-v4="fwd"]{display:inline-flex;align-items:center;gap:6px}
`;
  document.head.appendChild(st);
})();
