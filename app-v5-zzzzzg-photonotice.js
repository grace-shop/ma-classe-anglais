/* =====================================================================
   v5 · When someone changes their profile photo, a line is written in
   each of their conversations (one-to-one chats and groups they share),
   so everyone in those chats sees it. No push notification is sent.
   ===================================================================== */
(function () {
  function who() { return (typeof callMyName === "function" && callMyName()) || "Quelqu'un"; }

  window.__photoChanged = function () {
    var text = who() + " a changé de photo de profil.";
    // one-to-one chats: the people I have exchanged messages with
    var seen = {};
    ((typeof PR !== "undefined" && PR.inbox) || []).forEach(function (m) {
      var other = m.sender === S.uid ? m.receiver : m.sender;
      if (other && other !== S.uid) seen[other] = true;
    });
    Object.keys(seen).slice(0, 80).forEach(function (u) {
      try { window.__peer.send(u, text, null, null).catch(function () {}); } catch (e) {}
    });
    // groups I am in
    ((typeof GR !== "undefined" && GR.list) || []).forEach(function (g) {
      try { Promise.resolve(grSend(g.id, text, null, null)).catch(function () {}); } catch (e) {}
    });
  };
})();
