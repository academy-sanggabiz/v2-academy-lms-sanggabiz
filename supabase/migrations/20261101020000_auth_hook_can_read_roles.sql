-- Klaim peran di JWT tidak pernah terisi, dan itu membuat seluruh penjaga peran
-- di proxy.ts diam-diam tidak berfungsi.
--
-- `custom_access_token_hook` berjalan sebagai `supabase_auth_admin` dan membaca
-- `public.profiles` untuk menyisipkan `app_metadata.role`. databaseSetup.sql
-- sudah memberi `grant all on table public.profiles to supabase_auth_admin`,
-- tetapi GRANT bukan RLS: tabel ini mengaktifkan row level security dan seluruh
-- policy-nya ditujukan ke `authenticated`. Peran auth tidak punya BYPASSRLS,
-- jadi SELECT di dalam hook mengembalikan nol baris, `user_role` jadi NULL, dan
-- hook mengembalikan klaim tanpa perubahan -- tanpa galat apa pun.
--
-- Akibatnya `user.app_metadata.role` selalu undefined, sehingga di
-- lib/supabase/middleware.ts:
--   * admin tidak pernah benar-benar ditahan keluar dari area peserta;
--   * peserta tidak pernah dipantulkan dari /admin di lapisan proxy (masih
--     tertahan oleh pemeriksaan basis data di app/admin/layout.tsx, jadi bukan
--     kebocoran -- tetapi jalur cepatnya mati);
--   * setiap halaman admin membayar satu query `profiles` tambahan karena
--     resolveAdminProfile() selalu jatuh ke jalur cadangan.
--
-- Policy di bawah adalah pola yang dianjurkan Supabase untuk hook semacam ini:
-- beri peran auth hak baca khusus, dan tidak lebih.
create policy "auth admin reads roles for jwt hook" on public.profiles
  as permissive for select to supabase_auth_admin
  using (true);
