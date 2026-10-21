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
/* the field grows upward; the buttons stay at the bottom edge */
html body .chatbar.v4bar:has(textarea.zz-grow){align-items:flex-end}
html body .chatbar.v4bar textarea.zz-grow{flex:1;min-width:0;width:100%;font:inherit;font-size:19px;line-height:24px;padding:10px 6px;margin:0;resize:none;border:0;background:transparent;color:inherit;outline:none;box-sizing:border-box;overflow:hidden;align-self:center;word-break:break-word}
html body .chatbar.v4bar textarea.zz-grow::placeholder{opacity:.7}
html.zz-cf body .chatbar.v4bar textarea.zz-grow{font-family:var(--zzf)!important}
/* as soon as something is typed, the mic turns into the send arrow (like the attach rule for the old box) */
html body .chatbar.v4bar:has(>textarea.zz-grow:not(:placeholder-shown)) .v4att [data-v4="rec"]{display:none!important}
`;  document.head.appendChild(st);
  try { upgrade(); } catch (e) {}
})();
