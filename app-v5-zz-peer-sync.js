/* =====================================================================
   v5 · classmates chat: a message you just sent no longer vanishes.

   The list was replaced by the server's copy on every refresh. A refresh
   that started before the send finished could overwrite the list and
   remove the new message from the screen, until the next refresh brought
   it back. Now a refresh keeps the messages of the last 10 minutes that
   the server copy does not show yet, and the list stays in date order.
   ===================================================================== */
async function peerRefresh(){if(!peerOn())return;
  try{const[d,i]=await Promise.all([window.__peer.dir(),window.__peer.inbox()]);
    PR.dir=d;
    // an empty answer while we already show messages is a glitch (session not ready yet): keep what is shown
    if(!i.length&&PR.inbox.length){PR.loaded=true;PR.err="";render();return}
    const have=new Set(i.map(x=>x.id)),cut=Date.now()-10*60000;
    const keep=PR.inbox.filter(x=>!have.has(x.id)&&(String(x.id).startsWith("tmp")||+new Date(x.created_at)>cut));
    PR.inbox=[...keep,...i].sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));
    PR.loaded=true;PR.err=""}
  catch(e){PR.loaded=true;PR.err=navigator.onLine?"Cannot load messages right now.":"No network: your messages will arrive as soon as you are connected."}
  render()}
