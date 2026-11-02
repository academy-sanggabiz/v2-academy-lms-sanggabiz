-- Menarik sebagian soal secara acak tiap percobaan.
--
-- Pelengkap dari pencabutan batas percobaan: kalau peserta boleh mengulang
-- sampai lulus, kuis yang selalu menampilkan 10 soal yang sama persis
-- mengundang menghafal jawaban, bukan memahami materi. Dengan bank soal,
-- penyusun bisa menulis 30 soal lalu menampilkan 10 di antaranya.
--
-- KENAPA SOALNYA DISIMPAN, BUKAN DIHITUNG ULANG
--
-- Soal yang ditarik dicatat di barisnya sendiri (`quiz_attempts.question_ids`),
-- bukan diturunkan dari benih acak seperti pengacakan urutan. Tiga alasannya:
--
--   1. Penilaian harus memakai daftar yang persis sama dengan yang dilihat
--      peserta. Dua perhitungan terpisah -- satu di JavaScript untuk tampilan,
--      satu di plpgsql untuk penilaian -- harus sepakat sampai elemen
--      terakhir, selamanya. Sekali tidak sepakat, peserta dinilai atas soal
--      yang tidak pernah ia lihat.
--   2. Kalau ada peserta mempersoalkan nilainya, harus bisa ditunjukkan soal
--      mana saja yang ia hadapi. Benih tidak menjawab itu dengan jujur.
--   3. Penyusun bisa menambah atau menghapus soal kapan saja. Daftar yang
--      dihitung ulang akan berubah mengikuti kumpulan soal yang baru --
--      termasuk untuk percobaan yang sudah berlangsung.
--
-- KENAPA DIPILIH TRIGGER, BUKAN DI KODE APLIKASI
--
-- Percobaan dibuat oleh sesi PESERTA. Kalau aplikasi yang mengirim daftar
-- soalnya, peserta bisa mengirim daftar pilihannya sendiri lewat REST --
-- memilih sepuluh soal termudah, atau satu soal saja. Trigger di bawah
-- menimpa apa pun yang dikirim, jadi pemilihannya tidak pernah ada di tangan
-- yang dinilai.

alter table public.quizzes
  add column if not exists draw_count int;

comment on column public.quizzes.draw_count is
  'Berapa soal ditarik acak tiap percobaan. NULL = tampilkan semuanya.';

alter table public.quizzes
  drop constraint if exists quizzes_draw_count_check;
alter table public.quizzes
  add constraint quizzes_draw_count_check check (draw_count is null or draw_count > 0);

-- NULL berarti "seluruh soal kuis", supaya percobaan lama tetap dinilai
-- persis seperti sebelumnya.
alter table public.quiz_attempts
  add column if not exists question_ids uuid[];

comment on column public.quiz_attempts.question_ids is
  'Soal yang benar-benar dihadapi pada percobaan ini. NULL = seluruh soal kuis.';

-- -----------------------------------------------------------------------------
-- Pemilihan soal, di server
-- -----------------------------------------------------------------------------
create or replace function public.draw_attempt_questions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draw int;
  v_total int;
begin
  select q.draw_count into v_draw from public.quizzes q where q.id = new.quiz_id;
  select count(*) into v_total from public.questions where quiz_id = new.quiz_id;

  -- Tanpa penarikan, atau penarikannya mencakup semua soal: simpan NULL.
  -- Menyimpan daftar lengkap akan membuat percobaan membeku pada kumpulan
  -- soal saat itu, padahal yang dimaksud penyusun memang "semuanya".
  if v_draw is null or v_total = 0 or v_draw >= v_total then
    new.question_ids := null;
    return new;
  end if;

  select array_agg(id) into new.question_ids
  from (
    select id from public.questions
    where quiz_id = new.quiz_id
    order by random()
    limit v_draw
  ) terpilih;

  return new;
end;
$$;

drop trigger if exists draw_attempt_questions on public.quiz_attempts;
create trigger draw_attempt_questions
  before insert on public.quiz_attempts
  for each row execute function public.draw_attempt_questions();

revoke all on function public.draw_attempt_questions() from public, anon;

-- -----------------------------------------------------------------------------
-- Penilaian mengikuti soal yang benar-benar ditarik
-- -----------------------------------------------------------------------------
--
-- Definisi di bawah adalah grade_attempt() yang sudah ada, dengan SATU
-- perubahan: perulangan soalnya menyaring question_ids milik percobaan.
-- Diambil dari definisi hidup lalu ditambal, bukan ditulis ulang -- menulis
-- ulang fungsi sepanjang ini dari ingatan hampir pasti menghilangkan salah
-- satu penjaganya (belum masuk, belum terdaftar, percobaan sudah dikirim).

CREATE OR REPLACE FUNCTION public.grade_attempt(p_attempt_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_att public.quiz_attempts%rowtype;
  v_pass int;
  v_lesson uuid;
  v_course uuid;
  v_enr uuid;
  q public.questions%rowtype;
  v_resp text;
  v_ok boolean;
  v_total numeric := 0;
  v_award numeric := 0;
  v_correct int := 0;
  v_question_count int := 0;
  v_ungraded boolean := false;
  v_score numeric;
  v_passed boolean;
  v_per jsonb := '{}'::jsonb;
  v_sel text[];
  v_cor text[];
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select * into v_att from public.quiz_attempts
    where id = p_attempt_id and learner_id = v_uid;
  if not found then
    raise exception 'Attempt not found';
  end if;
  if v_att.status <> 'in_progress' then
    raise exception 'Attempt already submitted';
  end if;

  select pass_score, lesson_id into v_pass, v_lesson
    from public.quizzes where id = v_att.quiz_id;

  select cs.course_id into v_course
    from public.lessons l
    join public.course_sections cs on cs.id = l.section_id
    where l.id = v_lesson;

  select id into v_enr from public.enrollments
    where learner_id = v_uid and course_id = v_course;
  if v_enr is null then
    raise exception 'Not enrolled';
  end if;

  for q in select * from public.questions
    where quiz_id = v_att.quiz_id
      -- Hanya soal yang benar-benar dihadapi peserta pada percobaan ini.
      -- NULL berarti seluruh soal kuis, jadi percobaan lama dan kuis
      -- tanpa penarikan dinilai persis seperti sebelumnya.
      and (v_att.question_ids is null or id = any(v_att.question_ids))
  loop
    v_question_count := v_question_count + 1;
    v_resp := p_answers ->> q.id::text;

    if q.type = 'multiple_choice' and q.allow_multiple then
      v_sel := array(
        select trim(x) from unnest(string_to_array(coalesce(v_resp, ''), ',')) x
        where trim(x) <> ''
      );
      v_cor := array(
        select id::text from public.question_options
        where question_id = q.id and is_correct
      );
      v_ok := coalesce(array_length(v_sel, 1), 0) = coalesce(array_length(v_cor, 1), 0)
        and not exists (
          select unnest(v_sel)
          except
          select unnest(v_cor)
        );
    elsif q.type = 'multiple_choice' or q.type = 'true_false' then
      v_ok := v_resp is not null and exists (
        select 1 from public.question_options
        where question_id = q.id and id::text = v_resp and is_correct
      );
    elsif q.type = 'short_answer' and exists (
      select 1 from public.question_options where question_id = q.id and is_correct
    ) then
      v_ok := exists (
        select 1 from public.question_options o
        where o.question_id = q.id and o.is_correct
          and (
            case when q.case_sensitive
              then btrim(o.text) = btrim(coalesce(v_resp, ''))
              else lower(btrim(o.text)) = lower(btrim(coalesce(v_resp, '')))
            end
          )
      );
    else
      v_ok := null;
    end if;

    v_total := v_total + q.points;
    if v_ok is null then
      v_ungraded := true;
    elsif v_ok then
      v_award := v_award + q.points;
      v_correct := v_correct + 1;
    end if;
    v_per := v_per || jsonb_build_object(q.id::text, to_jsonb(v_ok));

    insert into public.quiz_responses (attempt_id, question_id, response, is_correct, points_awarded)
    values (
      p_attempt_id,
      q.id,
      to_jsonb(v_resp),
      v_ok,
      case when v_ok is null then null when v_ok then q.points else 0 end
    );
  end loop;

  v_score := case when v_total > 0 then round(v_award / v_total * 100) else 100 end;

  if v_ungraded then
    -- Persist the objective portion instead of leaving score null. Without
    -- it computeCourseGrade() (lib/course-grade.ts) counts a mixed quiz as 0
    -- until a human grades the essay, and the grading matrix shows nothing
    -- for a learner who already answered every auto-gradable question.
    -- `passed` stays null, so checkAndIssueCertificate's `passed = true` gate
    -- still withholds the certificate; finalizeAttempt (lib/grading-admin.ts)
    -- overwrites this provisional score on manual grading.
    update public.quiz_attempts
      set submitted_at = now(), score = v_score, passed = null, status = 'pending_review'
      where id = p_attempt_id;

    return jsonb_build_object(
      'pending', true,
      'score', null,
      'passed', null,
      'correctCount', v_correct,
      'total', v_question_count,
      'perQuestion', v_per
    );
  end if;

  v_passed := v_score >= v_pass;

  update public.quiz_attempts
    set submitted_at = now(), score = v_score, passed = v_passed, status = 'graded'
    where id = p_attempt_id;

  if v_passed then
    insert into public.lesson_progress (enrollment_id, lesson_id, completed, completed_at)
    values (v_enr, v_lesson, true, now())
    on conflict (enrollment_id, lesson_id)
    do update set completed = true, completed_at = now();
  end if;

  return jsonb_build_object(
    'pending', false,
    'score', v_score,
    'passed', v_passed,
    'correctCount', v_correct,
    'total', v_question_count,
    'perQuestion', v_per
  );
end;
$function$
;
