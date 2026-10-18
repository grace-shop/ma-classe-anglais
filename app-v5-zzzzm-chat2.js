/* =====================================================================
   v5 · Teacher chat, cleaned up.
   - The thread is redrawn only when something changed (no more blinking
     photos and bubbles every few seconds).
   - Plain text: no markdown stars or hashes shown to the pupil.
   - Messages grouped under day labels.
   - Camera button drawn as a 3D glass key.
   ===================================================================== */
(function () {
  var PT = window.__PT, nameOf = window.__chatH.nameOf, timeOf = window.__chatH.timeOf;
  function clean(t) {
    var s = String(t || "")
      .replace(/\*\([\s\S]*?\)\*/g, "")                       // *(...)* asides
      .replace(/\*\*(.+?)\*\*/gs, "$1")
      .replace(/__(.+?)__/gs, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*#{1,6}\s+/gm, "")
      .replace(/\*/g, "");
    // never talk about being a bot or an assistant: drop those sentences
    s = s.replace(/[^.!?\n]*(automatic assistant|automatic reply|artificial intelligence|\bAI\b|\bchatbot\b|\bbot\b|assistant of the teacher|I am the teacher)[^.!?\n]*[.!?]?/gi, "");
    return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function dayLabel(iso) {
    var d = new Date(iso), now = new Date();
    if (isNaN(d)) return "";
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((b - a) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  function bubble2(r) {
    var mine = PT.mode === "student" ? r.from_student : !r.from_student;
    var p = r.att && r.att.k === "img" && r.att.p;
    var img = p && PT.urls[p] && PT.urls[p] !== "…"
      ? '<img class="pt-img" src="' + esc(PT.urls[p]) + '" alt="' + esc(r.att.n || "photo") + '">'
      : (p ? '<div class="pt-meta">📷 photo</div>' : "");
    var txt = clean(r.body);
    var body = txt ? '<div class="pt-bub">' + img + natEmo(txt) + "</div>"
                   : (img ? '<div class="pt-bub">' + img + "</div>" : "");
    return '<div class="pt-row ' + (mine ? "me" : "them") + '">' + body +
      '<div class="pt-meta">' + timeOf(r.created_at) + "</div></div>";
  }
  function threadHtml(rows, empty) {
    if (!rows.length) return empty;
    var out = "", last = "";
    rows.forEach(function (r) {
      var lab = dayLabel(r.created_at);
      if (lab && lab !== last) { out += '<div class="pt-day"><span>' + lab + "</span></div>"; last = lab; }
      out += bubble2(r);
    });
    return out;
  }
  bubble = bubble2;

  ptRender = function () {
    var o = document.getElementById("profSheet");
    if (!o) return;
    var head = o.querySelector(".pt-head"), body = o.querySelector(".pt-body"), foot = o.querySelector(".pt-foot");
    var showThread = PT.mode === "student" || !!PT.student;
    foot.hidden = !showThread;
    o.querySelector(".pt-photo").hidden = PT.mode !== "student";
    var headHtml, html;
    if (PT.mode === "student") {
      headHtml = '<button type="button" class="pt-back" data-pt="back" aria-label="Back">‹</button><div class="pt-t"><b>Your teacher</b><small>Ask in English. Your teacher reads every message.</small></div>';
      html = threadHtml(thread(), '<div class="pt-empty">Write your question here. Your teacher will read it.<br>You can also send a photo or a screenshot.</div>');
    } else if (!PT.student) {
      headHtml = '<button type="button" class="pt-back" data-pt="back" aria-label="Close">✕</button><div class="pt-t"><b>Pupils\' messages</b><small>Tap a pupil to read and reply</small></div>';
      var by = {};
      for (var i = 0; i < PT.rows.length; i++) { var r = PT.rows[i], k = r.student; if (!by[k] || new Date(r.created_at) > new Date(by[k].created_at)) by[k] = r; }
      var last = Object.values(by).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      html = last.length
        ? '<div class="pt-list">' + last.map(function (r) { return '<button type="button" class="pt-item" data-pt="thread" data-id="' + esc(r.student) + '"><span class="pt-av">' + esc((nameOf(r.student) || "?").trim().charAt(0).toUpperCase()) + '</span><span class="pt-x"><b>' + esc(nameOf(r.student)) + "</b><small>" + (r.from_student ? "" : "You: ") + esc(clean(r.body || "📷 photo").slice(0, 80)) + '</small></span><span class="pt-meta">' + timeOf(r.created_at) + "</span></button>"; }).join("") + "</div>"
        : '<div class="pt-empty">No message from pupils yet.</div>';
    } else {
      headHtml = '<button type="button" class="pt-back" data-pt="back" aria-label="Back">‹</button><div class="pt-t"><b>' + esc(nameOf(PT.student)) + '</b><small>Pupil · you reply in English</small></div>';
      html = threadHtml(thread(), '<div class="pt-empty">No message yet.</div>');
    }
    if (head.dataset.sig !== headHtml) { head.innerHTML = headHtml; head.dataset.sig = headHtml; }
    if (PT.err) html = '<div class="pt-meta" style="color:#FF9AA8">' + esc(PT.err) + "</div>" + html;
    if (body._sig === html) return;
    var first = body._sig === undefined;
    var near = body.scrollHeight - body.scrollTop - body.clientHeight < 140;
    body.innerHTML = html;
    body._sig = html;
    if (first || near) body.scrollTop = body.scrollHeight;
  };

  var st = document.createElement("style");
  st.id = "zzzzmchat2";
  st.textContent = `
#profSheet .pt-day{display:flex;justify-content:center;margin:14px 0 6px}
#profSheet .pt-day span{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#AEB8E8;padding:4px 12px;border-radius:999px;background:rgba(120,135,255,.14);border:1px solid rgba(160,176,255,.22)}
#profSheet .pt-photo{width:52px!important;height:52px!important;border-radius:18px!important;display:grid!important;place-items:center!important;font-size:1.35rem!important;background:linear-gradient(145deg,rgba(255,255,255,.26),rgba(255,255,255,.03)),rgba(24,30,70,.7)!important;border:1px solid rgba(190,205,255,.38)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.4),inset 0 -6px 12px rgba(0,0,0,.35),0 12px 24px -8px rgba(90,110,255,.8),0 0 0 4px rgba(120,140,255,.08)!important;transform:perspective(500px) rotateX(16deg) translateZ(0)!important;transition:transform .3s ease,box-shadow .3s ease!important;cursor:pointer}
#profSheet .pt-photo:hover{transform:perspective(500px) rotateX(0deg) translateY(-3px) scale(1.05)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.45),inset 0 -6px 12px rgba(0,0,0,.3),0 18px 30px -8px rgba(110,130,255,.95),0 0 26px -2px rgba(127,140,255,.7)!important}
#profSheet .pt-photo:active{transform:perspective(500px) rotateX(24deg) scale(.95)!important}
@media (prefers-reduced-motion:reduce){#profSheet .pt-photo{transition:none!important}}
`;
  document.head.appendChild(st);
})();
