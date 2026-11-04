-- Halaman depan dwibahasa: satu kolom jsonb tambahan untuk susunan blok
-- versi Inggris. Versi Indonesia tetap di kolom `blocks` dan tetap menjadi
-- sumber kebenaran: pengunjung berbahasa Inggris mendapat `blocks_en` bila
-- superadmin sudah mengisinya, dan jatuh kembali ke versi Indonesia bila
-- belum -- halaman depan tidak boleh kosong hanya karena terjemahannya
-- belum ditulis.
--
-- Kolom terpisah, bukan jsonb bertingkat {id:..., en:...} di kolom lama,
-- supaya data yang sudah ada tidak perlu dimigrasikan dan pembacaan versi
-- Indonesia tidak berubah sama sekali.
alter table public.landing_content
  add column if not exists blocks_en jsonb;

comment on column public.landing_content.blocks_en is
  'Susunan blok halaman depan versi Inggris; NULL berarti belum diterjemahkan dan pengunjung EN mendapat versi Indonesia.';
