-- Draf halaman depan, dan pengaturan SEO situs.
--
-- DUA HAL, SATU MIGRASI, karena keduanya menopang perubahan yang sama:
-- penyunting pengelola kini memisahkan "simpan" dari "terbitkan".
--
-- == 1. Draf halaman depan ==
--
-- Sampai sekarang menekan Simpan di /admin/landing langsung mengubah apa yang
-- dilihat pengunjung. Itu berarti setiap percobaan -- menggeser satu bagian,
-- mencoba kalimat lain, menempelkan foto yang belum final -- tayang seketika
-- di halaman publik. Penyusun jadi harus menyelesaikan seluruh suntingannya
-- dalam satu tarikan napas, atau menerima bahwa pengunjung melihat pekerjaan
-- setengah jadi.
--
-- Kolom `blocks` dan `blocks_en` TIDAK berubah artinya: keduanya tetap yang
-- dibaca halaman depan. Yang baru hanya kembarannya yang berakhiran `_draft`.
-- Itu disengaja -- halaman publik tidak perlu tahu apa pun tentang draf, dan
-- tidak satu baris pun kodenya ikut berubah.
--
--   null pada kolom draf  = tidak ada perubahan yang belum terbit
--   berisi                = ada draf; penyunting membukanya, pengunjung tidak
--
-- == 2. Pengaturan SEO ==
--
-- Judul dan keterangan situs selama ini tertulis di app/layout.tsx, jadi
-- mengubahnya butuh orang yang bisa menyentuh kode dan satu kali deploy.
-- Tabel ini memindahkannya ke tangan pemiliknya.
--
-- Satu baris saja, dikunci `id = true` -- pola yang sama dengan
-- `landing_content`, supaya tidak mungkin ada dua baris pengaturan yang
-- diam-diam berbeda.
--
-- Isinya jsonb per bahasa, bukan kolom per medan, dengan alasan yang sama
-- seperti `blocks`: bentuknya masih akan tumbuh (gambar bagikan, kata kunci,
-- verifikasi mesin pencari), dan setiap medan baru tidak layak jadi satu
-- migrasi sendiri.

alter table public.landing_content
  add column if not exists blocks_draft jsonb,
  add column if not exists blocks_en_draft jsonb,
  add column if not exists theme_draft jsonb,
  add column if not exists draft_updated_at timestamptz;

comment on column public.landing_content.blocks_draft is
  'Susunan blok yang belum diterbitkan. null = tidak ada perubahan tertunda.';
comment on column public.landing_content.blocks_en_draft is
  'Versi Inggris dari draf. null = tidak ada perubahan tertunda.';
comment on column public.landing_content.theme_draft is
  'Warna yang belum diterbitkan. null = tidak ada perubahan tertunda.';

create table if not exists public.site_seo (
  id boolean primary key default true,
  -- Memaksa tabel ini hanya pernah punya satu baris.
  constraint site_seo_tunggal check (id),
  seo jsonb not null default '{}'::jsonb,
  seo_draft jsonb,
  updated_at timestamptz not null default now(),
  draft_updated_at timestamptz
);

insert into public.site_seo (id, seo)
values (true, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_seo enable row level security;

-- Dibaca siapa saja, termasuk anon: judul dan keterangan situs memang muncul
-- di <head> setiap halaman publik, jadi menyembunyikannya tidak melindungi
-- apa pun -- isinya justru dibuat untuk dibaca mesin pencari.
--
-- Hanya kolom terbitnya yang pantas terbuka, tetapi RLS mengunci baris, bukan
-- kolom. Jadi yang menjaga `seo_draft` adalah pembacanya di lib/seo-server.ts,
-- yang tidak pernah memilih kolom itu untuk halaman publik.
drop policy if exists "siapa pun membaca pengaturan seo" on public.site_seo;
create policy "siapa pun membaca pengaturan seo" on public.site_seo
  for select to public
  using (true);

drop policy if exists "superadmin menyunting pengaturan seo" on public.site_seo;
create policy "superadmin menyunting pengaturan seo" on public.site_seo
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());
