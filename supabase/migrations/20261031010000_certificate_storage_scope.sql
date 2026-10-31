-- Lanjutan C-05: policy tulis admin pada bucket `certificate-assets` memakai
-- `is_admin()` saja, tanpa batas folder. Akibatnya admin mana pun -- termasuk
-- yang bukan pemilik kursusnya -- bisa menimpa atau menghapus berkas PDF
-- sertifikat peserta di `certificates/<peserta>/<enrollment>.pdf`, sementara
-- nomor seri dan baris `certificates`-nya tetap terlihat sah.
--
-- Sejak penerbitan sertifikat pindah ke server (service role), tidak ada lagi
-- alasan sah bagi admin untuk menulis di bawah prefix `certificates/`. Yang
-- memang perlu mereka unggah -- templat sertifikat dan gambar tanda tangan --
-- disimpan di akar bucket dengan nama UUID (lib/storage.ts), bukan di folder
-- itu, sehingga pengecualian ini tidak mengganggu apa pun.
--
-- Catatan tentang `(storage.foldername(name))[1]`: untuk berkas di akar bucket
-- nilainya NULL, dan `NULL is distinct from 'certificates'` bernilai true --
-- jadi unggahan templat tetap lolos.

drop policy if exists "admins can upload certificate assets" on storage.objects;
create policy "admins can upload certificate assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'certificate-assets'
    and public.is_admin()
    and (storage.foldername(name))[1] is distinct from 'certificates'
  );

drop policy if exists "admins can update certificate assets" on storage.objects;
create policy "admins can update certificate assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'certificate-assets'
    and public.is_admin()
    and (storage.foldername(name))[1] is distinct from 'certificates'
  )
  with check (
    bucket_id = 'certificate-assets'
    and public.is_admin()
    and (storage.foldername(name))[1] is distinct from 'certificates'
  );

drop policy if exists "admins can delete certificate assets" on storage.objects;
create policy "admins can delete certificate assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'certificate-assets'
    and public.is_admin()
    and (storage.foldername(name))[1] is distinct from 'certificates'
  );
