"""Reconstruit www/index.html à partir de la page de l'application (english-class.html)."""
import re, sys, pathlib
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "english-class.html").read_text(encoding="utf-8")
out = pathlib.Path(__file__).with_name("www") / "index.html"
title = re.search(r"<title>(.*?)</title>", src, re.S); src = src.replace(title.group(0), "", 1) if title else src
head = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>{title.group(1) if title else "Ma Classe d'Anglais"}</title><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; frame-src 'self' blob: data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"><meta name="referrer" content="no-referrer"><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta name="format-detection" content="telephone=no"><meta name="theme-color" content="#0E1120"><meta name="color-scheme" content="light dark"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="description" content="Apprendre l'anglais au Togo avec sa professeure.">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">
<style>html{{box-sizing:border-box;height:100%;overscroll-behavior-y:none;-webkit-text-size-adjust:100%}}body{{margin:0;min-height:100%;background:#0E1120;overscroll-behavior-y:none}}img{{max-width:100%}}[hidden]:not([hidden=until-found i]){{display:none!important}}</style>
<script>if(window.top!==window.self){{try{{window.top.location=window.self.location}}catch(e){{document.documentElement.innerHTML=""}}}}</script><script src="config.js"></script><script src="claude-shim.js"></script>
</head><body>
"""
tail = """
<script>if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});</script>
</body></html>
"""
out.write_text(head + src + tail, encoding="utf-8")
print("www/index.html :", out.stat().st_size, "octets")
