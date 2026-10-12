/* =====================================================================
   v5 · push: on the Android app, register this phone so that the school
   can send a notification for a new message or an incoming call
   (even when the app is closed). Only works in the installed app.
   ===================================================================== */
const PUSH={started:false,token:null};
function pushPlugin(){const C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return null;
  return (C.Plugins&&C.Plugins.PushNotifications)||null}
async function pushStart(){
  if(PUSH.started||!S.uid||!window.__sb)return;
  const P=pushPlugin();if(!P)return;
  PUSH.started=true;
  try{
    P.addListener("registration",async t=>{PUSH.token=t.value;await pushSave(t.value)});
    P.addListener("registrationError",e=>console.warn("push",e));
    P.addListener("pushNotificationActionPerformed",()=>{/* tapping the notification opens the app */});
    let perm=await P.checkPermissions();
    if(perm.receive==="prompt")perm=await P.requestPermissions();
    if(perm.receive!=="granted"){PUSH.started=false;return}
    await P.register();
  }catch(e){console.warn("push",e);PUSH.started=false}
}
async function pushSave(token){
  if(!token||!window.__sb||!S.uid)return;
  const {error}=await window.__sb.rpc("save_push_token",{p_token:token,p_platform:"android"});
  if(error)console.warn("push token",error);
}
/* start once the person is signed in and the app is ready */
{const _pv=peersView;peersView=function(){const h=_pv();if(S.mode==="student")pushStart();return h}}
{const _cv=classView;classView=function(){pushStart();return _cv()}}
