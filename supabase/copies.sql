-- ---------- Copies des élèves (photos / PDF de devoirs et d'épreuves) : dossier PRIVÉ ----------
-- Chaque élève écrit dans son propre dossier (son identifiant) ; la prof et l'admin lisent tout.
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('copies', 'copies', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    drop policy if exists "copies_insert_own" on storage.objects;
    drop policy if exists "copies_read" on storage.objects;
    drop policy if exists "copies_delete" on storage.objects;
    create policy "copies_insert_own" on storage.objects for insert to authenticated
      with check (bucket_id = 'copies' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy "copies_read" on storage.objects for select to authenticated
      using (bucket_id = 'copies' and ((storage.foldername(name))[1] = auth.uid()::text or public.my_level() >= 3));
    create policy "copies_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'copies' and ((storage.foldername(name))[1] = auth.uid()::text or public.my_level() >= 3));
  end if;
end $$;
