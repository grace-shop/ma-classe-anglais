/* =====================================================================
   v5 · Community (Posts): a post you publish stays on screen.

   Same fault as the classmates chat. A post was published while a
   reload was already running, so that reload returned early and the new
   post only appeared at the next refresh, and an older reload could
   replace the list and hide it again.
   Now: a reload asked for while another runs is done right after it, and
   a refresh keeps the posts of the last 10 minutes that the server answer
   does not show yet.
   ===================================================================== */
let FC_AGAIN=false;
async function feedLoad(more){
  if(!feedOn())return;
  if(F.loading){if(!more)FC_AGAIN=true;return}
  F.loading=true;
  try{const before=more&&F.posts.length?F.posts[F.posts.length-1].created_at:null;
    const[p,st,vw,rx]=await Promise.all([window.__feed.posts(before),more?Promise.resolve(F.stories):window.__feed.stories(),more?Promise.resolve(F.views):window.__feed.storyViews(),more||!window.__feed.storyReactions?Promise.resolve(F.reacts):window.__feed.storyReactions()]);
    F.reacts=rx||[];
    const ids=p.map(x=>x.id);
    const[lk,cm]=await Promise.all([window.__feed.likes(ids),window.__feed.comments(ids)]);
    for(const id of ids){F.likes[id]=[];F.comments[id]=[]}
    for(const l of lk)(F.likes[l.post_id]=F.likes[l.post_id]||[]).push(l);
    for(const c of cm)(F.comments[c.post_id]=F.comments[c.post_id]||[]).push(c);
    const cut=Date.now()-10*60000;
    const keep=more?[]:F.posts.filter(x=>!ids.includes(x.id)&&+new Date(x.created_at)>cut);
    const merged=more?[...F.posts,...p.filter(x=>!F.posts.some(y=>y.id===x.id))]:[...keep,...p].sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));
    F.posts=merged;F.more=p.length>=30;F.stories=st;F.views=vw;for(const v of vw)if(v.uid===S.uid)F.seen.add(v.story_id);
    F.loaded=true;F.err="";F.at=Date.now();fCleanMyMedia()}
  catch(e){F.loaded=true;F.err=(e&&e.message)||"Cannot load the Community right now."}
  F.loading=false;render();
  if(FC_AGAIN){FC_AGAIN=false;feedLoad()}
}
