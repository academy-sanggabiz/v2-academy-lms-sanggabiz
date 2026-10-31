-- Profil peserta: foto, nama sertifikat, kontak, dan asal usaha.
-- Rancangannya di docs/STANDAR-PROFIL-PESERTA.md; setiap kolom di sini punya
-- tujuan yang disebutkan di sana (UU PDP 27/2022 Pasal 16: terbatas dan
-- spesifik). Semuanya boleh kosong kecuali nama, yang sudah ada.

alter table public.profiles
  add column if not exists avatar_url text,
  -- Nama yang dicetak di sertifikat. NULL berarti "pakai full_name".
  -- Dipisahkan karena nama panggilan yang nyaman di antarmuka sering bukan
  -- nama yang berguna di dokumen resmi, dan sebaliknya.
  add column if not exists certificate_name text,
  add column if not exists phone text,
  add column if not exists organization text;

comment on column public.profiles.certificate_name is
  'Nama untuk dicetak di sertifikat; NULL berarti memakai full_name.';

-- Peserta boleh menyunting kolom-kolom ini tentang dirinya sendiri. Perhatikan
-- `role` tetap di luar daftar: 20261029010000 sengaja membatasi grant kolom
-- supaya tidak ada peserta yang bisa menaikkan dirinya jadi admin lewat REST.
grant update (
  full_name,
  notification_email_enabled,
  avatar_url,
  certificate_name,
  phone,
  organization
) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Bucket foto profil
-- -----------------------------------------------------------------------------
--
-- Dibatasi di server, bukan hanya di klien: `file.type` yang diperiksa
-- lib/storage.ts berasal dari browser dan bisa dilewati dengan memanggil
-- Storage langsung memakai kunci anon. SVG sengaja tidak ada dalam daftar --
-- SVG dapat memuat <script> dan berkas ini disajikan untuk dibuka peramban.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2 * 1024 * 1024,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Jalurnya `<user_id>/<nama berkas>`, dan policy di bawah mengunci segmen
-- pertama ke pemiliknya. Tanpa itu, satu peserta bisa menimpa foto peserta lain.
drop policy if exists "anyone can read avatars" on storage.objects;
create policy "anyone can read avatars" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- -----------------------------------------------------------------------------
-- Tiga bucket lama tidak punya batas apa pun di server
-- -----------------------------------------------------------------------------
--
-- Sama persoalannya: satu-satunya pemeriksaan jenis dan ukuran berkas ada di
-- lib/storage.ts, di sisi klien. `certificate-assets` ikut menerima PDF karena
-- di situlah berkas sertifikat yang dibuat server disimpan.
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id in ('course-thumbnails', 'lesson-content');

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where id = 'certificate-assets';
