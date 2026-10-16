/* =====================================================================
   v5 · The camera takes selfies AND photos of things and people.
   - The camera screen has two clear buttons: "Selfie" (front camera) and
     "Photo" (back camera). The switch works while the camera is open.
   - Photos from the back camera are sent with the name photo.jpg (not
     selfie.jpg), in chats, stories and posts.
   - Every existing camera button still opens the camera. Selfie buttons
     open the front camera, as before.
   ===================================================================== */
(function camStyle(){
  if(document.getElementById("camModesCss"))return;
  const s=document.createElement("style");s.id="camModesCss";
  s.textContent=`
.cam-modes{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cam-mode{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#EEF2FF;border-radius:999px;padding:9px 16px;font:600 14px/1 inherit,system-ui,sans-serif;cursor:pointer;min-width:92px}
.cam-mode.on{background:#5EEAD4;color:#0E1120;border-color:#5EEAD4}
`;document.head.appendChild(s)})();

/* the camera screen: the two modes, the shutter, then the empty space */
const _mdSync=mdSync;
mdSync=function(){
  _mdSync();
  if(MD.open!=="cam"||!MD.cam)return;
  const host=document.getElementById("mdhost");
  const title=host&&host.querySelector(".md-cam .md-top b");if(title)title.textContent="Camera";
  const bar=host&&host.querySelector(".md-actions");
  if(bar&&!bar.classList.contains("cam-modes")){
    const front=MD.cam.facing==="user";
    bar.outerHTML=`<div class="md-actions cam-modes">
      <button type="button" class="cam-mode ${front?"on":""}" data-v4="camFront" aria-pressed="${front}">Selfie</button>
      <button type="button" class="md-shot" data-v4="mdShot" aria-label="Take the photo"></button>
      <button type="button" class="cam-mode ${front?"":"on"}" data-v4="camBack" aria-pressed="${!front}">Photo</button></div>`;
  }
  /* the preview survives every redraw of the screen */
  const v=document.getElementById("mdVid");
  if(v&&MD.cam.stream&&v.srcObject!==MD.cam.stream){v.srcObject=MD.cam.stream;v.play().catch(()=>{})}
};

/* switching the camera while it is open: front (Selfie) or back (Photo) */
function camSwitch(facing){
  if(!MD.cam||MD.cam.facing===facing)return;
  MD.cam.facing=facing;MD.cam.err="";
  mdCamStop();MD.cam.stream=null;
  mdSync();
}

/* the buttons are read before the old handlers: they never open a second camera */
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-v4]");if(!b)return;
  const k=b.dataset.v4;
  if(k==="camFront"){e.stopPropagation();e.preventDefault();return camSwitch("user")}
  if(k==="camBack"){e.stopPropagation();e.preventDefault();return camSwitch("environment")}
  if(k==="mdSelfie"&&b.dataset.f==="environment"){
    e.stopPropagation();e.preventDefault();
    mdCamStop();MD.cam={to:b.dataset.to||"chat",kind:b.dataset.k,target:b.dataset.s,facing:"environment",stream:null,err:""};
    MD.open="cam";mdSync();return;
  }
},true);

/* a photo from the back camera has its own name */
const _mdUse=mdUseSelfie;
mdUseSelfie=function(c,blob){
  if(c.facing==="environment"&&c.to==="chat"){return v4SendFile(c.kind,c.target,blob,"photo.jpg")}
  return _mdUse(c,blob);
};
