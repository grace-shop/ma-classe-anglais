/* =====================================================================
   v5 · Posts: a tab of its own for students, like the feed of a social
   network. Everyone's posts are shown here, newest first, with the box
   to publish one at the top. The "Posts" bubble in the stories row stays.
   The tab shows only when the Community is on (the teacher's switch).
   ===================================================================== */
{const _tf=tabsFor;tabsFor=function(){const t=_tf();
  if(S.mode!=="teacher"&&S.me&&!isParent(S.me)&&feedOn()&&!t.some(x=>x[0]==="posts")){const i=t.findIndex(x=>x[0]==="me");t.splice(i<0?t.length:i,0,["posts","Posts","users"])}
  return t}}
{const _sv=studentView;studentView=function(){if(S.tab==="posts"&&feedOn()&&!S.view&&!S.run&&!S.deck&&!S.srs)return feedView(true);return _sv()}}
