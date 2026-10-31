-- Pelacakan yang lebih rinci, dari data yang memang sudah sah dikumpulkan.
--
-- Dasar hukumnya UU PDP 27/2022 Pasal 20 ayat (2) huruf b: pemenuhan kewajiban
-- perjanjian. Peserta mendaftar untuk mengikuti kursus, dan untuk menyampaikan
-- kursus itu -- menandai kemajuan, menilai kuis, menerbitkan sertifikat --
-- penyelesaian pelajaran, percobaan kuis, dan jawaban per soal memang harus
-- dicatat. Seluruh fungsi di bawah hanya membaca ulang data itu; tidak ada satu
-- pun kolom baru yang dikumpulkan.
--
-- Yang TIDAK ada di sini, dan sengaja: jam berapa seseorang belajar, berapa
-- lama ia membuka halaman, dan pemeringkatan "peserta terbaik". Ketiganya
-- bukan keperluan menyampaikan kursus, jadi dasarnya bukan huruf b melainkan
-- huruf a -- persetujuan eksplisit, yang harus diminta sebelum data
-- dikumpulkan. Pemeringkatan juga merupakan pemrofilan, yang membawa kewajiban
-- tersendiri. Rancangannya ada di docs/STANDAR-PELACAKAN.md.

-- -----------------------------------------------------------------------------
-- Soal mana yang paling sering salah, per kursus
-- -----------------------------------------------------------------------------
--
-- Dikembalikan sebagai angka agregat lintas peserta, bukan per orang: yang
-- ingin diketahui pengajar adalah "bagian mana yang sulit", dan itu pertanyaan
-- tentang materinya, bukan tentang orangnya.
create or replace function public.admin_question_difficulty(p_course_id uuid)
returns table (
  question_id uuid,
  prompt text,
  lesson_id uuid,
  lesson_title text,
  section_title text,
  answered int,
  correct int,
  correct_pct int
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    q.id as question_id,
    q.prompt,
    l.id as lesson_id,
    l.title as lesson_title,
    cs.title as section_title,
    count(r.*)::int as answered,
    count(*) filter (where r.is_correct)::int as correct,
    case when count(r.*) = 0 then null
         else round(100.0 * count(*) filter (where r.is_correct) / count(r.*))::int
    end as correct_pct
  from public.questions q
  join public.quizzes qz on qz.id = q.quiz_id
  join public.lessons l on l.id = qz.lesson_id
  join public.course_sections cs on cs.id = l.section_id
  left join public.quiz_responses r on r.question_id = q.id
  where cs.course_id = p_course_id
    and public.owns_course(p_course_id)
  group by q.id, q.prompt, q.position, l.id, l.title, cs.title, cs.position
  order by
    -- Yang paling sering salah lebih dulu; soal yang belum pernah dijawab
    -- ditaruh paling akhir karena belum mengatakan apa-apa.
    (count(r.*) = 0),
    case when count(r.*) = 0 then null
         else 100.0 * count(*) filter (where r.is_correct) / count(r.*) end asc nulls last,
    cs.position, q.position;
$$;

revoke all on function public.admin_question_difficulty(uuid) from public, anon;
grant execute on function public.admin_question_difficulty(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Berapa kali peserta mencoba sebelum lulus, per kuis
-- -----------------------------------------------------------------------------
--
-- Mencabut batas percobaan tidak menghilangkan datanya: tiap percobaan tetap
-- satu baris lengkap dengan nomor urut dan skornya. Angka ini menjawab
-- "seberapa berat kuis ini" dengan cara yang tidak bisa dijawab skor akhir.
create or replace function public.admin_quiz_effort(p_course_id uuid)
returns table (
  quiz_id uuid,
  lesson_title text,
  learners int,
  passed int,
  attempts int,
  avg_attempts_to_pass numeric,
  avg_first_score numeric,
  avg_best_score numeric
)
language sql
security definer
set search_path = ''
stable
as $$
  with per_learner as (
    select
      qz.id as quiz_id,
      l.title as lesson_title,
      a.learner_id,
      count(*) filter (where a.status <> 'in_progress')::int as attempts,
      bool_or(a.passed) as passed,
      min(a.score) filter (where a.attempt_number = 1) as first_score,
      max(a.score) as best_score,
      min(a.attempt_number) filter (where a.passed) as attempt_passed_on
    from public.quizzes qz
    join public.lessons l on l.id = qz.lesson_id
    join public.course_sections cs on cs.id = l.section_id
    join public.quiz_attempts a on a.quiz_id = qz.id
    where cs.course_id = p_course_id
    group by qz.id, l.title, a.learner_id
  )
  select
    quiz_id,
    lesson_title,
    count(*)::int as learners,
    count(*) filter (where passed)::int as passed,
    sum(attempts)::int as attempts,
    round(avg(attempt_passed_on) filter (where passed), 1) as avg_attempts_to_pass,
    round(avg(first_score), 1) as avg_first_score,
    round(avg(best_score), 1) as avg_best_score
  from per_learner
  where public.owns_course(p_course_id)
  group by quiz_id, lesson_title
  order by lesson_title;
$$;

revoke all on function public.admin_quiz_effort(uuid) from public, anon;
grant execute on function public.admin_quiz_effort(uuid) to authenticated;
