-- Level tengah bernama "mentor", bukan "admin".
--
-- Alasannya di docs/STANDAR-PERAN.md §1: orang di level ini bukan pengurus
-- sistem melainkan pengajar yang mengelola kursusnya sendiri -- peran yang di
-- Moodle disebut Teacher dan di Canvas disebut Teacher, bukan Administrator.
-- Nilai enum ikut diganti supaya kode tidak memakai kosakata yang berbeda dari
-- layar; satu-satunya sebutan "admin" yang tersisa adalah nama fungsi
-- `is_admin()`, yang artinya "mentor atau superadmin" dan dipakai di puluhan
-- policy (§6).

alter type public.user_role rename value 'admin' to 'mentor';

-- Fungsi ini membandingkan nilai enum sebagai teks, jadi harus ikut diperbarui.
-- Tanpa ini setiap mentor langsung kehilangan akses ke seluruh area pengelola.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('mentor', 'superadmin')
  );
$$;
