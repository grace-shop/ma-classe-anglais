/* =====================================================================
   v5 · Two fixes on the profile page and the sign-in pages:
   1. The « Start » button of « Create your profile » always sends the form
      (the click is handed to the form, so it works even if another part of the
      page prevents the native submit).
   2. The floating « Arena » button is hidden on the sign-in / sign-up pages and
      on the profile-creation pages, including when nobody is signed in.
   ===================================================================== */

/* 1 · Start (and the parent « Go to the parent space » button) */
document.addEventListener("click", function (e) {
  var b = e.target.closest && e.target.closest("form[data-f] button[type=submit]");
  if (!b || !b.form) return;
  var k = b.form.dataset.f;
  if (k !== "join" && k !== "joinProf") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  b.form.requestSubmit(b);
}, true);

/* 2 · Arena button: visible only inside the app, once the student is fully in */
(function () {
  function inApp() {
    try {
      if (typeof S === "undefined" || !S.uid) return false;                 // not signed in
      if (document.getElementById("authGate")) return false;                 // sign-in / sign-up screen open
      if (S.mode === "student" && (!S.meLoaded || !S.me ||
          (typeof stOf === "function" && stOf(S.me) !== "active"))) return false; // profile still being created
      return true;
    } catch (err) { return false; }
  }
  setInterval(function () {
    var f = document.getElementById("arFab");
    if (!f) return;
    var show = inApp();
    if (f.hidden !== !show) f.hidden = !show;
    f.style.display = show ? "" : "none";
  }, 300);
})();
