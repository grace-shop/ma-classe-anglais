/* =====================================================================
   v5 · a video in a post or a message plays where it is.

   A tap on the video starts it in place, with its own controls. The
   full-screen button of the player opens full screen; nothing else does.
   (The full-screen player still opens for videos without a place on the page.)
   ===================================================================== */
{const _vp=vPlay;
vPlay=async function(p,t){
  const tile=[...document.querySelectorAll("button.fvid")].find(b=>b.dataset.p===p);
  if(!tile)return _vp(p,t);
  if(tile.dataset.busy)return;tile.dataset.busy="1";tile.classList.add("busy");
  try{const u=await srcURL({k:"m",id:p,t});
    if(!tile.isConnected)return;
    const v=document.createElement("video");v.controls=true;v.playsInline=true;v.preload="auto";v.src=u;v.className="fvid-v";v.setAttribute("aria-label","Video");
    tile.replaceWith(v);v.play().catch(()=>{});
  }catch(e){tile.classList.remove("busy");delete tile.dataset.busy;toast(navigator.onLine?"Cannot play this video.":"No network: the video needs internet.","x")}}}
{const st=document.createElement("style");st.id="zzvidinline";st.textContent=`
.fvid-v{display:block;width:100%;max-height:460px;background:#000;border-radius:0}
.msg .fvid-v{width:min(260px,62vw);border-radius:14px;margin-bottom:4px}
.fvid.busy .fplay{opacity:.45}
`;document.head.appendChild(st)}
