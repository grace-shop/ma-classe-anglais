/* =====================================================================
   v5 · Polls you can vote on.
   A poll is a message with its options hidden in invisible characters.
   A vote is a short hidden message: each person's latest vote counts,
   so both people see the same numbers.
   ===================================================================== */
(function () {
  var A = ["⁡", "⁢", "⁣", "⁤"];
  var RUN = /[⁡-⁤]+/g;

  function enc(s) {
    var b = new TextEncoder().encode(s), o = "";
    for (var i = 0; i < b.length; i++) {
      var x = b[i];
      o += A[(x >> 6) & 3] + A[(x >> 4) & 3] + A[(x >> 2) & 3] + A[x & 3];
    }
    return o;
  }
  function dec(run) {
    var bytes = [];
    for (var i = 0; i + 3 < run.length; i += 4) {
      var v = [0, 1, 2, 3].map(function (k) { return A.indexOf(run.charAt(i + k)); });
      if (v.indexOf(-1) >= 0) return "";
      bytes.push((v[0] << 6) | (v[1] << 4) | (v[2] << 2) | v[3]);
    }
    try { return new TextDecoder().decode(new Uint8Array(bytes)); } catch (e) { return ""; }
  }

  // the poll's invisible part, added to its message when it is sent
  window.__zzPoll = {
    enc: enc,
    mark: function (id, q, opts) {
      return enc("P:" + id + ":" + (((typeof S !== "undefined" ? S : undefined) && S.uid) || "") + ":" + JSON.stringify({ q: q, o: opts }));
    }
  };

  // the kind and conversation of the open chat, to send a vote
  function chatInfo() {
    var f = document.querySelector("form.v4bar");
    if (!f) return null;
    var kinds = ["peer", "chat", "group", "staff"];
    for (var i = 0; i < kinds.length; i++) {
      try { if (V4F(kinds[i]) === f.dataset.f) return { kind: kinds[i], target: f.dataset.s }; } catch (e) {}
    }
    return null;
  }

  function sendVote(pid, idx) {
    var c = chatInfo();
    if (!c || !c.target) { toast("Ouvre la conversation pour voter.", "x"); return; }
    var text = enc("V:" + pid + ":" + idx + ":" + (((typeof S !== "undefined" ? S : undefined) && S.uid) || ""));
    Promise.resolve(v4Deliver(c.kind, c.target, text, null, null)).catch(function () {
      toast("Vote non envoyé.", "x");
    });
  }

  var scheduled = 0;
  function scan() {
    var votes = {}, polls = [], locs = [];
    document.querySelectorAll(".msgs .msg").forEach(function (m) {
      if (!/[⁡-⁤]/.test(m.textContent)) return;
      (m.textContent.match(RUN) || []).forEach(function (r) {
        var s = dec(r);
        var i1 = s.indexOf(":");
        if (i1 < 0) return;
        var type = s.slice(0, i1);
        if (type === "V") {
          var p = s.split(":");
          if (p.length < 4) return;
          (votes[p[1]] = votes[p[1]] || {})[p[3]] = +p[2];
          m.classList.add("zz-vmsg");
        } else if (type === "L") {
          var q = s.split(":");
          var lat = parseFloat(q[1]), lng = parseFloat(q[2]);
          if (isFinite(lat) && isFinite(lng)) locs.push({ m: m, lat: lat, lng: lng });
        } else if (type === "P") {
          var i2 = s.indexOf(":", i1 + 1), i3 = s.indexOf(":", i2 + 1);
          var id = s.slice(i1 + 1, i2);
          var data;
          try { data = JSON.parse(s.slice(i3 + 1)); } catch (e) { return; }
          polls.push({ m: m, id: id, data: data });
        }
      });
    });
    polls.forEach(function (P) { render(P, votes[P.id] || {}); });
    locs.forEach(function (L) { renderLoc(L); });
  }

  // a location card: a map tile of the place, tap to open the map
  function renderLoc(L) {
    var sig = L.lat + "," + L.lng;
    var old = L.m.querySelector(":scope > .zz-loc");
    if (old && old.dataset.sig === sig) return;
    if (old) old.remove();
    var z = 15, n = Math.pow(2, z);
    var x = Math.floor((L.lng + 180) / 360 * n);
    var lr = L.lat * Math.PI / 180;
    var y = Math.floor((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n);
    var a = document.createElement("a");
    a.className = "zz-loc";
    a.dataset.sig = sig;
    a.href = "https://www.openstreetmap.org/?mlat=" + L.lat + "&mlon=" + L.lng + "#map=16/" + L.lat + "/" + L.lng;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = '<span class="zz-lmap"><img alt="Carte" src="https://a.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png" loading="lazy"><i class="zz-lpin"></i></span>' +
      '<span class="zz-lt">📍 Position partagée</span><span class="zz-lo">Ouvrir la carte</span>';
    L.m.appendChild(a);
  }

  function render(P, v) {
    var me = ((typeof S !== "undefined" ? S : undefined) && S.uid) || "";
    var counts = P.data.o.map(function () { return 0; });
    var total = 0;
    Object.keys(v).forEach(function (uid) {
      var idx = v[uid];
      if (idx >= 0 && idx < counts.length) { counts[idx]++; total++; }
    });
    var mine = v[me];
    var sig = JSON.stringify([counts, mine]);
    var old = P.m.querySelector(":scope > .zz-pl");
    if (old && old.dataset.sig === sig) return;
    if (old) old.remove();
    var box = document.createElement("div");
    box.className = "zz-pl";
    box.dataset.pid = P.id;
    box.dataset.sig = sig;
    box.innerHTML = P.data.o.map(function (opt, i) {
      var pct = total ? Math.round(counts[i] * 100 / total) : 0;
      return '<button type="button" class="zz-po' + (mine === i ? " on" : "") + '" data-i="' + i + '">' +
        '<span class="zz-pb" style="width:' + pct + '%"></span>' +
        '<span class="zz-pt">' + esc(opt) + '</span>' +
        '<span class="zz-pc">' + counts[i] + (total ? " · " + pct + "%" : "") + '</span></button>';
    }).join("") + '<small class="zz-ptot">' + total + (total > 1 ? " votes" : " vote") + '</small>';
    P.m.appendChild(box);
  }

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".zz-po");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var box = b.closest(".zz-pl");
    if (box) sendVote(box.dataset.pid, +b.dataset.i);
  }, true);

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { scan(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzqPoll";
  st.textContent = `
.msgs .msg.zz-vmsg{display:none!important}
.msgs .msg .zz-loc{position:relative;display:block;margin-top:8px;border-radius:14px;overflow:hidden;background:#0B0D18;color:#fff;text-decoration:none;width:min(260px,100%)}
.msgs .msg .zz-lmap{position:relative;display:block;height:150px;overflow:hidden}
.msgs .msg .zz-lmap img{width:100%;height:100%;object-fit:cover;display:block}
.msgs .msg .zz-lpin{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-18px 0 0 -9px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#EF4444;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.msgs .msg .zz-lt{display:block;padding:8px 10px 0;font:700 .85rem system-ui,sans-serif}
.msgs .msg .zz-lo{display:block;padding:2px 10px 10px;font:600 .75rem system-ui,sans-serif;color:#9FF5DA}
.msgs .msg .zz-pl{margin-top:8px;display:flex;flex-direction:column;gap:6px;min-width:200px}
.msgs .msg .zz-po{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:inherit;font:600 .92rem/1.2 system-ui,sans-serif;cursor:pointer}
.msgs .msg .zz-po.on{border-color:#A78BFA;box-shadow:0 0 0 1px #A78BFA inset}
.msgs .msg .zz-pb{position:absolute;left:0;top:0;bottom:0;background:rgba(167,139,250,.35);z-index:0;transition:width .25s}
.msgs .msg .zz-pt,.msgs .msg .zz-pc{position:relative;z-index:1}
.msgs .msg .zz-pc{font-size:.78rem;opacity:.85;white-space:nowrap}
.msgs .msg .zz-ptot{opacity:.7;font:600 .75rem system-ui,sans-serif}
`;
  document.head.appendChild(st);
  try { scan(); } catch (e) {}
})();
