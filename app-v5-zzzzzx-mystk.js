/* =====================================================================
   v5 · My own stickers.
   - "Créer un sticker" in the Stickers panel: from a photo, a GIF or a
     short video. A photo can be edited first (crop, text, blur…).
   - Videos must be MP4 or WebM (the formats a phone shows in a bubble).
   - Tap a sticker in a chat:
       not in my collection → "Enregistrer" · "Modifier"
       in my collection     → "Supprimer" · "Modifier"
   - A sticker is kept on the server; the list is kept on this phone.
   ===================================================================== */
(function () {
  var MAX_VIDEO = 6 * 1024 * 1024;   // a sticker video must stay small

  function store() {
    var uid = ((typeof S !== "undefined" ? S : undefined) && S.uid) || "anon";
    return {
      key: "mca_mystk_" + uid,
      list: function () {
        try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch (e) { return []; }
      },
      save: function (l) { try { localStorage.setItem(this.key, JSON.stringify(l)); } catch (e) {} }
    };
  }
  function mine(p) { return store().list().some(function (x) { return x.p === p; }); }

  // ---- a small bottom sheet with choices ----
  function ask(title, sub, actions) {
    return new Promise(function (resolve) {
      var box = document.createElement("div");
      box.id = "zzStk";
      box.innerHTML = '<div class="zz-skb" data-x="1"></div><div class="zz-sks"><div class="zz-skg"></div>' +
        '<div class="zz-skh"></div>' + (sub ? '<p class="zz-skp"></p>' : "") +
        actions.map(function (a, i) { return '<button type="button" class="zz-ska' + (a.primary ? " pri" : "") + (a.danger ? " dng" : "") + '" data-i="' + i + '"></button>'; }).join("") +
        '<button type="button" class="zz-skc" data-x="1">Annuler</button></div>';
      box.querySelector(".zz-skh").textContent = title;
      if (sub) box.querySelector(".zz-skp").textContent = sub;
      actions.forEach(function (a, i) { box.querySelectorAll(".zz-ska")[i].textContent = a.label; });
      document.body.appendChild(box);
      function done(v) { box.remove(); resolve(v); }
      box.addEventListener("click", function (e) {
        if (e.target.dataset && e.target.dataset.x) return done(null);
        var b = e.target.closest && e.target.closest(".zz-ska");
        if (b) done(actions[+b.dataset.i].key);
      });
    });
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
        if (f) chooseFile(f);
      });
    }
    picker.click();
  }

  function isVideo(f) { return /^video\//.test(f.type || "") || /\.(mp4|mov|webm|3gp|m4v)$/i.test(f.name || ""); }
  function isGif(f) { return /gif/i.test(f.type || "") || /\.gif$/i.test(f.name || ""); }

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

  // a photo: offer to edit it first
  async function chooseFile(file) {
    if (isVideo(file)) return makeSticker(file);
    if (isGif(file)) return makeSticker(file);
    var go = await ask("Ton sticker", "Tu veux le modifier avant de le créer ? (rogner, texte, flou, stickers…)", [
      { key: "edit", label: "Modifier", primary: true },
      { key: "as", label: "Créer tel quel" }
    ]);
    if (!go) return;
    if (go === "as") return makeSticker(file);
    var url = URL.createObjectURL(file);
    if (!window.__zzPhotoEdit) return makeSticker(file);
    window.__zzPhotoEdit.open(url, function (edited) { makeSticker(edited); });
  }

  function makeSticker(file) {
    var video = isVideo(file);
    var type = (file.type || "").toLowerCase();
    var name = (file.name || "").toLowerCase();
    if (video) {
      // only the formats that every phone shows inside a bubble
      if (/\.mp4$/.test(name) || type === "video/mp4") type = "video/mp4";
      else if (/\.webm$/.test(name) || type === "video/webm") type = "video/webm";
      else { toast("Ce format de vidéo ne marche pas en sticker. Utilise une vidéo MP4 ou WebM, ou fais un GIF.", "x"); return; }
      if (file.size > MAX_VIDEO) { toast("Vidéo trop lourde pour un sticker (6 Mo max). Prends une vidéo plus courte.", "x"); return; }
    }
    toast("Création du sticker…", "check");
    var job = video ? Promise.resolve(new Blob([file], { type: type }))
      : (isGif(file) ? Promise.resolve(file) : resizeToWebp(file));
    job.then(function (blob) {
      var ext = video ? (type === "video/webm" ? "webm" : "mp4") : (isGif(file) ? "gif" : "webp");
      return window.__chatFiles.upload(blob, "sticker." + ext).then(function (up) {
        var l = store().list();
        l.unshift({ id: Math.random().toString(36).slice(2, 10), p: up.p, t: up.t || blob.type });
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
    var k = ((typeof V4 !== "undefined" ? V4 : undefined) && V4.panel && V4.panel.kind) || "peer";
    var t = (typeof v4Target === "function" && v4Target(k)) || (V4.panel && V4.panel.target) || "";
    V4.panel = null;
    if (typeof render === "function") render();
    if (!t) return;
    if (!navigator.onLine) { toast("Pas de réseau : réessaie quand tu es en ligne.", "x"); return; }
    Promise.resolve(v4Deliver(k, t, "", { k: "sticker", p: item.p, t: item.t })).catch(function (e) {
      toast((e && e.message) || "Envoi impossible", "x");
    });
  }

  // ---- show the files ----
  // loaded as a local file (same as the photos), so every phone can show it
  function hydrate(el, path, mime) {
    if (el.dataset.zzload) return;
    el.dataset.zzload = "1";
    if (typeof srcBlob !== "function") return;
    srcBlob({ k: "m", id: path, t: mime }).then(function (b) {
      var u = URL.createObjectURL(b);
      el.src = u;
      if (el.tagName === "VIDEO") { el.muted = true; el.play && el.play().catch(function () {}); }
    }).catch(function () {
      el.removeAttribute("src");
      el.alt = "Sticker indisponible";
      el.classList.add("zz-stkbad");
    });
  }

  function panelTiles() {
    document.querySelectorAll(".v4panel .v4grid.stk").forEach(function (grid) {
      if (grid.dataset.zzmy === "1") return;
      grid.dataset.zzmy = "1";
      var list = store().list();
      var head = document.createElement("button");
      head.type = "button";
      head.className = "zz-mnew";
      head.setAttribute("aria-label", "Créer un sticker");
      head.innerHTML = '<span class="zz-mplus">+</span><span class="zz-mtxt">Créer un sticker</span>';
      grid.insertBefore(head, grid.firstChild);
      list.forEach(function (it) {
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

  function hydrateAll() {
    document.querySelectorAll("img[data-zzp], video[data-zzp]").forEach(function (el) {
      hydrate(el, el.dataset.zzp, el.dataset.zzt);
    });
  }

  // ---- tap a sticker in a chat ----
  async function stickerMenu(el) {
    var path = el.dataset.zzp, t = el.dataset.zzt || "";
    var isVid = /^video\//.test(t);
    var have = mine(path);
    var actions = have
      ? [{ key: "del", label: "Supprimer de mes stickers", danger: true }]
      : [{ key: "save", label: "⭐ Enregistrer dans mes stickers", primary: true }];
    if (!isVid) actions.push({ key: "edit", label: "Modifier" });
    var go = await ask("Sticker", have ? "Il est dans ta collection." : "Ajoute-le à ta collection pour le réutiliser.", actions);
    if (!go) return;
    if (go === "del") {
      store().save(store().list().filter(function (x) { return x.p !== path; }));
      toast("Sticker retiré de ta collection", "check");
      if (typeof render === "function") render();
    } else if (go === "save") {
      store().save([{ id: Math.random().toString(36).slice(2, 10), p: path, t: t }].concat(store().list()).slice(0, 60));
      toast("Sticker enregistré dans ta collection", "check");
      if (typeof render === "function") render();
    } else if (go === "edit") {
      if (typeof srcBlob !== "function" || !window.__zzPhotoEdit) return;
      try {
        var blob = await srcBlob({ k: "m", id: path, t: t });
        window.__zzPhotoEdit.open(URL.createObjectURL(blob), function (edited) { makeSticker(edited); });
      } catch (e) { toast("Sticker impossible à modifier.", "x"); }
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".zz-mnew")) { e.preventDefault(); e.stopPropagation(); openPicker(); return; }
    var b = t.closest(".zz-mstk");
    if (b) {
      e.preventDefault(); e.stopPropagation();
      var it = store().list().filter(function (x) { return x.id === b.dataset.zzid; })[0];
      if (it) sendSticker(it);
      return;
    }
    // a sticker in a chat bubble: its menu, not the message menu
    var s = t.closest(".msgs [data-zzp]");
    if (s && !t.closest("button")) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      stickerMenu(s);
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
img.zz-stkbad{width:120px;min-height:60px;opacity:.6;object-fit:contain}
#zzStk{position:fixed;inset:0;z-index:10002;font:600 .95rem system-ui,sans-serif;color:#EDEEF3}
#zzStk .zz-skb{position:absolute;inset:0;background:rgba(0,0,0,.5)}
#zzStk .zz-sks{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:linear-gradient(180deg,#1E1B33,#14121F);border-radius:24px 24px 0 0;padding:10px 16px calc(16px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:10px;box-shadow:0 -12px 40px -10px rgba(0,0,0,.7)}
#zzStk .zz-skg{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 4px}
#zzStk .zz-skh{font:800 1.1rem system-ui,sans-serif}
#zzStk .zz-skp{margin:0;opacity:.75;font-weight:500;font-size:.86rem;line-height:1.4}
#zzStk .zz-ska{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;border-radius:16px;padding:13px;font:700 .98rem system-ui,sans-serif;cursor:pointer;text-align:left}
#zzStk .zz-ska.pri{background:linear-gradient(135deg,#C4B5FD,#8B5CF6);color:#0B0D18;border-color:transparent;box-shadow:0 10px 24px -10px rgba(139,92,246,.8)}
#zzStk .zz-ska.dng{color:#FCA5A5;border-color:rgba(248,113,113,.4)}
#zzStk .zz-skc{border:0;background:transparent;color:#EDEEF3;opacity:.8;padding:10px;font:700 .95rem system-ui,sans-serif;cursor:pointer}
`;
  document.head.appendChild(st);
})();
