-- Titik kesulitan per peserta: soal mana yang berulang kali salah, dan
-- pelajaran mana yang mengajarkannya.
--
-- Dasar hukumnya sama dengan wawasan belajar lain: UU PDP Pasal 20 ayat (2)
-- huruf b. Seluruhnya membaca ulang `quiz_responses` dan `quiz_attempts`, yang
-- memang harus dicatat untuk menilai kuis. Tidak ada data perilaku baru, dan
-- karena itu tidak perlu persetujuan tambahan.
--
-- Dipisah dari `admin_question_difficulty` yang sudah ada, dan perbedaannya
-- disengaja: fungsi itu menjawab "soal mana yang sulit bagi semua orang"
-- (tentang materinya), yang ini menjawab "di mana ORANG INI tersangkut"
-- (tentang orangnya). Yang pertama untuk memperbaiki kursus, yang kedua untuk
-- menolong satu peserta.
--
-- Mengembalikan `lesson_id` dengan sengaja: angka kesulitan tanpa jalan
-- kembali ke materinya hanya memberi tahu pengajar bahwa ada masalah, bukan
-- apa yang harus dilakukan (docs/STANDAR-DIGITAL-LEARNING §14).

create or replace function public.admin_learner_difficulty(p_enrollment_id uuid)
returns table (
  question_id uuid,
  prompt text,
  lesson_id uuid,
  lesson_title text,
  section_title text,
  salah int,
  dijawab int,
  akhirnya_benar boolean
)
language sql
security definer
set search_path = ''
stable
as $$
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
$$;

revoke all on function public.admin_learner_difficulty(uuid) from public, anon;
grant execute on function public.admin_learner_difficulty(uuid) to authenticated;
