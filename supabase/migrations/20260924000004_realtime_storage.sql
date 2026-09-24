-- ============================================================================
-- WaqtPe · 004 · Realtime publication + Storage buckets
-- Guarded so the migration also runs on a plain Postgres (CI/tests).
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.orders, public.riders, public.app_settings, public.restaurants, public.menu_items;
  end if;
end;
$$;

-- Public-read buckets. Uploads happen on the server (service role), so no
-- insert/update policies are needed on storage.objects.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('bag-photos',  'bag-photos',  true, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
      ('menu-photos', 'menu-photos', true, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
      ('avatars',     'avatars',     true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end;
$$;
