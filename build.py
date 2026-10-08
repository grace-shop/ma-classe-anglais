"""Reconstruit www/index.html à partir de la page de l'application (source-english-class.html)."""
import re, sys, pathlib
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "source-english-class.html").read_text(encoding="utf-8")
out = pathlib.Path(__file__).with_name("www") / "index.html"
title = re.search(r"<title>(.*?)</title>", src, re.S); src = src.replace(title.group(0), "", 1) if title else src
head = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title.group(1) if title else "English Classes"}</title><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="theme-color" content="#0E1120"><meta name="description" content="Apprendre l'anglais au Togo avec sa professeure.">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="English Classes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>:root{{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;background:#0E1120}}img{{max-width:100%}}[hidden]:not([hidden=until-found i]){{display:none!important}}</style>
<script src="config.js"></script><script src="claude-shim.js"></script>
</head><body>
"""
tail = """
<script>if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});</script>
</body></html>
"""
out.write_text(head + src + tail, encoding="utf-8")
print("www/index.html :", out.stat().st_size, "octets")
