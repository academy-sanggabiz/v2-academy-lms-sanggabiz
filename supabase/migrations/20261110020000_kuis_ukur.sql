-- Pretest dan posttest: kuis yang MENGUKUR, bukan menilai.
--
-- == Aturan yang dipegang berkas ini ==
--
-- SELURUHNYA PENAMBAHAN, dan itu bukan sekadar niat baik: basis data ini
-- dipakai bersama oleh produksi, preview dev, DAN pohon kerja kedua
-- (../lms-gaya) yang kodenya tertinggal puluhan commit. Apa pun yang
-- ditambahkan di sini harus tidak terlihat oleh kode yang belum tahu
-- keberadaannya.
--
-- Karena itu:
--   * kolom baru NULLABLE, tanpa default yang mengubah arti baris lama;
--   * tidak ada drop, rename, atau perubahan arti kolom yang sudah ada;
--   * TIDAK ADA perubahan pada trigger `guard_quiz_attempt_write`.
--
-- Yang terakhir itu keputusan sadar. Kolom bisa diabaikan kode lama; trigger
-- TIDAK BISA -- ia berjalan di dalam basis data dan menjaga setiap percobaan
-- kuis milik siapa pun yang menyentuhnya, termasuk kode lama. Menulis ulang
-- trigger 67 baris sekarang berarti mempertaruhkan "semua peserta tidak bisa
-- mengerjakan kuis apa pun" demi pagar yang untuk sementara bisa dijaga di
-- kode. Pembatasan satu percobaan pindah ke trigger belakangan, sebagai satu
-- perubahan tersendiri dengan garis dasar sebagai pembanding
-- (scripts/garis-dasar.mjs).
--
-- == Kenapa "kuis ukur" dan bukan jenis pelajaran baru ==
--
-- Pretest dan posttest adalah kuis biasa dengan satu kolom tambahan, bukan
-- entitas baru. Itu membuat seluruh mesin yang sudah ada -- pemutar, bank
-- soal, undian `draw_count`, penilaian otomatis `grade_attempt()` -- berlaku
-- apa adanya. Yang berbeda hanya cara hasilnya DIPAKAI, dan itu urusan kode.

-- ============================================================
-- 1. Penanda kuis ukur
-- ============================================================

do $$ begin
  create type public.quiz_measure_kind as enum ('pretest', 'posttest');
exception when duplicate_object then null; end $$;

alter table public.quizzes
  add column if not exists measure_kind public.quiz_measure_kind;

comment on column public.quizzes.measure_kind is
  'null = kuis biasa (perilaku lama, tidak berubah). pretest/posttest = kuis ukur: tidak memengaruhi nilai akhir, kelulusan, maupun sertifikat.';

-- Kuis ukur tidak pernah studi kasus: studi kasus dinilai manusia dan
-- berbobot tiga kali, dua hal yang justru tidak boleh dimiliki alat ukur.
alter table public.quizzes
  drop constraint if exists quizzes_ukur_bukan_studi_kasus;
alter table public.quizzes
  add constraint quizzes_ukur_bukan_studi_kasus
  check (measure_kind is null or is_assessment = false) not valid;

-- `not valid` lalu `validate`: baris lama semuanya `measure_kind is null`
-- sehingga pasti lolos, tetapi memisahkan keduanya membuat penambahan
-- constraint tidak mengunci tabel lebih lama dari yang perlu.
alter table public.quizzes validate constraint quizzes_ukur_bukan_studi_kasus;

-- ============================================================
-- 2. Satu pretest dan satu posttest per kursus
-- ============================================================
--
-- Ditegakkan di basis data, bukan hanya di editor. Dua pretest pada satu
-- kursus membuat "kenaikan per modul" tidak punya arti tunggal, dan layar
-- Perkembangan akan diam-diam memilih salah satunya.
--
-- Ditegakkan dengan TRIGGER, bukan indeks unik, dan itu bukan pilihan pertama.
--
-- `quizzes` tidak menyimpan course_id (ia menggantung di lesson -> section ->
-- course), jadi upaya pertama adalah indeks unik parsial atas
-- `public.quiz_course_id(id)`. Postgres menolaknya: "functions in index
-- expression must be marked IMMUTABLE". Penolakan itu benar. Fungsi itu
-- membaca tabel, jadi hasilnya bisa berubah tanpa barisnya berubah -- memindah
-- pelajaran ke modul lain memindahkan kuisnya ke kursus lain, dan indeks yang
-- terlanjur dibangun akan menyimpan jawaban lama. Menandainya IMMUTABLE supaya
-- indeksnya bisa dibuat adalah berbohong kepada perencana kueri, dan bayarannya
-- indeks rusak diam-diam. Jadi fungsinya dibiarkan STABLE dan aturannya pindah
-- ke trigger.
--
-- Yang hilang dengan trigger: ia memeriksa lalu menulis, jadi dua penyimpanan
-- yang benar-benar bersamaan bisa sama-sama lolos. Itu diterima di sini --
-- penulisnya satu admin di satu editor, dan akibat terburuknya adalah dua
-- pretest yang bisa dihapus, bukan data rusak.
--
-- Trigger baru ini AMAN untuk kode lama, berbeda dari menulis ulang
-- `guard_quiz_attempt_write`: baris pertamanya keluar bila `measure_kind` null,
-- dan kode lama tidak pernah mengisi kolom itu. Untuk setiap kuis yang ada
-- sekarang, trigger ini tidak melakukan apa pun.

create or replace function public.jaga_satu_kuis_ukur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course uuid;
  v_sudah_ada int;
begin
  if new.measure_kind is null then
    return new;
  end if;

  -- Kursus dicari dari `new.lesson_id`, bukan lewat `quiz_course_id(new.id)`:
  -- pada BEFORE INSERT barisnya belum ada di tabel, jadi fungsi itu akan
  -- menjawab null dan pemeriksaannya lolos tanpa memeriksa apa pun.
  select s.course_id into v_course
  from public.lessons l
  join public.course_sections s on s.id = l.section_id
  where l.id = new.lesson_id;

  if v_course is null then
    return new;
  end if;

  select count(*) into v_sudah_ada
  from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.course_sections s on s.id = l.section_id
  where s.course_id = v_course
    and q.measure_kind = new.measure_kind
    and q.id <> new.id;

  if v_sudah_ada > 0 then
    raise exception
      'Kursus ini sudah punya satu %. Satu kursus hanya boleh punya satu pretest dan satu posttest.',
      new.measure_kind
      using errcode = 'unique_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_satu_kuis_ukur_trg on public.quizzes;
create trigger jaga_satu_kuis_ukur_trg
  before insert or update of measure_kind, lesson_id on public.quizzes
  for each row execute function public.jaga_satu_kuis_ukur();

-- Indeks biasa (bukan unik) supaya mencari kuis ukur sebuah kursus tidak
-- memindai seluruh tabel. Parsial: baris kuis biasa tidak perlu masuk.
create index if not exists quizzes_measure_kind_idx
  on public.quizzes (measure_kind)
  where measure_kind is not null;

-- ============================================================
-- 3. Soal menunjuk modul yang diukurnya
-- ============================================================
--
-- Inti layar Perkembangan: tanpa ini, nilai pretest hanya satu angka dan
-- tidak bisa dipecah "modul mana yang naik". `on delete set null` supaya
-- menghapus modul tidak menghapus soalnya.

alter table public.questions
  add column if not exists measured_section_id uuid
    references public.course_sections (id) on delete set null;

comment on column public.questions.measured_section_id is
  'Modul yang diukur soal ini. Hanya diisi untuk soal di kuis ukur; null untuk kuis biasa.';

create index if not exists questions_measured_section_idx
  on public.questions (measured_section_id)
  where measured_section_id is not null;

-- ============================================================
-- 4. Pretest yang dikerjakan setelah mulai belajar
-- ============================================================
--
-- Pretest baru berarti "sebelum" kalau memang dikerjakan sebelum. Peserta
-- yang membuka pretest setelah menyelesaikan beberapa pelajaran tetap boleh
-- mengerjakannya -- nilainya tetap miliknya -- tetapi pasangan pretest-posttest
-- itu tidak sah untuk statistik kenaikan.
--
-- Ditandai saat percobaan dibuat, bukan dihitung belakangan: jumlah pelajaran
-- selesai berubah terus, jadi menghitungnya nanti memberi jawaban berbeda
-- setiap kali ditanya.

alter table public.quiz_attempts
  add column if not exists after_learning_started boolean not null default false;

comment on column public.quiz_attempts.after_learning_started is
  'Hanya berarti untuk percobaan pretest: true bila peserta sudah menyelesaikan pelajaran lain sebelum mengerjakannya. Pasangan pretest-posttest seperti itu tidak dipakai di statistik kenaikan.';
