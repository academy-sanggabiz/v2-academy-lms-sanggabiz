-- Ringkasan kinerja per mentor, untuk superadmin.
--
-- Alasan memilih angka-angka ini ada di docs/STANDAR-PERAN.md §4: rasio dan
-- hasil, bukan jumlah yang hanya bisa naik. Setiap angka dikembalikan bersama
-- jumlah data yang mendasarinya, supaya "100% selesai dari 1 pendaftaran"
-- tidak terbaca sama dengan "100% dari 200".
--
-- SECURITY DEFINER dan khusus superadmin: isinya menyilangkan data seluruh
-- mentor, yang justru tidak boleh dilihat mentor mana pun (§2).
create or replace function public.admin_mentor_overview()
returns table (
  mentor_id uuid,
  full_name text,
  email text,
  avatar_url text,
  joined_at timestamptz,
  courses_total int,
  courses_published int,
  learners int,
  enrollments int,
  completed int,
  avg_rating numeric,
  rating_count int,
  pending_reviews int
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id as mentor_id,
    coalesce(nullif(p.full_name, ''), p.email, 'Tanpa nama') as full_name,
    coalesce(p.email, '') as email,
    p.avatar_url,
    p.created_at as joined_at,
    coalesce(c.courses_total, 0)::int,
    coalesce(c.courses_published, 0)::int,
    coalesce(e.learners, 0)::int,
    coalesce(e.enrollments, 0)::int,
    coalesce(e.completed, 0)::int,
    f.avg_rating,
    coalesce(f.rating_count, 0)::int,
    coalesce(g.pending_reviews, 0)::int
  from public.profiles p
  left join lateral (
    select
      count(*) as courses_total,
      count(*) filter (where co.status = 'published') as courses_published
    from public.courses co
    where co.created_by = p.id
  ) c on true
  left join lateral (
    select
      count(distinct en.learner_id) as learners,
      count(*) as enrollments,
      count(*) filter (where en.status = 'completed') as completed
    from public.enrollments en
    join public.courses co on co.id = en.course_id
    where co.created_by = p.id
  ) e on true
  left join lateral (
    select round(avg(cf.rating)::numeric, 1) as avg_rating, count(*) as rating_count
    from public.course_feedback cf
    join public.courses co on co.id = cf.course_id
    where co.created_by = p.id
  ) f on true
  left join lateral (
    select count(*) as pending_reviews
    from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    join public.lessons l on l.id = q.lesson_id
    join public.course_sections cs on cs.id = l.section_id
    join public.courses co on co.id = cs.course_id
    where co.created_by = p.id and qa.status = 'pending_review'
  ) g on true
  where p.role = 'mentor' and public.is_superadmin()
  order by coalesce(nullif(p.full_name, ''), p.email);
$$;

revoke all on function public.admin_mentor_overview() from public, anon;
grant execute on function public.admin_mentor_overview() to authenticated;
