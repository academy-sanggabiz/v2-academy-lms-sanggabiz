-- Data demo peserta untuk LMS Sanggabiz.
-- Skor kuis TIDAK ditulis tangan: attempt dibuat lalu dinilai lewat
-- public.grade_attempt(), fungsi yang sama dipakai QuizPlayer, supaya angka
-- yang muncul di layar admin benar-benar hasil penilaian aplikasi.
do $$
declare
  c_keu  uuid := '0b78773d-0783-49dc-93c5-dfe9b6ae8446'; -- Dasar Keuangan (published)
  c_wa   uuid := '0fe57bb6-a4cc-43d1-8a68-8aa4bdb808e5'; -- WhatsApp Bisnis (published)

  l_keu1 uuid := '1353b76f-69f9-4dec-ae3f-ff39647e3aa4';
  l_keu2 uuid := '44900496-3370-4e49-9e69-567abdab863c'; -- video
  l_keu3 uuid := 'ff6fe138-6ab9-422a-9431-993466df5102';
  l_keu4 uuid := 'c5a0404d-38d7-42db-aff8-35a7715939be';
  l_keu5 uuid := 'bdd9f4ba-81e0-4fa2-8826-4c389649bc87'; -- lesson kuis

  l_wa1  uuid := '674ad99c-ae30-471d-84d7-0dfb587202f8';
  l_wa2  uuid := '1ed11036-cd91-424f-9960-79550dbfa53b'; -- video
  l_wa3  uuid := '7389d705-84b7-471a-bccf-b43d3d4b4e98'; -- lesson kuis

  qz_keu uuid := '25e80a75-c2a0-4d2c-909b-c26a44549ad8';
  qz_wa  uuid := '295a14a0-05b6-42a5-9c14-09204ea70b27';

  siti uuid := '41d4abc0-573b-4a95-bee1-ecc852d786d4';
  budi uuid := 'b070d5f6-9313-49a0-aef5-0d7c4ef63610';
  dewi uuid := '8b1f34d0-9589-4153-842d-3f40a0251cd4';

  -- jawaban benar seluruhnya
  ans_keu_benar jsonb := jsonb_build_object(
    '08de8d72-22d9-4e28-a798-424d3567e7c4', '9cdb0ad2-eed2-4f69-8e63-8b5c01b9aebf',
    'bd7397e6-01c9-415f-85e9-c4fcc57604ab', '9dc44cb4-ab7c-4070-8c1d-fe40df06d626',
    'ad119fa0-b8b6-4078-95d7-8d1b8d36aa22', '8a4eccc0-f1fd-483c-9577-0ae3c414eaa0');
  -- satu salah (soal 1) -> 2 dari 3
  ans_keu_sebagian jsonb := jsonb_build_object(
    '08de8d72-22d9-4e28-a798-424d3567e7c4', 'a32cea89-b86a-4b2c-a292-e55406044527',
    'bd7397e6-01c9-415f-85e9-c4fcc57604ab', '9dc44cb4-ab7c-4070-8c1d-fe40df06d626',
    'ad119fa0-b8b6-4078-95d7-8d1b8d36aa22', '8a4eccc0-f1fd-483c-9577-0ae3c414eaa0');
  ans_wa_benar jsonb := jsonb_build_object(
    'f2241421-4731-464c-a140-1fe686005ec9', '07185e9f-b910-4928-a9a4-4f2a29500cab',
    '680380df-75b7-42eb-b9c5-a37c7ff5ef69', '676a597b-67eb-4089-9c1d-614621240d69');
  -- satu salah -> 1 dari 2 = 50, di bawah pass_score 70
  ans_wa_salah jsonb := jsonb_build_object(
    'f2241421-4731-464c-a140-1fe686005ec9', '75ad481a-9165-4a8f-bd26-fb6484a89243',
    '680380df-75b7-42eb-b9c5-a37c7ff5ef69', '676a597b-67eb-4089-9c1d-614621240d69');

  e_siti_keu uuid; e_siti_wa uuid;
  e_budi_keu uuid; e_budi_wa uuid;
  e_dewi_keu uuid; e_dewi_wa uuid;
  v_att uuid;
begin
  -- ---------------------------------------------------------------- sertifikat
  insert into course_certificate_settings
    (course_id, enabled, certificate_type, custom_title, description, signer_name, signer_title, additional_text)
  values (c_keu, true, 'completion', 'Sertifikat Penyelesaian',
          'Diberikan atas penyelesaian seluruh pelajaran dan kuis pada kursus ini.',
          'Priyo Pamungkas', 'Kepala Program Sanggabiz Academy',
          'Keaslian sertifikat dapat diperiksa melalui nomor seri di bawah.')
  on conflict (course_id) do update
    set enabled = excluded.enabled,
        certificate_type = excluded.certificate_type,
        custom_title = excluded.custom_title,
        description = excluded.description,
        signer_name = excluded.signer_name,
        signer_title = excluded.signer_title,
        additional_text = excluded.additional_text;

  -- --------------------------------------------------------------- pendaftaran
  insert into enrollments (learner_id, course_id, status, enrolled_at) values
    (siti, c_keu, 'active', '2026-09-08 09:12:00+07'),
    (siti, c_wa,  'active', '2026-10-14 20:05:00+07'),
    (budi, c_keu, 'active', '2026-09-22 07:40:00+07'),
    (budi, c_wa,  'active', '2026-09-30 13:25:00+07'),
    (dewi, c_keu, 'active', '2026-10-27 21:48:00+07'),
    (dewi, c_wa,  'active', '2026-10-29 08:03:00+07')
  on conflict do nothing;

  select id into e_siti_keu from enrollments where learner_id=siti and course_id=c_keu;
  select id into e_siti_wa  from enrollments where learner_id=siti and course_id=c_wa;
  select id into e_budi_keu from enrollments where learner_id=budi and course_id=c_keu;
  select id into e_budi_wa  from enrollments where learner_id=budi and course_id=c_wa;
  select id into e_dewi_keu from enrollments where learner_id=dewi and course_id=c_keu;
  select id into e_dewi_wa  from enrollments where learner_id=dewi and course_id=c_wa;

  -- ------------------------------------------------------------------ progres
  -- Siti: Dasar Keuangan tuntas seluruhnya.
  insert into lesson_progress (enrollment_id, lesson_id, completed, completed_at, last_position_seconds) values
    (e_siti_keu, l_keu1, true, '2026-09-08 09:31:00+07', 0),
    (e_siti_keu, l_keu2, true, '2026-09-09 20:18:00+07', 612),
    (e_siti_keu, l_keu3, true, '2026-09-11 06:55:00+07', 0),
    (e_siti_keu, l_keu4, true, '2026-09-14 19:02:00+07', 0),
    (e_siti_keu, l_keu5, true, '2026-09-14 19:40:00+07', 0),
  -- Siti: WhatsApp baru mulai.
    (e_siti_wa,  l_wa1,  true, '2026-10-14 20:22:00+07', 0),
  -- Budi: Dasar Keuangan berjalan, video belum selesai ditonton.
    (e_budi_keu, l_keu1, true, '2026-09-22 08:05:00+07', 0),
    (e_budi_keu, l_keu2, false, null, 247),
  -- Budi: WhatsApp tuntas.
    (e_budi_wa,  l_wa1,  true, '2026-09-30 13:51:00+07', 0),
    (e_budi_wa,  l_wa2,  true, '2026-10-02 21:14:00+07', 438),
    (e_budi_wa,  l_wa3,  true, '2026-10-02 21:46:00+07', 0),
  -- Dewi: WhatsApp baru satu pelajaran; Dasar Keuangan belum disentuh.
    (e_dewi_wa,  l_wa1,  true, '2026-10-29 08:29:00+07', 0)
  on conflict do nothing;

  -- -------------------------------------------------------------------- kuis
  -- Setiap attempt dinilai oleh grade_attempt(); auth.uid() dipalsukan di sini
  -- hanya untuk sesi transaksi ini, persis seperti JWT peserta saat memakai app.

  -- Siti, percobaan 1: dua dari tiga benar (67, belum lulus).
  perform set_config('request.jwt.claims', json_build_object('sub', siti, 'role','authenticated')::text, true);
  insert into quiz_attempts (quiz_id, learner_id, attempt_number, started_at)
    values (qz_keu, siti, 1, '2026-09-14 19:12:00+07') returning id into v_att;
  perform grade_attempt(v_att, ans_keu_sebagian);
  update quiz_attempts set submitted_at = '2026-09-14 19:21:00+07' where id = v_att;

  -- Siti, percobaan 2: seluruhnya benar (100, lulus).
  insert into quiz_attempts (quiz_id, learner_id, attempt_number, started_at)
    values (qz_keu, siti, 2, '2026-09-14 19:30:00+07') returning id into v_att;
  perform grade_attempt(v_att, ans_keu_benar);
  update quiz_attempts set submitted_at = '2026-09-14 19:38:00+07' where id = v_att;

  -- Budi: kuis WhatsApp lulus sekali jalan.
  perform set_config('request.jwt.claims', json_build_object('sub', budi, 'role','authenticated')::text, true);
  insert into quiz_attempts (quiz_id, learner_id, attempt_number, started_at)
    values (qz_wa, budi, 1, '2026-10-02 21:30:00+07') returning id into v_att;
  perform grade_attempt(v_att, ans_wa_benar);
  update quiz_attempts set submitted_at = '2026-10-02 21:44:00+07' where id = v_att;

  -- Dewi: kuis WhatsApp belum lulus -- memperlihatkan alur mengulang.
  perform set_config('request.jwt.claims', json_build_object('sub', dewi, 'role','authenticated')::text, true);
  insert into quiz_attempts (quiz_id, learner_id, attempt_number, started_at)
    values (qz_wa, dewi, 1, '2026-10-29 08:35:00+07') returning id into v_att;
  perform grade_attempt(v_att, ans_wa_salah);
  update quiz_attempts set submitted_at = '2026-10-29 08:41:00+07' where id = v_att;

  perform set_config('request.jwt.claims', null, true);

  -- Sinkron status enrollment, sama seperti yang dilakukan
  -- checkAndIssueCertificate() setelah pelajaran terakhir ditandai selesai.
  update enrollments set status='completed', completed_at='2026-09-14 19:40:00+07' where id = e_siti_keu;
  update enrollments set status='completed', completed_at='2026-10-02 21:46:00+07' where id = e_budi_wa;
end $$;
