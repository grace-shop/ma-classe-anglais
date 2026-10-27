/* Outbox: when there is no network, writes (messages, posts, reactions) wait on the phone
   and are sent in order as soon as the connection comes back. Reads are not queued. */
(function () {
  var KEY = "mca_outbox";
  var WRITES = { prof_send: 1, prof_teacher_reply: 1, send_group_message: 1, react_group_message: 1,
    mark_group_read: 1, create_post: 1, create_story: 1, game_play: 1, game_respond: 1 };
  var orig = null, busy = false;

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function write(q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) {} }
  function isNetErr(e) {
    if (!e) return false;
    if (navigator.onLine === false) return true;
    var m = String(e.message || e.details || e);
    return e.name === "TypeError" || /fetch|network|failed to|load failed|timeout/i.test(m);
  }
  function enqueue(name, args) {
    var q = read(); q.push({ n: name, a: args, t: Date.now() }); write(q);
    try { toast("Pas de réseau : le message part dès que la connexion revient."); } catch (e) {}
  }
  async function flush() {
    if (busy || !orig || navigator.onLine === false) return;
    busy = true;
    try {
      var q = read();
      while (q.length) {
        var it = q[0], r;
        try { r = await orig(it.n, it.a); } catch (e) { r = { error: e }; }
        if (r && r.error && isNetErr(r.error)) break;   // still offline: keep the rest
        q.shift(); write(q);                              // sent, or refused by the server (not retried)
      }
    } finally { busy = false; }
  }

  function install(sb) {
    if (!sb || !sb.rpc || sb.__outbox) return;
    sb.__outbox = true;
    orig = sb.rpc.bind(sb);
    sb.rpc = function (name, args, opts) {
      if (!WRITES[name]) return orig(name, args, opts);
      if (navigator.onLine === false) { enqueue(name, args); return Promise.resolve({ data: null, error: null, queued: true }); }
      // a request that does not answer in 12 s is treated as offline: it is queued, so sending never hangs
      var timed = new Promise(function (resolve) {
        var t = setTimeout(function () { resolve({ error: { message: "Failed to fetch (timeout)" } }); }, 12000);
        Promise.resolve(orig(name, args, opts)).then(function (r) { clearTimeout(t); resolve(r); }, function (e) { clearTimeout(t); resolve({ error: e }); });
      });
      return timed.then(function (r) {
        if (r && r.error && isNetErr(r.error)) { enqueue(name, args); return { data: null, error: null, queued: true }; }
        return r;
      });
    };
  }

  var tries = 0;
  var wait = setInterval(function () {
    var sb = window.__sb;
    if (sb) { clearInterval(wait); install(sb); flush(); }
    else if (++tries > 600) clearInterval(wait);
  }, 100);

  // watchdog: the peer send guard (PR.sending) must never stay on; if a send is still busy after 20 s, release it
  var busySince = 0;
  setInterval(function () {
    if (typeof PR === "undefined") return;
    if (!PR.sending) { busySince = 0; return; }
    if (!busySince) busySince = Date.now();
    if (Date.now() - busySince > 20000) {
      PR.sending = false; busySince = 0;
      try { toast("L\x27envoi a été bloqué. Réessayez."); } catch (e) {}
      try { render(); } catch (e) {}
    }
  }, 1000);

  window.addEventListener("online", function () { flush(); });
  setInterval(flush, 15000);
  window.mcaOutbox = { pending: function () { return read().length; }, flush: flush };
})();
