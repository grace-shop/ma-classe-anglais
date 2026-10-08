# Insère app-v4.js dans la page source (entre les marqueurs) et applique les petites retouches de la page.
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "source-english-class.html"
s = src.read_text(encoding="utf-8")
v4 = (root / "app-v4.js").read_text(encoding="utf-8")
A, B = "/* ==== v4 START ==== */", "/* ==== v4 END ==== */"
if A in s:
    i, j = s.index(A), s.index(B) + len(B)
    s = s[:i] + A + "\n" + v4 + "\n" + B + s[j:]
else:
    tail = "render();\nloadThree();"
    k = s.rindex(tail)
    s = s[:k] + A + "\n" + v4 + "\n" + B + "\n" + s[k:]

def rep(old, new, must=True):
    global s
    if new in s and old not in s: return
    if old not in s:
        if must: sys.exit("introuvable : " + old[:90])
        return
    s = s.replace(old, new)

# visionneuse intégrée pour les sujets / corrigés
rep('const fileView=(id,type,label)=>!id?"":/^image\\//.test(type||"")?`<a class="scanimg" href="${blobURL(id)}" target="_blank" rel="noopener" title="Ouvrir en grand"><img src="${blobURL(id)}" alt="${esc(label)}" loading="lazy"></a>`:blobLink(id,label);',
    'const fileView=(id,type,label)=>!id?"":(/^image\\//.test(type||"")?`<button type="button" class="scanimg" data-v4="doc" data-k="a" data-id="${esc(id)}" data-t="${esc(type||"image/jpeg")}" data-n="${esc(label)}" title="Ouvrir en grand"><img src="${blobURL(id)}" alt="${esc(label)}" loading="lazy"></button>`:blobLink(id,label,type))+(S.mode==="student"&&!V4.cached.has("a:"+id)?` <button type="button" class="btn ghost sm" data-v4="keepOff" data-id="${esc(id)}" data-t="${esc(type||"")}">${ic("download")}Garder hors ligne</button>`:"");')
rep('const blobLink=(id,label)=>id?`<a class="btn ghost sm" href="${blobURL(id)}" target="_blank" rel="noopener">${ic("file")}${esc(label)}</a>`:"";',
    'const blobLink=(id,label,type)=>id?`<button type="button" class="btn ghost sm docbtn" data-v4="doc" data-k="a" data-id="${esc(id)}" data-t="${esc(type||"application/pdf")}" data-n="${esc(label)}">${ic("file")}${esc(label)}${offChip("a:"+id)}</button>`:"";')
# camarades : plus de mention « la professeure peut lire »
rep('<p class="sub">Écris à tes camarades de classe. Sois gentil et respectueux : ta professeure peut lire ces messages.</p>',
    '<p class="sub">Écris aux autres apprenants de l\'école : messages, vocaux, photos, fichiers et stickers. Sois gentil et respectueux.</p>')
rep('String(x.last.body).slice(0,60)', 'String(x.last.body||attLabel(x.last.att)).slice(0,60)')
rep('esc(x.classe||"Dis bonjour !")', 'esc((x.classe?x.classe+(x.same?" · ta classe":""):"")||"Dis bonjour !")')
rep('<b>Aucun camarade disponible pour l\'instant.</b><br>Tes camarades apparaîtront ici dès qu\'ils auront rejoint la classe de ta professeure.',
    '<b>Aucun autre apprenant pour l\'instant.</b><br>Les apprenants apparaîtront ici dès que leur inscription aura été validée par la professeure.')
rep('notifyNow("Message de "+n,String(m.body).slice(0,80))', 'notifyNow("Message de "+n,String(m.body||attLabel(m.att)).slice(0,80))')
rep('<span style="white-space:pre-wrap">${esc(m.body)}</span></div><button class="btn ghost sm" data-a="peerHide"',
    '<span>${msgBodyHTML(m.body,m.att)}</span></div><button class="btn ghost sm" data-a="peerHide"')
# devoirs : pièces jointes + consignes facultatives si fichier
rep('<label>Consignes<textarea id="h_body" required placeholder="Write 80 words about…"></textarea></label>',
    '<label>Consignes<textarea id="h_body" placeholder="Write 80 words about… (facultatif si tu joins un fichier)"></textarea></label>${v4HwFilesHTML()}')
# photos de la prof : vignettes des séries Nova (images 3D)
rep('<div class="glass pthumb"><img src="${esc(blobURL(x.picId))}" alt="" loading="lazy">',
    '<div class="glass pthumb">${x.picId?`<img src="${esc(blobURL(x.picId))}" alt="" loading="lazy">`:`<span class="pemo-th">${E(x.emo||"")}</span>`}')
# corrigé par Nova (épreuves et devoirs)
rep('${kind==="epreuves"?`<div><button class="btn ghost sm" data-a="openEp" data-id="${x.id}">${ic("eye")}Ouvrir l’épreuve et le corrigé</button></div>`:""}</div>`;',
    '${kind==="epreuves"?`<div><button class="btn ghost sm" data-a="openEp" data-id="${x.id}">${ic("eye")}Ouvrir l’épreuve et le corrigé</button></div>`:""}${(kind==="epreuves"||kind==="homework")&&AI.sample&&!AI.disabled&&canEditContent(x)?`<div><button class="btn ghost sm" data-v4="aiCor" data-k="${kind}" data-id="${x.id}">${ic("spark")}Corrigé rédigé par Nova</button>${kind==="homework"&&x.corrigeVisible?` <span class="chip ok">Corrigé publié</span>`:""}</div>`:""}</div>`;')
# tableau du tableau de bord : caché quand on montre les dossiers
rep('${stToolbar(st,F.length)}<div class="glass tablewrap">', '${stToolbar(st,F.length)}<div class="glass tablewrap${F.length?"":" v4hide"}">')
rep('F.length?moreBtn(FL.length,F.length,"stMore"):`<div class="empty">Aucun élève ne correspond à ta recherche.</div>`',
    'F.length?moreBtn(FL.length,F.length,"stMore"):v4DashFoldersOnly(st)?"":`<div class="empty">Aucun élève ne correspond à ta recherche.</div>`')
# carte « télécharger l'application » plus belle
i = s.index('const downloadHTML=()=>')
j = s.index('\n', i)
s = s[:i] + '''const downloadHTML=()=>window.__appDownload?`<div class="section"><div class="dl-card2"><img class="dl-app" src="icons/icon-192.png" alt=""><div><h3>Ma Classe d'Anglais sur ton téléphone</h3><p>La vraie application Android : icône sur l'écran d'accueil, plein écran, micro pour parler à Nova, épreuves disponibles hors ligne.</p></div><div class="dl-feat"><span>Gratuite</span><span>Hors ligne</span><span>Micro et vocaux</span><span>Notifications</span></div><div class="dl-row"><a class="dl-go" href="${esc(window.__appDownload.apk)}" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span>Télécharger l'application<small>Android · fichier .apk</small></span></a>${window.__appDownload.canInstall?`<button class="dl-alt" data-a="pwaInstall">${ic("plus")}Ajouter à l'écran d'accueil</button>`:""}</div></div></div>`:"";''' + s[j:]
src.write_text(s, encoding="utf-8")
print("v4 inséré :", len(v4), "caractères")
