/* ---- Invitation de jeu : notification + bandeau en haut de l'écran ----
   Quand un camarade lance une invitation de jeu, la personne invitée :
   - reçoit la notification (cloche, liste des notifications, notification système) ;
   - voit un bandeau en haut de l'écran, qui reste jusqu'à ce qu'elle le touche ou le ferme ;
   - en touchant la notification ou le bandeau, elle arrive sur la liste des invitations.
   La ligne de notification est créée par game_invite (supabase/jeux-invite.sql). */
{
  var GI_NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", ttt: "Tic-tac-toe" };

  var giCss = document.createElement("style");
  giCss.textContent =
    "#gameInvBanner{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:12px;right:12px;z-index:9500;" +
    "display:flex;align-items:center;gap:8px;padding:10px 10px 10px 12px;border-radius:18px;background:var(--grad);color:#fff;" +
    "box-shadow:0 14px 34px -10px rgba(0,0,0,.45);animation:gibIn .35s ease-out}" +
    "#gameInvBanner .gib-main{flex:1;min-width:0;display:flex;gap:12px;align-items:center;background:none;border:0;color:inherit;text-align:left;font:inherit;cursor:pointer;padding:4px}" +
    "#gameInvBanner .gib-ic{font-size:26px;flex:0 0 auto}" +
    "#gameInvBanner .gib-txt{min-width:0}" +
    "#gameInvBanner .gib-txt b{display:block;font-size:15px;line-height:1.25}" +
    "#gameInvBanner .gib-txt small{opacity:.85;font-size:12.5px}" +
    "#gameInvBanner .gib-x{flex:0 0 auto;background:rgba(255,255,255,.2);border:0;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px}" +
    "@keyframes gibIn{from{transform:translateY(-130%);opacity:0}to{transform:none;opacity:1}}";
  document.head.appendChild(giCss);

  function giHide() {
    var old = document.getElementById("gameInvBanner");
    if (old) old.remove();
    clearTimeout(window.__gibT);
  }

  // the banner at the top of the screen, for a new invitation
  function giBanner(n) {
    giHide();
    var el = document.createElement("div");
    el.id = "gameInvBanner";
    el.setAttribute("role", "alert");
    el.innerHTML =
      '<button type="button" class="gib-main" data-gib="open" data-id="' + esc(String(n.id)) + '">' +
        '<span class="gib-ic" aria-hidden="true">🎲</span>' +
        '<span class="gib-txt"><b>' + esc(nName(n)) + ' invites you to ' + esc(GI_NAMES[n.body] || "a game") + '</b>' +
        '<small>Tap to see the invitation</small></span></button>' +
      '<button type="button" class="gib-x" data-gib="x" aria-label="Close">✕</button>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-gib]");
      if (!b) return;
      if (b.getAttribute("data-gib") === "x") { giHide(); return; }
      nGo(b.getAttribute("data-id"));
    });
    // it stays a while; the notification stays in the list either way
    window.__gibT = setTimeout(giHide, 30000);
  }

  // text in the notifications list
  var _t = nTitle, _b = nBody;
  nTitle = function (n) { return n && n.kind === "game" ? nName(n) + " invites you to play" : _t(n); };
  nBody = function (n) { return n && n.kind === "game" ? (GI_NAMES[n.body] || "A game") + " · tap to see the invitation" : _b(n); };

  // a new invitation arrives while the app is open: show the banner (the usual notification follows)
  var _arrive = nArrive;
  nArrive = function (n) {
    if (n && n.kind === "game" && !(typeof nViewing === "function" && nViewing(n))) giBanner(n);
    return _arrive(n);
  };

  // tapping the notification or the banner: the list of invitations opens
  var _go = nGo;
  nGo = function (id) {
    var n = N.list.find(function (x) { return String(x.id) === String(id); });
    if (!n || !String(n.ref || "").startsWith("game:")) return _go(id);
    if (!n.read_at) { n.read_at = new Date().toISOString(); try { window.__notif.read([n.id]).catch(function () {}); } catch (e) {} }
    giHide();
    S.view = null; S.animate = true; render();
    if (window.ZGUI && typeof window.ZGUI.menu === "function") window.ZGUI.menu("battle");
  };
}
