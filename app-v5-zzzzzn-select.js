/* =====================================================================
   v5 · Choose messages with a tap, then copy them.
   - Tapping a message selects it (tap again to unselect). No blue text
     highlight and no "Copy" popup from the phone.
   - A small bar above the messages shows how many are selected, with
     "Copier" (copies the text of the selected messages) and "✕" (cancel).
   - Buttons, voice messages, links and reactions keep working as before.
   ===================================================================== */
(function () {
  var sel = new Set();
  var bar = null;

  function frame() { return document.querySelector(".glass.chat.zz-framed"); }

  function ensureBar() {
    var f = frame();
    if (!f) return null;
    if (bar && bar.isConnected && f.contains(bar)) return bar;
    bar = document.createElement("div");
    bar.id = "zzSelBar";
    bar.hidden = true;
    bar.innerHTML = '<span class="zz-sn"></span><button type="button" class="zz-scopy">Copier</button><button type="button" class="zz-sx" aria-label="Annuler">✕</button>';
    var cs = f.querySelector(":scope > #chatScroll");
    f.insertBefore(bar, cs || f.firstChild);
    return bar;
  }

  function refresh() {
    sel.forEach(function (m) { if (!m.isConnected) sel.delete(m); });
    var b = ensureBar();
    if (!b) return;
    var n = sel.size;
    b.hidden = n === 0;
    b.querySelector(".zz-sn").textContent = n + (n > 1 ? " messages sélectionnés" : " message sélectionné");
  }

  function clear() {
    sel.forEach(function (m) { m.classList.remove("zz-sel"); });
    sel.clear();
    refresh();
  }

  // the text of a bubble, without the time, buttons or media
  function textOf(m) {
    var c = m.cloneNode(true);
    c.querySelectorAll("button,audio,video,img,svg,input,textarea,.v4voice,.v4file,.v4bars,.v4replybar,.v4quote").forEach(function (x) { x.remove(); });
    // a translated message: keep the original text the person wrote (not the English)
    var en = c.querySelector(".v4en");
    if (en) { en.remove(); var fr = c.querySelector(".v4fr"); if (fr) return (fr.textContent || "").trim(); }
    var last = c.lastElementChild;
    if (last && last.tagName === "SPAN" && /\d{1,2}[:h.]\d{2}/.test(last.textContent)) last.remove();
    return (c.innerText || c.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function fallbackCopy(txt) {
    var t = document.createElement("textarea");
    t.value = txt;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    t.remove();
    return ok;
  }

  function copySel() {
    var parts = [];
    sel.forEach(function (m) { var s = textOf(m); if (s) parts.push(s); });
    var txt = parts.join("\n");
    var btn = ensureBar() && bar.querySelector(".zz-scopy");
    var done = function (ok) {
      if (btn) { btn.textContent = ok ? "Copié ✓" : "Échec"; setTimeout(function () { btn.textContent = "Copier"; }, 1200); }
      if (ok) clear();
    };
    if (!txt) { done(false); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(fallbackCopy(txt)); });
        return;
      }
    } catch (e) {}
    done(fallbackCopy(txt));
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#zzSelBar")) {
      if (t.closest(".zz-scopy")) copySel();
      else if (t.closest(".zz-sx")) clear();
      return;
    }
  });

  // Tapping a message selects it. This runs before the app's own tap handler,
  // which would open the message menu. A long press still opens the menu.
  var downAt = 0;
  document.addEventListener("pointerdown", function () { downAt = Date.now(); }, true);
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var m = t.closest(".msgs .msg[data-mid]");
    if (!m || String(m.dataset.mid).indexOf("tmp") === 0) return;
    if (t.closest("button,a,audio,video,input,textarea,select,label,.v4quote")) return;
    if (Date.now() - downAt > 420) return;             // long press: the menu opens
    try { if (window.getSelection && String(window.getSelection())) return; } catch (x) {}
    e.stopImmediatePropagation();
    e.preventDefault();
    if (sel.has(m)) { sel.delete(m); m.classList.remove("zz-sel"); }
    else { sel.add(m); m.classList.add("zz-sel"); }
    refresh();
  }, true);

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sel.size) clear(); });

  var raf = 0;
  new MutationObserver(function () {
    if (!sel.size) return;
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { refresh(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzznSelect";
  st.textContent = `
/* no phone text selection in the messages (no blue box, no Copy popup) */
.msgs .msg,.msgs .msg *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent}
.msgs .msg.zz-sel{box-shadow:0 0 0 3px #38BDF8,0 0 16px rgba(56,189,248,.55)!important}
#zzSelBar{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(16,18,40,.82);color:#fff;font:600 .85rem/1.2 system-ui,sans-serif;border-bottom:1px solid rgba(255,255,255,.12)}
#zzSelBar[hidden]{display:none}
#zzSelBar .zz-sn{flex:1;min-width:0}
#zzSelBar button{border:0;border-radius:999px;padding:6px 12px;font:700 .8rem system-ui,sans-serif;background:rgba(255,255,255,.14);color:#fff;cursor:pointer}
#zzSelBar .zz-scopy{background:#A78BFA;color:#0B0D18}
`;
  document.head.appendChild(st);
})();
