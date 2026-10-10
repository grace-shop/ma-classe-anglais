# Insère app-v4.js dans la page source (entre les marqueurs) et applique les petites retouches de la page.
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "source-english-class.html"
s = src.read_text(encoding="utf-8")
v4 = (root / "app-v4.js").read_text(encoding="utf-8")
# extra feature files (app-v5-*.js), added in name order after app-v4.js
for f in sorted(root.glob("app-v5-*.js")):
    v4 += "\n/* ---- " + f.name + " ---- */\n" + f.read_text(encoding="utf-8")
A, B = "/* ==== v4 START ==== */", "/* ==== v4 END ==== */"
if A in s:
    i, j = s.index(A), s.index(B) + len(B)
    s = s[:i] + A + "\n" + v4 + "\n" + B + s[j:]
else:
    tail = "render();\nloadThree();"
    k = s.rindex(tail)
    s = s[:k] + A + "\n" + v4 + "\n" + B + "\n" + s[k:]

# (the one-off page patches of earlier versions are now part of source-english-class.html)
src.write_text(s, encoding="utf-8")
print("v4 inséré :", len(v4), "caractères")
