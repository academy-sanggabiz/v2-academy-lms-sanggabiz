-- Layar wawasan mengabaikan kuis ukur.
--
-- == Kenapa ini perlu, dan kenapa tidak bisa diselesaikan di kode ==
--
-- Tiga layar wawasan mentor menjawab pertanyaan yang sama: "di mana peserta
-- kesulitan". Jawabannya dihitung di dalam basis data (admin_question_difficulty,
-- admin_quiz_effort, admin_learner_difficulty), jadi penyaringan harus di sini
-- juga -- menyaring hasilnya di TypeScript sudah terlambat, rata-rata dan
-- urutannya sudah terlanjur dihitung ikut baris yang tidak diinginkan.
--
-- Pretest DIRANCANG untuk banyak dijawab salah: itu titik awal pengukuran,
-- bukan kegagalan materi. Dibiarkan masuk, ia akan menempati seluruh puncak
-- daftar "soal tersulit" di setiap kursus yang memakainya, dan menenggelamkan
-- soal yang benar-benar bermasalah. "Rata-rata percobaan sampai lulus" juga
-- tidak punya arti untuk kuis yang hanya dikerjakan sekali dan tidak perlu
-- lulus.
--
-- == Keamanan perubahan ==
--
-- Hanya `create or replace`: nama, parameter, tipe kembalian, hak akses, dan
-- SECURITY DEFINER persis sama. Satu-satunya tambahan di tiap fungsi adalah
-- `measure_kind is null`, yang hari ini benar untuk SETIAP kuis di basis data
-- ini -- jadi hasil ketiga fungsi tidak berubah sebaris pun sampai ada mentor
-- yang benar-benar membuat pretest. Tidak ada tabel yang disentuh.

create or replace function public.admin_question_difficulty(p_course_id uuid)
 returns table(question_id uuid, prompt text, lesson_id uuid, lesson_title text, section_title text, answered integer, correct integer, correct_pct integer)
 language sql
 stable security definer
 set search_path to ''
as $function$
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
    -- Pretest/posttest tidak menjawab "soal mana yang sulit".
    and qz.measure_kind is null
  group by q.id, q.prompt, q.position, l.id, l.title, cs.title, cs.position
  order by
    -- Yang paling sering salah lebih dulu; soal yang belum pernah dijawab
    -- ditaruh paling akhir karena belum mengatakan apa-apa.
    (count(r.*) = 0),
    case when count(r.*) = 0 then null
         else 100.0 * count(*) filter (where r.is_correct) / count(r.*) end asc nulls last,
    cs.position, q.position;
$function$;

create or replace function public.admin_quiz_effort(p_course_id uuid)
 returns table(quiz_id uuid, lesson_title text, learners integer, passed integer, attempts integer, avg_attempts_to_pass numeric, avg_first_score numeric, avg_best_score numeric)
 language sql
 stable security definer
 set search_path to ''
as $function$
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
      -- "Berapa percobaan sampai lulus" tidak berlaku untuk kuis yang
      -- dikerjakan sekali dan tidak perlu lulus.
      and qz.measure_kind is null
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
$function$;

create or replace function public.admin_learner_difficulty(p_enrollment_id uuid)
 returns table(question_id uuid, prompt text, lesson_id uuid, lesson_title text, section_title text, salah integer, dijawab integer, akhirnya_benar boolean)
 language sql
 stable security definer
 set search_path to ''
as $function$
  with pendaftaran as (
    select e.learner_id, e.course_id
    from public.enrollments e
    where e.id = p_enrollment_id
      and public.owns_course(e.course_id)
  ),
  jawaban as (
    select
      r.question_id,
      r.is_correct,
      a.attempt_number,
      -- Jawaban terakhir per soal menentukan apakah akhirnya dikuasai.
      row_number() over (
        partition by r.question_id order by a.attempt_number desc, r.id desc
      ) as urutan_mundur
    from public.quiz_responses r
    join public.quiz_attempts a on a.id = r.attempt_id
    join pendaftaran p on p.learner_id = a.learner_id
    join public.questions q on q.id = r.question_id
    join public.quizzes z on z.id = q.quiz_id
    join public.lessons l on l.id = z.lesson_id
    join public.course_sections cs on cs.id = l.section_id
    where cs.course_id = p.course_id
      -- Salah di pretest bukan "tersangkut", itu keadaan awal.
      and z.measure_kind is null
  )
  select
    q.id as question_id,
    q.prompt,
    l.id as lesson_id,
    l.title as lesson_title,
    cs.title as section_title,
    count(*) filter (where j.is_correct is false)::int as salah,
    count(*)::int as dijawab,
    bool_or(j.urutan_mundur = 1 and j.is_correct) as akhirnya_benar
  from jawaban j
  join public.questions q on q.id = j.question_id
  join public.quizzes z on z.id = q.quiz_id
  join public.lessons l on l.id = z.lesson_id
  join public.course_sections cs on cs.id = l.section_id
  group by q.id, q.prompt, l.id, l.title, cs.title, cs.position, l.position
  having count(*) filter (where j.is_correct is false) > 0
  -- Yang paling sering salah lebih dulu; yang belum dikuasai mendahului yang
  -- sudah, karena hanya yang pertama masih butuh tindakan.
  order by bool_or(j.urutan_mundur = 1 and j.is_correct) asc nulls first,
           count(*) filter (where j.is_correct is false) desc,
           cs.position, l.position;
$function$;
