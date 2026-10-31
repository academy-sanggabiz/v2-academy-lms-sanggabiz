-- Kuis biasa tidak lagi dibatasi jumlah percobaan.
--
-- Batasnya ditegakkan di tiga tempat sekaligus, dan dua di antaranya memakai
-- angka yang dipaku -- bukan kolom `quizzes.max_attempts`:
--   1. lib/courses.ts REGULAR_QUIZ_MAX_ATTEMPTS = 3
--   2. app/learn/[courseId]/quiz-actions.ts
--   3. trigger guard_quiz_attempt_write di bawah
-- Karena itu menaikkan `max_attempts` sebuah kuis biasa tidak pernah
-- berpengaruh apa pun; satu-satunya yang benar-benar memakai kolom itu adalah
-- studi kasus (is_assessment), yang dinilai manusia.
--
-- Akibatnya nyata: seorang peserta gagal tiga kali (50, 0, 50 terhadap batas
-- lulus 70) lalu mentok permanen -- tidak bisa lulus, tidak bisa menulis
-- ulasan karena RLS menuntut pendaftaran berstatus selesai, dan tidak akan
-- pernah menerima sertifikat. Kuis bernilai lulus seharusnya mengukur apakah
-- peserta akhirnya paham, bukan apakah ia paham dalam tiga kali percobaan.
--
-- Definisi di bawah disalin apa adanya dari fungsi yang sedang berjalan
-- (pg_get_functiondef), dengan satu baris diubah: perhitungan v_max. Jalur
-- lainnya -- pintasan untuk pemilik kursus lewat owns_course(), early return
-- untuk peran selain anon/authenticated, dan seluruh pemeriksaan tulis --
-- sengaja tidak disentuh.

CREATE OR REPLACE FUNCTION public.guard_quiz_attempt_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_course uuid;
  v_quiz record;
  v_used int;
  v_max int;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  v_course := public.quiz_course_id(new.quiz_id);
  if v_course is not null and public.owns_course(v_course) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'in_progress'
      or new.submitted_at is not null
      or new.score is not null
      or new.passed is not null then
      raise exception 'A quiz attempt must start in progress' using errcode = '42501';
    end if;

    if v_course is null or not public.can_read_course_content(v_course) then
      raise exception 'Not enrolled' using errcode = '42501';
    end if;

    -- Mirrors the app-level cap (REGULAR_QUIZ_MAX_ATTEMPTS = 3 in
    -- lib/courses.ts for normal quizzes; quizzes.max_attempts, null =
    -- unlimited, for study cases) so it can't be bypassed over REST.
    select q.is_assessment, q.max_attempts into v_quiz
      from public.quizzes q where q.id = new.quiz_id;
    -- Kuis biasa: tanpa batas. Studi kasus tetap memakai max_attempts
    -- (null = tanpa batas) karena penilaiannya dikerjakan manusia.
    v_max := case when v_quiz.is_assessment then v_quiz.max_attempts else null end;
    if v_max is not null then
      select count(*) into v_used from public.quiz_attempts a
        where a.quiz_id = new.quiz_id and a.learner_id = new.learner_id;
      if v_used >= v_max then
        raise exception 'No attempts remaining' using errcode = '42501';
      end if;
    end if;

    return new;
  end if;

  -- UPDATE: only draft_answers on an attempt that is still open.
  if old.status <> 'in_progress' then
    raise exception 'Attempt already submitted' using errcode = '42501';
  end if;
  if (new.id, new.quiz_id, new.learner_id, new.attempt_number, new.started_at,
      new.submitted_at, new.score, new.passed, new.status)
     is distinct from
     (old.id, old.quiz_id, old.learner_id, old.attempt_number, old.started_at,
      old.submitted_at, old.score, old.passed, old.status) then
    raise exception 'Only draft answers can be changed' using errcode = '42501';
  end if;

  return new;
end;
$function$

;

-- Nilai lama pada kuis biasa tidak pernah ditegakkan, tetapi membiarkannya
-- membuat layar menampilkan batas yang tidak berlaku.
update public.quizzes set max_attempts = null where not is_assessment;
