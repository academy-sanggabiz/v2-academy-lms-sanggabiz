-- Bucket dokumen SOP: berkas yang diunggah mentor untuk dijadikan kerangka
-- kursus (F1).
--
-- == Kenapa bucket sendiri, dan kenapa PRIVAT ==
--
-- SOP adalah dokumen internal perusahaan pelanggan: prosedur penanganan
-- keluhan, alur persetujuan, kadang nama sistem dan nama orang. Seluruh bucket
-- lain di proyek ini publik-baca karena isinya memang untuk dilihat (gambar
-- pelajaran, aset halaman depan). Yang ini tidak boleh ikut pola itu: satu URL
-- yang bocor berarti SOP perusahaan orang bisa dibaca siapa saja yang
-- menebaknya.
--
-- Karena itu TIDAK ADA policy select untuk anon maupun authenticated. Yang
-- membaca isinya hanyalah server action yang memakai service role untuk
-- mengekstrak teksnya, lalu mengirim teks itu ke penyedia AI. Mentor tidak
-- perlu mengunduhnya kembali -- ia sudah punya berkas aslinya.
--
-- Penghapusan diizinkan untuk admin supaya dokumen yang salah unggah bisa
-- dicabut; itu satu-satunya kewenangan yang diberikan ke sesi pengguna.
--
-- Seluruhnya penambahan: tidak ada bucket atau policy lama yang disentuh.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sop-documents', 'sop-documents', false, 10 * 1024 * 1024,
        array['application/pdf', 'text/plain', 'text/markdown'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload sop documents" on storage.objects;
create policy "admins upload sop documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sop-documents' and public.is_admin());

drop policy if exists "admins delete sop documents" on storage.objects;
create policy "admins delete sop documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sop-documents' and public.is_admin());
