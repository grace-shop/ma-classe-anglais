/* ---- Pouvoirs des avatars légendaires (1500 à 5000 XP), nom modifiable dans le profil, mode léger par défaut ---- */
{
  // chaque avatar a son pouvoir, réclamé tout seul une fois par jour quand on le porte
  var PERKS = {
    "av:hero-man":     { at: 1500, t: "+40 XP every day",                               xp: 40 },
    "av:hero-woman":   { at: 1500, t: "+40 XP every day",                               xp: 40 },
    "av:robot":        { at: 2000, t: "+1 50/50 joker every day",                       joker: 1 },
    "av:alien":        { at: 2000, t: "Turbo XP ×2 for 20 minutes every day",           boost: 20 },
    "av:prince":       { at: 2500, t: "+60 XP every day",                               xp: 60 },
    "av:princess":     { at: 2500, t: "+1 streak freeze every day",                     freeze: 1 },
    "av:unicorn":      { at: 4000, t: "+100 XP and 1 joker every day",                  xp: 100, joker: 1 },
    "av:dragon":       { at: 5000, t: "+150 XP and Turbo ×2 for 30 minutes every day",  xp: 150, boost: 30 }
  };
  var pkBusy = false;
  function pkMine() { var m = S && S.me; return m && PERKS[m.ava] ? PERKS[m.ava] : null; }

  function pkClaim() {
    var m = S && S.me, p = pkMine();
    if (!p || pkBusy || !S.uid || S.mode !== "student" || (typeof isParent === "function" && isParent(m)) || m.perkDay === today()) return;
    if ((m.xp || 0) < p.at && !(m.owned && m.owned["ava-" + m.ava.slice(3)])) return;
    pkBusy = true;
    var patch = { perkDay: today() }, bits = [];
    if (p.joker && (m.jokers || 0) < JOKER_MAX) { patch.jokers = Math.min(JOKER_MAX, (m.jokers || 0) + p.joker); bits.push("+" + p.joker + " joker"); }
    if (p.freeze && (m.freezes || 0) < FREEZE_MAX) { patch.freezes = (m.freezes || 0) + p.freeze; bits.push("+" + p.freeze + " streak freeze"); }
    if (p.boost) { patch.boostUntil = Math.max(Date.now(), m.boostUntil || 0) + p.boost * 60000; bits.push("Turbo ×2 " + p.boost + " min"); }
    try { meWrite(patch); } catch (e) { pkBusy = false; return; }
    if (p.xp) { try { gain(p.xp, "Avatar power"); } catch (e) {} bits.unshift("+" + p.xp + " XP"); }
    try { toast("Avatar power: " + bits.join(" · "), "gift"); } catch (e) {}
    setTimeout(function () { pkBusy = false; }, 1500);
  }
  setInterval(function () { if (document.visibilityState === "visible") { try { pkClaim(); } catch (e) {} } }, 8000);

  /* ---- profil : changer son nom, et voir le pouvoir de son avatar ---- */
  var _pv = profileView;
  profileView = function () {
    var h = _pv(), m = S.me;
    if (!m || S.mode !== "student") return h;
    var p = pkMine(), done = m.perkDay === today();
    var perk = p
      ? '<p class="small muted" style="margin:6px 0 0">Avatar power: <b>' + esc(p.t) + '</b> · ' + (done ? "claimed today ✓" : "comes with your next visit") + '</p>'
      : '<p class="small muted" style="margin:6px 0 0">Legendary avatars (1500 to 5000 XP) each have a daily power. See the shop.</p>';
    var card = '<div class="section" style="max-width:720px;margin-inline:auto"><div class="glass card" style="display:grid;gap:8px"><label class="small muted" for="pfName">Your name</label>' +
      '<div class="row" style="gap:8px;flex-wrap:nowrap"><input id="pfName" class="input" maxlength="40" autocomplete="name" style="flex:1;min-width:0" value="' + esc(m.name || "") + '" placeholder="Your name">' +
      '<button type="button" class="btn sm" data-pfname="save">Save</button></div>' + perk + '</div></div>';
    return card + h;
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pfname]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var el = document.getElementById("pfName"), nm = String(el ? el.value : "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (nm.length < 2) { toast("Write your name (at least 2 letters).", "x"); return; }
    if (!S.uid) return;
    S.me = Object.assign({}, S.me, { name: nm });
    write(function () { return S.db.doc("students/" + S.uid).update({ name: nm }); }).then(function () { toast("Name saved", "check"); }).catch(function () { toast("Saved on this phone: it will be sent when you are online.", "check"); });
    try { write(function () { return S.db.doc("board/" + S.uid).update({ name: nm }); }).catch(function () {}); } catch (x) {}
    render();
  }, true);

  /* ---- boutique : la liste des pouvoirs ---- */
  var _sv = shopView;
  shopView = function () {
    var h = _sv(), m = S.me; if (!m) return h;
    var seen = {}, rows = Object.keys(PERKS).filter(function (k) { var t = PERKS[k].t + PERKS[k].at; if (seen[t]) return false; seen[t] = 1; return true; }).map(function (k) {
      var p = PERKS[k], has = (m.xp || 0) >= p.at;
      return '<div class="small" style="display:flex;justify-content:space-between;gap:10px;opacity:' + (has ? 1 : .6) + '"><span>' + (m.ava === k ? "★ " : "") + esc(k.slice(3).replace(/-/g, " ")) + ' · ' + p.at + ' XP</span><b>' + esc(p.t) + '</b></div>';
    }).join("");
    var card = '<div class="section"><div class="glass card" style="display:grid;gap:8px"><span class="eyebrow">Legendary avatars</span><h3 style="margin:0">Each avatar has a daily power</h3>' + rows + '<p class="small muted" style="margin:0">Wear the avatar and its power arrives by itself, once a day.</p></div></div>';
    var k = h.indexOf('<div class="section"><div><span class="eyebrow">In real life</span>');
    return k > 0 ? h.slice(0, k) + card + h.slice(k) : h + card;
  };
}

