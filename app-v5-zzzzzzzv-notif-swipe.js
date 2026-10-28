/* ---- Notifications: swipe a row to the left to delete it, "Delete all" at the top,
   only the 15 newest are listed (the logic is in app-v4.js, section notifications) ---- */
(function () {
  var st = document.createElement("style");
  st.id = "zzzzzzzv-notif-swipe";
  st.textContent = [
    ".nbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:4px 2px 8px}",
    ".nrow{position:relative;overflow:hidden;border-radius:14px;--sw:0}",
    ".nrow .nbg{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:20px;background:linear-gradient(90deg,rgba(229,72,77,0),rgba(229,72,77,.92));color:#fff;font-weight:700;opacity:var(--sw);pointer-events:none}",
    ".nrow .it{position:relative;touch-action:pan-y;user-select:none;-webkit-user-select:none}",
    ".nold{text-align:center;margin:8px 0 0;opacity:.7}"
  ].join("");
  document.head.appendChild(st);
})();
