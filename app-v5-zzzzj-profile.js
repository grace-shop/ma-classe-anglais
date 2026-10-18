/* =====================================================================
   v5 · Profile header in the Facebook layout (reference image).
   Added above the existing profile page. Nothing is removed: the cover,
   shop, log-out and all cards below stay as they are. The duplicate
   avatar and cover are hidden with CSS. Colours follow the app theme
   variables, so the page changes with the chosen theme.
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzjprofile")) return;
  var st = document.createElement("style");
  st.id = "zzzzjprofile";
  st.textContent = `
.fbp{max-width:720px;margin:0 auto;color:var(--fg);font-family:Manrope,system-ui,sans-serif}
.fbp-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;position:sticky;top:0;z-index:6;background:var(--nav-bg,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:0 0 18px 18px}
.fbp-top h2{margin:0;font-size:1.05rem;font-weight:800;letter-spacing:.01em}
.fbp-ib{width:42px;height:42px;border-radius:14px;border:1px solid var(--line);background:var(--surface2,rgba(127,140,255,.12));color:var(--fg);display:grid;place-items:center;cursor:pointer;padding:0}
.fbp-ib svg{width:20px;height:20px}
.fbp .av3-cover{height:200px;border-radius:0 0 26px 26px;margin:0}
.fbp-av{position:relative;width:max-content;margin:-70px 0 0 20px;padding:5px;border-radius:50%;background:var(--surface2,#fff);box-shadow:0 18px 36px -12px rgba(0,0,0,.55),0 0 0 3px rgba(127,140,255,.35)}
.fbp-name{margin:12px 20px 2px;font-size:1.9rem;font-weight:800;letter-spacing:-.01em;line-height:1.1}
.fbp-title{margin:0 20px;color:var(--muted);font-size:.95rem}
.fbp-title b{color:var(--fg)}
.fbp-btns{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin:16px 20px 0}
.fbp-btn{display:flex;align-items:center;justify-content:center;gap:8px;height:44px;border-radius:14px;border:1px solid var(--line);font:inherit;font-weight:700;cursor:pointer;padding:0 12px;background:var(--surface2,rgba(127,140,255,.12));color:var(--fg)}
.fbp-btn svg{width:18px;height:18px}
.fbp-btn.pri{background:var(--ink);color:var(--on-ink,#fff);border-color:transparent;box-shadow:0 12px 26px -12px var(--ink)}
.fbp-btn.more{width:44px;padding:0}
.fbp-tabs{display:flex;gap:6px;margin:18px 14px 0;padding:0 0 12px;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.fbp-tabs::-webkit-scrollbar{display:none}
.fbp-tab{flex:0 0 auto;padding:9px 16px;border-radius:999px;border:0;background:none;color:var(--muted);font:inherit;font-weight:700;cursor:pointer}
.fbp-tab[aria-selected="true"]{background:var(--surface2,rgba(127,140,255,.16));color:var(--fg)}
.fbp-det{margin:14px 20px 4px;display:grid;gap:12px}
.fbp-det h3{margin:0;font-size:1.05rem;font-weight:800}
.fbp-row{display:flex;align-items:center;gap:12px;font-size:.98rem}
.fbp-row i{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--surface2,rgba(127,140,255,.12));color:var(--muted);flex:0 0 auto}
.fbp-row i svg{width:18px;height:18px}
.fbp-row small{display:block;color:var(--muted);font-size:.8rem}
.fbp-btn{white-space:nowrap;font-size:.88rem}
.fbp .av3-cov-btn{font-size:.8rem;padding:7px 12px;white-space:nowrap;width:auto}
.fbp-av .av,.fbp-av .av3d-avt{width:112px!important;height:112px!important;border-radius:50%!important;display:grid;place-items:center;overflow:hidden}
.fbp-av .av{font-size:2.4rem;background:linear-gradient(135deg,#6EE7C1,#8B9BFF);color:#06241C;font-weight:800}
.fbp .av3-cover{background-color:transparent}
/* the duplicates below the new header */
.fbp ~ .section.av3-wrap{display:none!important}
.fbp ~ .section .glass.hero>.row:first-child{display:none!important}
`;
  document.head.appendChild(st);

  var I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>'
  };

  function fbHeader() {
    var m = S.me || {};
    var nm = esc(m.name || "");
    var lg = leagueOf(m.xp);
    var words = Object.values(m.deckProgress || {}).reduce(function (s, d) { return s + ((d && d.known) || []).length; }, 0);
    var lessons = Object.keys(m.lessonsRead || {}).length;
    var title = titleOf(m);
    return '<div class="fbp" id="fbpTop">' +
      '<div class="fbp-top"><button type="button" class="fbp-ib" data-fbp="home" aria-label="Back to home">' + I.home + '</button>' +
      '<h2>Profile</h2>' +
      '<button type="button" class="fbp-ib" data-a="openShop" aria-label="Shop">' + I.bag + '</button></div>' +
      covBanner(m.cover, true) +
      '<div class="fbp-av">' + avatar(S.uid, m.name, 112) + '</div>' +
      '<h1 class="fbp-name">' + nm + '</h1>' +
      '<p class="fbp-title"><b>Rank ' + rankOf(m.xp) + '</b> · ' + esc(m.level || "") + (title ? ' · ' + esc(title) : '') + '</p>' +
      '<div class="fbp-btns">' +
        '<button type="button" class="fbp-btn pri" data-a="openShop">' + I.bag + 'Shop · ' + coinsOf(m) + ' XP</button>' +
        '<button type="button" class="fbp-btn" data-fbp="details">' + I.trophy + lg.name + ' League</button>' +
        '<button type="button" class="fbp-btn more" data-a="logout" aria-label="Log out">' + I.more + '</button>' +
      '</div>' +
      '<div class="fbp-tabs" role="tablist">' +
        '<button type="button" class="fbp-tab" role="tab" aria-selected="true" data-fbp="home">Overview</button>' +
        '<button type="button" class="fbp-tab" role="tab" aria-selected="false" data-fbp="details">Details</button>' +
        '<button type="button" class="fbp-tab" role="tab" aria-selected="false" data-a="openShop">Shop</button>' +
      '</div>' +
      '<div class="fbp-det" id="fbpDetails"><h3>Details</h3>' +
        '<div class="fbp-row"><i>' + I.star + '</i><div><b>' + (m.xp || 0) + ' XP</b><small>Experience points</small></div></div>' +
        '<div class="fbp-row"><i>' + I.trophy + '</i><div><b>' + lg.name + ' League</b><small>' + esc(m.level || "") + '</small></div></div>' +
        '<div class="fbp-row"><i>' + I.book + '</i><div><b>' + words + ' words · ' + lessons + ' lessons</b><small>Mastered and read</small></div></div>' +
        '<div class="fbp-row"><i>' + I.cal + '</i><div><b>Joined on ' + fmtDate(m.joinedAt) + '</b><small>English Classes</small></div></div>' +
      '</div></div>';
  }

  // Tabs and the back button: scroll inside the page, no navigation change.
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-fbp]");
    if (!b) return;
    e.preventDefault();
    var k = b.getAttribute("data-fbp");
    if (k === "home" && b.getAttribute("aria-label") === "Back to home") {
      var first = document.querySelector("nav.tabs button");
      if (first) first.click();
      return;
    }
    var target = k === "details" ? document.getElementById("fbpDetails") : document.getElementById("fbpTop");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelectorAll(".fbp-tab").forEach(function (t) {
      t.setAttribute("aria-selected", String(t.getAttribute("data-fbp") === k));
    });
  }, true);

  // Wrap the profile view once the page has defined it.
  var tries = 0;
  (function wrap() {
    if (typeof profileView === "function" && !window.__fbpWrapped) {
      window.__fbpWrapped = true;
      var base = profileView;
      profileView = function () { return fbHeader() + base(); };
      return;
    }
    if (tries++ < 200) setTimeout(wrap, 50);
  })();
})();
