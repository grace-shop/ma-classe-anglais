/* =====================================================================
   v5 · a screen does not replay its entrance animation on every refresh.

   Each background refresh (classmates, Community, access, presence)
   redraws the page. The sections fade in again from invisible on every
   redraw, so the page seemed to disappear and come back. The entrance now
   plays only when the student opens a screen (the page is marked "enter"
   by render() in that case).
   ===================================================================== */
{const st=document.createElement("style");st.id="zzsteady";st.textContent=`
#main:not(.enter) .section,#main:not(.enter) .glass.list,#main:not(.enter) .glass.kpi,#main:not(.enter) .glass.card,#main:not(.enter) .glass.chat,#main:not(.enter) .msg{animation:none!important}
:root[data-skin="nuit"] main:not(.enter)>section,:root[data-skin="nuit"] #main:not(.enter) .view{animation:none!important}
`;document.head.appendChild(st)}
