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
      return Promise.resolve(orig(name, args, opts)).then(function (r) {
        if (r && r.error && isNetErr(r.error)) { enqueue(name, args); return { data: null, error: null, queued: true }; }
        return r;
      }, function (e) {
        if (isNetErr(e)) { enqueue(name, args); return { data: null, error: null, queued: true }; }
        throw e;
      });
    };
  }

  var tries = 0;
  var wait = setInterval(function () {
    var sb = window.__sb;
    if (sb) { clearInterval(wait); install(sb); flush(); }
    else if (++tries > 600) clearInterval(wait);
  }, 100);

  window.addEventListener("online", function () { flush(); });
  setInterval(flush, 15000);
  window.mcaOutbox = { pending: function () { return read().length; }, flush: flush };
})();
