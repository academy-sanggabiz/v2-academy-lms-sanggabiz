-- Bucket aset halaman depan: logo mitra, foto alumni, galeri, foto hero
-- (docs/STANDAR-HALAMAN-DEPAN.md §3). Dipisah dari `lesson-content` supaya aset
-- pemasaran tidak bercampur dengan isi pelajaran.
--
-- Jenis berkas dibatasi di server, bukan hanya di klien (lib/storage.ts):
-- `file.type` dari peramban bisa dilewati dengan memanggil Storage langsung.
-- SVG sengaja tidak ada: dapat memuat <script> dan bucket ini publik.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('landing-assets', 'landing-assets', true, 5 * 1024 * 1024,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can read landing assets" on storage.objects;
create policy "anyone can read landing assets" on storage.objects
  for select to public
  using (bucket_id = 'landing-assets');

drop policy if exists "admins upload landing assets" on storage.objects;
create policy "admins upload landing assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing-assets' and public.is_admin());

drop policy if exists "admins update landing assets" on storage.objects;
create policy "admins update landing assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'landing-assets' and public.is_admin())
  with check (bucket_id = 'landing-assets' and public.is_admin());

drop policy if exists "admins delete landing assets" on storage.objects;
create policy "admins delete landing assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing-assets' and public.is_admin());
