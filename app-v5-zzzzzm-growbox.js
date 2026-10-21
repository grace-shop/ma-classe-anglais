/* =====================================================================
   v5 · The typing box grows with the text.
   The one-line box in a chat becomes a box that gets taller as you type
   (up to about 6 lines), so you see everything you write. Enter sends,
   Shift+Enter makes a new line. The box keeps the same id, so sending
   works as before.
   ===================================================================== */
(function () {
  var FORMS = /^(chat|peerchat|groupchat)$/;

  function grow(ta) {
    ta.style.height = "auto";
    var max = 6 * 24 + 16;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
    ta.style.overflowY = ta.scrollHeight > max ? "auto" : "hidden";
  }

  function upgrade() {
    document.querySelectorAll("form.v4bar").forEach(function (f) {
      if (!FORMS.test(f.dataset.f || "")) return;
      var inp = f.querySelector("input:not([type=file]):not([type=hidden])");
      if (!inp || !inp.id) return;
      var ta = document.createElement("textarea");
      ta.id = inp.id;
      ta.name = inp.name || "";
      ta.placeholder = inp.placeholder || "";
      ta.className = (inp.className || "") + " zz-grow";
      ta.rows = 1;
      ta.value = inp.value || "";
      ta.setAttribute("autocomplete", "off");
      ta.setAttribute("autocorrect", "on");
      ta.setAttribute("enterkeyhint", "send");
      var wasFocus = document.activeElement === inp;
      inp.parentNode.replaceChild(ta, inp);
      if (wasFocus) { try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }
      grow(ta);
    });
  }

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains("zz-grow")) grow(t);
  }, true);

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("zz-grow")) return;
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (t.form && t.value.trim()) t.form.requestSubmit();
    }
  }, true);

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { upgrade(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzmGrow";
  st.textContent = `
/* the composer: one rounded row at the bottom; buttons stay on the bottom edge */
html body .chatbar.v4bar:has(textarea.zz-grow){align-items:flex-end!important;padding:8px 10px!important;gap:6px!important;border-top:0!important;background:transparent!important}
/* the field: a rounded pill that grows upward with the text (overrides the app's general textarea style) */
html body .chatbar.v4bar textarea.zz-grow{flex:1 1 auto!important;width:auto!important;min-width:0!important;min-height:44px!important;max-height:160px!important;height:44px;box-sizing:border-box!important;margin:0!important;padding:10px 16px!important;font:inherit!important;font-size:19px!important;line-height:24px!important;color:inherit!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:22px!important;box-shadow:none!important;resize:none!important;outline:none!important;overflow:hidden;word-break:break-word}
html body .chatbar.v4bar textarea.zz-grow:focus{border-color:rgba(127,190,255,.6)!important;box-shadow:none!important}
html body .chatbar.v4bar textarea.zz-grow::placeholder{opacity:.65}
html.zz-cf body .chatbar.v4bar textarea.zz-grow{font-family:var(--zzf)!important}
/* the mic turns into the send arrow as soon as something is typed */
html body .chatbar.v4bar:has(>textarea.zz-grow:not(:placeholder-shown)) .v4att [data-v4="rec"]{display:none!important}
`;  document.head.appendChild(st);
  try { upgrade(); } catch (e) {}
})();
