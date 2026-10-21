/* =====================================================================
   v5 · My own stickers.
   - In the "Stickers 3D" panel of a chat, a "Créer un sticker" tile lets
     you make a sticker from a photo (a square, light image), a GIF, or a
     short video. The file is kept on the server and listed on this phone.
   - Your stickers appear in the panel. Tap one to send it to the chat.
   - The photo is resized to 512 px, which keeps it fast on a phone.
   ===================================================================== */
(function () {
  var MAX_VIDEO = 6 * 1024 * 1024;   // a sticker video must stay small
  var cache = {};                    // path -> object URL, for this page only

  function store() {
    var uid = (window.S && S.uid) || "anon";
    return {
      key: "mca_mystk_" + uid,
      list: function () {
        try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch (e) { return []; }
      },
      save: function (l) { try { localStorage.setItem(this.key, JSON.stringify(l)); } catch (e) {} }
    };
  }

  // ---- create ----
  var picker = null;
  function openPicker() {
    if (!picker) {
      picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*,video/*";
      picker.hidden = true;
      document.body.appendChild(picker);
      picker.addEventListener("change", function () {
        var f = picker.files && picker.files[0];
        picker.value = "";
        if (f) makeSticker(f);
      });
    }
    picker.click();
  }

  function resizeToWebp(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        try {
          var max = 512, sc = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * sc));
          c.height = Math.max(1, Math.round(img.height * sc));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            URL.revokeObjectURL(url);
            b ? resolve(b) : reject(new Error("Image non lisible"));
          }, "image/webp", 0.9);
        } catch (e) { reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Image non lisible")); };
      img.src = url;
    });
  }

  function makeSticker(file) {
    var isVid = /^video\//.test(file.type || "") || /\.(mp4|mov|webm|3gp|m4v)$/i.test(file.name || "");
    if (isVid && file.size > MAX_VIDEO) { toast("Vidéo trop lourde pour un sticker (6 Mo max). Prends une vidéo plus courte.", "x"); return; }
    toast("Création du sticker…", "check");
    var job = isVid ? Promise.resolve(file) : (/gif/i.test(file.type || "") ? Promise.resolve(file) : resizeToWebp(file));
    job.then(function (blob) {
      var name = isVid ? "sticker-video" : "sticker";
      return window.__chatFiles.upload(blob, name + (isVid ? ".mp4" : ".webp")).then(function (up) {
        var l = store().list();
        l.unshift({ id: Math.random().toString(36).slice(2, 10), p: up.p, t: up.t });
        store().save(l.slice(0, 60));
        toast("Sticker ajouté à ta collection", "check");
        if (typeof render === "function") render();
      });
    }).catch(function (e) {
      toast(String((e && e.message) || "Sticker impossible à créer").slice(0, 120), "x");
    });
  }

  // ---- send ----
  function sendSticker(item) {
    var k = (window.V4 && V4.panel && V4.panel.kind) || "peer";
    var t = (typeof v4Target === "function" && v4Target(k)) || (V4.panel && V4.panel.target) || "";
    V4.panel = null;
    if (typeof render === "function") render();
    if (!t) return;
    if (!navigator.onLine) { toast("Pas de réseau : réessaie quand tu es en ligne.", "x"); return; }
    Promise.resolve(v4Deliver(k, t, "", { k: "sticker", p: item.p, t: item.t })).catch(function (e) {
      toast((e && e.message) || "Envoi impossible", "x");
    });
  }

  // ---- show the files (photo, GIF or video) ----
  function hydrate(el, path, mime) {
    if (cache[path]) { setSrc(el, cache[path], mime); return; }
    if (typeof srcURL !== "function") return;
    srcURL({ k: "m", id: path, t: mime }).then(function (u) {
      cache[path] = u;
      setSrc(el, u, mime);
    }).catch(function () {});
  }
  function setSrc(el, u, mime) {
    if (el.tagName === "VIDEO") { el.src = u; el.play && el.play().catch(function () {}); }
    else el.src = u;
  }

  function panelTiles() {
    document.querySelectorAll(".v4panel .v4grid.stk").forEach(function (grid) {
      if (grid.dataset.zzmy === "1") return;
      grid.dataset.zzmy = "1";
      var mine = store().list();
      var head = document.createElement("button");
      head.type = "button";
      head.className = "zz-mnew";
      head.setAttribute("aria-label", "Créer un sticker");
      head.innerHTML = '<span class="zz-mplus">+</span><span class="zz-mtxt">Créer un sticker</span>';
      grid.insertBefore(head, grid.firstChild);
      mine.forEach(function (it) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "zz-mstk";
        b.dataset.zzid = it.id;
        var isVid = /^video\//.test(it.t || "");
        b.innerHTML = isVid
          ? '<video data-zzp="' + it.p + '" data-zzt="' + it.t + '" muted loop playsinline autoplay></video>'
          : '<img data-zzp="' + it.p + '" data-zzt="' + it.t + '" alt="Mon sticker">';
        grid.insertBefore(b, head.nextSibling);
      });
    });
  }

  // a sticker bubble or panel tile: load its file once it is on screen
  function hydrateAll() {
    document.querySelectorAll("img[data-zzp], video[data-zzp]").forEach(function (el) {
      if (el.dataset.zzdone) return;
      el.dataset.zzdone = "1";
      hydrate(el, el.dataset.zzp, el.dataset.zzt);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".zz-mnew")) { e.preventDefault(); e.stopPropagation(); openPicker(); return; }
    var b = t.closest(".zz-mstk");
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      var it = store().list().filter(function (x) { return x.id === b.dataset.zzid; })[0];
      if (it) sendSticker(it);
    }
  }, true);

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      try { panelTiles(); hydrateAll(); } catch (e) {}
    });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzxMystk";
  st.textContent = `
.v4panel .v4grid.stk .zz-mnew{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1px dashed rgba(255,255,255,.35);border-radius:16px;background:rgba(255,255,255,.05);color:inherit;cursor:pointer;min-height:72px;padding:8px;font:700 .72rem/1.1 system-ui,sans-serif}
.v4panel .v4grid.stk .zz-mplus{font-size:1.6rem;line-height:1}
.v4panel .v4grid.stk .zz-mstk{border:0;background:rgba(255,255,255,.04);border-radius:16px;padding:4px;cursor:pointer;min-height:72px}
.v4panel .v4grid.stk .zz-mstk img,.v4panel .v4grid.stk .zz-mstk video{width:100%;height:100%;object-fit:contain;display:block;border-radius:12px}
img.zz-stki,video.zz-stkv{width:150px;max-width:55vw;height:auto;display:block;background:transparent}
`;
  document.head.appendChild(st);
})();
