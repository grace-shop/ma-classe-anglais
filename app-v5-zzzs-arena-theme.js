/* =====================================================================
   v5 · L'Arena suit le thème de l'application. Ses couleurs viennent
   des jetons du thème (fond, surfaces, encre, or, rose…) : quand on
   change de thème, l'Arena, les battles et l'écran de victoire
   changent avec lui, clair ou sombre.
   ===================================================================== */
{const st=document.createElement("style");st.id="zzzsarenatheme";st.textContent=`
#arena{background:var(--bg)!important;color:var(--fg)!important}
#arena .ar-orb{background:radial-gradient(circle,var(--sky-soft,rgba(56,189,248,.25)),transparent 70%)!important;opacity:.7}
#arena .ar-kicker,#arena .ar-hint,#arena .bt-wait,#arena .ar-score small,#arena .vic-kicker{color:var(--muted)!important}
#arena h1,#arena h2,#arena .ar-top b{color:var(--fg)!important}
#arena .ar-card,#arena .ar-row,#arena .ar-sb,#arena .bt-sb .ar-row{background:var(--surface)!important;border-color:var(--line)!important;color:var(--fg)!important}
#arena .ar-row.me{border-color:var(--ink)!important;background:var(--surface2)!important}
#arena .ar-opt{background:var(--surface2)!important;border-color:var(--line2)!important;color:var(--fg)!important}
#arena .ar-opt.ok{background:var(--ink-soft)!important;border-color:var(--ink)!important;color:var(--ink)!important}
#arena .ar-opt.bad{background:var(--rose-soft)!important;border-color:var(--rose)!important;color:var(--rose)!important}
#arena .ar-mode,#arena .bt-entry.ar-go{background:linear-gradient(160deg,var(--surface2),var(--surface))!important;border-color:var(--line2)!important;color:var(--fg)!important}
#arena .ar-mode small{color:var(--muted)!important}
#arena .ar-mode .ar-badge,#arena .ar-badge{background:var(--grad)!important;color:var(--on-ink)!important}
#arena .ar-mode .ar-badge .ar-ic,#arena .ar-badge .ar-ic{stroke:var(--on-ink)!important}
#arena .ar-go:not(.ghost){background:var(--grad)!important;color:var(--on-ink)!important;box-shadow:0 14px 30px -12px var(--ink)!important}
#arena .ar-go.ghost,#arena .ar-glass{background:var(--surface)!important;color:var(--fg)!important;border-color:var(--line2)!important}
#arena .ar-seg{background:var(--surface)!important;border-color:var(--line)!important}
#arena .ar-seg button{color:var(--muted)!important}
#arena .ar-seg button.on{background:var(--grad)!important;color:var(--on-ink)!important}
#arena .ar-bar{background:var(--line)!important}
#arena .ar-bar i{background:var(--grad)!important}
#arena .ar-ring .ar-arc{stroke:var(--ink)!important}
#arena .ar-ring .ar-track{stroke:var(--line2)!important}
#arena .ar-ring b{color:var(--fg)!important}
#arena .bt-code{background:none!important;color:#8EF6E4!important;text-shadow:0 0 24px rgba(142,246,228,.35)}
#arena .bt-in{background:var(--surface2)!important;color:var(--fg)!important;border-color:var(--line2)!important}
#arena .bt-tag{background:var(--ink-soft)!important;color:var(--ink)!important}
#arena .bt-tag.host{background:var(--goldS,var(--surface2))!important;color:var(--gold)!important}
#arena .bt-out-card{background:var(--rose-soft)!important;border-color:var(--rose)!important}
#arena .bt-win,.vic-title{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent!important}
#arena .vic-score b{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent!important}
#arena .vic-stars span.on{color:var(--gold)!important}
#arena .vic-aura{background:radial-gradient(circle,var(--ink-soft),transparent 70%)!important}
#arena .vic-ring{border-top-color:var(--ink)!important;border-right-color:var(--sky)!important}
#arena .vic-sub{color:var(--muted)!important}
#arena .ar-fab,.ar-fab{background:var(--surface)!important;color:var(--fg)!important;border-color:var(--line2)!important}
#arena .ar-fab .ar-badge,.ar-fab .ar-badge{background:var(--grad)!important}
`;document.head.appendChild(st)}
