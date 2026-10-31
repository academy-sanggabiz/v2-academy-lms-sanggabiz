-- Pilihan bahasa peserta, supaya ikut berpindah perangkat.
--
-- Cookie yang menentukan tampilan pada permintaan tertentu (lib/i18n/server.ts
-- membacanya, bukan kolom ini, supaya tiap render halaman tidak membayar satu
-- query tambahan). Kolom ini adalah penyimpanannya: diisi saat orang memilih
-- bahasa, dan dibaca saat ia masuk di perangkat lain untuk mengisi cookie-nya.
--
-- NULL berarti belum pernah memilih; saat itu bahasa peramban yang dipakai.
alter table public.profiles add column if not exists locale text
  check (locale is null or locale in ('id', 'en'));

grant update (
  full_name,
  notification_email_enabled,
  avatar_url,
  certificate_name,
  phone,
  organization,
  locale
) on public.profiles to authenticated;
