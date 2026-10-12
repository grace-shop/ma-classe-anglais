/* =====================================================================
   v5 · the student's access status stays steady.

   The access record arrives through a live listener. For a moment it can
   come back empty (a cached answer, a slow connection), and the screen
   then switched to "Waiting for approval" and back to the page: it looked
   like the page disappeared and came back. Now an empty answer keeps the
   last known status for 4 seconds; only an empty answer that lasts longer
   is taken as real.
   ===================================================================== */
{const _st=stOf,LAST={},EMPTY={};
stOf=function(x){
  if(!x)return "pending";
  if(x.preview)return "active";
  const isMe=S.mode==="student"&&x.id===S.uid;
  const a=isMe?S.myAccess:S.access[x.id];
  if(a&&a.status){LAST[x.id]=a.status;delete EMPTY[x.id];return a.status}
  if(isMe&&LAST[x.id]){
    if(!EMPTY[x.id])EMPTY[x.id]=Date.now();
    if(Date.now()-EMPTY[x.id]<4000)return LAST[x.id];
  }
  return _st(x)}}
