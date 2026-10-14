/* =====================================================================
   v5 · Mise en page et économie d'énergie.
   - Réponse fausse ou juste : texte lisible dans les deux thèmes.
   - Publications : photos et vidéos restent dans le fond de la carte.
   - Économie d'énergie : animations et effets coupés (voir liteHTML).
   ===================================================================== */
{const st=document.createElement("style");st.id="zzzglayout";st.textContent=`
/* réponse à remplir : rouge ou vert lisible, pas de texte blanc sur fond clair */
.answer-input.wrong{color:var(--bad-ink)!important;background:var(--bad-soft)!important}
.answer-input.right{color:var(--ok-ink)!important;background:var(--ok-soft)!important}
:root[data-theme="light"] .answer-input.wrong,:root:not([data-theme="dark"]) .answer-input.wrong{color:#9E2A3E!important}
:root[data-theme="light"] .answer-input.right,:root:not([data-theme="dark"]) .answer-input.right{color:#13674A!important}

/* publications : rien ne dépasse du fond */
.fpost{grid-template-columns:minmax(0,1fr);min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden}
.fpost>*{min-width:0;max-width:100%}
.fmedia,.fmedia>*,.fvid,.fvid-v,.fvid img,.fmedia img{max-width:100%;box-sizing:border-box}
.fvid,.fvid-v{width:100%;object-fit:contain}
.fvid-v{max-height:min(70vh,520px)}
.fshared{min-width:0;max-width:100%;box-sizing:border-box}
.factions{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) minmax(0,1fr)!important;max-width:100%}
.factions button{min-width:0;overflow:hidden;text-overflow:ellipsis}
@media (max-width:430px){.factions button{font-size:.86rem;padding:8px 4px;gap:4px}}

/* économie d'énergie : plus d'animations, de flous ni d'effets */
:root[data-lite="1"] *,:root[data-lite="1"] *::before,:root[data-lite="1"] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
:root[data-lite="1"] .glass,:root[data-lite="1"] header.top,:root[data-lite="1"] nav.tabs{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
:root[data-lite="1"] .mg-p,:root[data-lite="1"] #bg3d,:root[data-lite="1"] .torus{display:none!important}
`;document.head.appendChild(st)}
