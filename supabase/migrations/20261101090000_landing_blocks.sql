-- Halaman depan jadi daftar blok berurutan.
--
-- Sebelumnya bentuknya tetap dan tertanam di tata letak: hero, kursus pilihan,
-- keunggulan, lalu satu ajakan bertindak yang bahkan ditulis langsung di dalam
-- app/page.tsx sehingga tidak bisa disunting siapa pun. Superadmin hanya bisa
-- mengganti isi tiga bagian pertama -- tidak urutannya, dan tidak bisa menambah
-- atau menghilangkan bagian.
--
-- Kolom lama sengaja TIDAK dihapus. Selama peralihan, pembaca jatuh ke kolom
-- lama bila `blocks` masih kosong, jadi halaman depan tidak pernah kosong di
-- tengah jalan -- dan kalau ada yang salah dengan bentuk barunya, mengosongkan
-- `blocks` saja sudah mengembalikan tampilan lamanya.
alter table public.landing_content add column if not exists blocks jsonb;

comment on column public.landing_content.blocks is
  'Daftar blok halaman depan berurutan. NULL berarti pakai kolom lama (lib/landing-blocks.ts).';

-- Pindahkan isi baris yang ada ke bentuk blok, mempertahankan urutan lamanya
-- persis. Ajakan bertindak diisi dengan teks yang selama ini dipaku di
-- app/page.tsx, supaya halaman depan tampil sama seperti sebelumnya.
update public.landing_content
set blocks = jsonb_build_array(
  jsonb_build_object(
    'id', 'blok-hero',
    'type', 'hero',
    'hero', jsonb_build_object(
      'heading', heading,
      'highlightWord', highlight_word,
      'subheading', subheading,
      'primaryCtaText', primary_cta_text,
      'primaryCtaHref', primary_cta_href
    )
  ),
  jsonb_build_object(
    'id', 'blok-kursus',
    'type', 'courses',
    'heading', 'Kursus Pilihan',
    'subheading', '',
    'courseIds', to_jsonb(coalesce(featured_course_ids, array[]::uuid[]))
  ),
  jsonb_build_object(
    'id', 'blok-keunggulan',
    'type', 'features',
    'heading', 'Kenapa Belajar di Sini',
    'features', coalesce(features, '[]'::jsonb)
  ),
  jsonb_build_object(
    'id', 'blok-ajakan',
    'type', 'cta',
    'heading', 'Siap Mulai Belajar?',
    'subheading', 'Bergabunglah dengan peserta lain yang sudah mengembangkan diri melalui kursus kami.',
    'primaryText', 'Buat Akun',
    'primaryHref', '/auth/login',
    'secondaryText', 'Lihat Semua Kursus',
    'secondaryHref', '/auth/login'
  )
)
where blocks is null;
