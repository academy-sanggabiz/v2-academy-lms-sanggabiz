-- Statistik publik tanpa data pribadi, untuk API terbuka /api/public/stats.
--
-- Batas keterbukaannya sengaja ditetapkan di database, bukan di kode: endpoint
-- publik memakai klien anon biasa, sehingga tidak ada service-role key yang
-- perlu dibawa ke jalur publik. Yang bisa dibaca anon hanyalah kolom agregat di
-- bawah ini -- tidak ada nama, email, atau id orang.
--
-- `security_invoker = false` disengaja (pola yang sama dengan lessons_public):
-- view berjalan dengan hak pemiliknya supaya bisa menghitung baris di
-- `enrollments` dan `profiles`, yang keduanya tertutup untuk anon. Karena itu
-- kolom yang diproyeksikan harus tetap agregat -- jangan pernah menambahkan
-- kolom identitas ke view ini.

create or replace view public.public_course_stats
with (security_invoker = false) as
select
  c.id,
  c.title,
  c.description,
  c.level,
  c.language,
  c.lesson_count,
  c.duration_hours,
  coalesce(e.learner_count, 0)::int as learner_count
from public.courses c
left join (
  select course_id, count(*)::int as learner_count
  from public.enrollments
  group by course_id
) e on e.course_id = c.id
-- Kursus draf dan privat tetap tidak terlihat, sama seperti di katalog peserta.
where c.status = 'published' and c.is_private = false;

create or replace view public.public_platform_totals
with (security_invoker = false) as
select
  (select count(*) from public.profiles where role = 'learner')::int as learner_count,
  -- Dihitung terpisah supaya API bisa menyatakan sendiri bahwa isinya masih
  -- data uji; @contoh.test adalah domain uji yang tidak bisa menerima surel.
  (select count(*) from public.profiles
    where role = 'learner' and email like '%@contoh.test')::int as demo_learner_count,
  (select count(*) from public.courses
    where status = 'published' and is_private = false)::int as course_count,
  (select count(*) from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.status = 'published' and c.is_private = false)::int as enrollment_count;

grant select on public.public_course_stats to anon, authenticated;
grant select on public.public_platform_totals to anon, authenticated;
