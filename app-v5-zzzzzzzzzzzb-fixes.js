/* =====================================================================
   v5 · Fixes and polish
   1. Any button that sends a form (chat, sign-in, sign-up, profile Start…) sends it
      straight from the click, even when another part of the page blocks the native submit.
   2. Game invitations: a nicer card, and a banner at the top of the screen when a new
      invitation arrives (checked every 15 s while the app is open).
   ===================================================================== */

/* 1 · sending from the button */
document.addEventListener("click", function (e) {
  var b = e.target.closest && e.target.closest("form[data-f] button[type=submit], form[data-ff] button[type=submit]");
  if (!b || !b.form || b.disabled) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  b.form.requestSubmit(b);
}, true);

/* 2 · invitations: style */
(function () {
  var st = document.createElement("style");
  st.textContent = [
    "#zgInbox{margin-top:8px}",
    "#zgInbox .zg-label{font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:.72rem;opacity:.8;margin:6px 6px 4px!important}",
    "#zgInbox .opt{display:flex;align-items:center;gap:14px;width:100%;box-sizing:border-box;text-align:left;padding:14px 16px;border-radius:22px;border:1px solid rgba(170,150,255,.35);background:linear-gradient(135deg,rgba(124,92,255,.22),rgba(56,189,248,.12));box-shadow:0 14px 34px -14px rgba(120,80,255,.6);color:inherit;font:inherit;cursor:pointer}",
    "#zgInbox .opt>span:first-child{flex:none;width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-size:1.5rem;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}",
    "#zgInbox .opt>span:last-child{display:grid;gap:4px;min-width:0;font-weight:700;font-size:1rem}",
    "#zgInbox .opt small{display:block;opacity:.75;font-weight:500;font-size:.82rem}",
    "#zgInbox .opt small .zg-btn{margin-top:8px}",
    "#zgInbox .zg-btn{border:0;cursor:pointer;border-radius:999px;font:inherit;font-weight:800;padding:9px 16px;color:#06091c;background:linear-gradient(135deg,#8EA0FF,#B49BFF 55%,#6FE3F0);box-shadow:0 10px 22px -10px rgba(120,110,255,.8)}",
    "#zgInbox .zg-btn.ghost{background:transparent;color:inherit;box-shadow:none;border:1px solid rgba(255,255,255,.3)}",
    "#invBanner{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translate(-50%,-140%);z-index:99999;width:min(94vw,460px);box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#2a1d6b,#1b3a6b);border:1px solid rgba(170,150,255,.5);box-shadow:0 18px 40px -12px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.2,.8,.2,1);cursor:pointer;font:inherit}",
    "#invBanner.on{transform:translate(-50%,0)}",
    "#invBanner .ib-ic{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:1.3rem;background:rgba(255,255,255,.12)}",
    "#invBanner .ib-t{display:grid;gap:2px;min-width:0;text-align:left}",
    "#invBanner .ib-t b{font-size:.98rem}",
    "#invBanner .ib-t small{opacity:.8;font-size:.82rem}"
  ].join("");
  document.head.appendChild(st);
})();

/* 2 · invitations: banner and check */
(function () {
  var SEEN = "mca_inv_seen", NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", ttt: "Tic-tac-toe" };
  function seen() { try { return JSON.parse(localStorage.getItem(SEEN) || "null"); } catch (e) { return null; } }
  function save(ids) { try { localStorage.setItem(SEEN, JSON.stringify(ids.slice(-200))); } catch (e) {} }
  function who(uid) {
    try { var x = (PR.dir || []).filter(function (d) { return d.uid === uid; })[0]; if (x && x.name) return x.name; } catch (e) {}
    return "A classmate";
  }
  function banner(title, sub) {
    var old = document.getElementById("invBanner"); if (old) old.remove();
    var b = document.createElement("button");
    b.id = "invBanner"; b.type = "button";
    b.innerHTML = '<span class="ib-ic">🎮</span><span class="ib-t"><b></b><small></small></span>';
    b.querySelector("b").textContent = title;
    b.querySelector("small").textContent = sub;
    b.addEventListener("click", function () {
      b.remove();
      try { toast("Open Battle Royale to accept the invitation.", "check"); } catch (e) {}
    });
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add("on"); });
    setTimeout(function () { b.classList.remove("on"); setTimeout(function () { b.remove(); }, 400); }, 7000);
  }
  async function check() {
    var sb = window.__sb;
    if (!sb || !navigator.onLine) return;
    try {
      var u = await sb.auth.getUser();
      var me = u && u.data && u.data.user && u.data.user.id;
      if (!me) return;
      var r = await sb.rpc("game_list");
      if (!r || r.error || !r.data) return;
      var inv = r.data.filter(function (g) { return g.status === "invited" && g.guest === me; });
      var known = seen();
      var ids = inv.map(function (g) { return g.id; });
      if (known === null) { save(ids); return; }                 // first run: no banner for old invitations
      var fresh = inv.filter(function (g) { return known.indexOf(g.id) < 0; });
      if (fresh.length) {
        var g = fresh[0];
        banner(who(g.host) + " invites you", (NAMES[g.kind] || "a game") + (fresh.length > 1 ? " · +" + (fresh.length - 1) + " more" : ""));
      }
      save(known.concat(fresh.map(function (g) { return g.id; })));
    } catch (e) {}
  }
  setTimeout(check, 4000);
  setInterval(check, 15000);
})();
