-- Gambar dan keterangan untuk kartu bidang minat di halaman depan.
--
-- Keduanya nullable dan tanpa nilai bawaan: kategori yang sudah ada tetap
-- tampil apa adanya, dan kartunya menyusut dengan rapi ketika gambarnya belum
-- diisi. Tidak ada migrasi data, tidak ada baris yang berubah.
--
-- Ditaruh di `categories`, BUKAN di dalam blok halaman depan. Kategori adalah
-- data bersama yang juga dipakai saringan katalog `/kelas`; menyimpan
-- gambarnya sebagai isi halaman depan berarti satu kategori bisa punya dua
-- wajah yang berbeda di dua layar.
alter table public.categories
  add column if not exists image_url text,
  add column if not exists description text;

comment on column public.categories.image_url is
  'Gambar kartu bidang minat. Diunggah ke bucket landing-assets.';
comment on column public.categories.description is
  'Satu kalimat tentang isi bidang ini, ditampilkan di kartu halaman depan.';
