-- Pengetatan view statistik publik, hasil tinjauan keamanan atas migrasi
-- 20261030000000_public_stats_views.sql. Tiga hal yang terlewat di sana:
--
-- 1. `grant select` saja ternyata menyesatkan. Supabase memasang
--    `alter default privileges ... grant all`, sehingga setiap view baru
--    otomatis mewarisi INSERT/UPDATE/DELETE untuk anon. Hari ini hak itu mati
--    karena kedua view tidak auto-updatable, tetapi view TIDAK punya RLS --
--    grant adalah satu-satunya kontrolnya. Bila suatu saat JOIN di
--    public_course_stats disederhanakan (refactor yang sangat masuk akal demi
--    kecepatan), view menjadi auto-updatable dan tulisan anon akan mendarat di
--    tabel aslinya DENGAN HAK PEMILIK VIEW, menembus RLS. Dicabut eksplisit.
--
-- 2. Penanda data demo tidak pernah menyala. `email like '%@contoh.test'` tidak
--    cocok dengan satu baris pun, sementara akun uji yang benar-benar dibuat
--    proyek ini adalah `c-rls-*@test.local` (scripts/rls-check.mjs), dan satu
--    satunya kursus terbit justru berjudul "Kursus Demo". Akibatnya angka uji
--    disajikan seolah angka nyata.
--
-- 3. Tidak ada ambang minimum. Pada platform sekecil ini, "1 peserta di kursus
--    ini" adalah pernyataan tentang satu orang tertentu -- persis fakta
--    siapa-ikut-apa yang justru ditolak untuk diterbitkan.

-- `create or replace` tidak bisa mengubah susunan kolom, dan kedua view ini
-- bertambah kolom; tidak ada objek lain yang bergantung padanya.
drop view if exists public.public_course_stats;
drop view if exists public.public_platform_totals;

create view public.public_course_stats
with (security_invoker = false) as
select
  c.id,
  c.title,
  c.description,
  c.level,
  c.language,
  c.lesson_count,
  c.duration_hours,
  -- Di bawah ambang, jumlahnya disembunyikan (null), bukan dinolkan: nol itu
  -- bohong, null berarti "terlalu sedikit untuk dilaporkan".
  case
    when coalesce(e.learner_count, 0) >= 5 then e.learner_count
    else null
  end as learner_count,
  (c.slug like 'kursus-demo-%') as is_demo
from public.courses c
left join (
  select course_id, count(*)::int as learner_count
  from public.enrollments
  group by course_id
) e on e.course_id = c.id
where c.status = 'published' and c.is_private = false;

create view public.public_platform_totals
with (security_invoker = false) as
select
  (select count(*) from public.profiles where role = 'learner')::int as learner_count,
  -- Pola disamakan dengan akun uji yang benar-benar dipakai repo ini.
  (select count(*) from public.profiles
    where role = 'learner'
      and (email like '%@contoh.test' or email like '%@test.local' or email like 'c-rls-%')
  )::int as demo_learner_count,
  (select count(*) from public.courses
    where status = 'published' and is_private = false)::int as course_count,
  (select count(*) from public.courses
    where status = 'published' and is_private = false and slug like 'kursus-demo-%')::int as demo_course_count,
  (select count(*) from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.status = 'published' and c.is_private = false)::int as enrollment_count;

-- Urutan penting: cabut dulu hak bawaan, baru berikan yang memang dimaksud.
revoke all on public.public_course_stats from anon, authenticated;
revoke all on public.public_platform_totals from anon, authenticated;

grant select on public.public_course_stats to anon, authenticated;
grant select on public.public_platform_totals to anon, authenticated;
