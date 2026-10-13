-- Community: an author can change the words of their own post.
-- Run once in the Supabase SQL editor.
create or replace function public.edit_post(p_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update posts
     set body = left(coalesce(p_body, ''), 4000)
   where id = p_id and author = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'You can only change your own post';
  end if;
end $$;

grant execute on function public.edit_post(uuid, text) to authenticated;
