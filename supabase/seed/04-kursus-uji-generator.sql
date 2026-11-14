-- Kursus hasil uji coba generator AI.
--
-- Bahannya `docs/contoh/sop-izin-dan-cuti.md`, dokumen contoh yang sengaja
-- dibuat semembosankan SOP sungguhan. Seluruh isi pelajaran ditulis AI bawaan
-- lewat alur tiga tahap (kerangka -> isi modul -> simulasi tersendiri), lalu
-- DIPERIKSA: tiap kendali simulasinya diklik satu per satu, axe dijalankan di
-- keempat pelajarannya, dan hasilnya 0 pelanggaran WCAG 2.2 AA.
--
-- Yang TIDAK ditulis AI: tiga soal kuis tambahan di bagian bawah berkas ini.
-- Panggilan itu hanya menghasilkan satu soal -- ragam keluaran model yang
-- sudah dicatat di `lib/ai/sop.ts` dan tidak ditutup-tutupi. Ketiganya ditulis
-- tangan dari SOP yang sama.

-- Kursus hasil uji coba generator AI, dari docs/contoh/sop-izin-dan-cuti.md.
-- Dibuat 14 Nov 2026. Isi pelajaran ditulis AI, lalu diperiksa: tiap kendali
-- simulasinya diklik, axe dijalankan, dan hasilnya 0 pelanggaran.
do $$
declare v_admin uuid; c uuid; s uuid; l uuid; qz uuid; qq uuid;
begin
  select id into v_admin from public.profiles where role = 'superadmin' order by created_at limit 1;
  if exists (select 1 from public.courses where slug = 'cuti-tepat-waktu') then
    raise notice 'sudah ada'; return;
  end if;

  insert into public.courses
    (title, slug, description, level, language, status, is_private, price,
     lesson_count, duration_hours, passing_grade, sequential, who_for, requirements, created_by)
  values ('', 'cuti-tepat-waktu', 'Tenggat pengajuan izin dan cuti, apa yang membuat sebuah permintaan sah, dan apa yang terjadi kalau terlambat. Ditutup dengan simulasi: Anda yang memutuskan satu permintaan yang masuk lewat tenggat.',
    'beginner', 'Bahasa Indonesia', 'published', false, 0,
    4, 1, 70, false,
    array['Karyawan yang pernah bingung kapan harus mengajukan cuti','Manajer yang menyetujui permintaan izin dan cuti timnya','Tim SDM yang menyusun aturan dan memeriksanya tiap bulan'],
    array['Tidak perlu pengetahuan awal','Cukup 20 menit'],
    v_admin) returning id into c;

  insert into public.course_sections (course_id, title, position)
  values (c, 'Tenggat Pengajuan', 0) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Menentukan Tenggat untuk Tiap Jenis Permintaan', 0, 'text', '<p>Tenggat pengajuan penting bagi Anda karena permintaan yang masuk lewat tenggat tetap bisa disetujui, tetapi manajer wajib menuliskan alasannya di kolom catatan. Memahami tenggat sejak awal membantu Anda mengajukan permintaan dengan tenang dan menghindari pemeriksaan ulang.</p><p>Tenggat berbeda menurut jenis permintaan. Untuk cuti tahunan, ajukan paling lambat 7 hari kerja sebelum tanggal mulai.</p><p>Untuk cuti lebih dari 3 hari berturut-turut, ajukan paling lambat 14 hari kerja.</p><p>Izin penting boleh diajukan pada hari kejadian, lalu dilengkapi dalam 3 hari. Izin sakit diajukan pada hari pertama tidak masuk, sebelum pukul 09.00.</p>', 300);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Permintaan Mendadak Tanpa Alasan yang Ditulis', 1, 'text', '<p>Pada suatu pagi di bulan Februari, Rina—karyawan Divisi Operasional PT Cahaya Sentosa—mengirim pesan ke manajernya bahwa ia tidak bisa masuk hari itu karena urusan keluarga. Ia menulis lewat pesan pribadi, bukan melalui sistem kepegawaian. Manajernya menjawab singkat bahwa ia boleh tidak masuk.</p><p>Karena tidak ada pengajuan di sistem, permintaan itu tidak pernah tercatat. Saat pemeriksaan bulanan, SDM menemukan hari tersebut tanpa permintaan resmi dan tanpa alasan yang ditulis di kolom catatan. Permintaan mendadak tanpa alasan yang ditulis ditolak oleh SDM, dan hari itu dihitung sebagai alpa.</p><p>Akibatnya, alpa satu hari memotong cuti tahunan Rina satu hari. Persetujuan lisan dan lewat pesan pribadi tidak berlaku dan tidak menjadi dasar pembayaran gaji.</p><p>Kejadian ini menunjukkan bahwa tenggat bukan satu-satunya hal yang perlu diperhatikan; alasan tertulis di kolom catatan juga menentukan. Nama orang dan perusahaan dalam cerita ini dibuat-buat.</p>', 300);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Menangani Permintaan yang Masuk Lewat Tenggat', 2, 'interactive', '<style>.materi-interaktif {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #14252a;
    background: #ffffff;
    margin: 0;
    padding: 16px;
    line-height: 1.5;
    font-size: 16px;
  }
  .materi-interaktif h2 {
    font-size: 1.25rem;
    margin: 0 0 12px 0;
  }
  .materi-interaktif h3 {
    font-size: 1rem;
    margin: 16px 0 8px 0;
  }
  .materi-interaktif .tugas {
    background: #f4f7f8;
    border: 1px solid #d6e2e5;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
  }
  .materi-interaktif .tugas p {
    margin: 0;
  }
  .materi-interaktif .layar {
    border: 1px solid #d6e2e5;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    background: #ffffff;
  }
  .materi-interaktif .layar-judul {
    font-weight: 600;
    border-bottom: 1px solid #d6e2e5;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .materi-interaktif .baris {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    padding: 4px 0;
    border-bottom: 1px dashed #d6e2e5;
  }
  .materi-interaktif .baris:last-child {
    border-bottom: none;
  }
  .materi-interaktif .label-kolom {
    color: #566a70;
    min-width: 150px;
  }
  .materi-interaktif .nilai {
    color: #14252a;
    font-weight: 500;
  }
  .materi-interaktif .catatan-kosong {
    color: #566a70;
    font-style: italic;
  }
  .materi-interaktif .blok-pilihan {
    margin-bottom: 8px;
  }
  .materi-interaktif .pilihan label {
    display: block;
    border: 1px solid #d6e2e5;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: pointer;
    background: #f4f7f8;
  }
  .materi-interaktif .pilihan input {
    margin-right: 8px;
  }
  .materi-interaktif .akibat {
    display: none;
    border-left: 4px solid #13707f;
    padding: 10px 12px;
    margin: 8px 0 0 0;
    background: #f4f7f8;
    border-radius: 0 6px 6px 0;
  }
  .materi-interaktif .akibat p {
    margin: 0 0 6px 0;
  }
  .materi-interaktif .akibat p:last-child {
    margin-bottom: 0;
  }
  .materi-interaktif .baik {
    color: #0f5c3f;
    font-weight: 600;
  }
  .materi-interaktif .buruk {
    color: #8a2b2b;
    font-weight: 600;
  }
  .materi-interaktif .sim .akibat { display: none; }

  /* Akibat tindakan */
  .materi-interaktif .sim:has(#t1:checked) .akibat-t1 { display: block; }
  .materi-interaktif .sim:has(#t2:checked) .akibat-t2 { display: block; }
  .materi-interaktif .sim:has(#t3:checked) .akibat-t3 { display: block; }
  .materi-interaktif .sim:has(#t4:checked) .akibat-t4 { display: block; }

  /* Varian situasi mengubah keterangan formulir */
  .materi-interaktif .hanya-v1 { display: block; }
  .materi-interaktif .hanya-v2 { display: none; }
  .materi-interaktif .hanya-v3 { display: none; }
  .materi-interaktif .sim:has(#v2:checked) .hanya-v1 { display: none; }
  .materi-interaktif .sim:has(#v2:checked) .hanya-v2 { display: block; }
  .materi-interaktif .sim:has(#v3:checked) .hanya-v1 { display: none; }
  .materi-interaktif .sim:has(#v3:checked) .hanya-v3 { display: block; }

  /* Varian 2 menutup jalan: pengganti tidak tersedia */
  .materi-interaktif .sim:has(#v2:checked) .jalan-pengganti { display: none; }

  /* Varian 3 mengubah keputusan: pengajuan lewat tenggat pada masa sibuk */
  .materi-interaktif .sim:has(#v3:checked) .tindakan-biasa { display: none; }

  /* Ulangi dari awal */
  .materi-interaktif .sim:has(#ulang:checked) .blok-keputusan { display: none; }</style>
<div class="sim">

<h2>Menangani Permintaan yang Masuk Lewat Tenggat</h2>

<div class="tugas">
  <p>Anda manajer langsung di PT Nusantara Terang. sebuah permintaan cuti tahunan baru masuk ke sistem kepegawaian, padahal tanggal mulainya sudah dekat. Baca layar permintaan, lalu lakukan apa yang akan Anda lakukan sungguhan.</p>
</div>

<h3>Varian situasi</h3>
<div class="blok-pilihan">
  <div class="pilihan">
    <input type="radio" name="situasi" id="v1" checked />
    <label for="v1">Situasi biasa: tanggal mulai 3 hari kerja lagi, bukan masa sibuk.</label>
  </div>
  <div class="pilihan">
    <input type="radio" name="situasi" id="v2" />
    <label for="v2">Situasi kedua: nama rekan pengganti di kolomnya tidak tersedia, ia sedang cuti di periode yang sama.</label>
  </div>
  <div class="pilihan">
    <input type="radio" name="situasi" id="v3" />
    <label for="v3">Situasi ketiga: tanggal mulai jatuh pada minggu pertama bulan, tanpa keadaan darurat keluarga.</label>
  </div>
</div>

<div class="layar">
  <div class="layar-judul">Menu Izin &amp; Cuti — Status: Menunggu</div>
  <div class="baris"><span class="label-kolom">Pemohon</span><span class="nilai">Rani Kusuma</span></div>
  <div class="baris"><span class="label-kolom">Jenis</span><span class="nilai">Cuti tahunan</span></div>
  <div class="baris"><span class="label-kolom">Tanggal</span><span class="nilai">3 hari kerja, mulai pekan depan</span></div>
  <div class="baris biasa-saja"><span class="label-kolom">Rekan pengganti</span><span class="nilai">Dedi Saputra</span></div>
  <div class="baris jalan-pengganti"><span class="label-kolom">Catatan rekan pengganti</span><span class="nilai">Dedi Saputra tercatat cuti pada periode yang sama</span></div>
  <div class="baris"><span class="label-kolom">Pengajuan</span><span class="nilai hanya-v1">Masuk 3 hari kerja sebelum tanggal mulai. Tenggat cuti tahunan adalah 7 hari kerja.</span><span class="nilai hanya-v2">Masuk 3 hari kerja sebelum tanggal mulai. Tenggat cuti tahunan adalah 7 hari kerja.</span><span class="nilai hanya-v3">Masuk 3 hari kerja sebelum tanggal mulai. Tanggal mulai ada di minggu pertama bulan.</span></div>
  <div class="baris"><span class="label-kolom">Kolom catatan manajer</span><span class="nilai catatan-kosong">masih kosong</span></div>
</div>

<div class="blok-keputusan">
  <h3>Langkah Anda</h3>
  <div class="pilihan">
    <input type="radio" name="t" id="t1" />
    <label for="t1">Setujui permintaan dan tulis alasan di kolom catatan bahwa pengajuan masuk lewat tenggat.</label>

    <input type="radio" name="t" id="t2" />
    <label for="t2">Setujui permintaan tanpa menulis apa pun di kolom catatan.</label>

    <input type="radio" name="t" id="t3" />
    <label for="t3">Tunda keputusan, minta pemohon menulis sendiri alasannya di luar sistem.</label>

    <input type="radio" name="t" id="t4" />
    <label for="t4">Tolak permintaan dan biarkan kolom catatan kosong.</label>
  </div>
</div>

<div class="akibat akibat-t1">
  <p>Persetujuan tercatat dengan alasan lewat tenggat di kolom catatan. Saat pemeriksaan bulanan, SDM membaca catatan itu.</p>
  <p class="hanya-v1"><span class="baik">Yang terjadi berikutnya:</span> permintaan lolos pemeriksaan SDM. Hari cuti dihitung sebagai cuti tahunan, bukan alpa.</p>
  <p class="hanya-v2"><span class="bad">Yang terjadi berikutnya:</span> kolom nama pengganti diisi orang yang sedang cuti. Pekerjaan tidak punya pengganti, dan rekan yang namanya dipakai baru tahu saat ditanya pelanggan.</p>
  <p class="hanya-v3"><span class="bad">Yang terjadi berikutnya:</span> tanggal mulai ada di minggu pertama bulan, dan tidak ada keadaan darurat keluarga yang dicatat. Cuti tahunan tidak disetujui pada periode itu, sehingga persetujuan ini tertahan di SDM.</p>
</div>

<div class="akibat akibat-t2">
  <p>Status berubah menjadi Disetujui, tetapi kolom catatan tetap kosong.</p>
  <p class="hanya-v1"><span class="bad">Yang terjadi berikutnya:</span> permintaan mendadak tanpa alasan tertulis ditolak SDM saat pemeriksaan bulanan. Hari tersebut dihitung sebagai alpa.</p>
  <p class="hanya-v2"><span class="bad">Yang terjadi berikutnya:</span> permintaan tanpa alasan tertulis ditolak SDM saat pemeriksaan bulanan. Hari tersebut dihitung sebagai alpa, dan pekerjaan tetap tanpa pengganti.</p>
  <p class="hanya-v3"><span class="bad">Yang terjadi berikutnya:</span> permintaan masuk pada minggu pertama bulan tanpa alasan tertulis di kolom catatan. Keputusan tertahan di SDM, dan tanggal itu tercatat sebagai alpa.</p>
</div>

<div class="akibat akibat-t3">
  <p>Status tetap Menunggu. Pemohon mengirim alasan lewat pesan pribadi, bukan ke sistem.</p>
  <p class="hanya-v1"><span class="bad">Yang terjadi berikutnya:</span> permintaan yang masih Menunggu bukan izin. Bila pemohon tidak masuk, hari itu dihitung alpa meski Anda sudah mengiyakan lewat chat.</p>
  <p class="hanya-v2"><span class="bad">Yang terjadi berikutnya:</span> status tetap Menunggu, dan nama pengganti tetap orang yang sedang cuti. Bila pemohon tidak masuk, hari itu dihitung alpa dan pekerjaan berhenti.</p>
  <p class="hanya-v3"><span class="bad">Yang terjadi berikutnya:</span> status tetap Menunggu sampai tanggal mulai tiba. Hari itu dihitung alpa, dan tanggal pada minggu pertama bulan tidak pernah diputuskan.</p>
</div>

<div class="akibat akibat-t4">
  <p>Status menjadi Ditolak. Kolom catatan tetap kosong.</p>
  <p class="hanya-v1"><span class="bad">Yang terjadi berikutnya:</span> permintaan yang masuk lewat tenggat sebenarnya tetap bisa disetujui bila alasannya ditulis. Pemohon kehilangan jalan itu tanpa penjelasan tertulis.</p>
  <p class="hanya-v2"><span class="bad">Yang terjadi berikutnya:</span> penolakan tercatat tanpa alasan, padahal masalahnya ada pada nama pengganti. Pemohon tidak tahu apa yang harus diperbaiki.</p>
  <p class="hanya-v3"><span class="bad">Yang terjadi berikutnya:</span> penolakan tercatat tanpa alasan. Keputusan untuk periode minggu pertama bulan tidak pernah tertulis di kolom catatan.</p>
</div>

<div class="blok-pilihan">
  <div class="pilihan">
    <input type="radio" name="t" id="ulang" checked />
    <label for="ulang">Ulangi dari awal: kosongkan pilihan saya.</label>
  </div>
</div>

</div>', 300);

  insert into public.lessons (section_id, title, position, content_type, duration_seconds)
  values (s, 'Kuis Tenggat Pengajuan', 3, 'quiz', 300) returning id into l;
  insert into public.quizzes (lesson_id, title, pass_score, max_attempts, shuffle, is_assessment)
  values (l, 'Kuis Tenggat Pengajuan', 70, 3, false, false) returning id into qz;

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Paling lambat kapan cuti tahunan harus diajukan?</p><p>Paling lambat kapan izin sakit diajukan?</p><p>Apa yang terjadi bila permintaan mendadak tidak memiliki alasan yang ditulis?</p>', 1, 0, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Pada hari kejadian', false, 0),
    (qq, '7 hari kerja sebelum tanggal mulai', true, 1),
    (qq, '14 hari kerja sebelum tanggal mulai', false, 2),
    (qq, 'Pada hari pertama tidak masuk, sebelum pukul 09.00', true, 3),
    (qq, 'Pada hari kejadian, lalu dilengkapi dalam 3 hari', false, 4),
    (qq, '14 hari kerja sebelum tanggal mulai', false, 5),
    (qq, 'Ditolak oleh SDM saat pemeriksaan bulanan, dan hari tersebut dihitung sebagai alpa', true, 6),
    (qq, 'Otomatis berubah menjadi cuti tahunan', false, 7),
    (qq, 'Tetap disetujui tanpa catatan', false, 8);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Permintaan mendadak tanpa alasan yang ditulis akan ditolak oleh SDM saat pemeriksaan bulanan, dan hari tersebut dihitung sebagai alpa.');

end $$;

-- Pembetulan judul dan soal tambahan.
do $$
declare c uuid; qz uuid; qq uuid;
begin
  select id into c from public.courses where slug = 'cuti-tepat-waktu';

  update public.courses set
    title = 'Mengajukan dan Menyetujui Cuti Tepat Waktu',
    description = 'Tenggat pengajuan izin dan cuti, apa yang membuat sebuah permintaan sah, dan apa yang terjadi kalau terlambat. Ditutup dengan simulasi: Anda yang memutuskan satu permintaan yang masuk lewat tenggat.',
    who_for = array[
      'Karyawan yang pernah bingung kapan harus mengajukan cuti',
      'Manajer yang menyetujui permintaan izin dan cuti timnya',
      'Tim SDM yang menyusun aturan dan memeriksanya tiap bulan'],
    requirements = array['Tidak perlu pengetahuan awal','Cukup 20 menit']
  where id = c;

  select qz2.id into qz from public.quizzes qz2
    join public.lessons l on l.id = qz2.lesson_id
    join public.course_sections cs on cs.id = l.section_id
   where cs.course_id = c;

  -- Tiga soal tambahan, ditulis tangan dari SOP yang sama. Modelnya hanya
  -- menghasilkan satu soal pada panggilan ini; ragam itu sudah dicatat di
  -- lib/ai/sop.ts dan tidak ditutup-tutupi.
  if (select count(*) from public.questions where quiz_id = qz) < 2 then
    insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
    values (qz, 'multiple_choice', '<p>Anda ingin cuti 5 hari berturut-turut. Paling lambat kapan diajukan?</p>', 1, 1, false) returning id into qq;
    insert into public.question_options (question_id, text, is_correct, position) values
      (qq, '7 hari kerja sebelum tanggal mulai', false, 0),
      (qq, '14 hari kerja sebelum tanggal mulai', true, 1),
      (qq, 'Pada hari pertama tidak masuk', false, 2);
    insert into public.question_explanations (question_id, explanation) values
      (qq, 'Tenggat 7 hari berlaku untuk cuti tahunan biasa. Begitu cutinya lebih dari 3 hari berturut-turut, tenggatnya naik jadi 14 hari kerja, karena pekerjaan yang ditinggalkan perlu diatur lebih jauh ke depan.');

    insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
    values (qz, 'multiple_choice', '<p>Manajer Anda sudah mengiyakan lewat WhatsApp, tetapi status di sistem masih "Menunggu". Anda tetap berangkat. Apa akibatnya?</p>', 1, 2, false) returning id into qq;
    insert into public.question_options (question_id, text, is_correct, position) values
      (qq, 'Sah, karena manajer sudah menyetujui', false, 0),
      (qq, 'Hari itu dihitung alpa', true, 1),
      (qq, 'Otomatis berubah jadi izin tidak berbayar', false, 2);
    insert into public.question_explanations (question_id, explanation) values
      (qq, 'Persetujuan lisan, lewat WhatsApp, atau surel pribadi tidak berlaku. Yang menjadi dasar pembayaran gaji hanya status Disetujui di sistem, dan alpa satu hari memotong cuti tahunan satu hari.');

    insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
    values (qz, 'multiple_choice', '<p>Anda sakit dan tidak masuk selama dua hari. Surat dokter belum sempat diurus sampai hari kerja keempat. Apa yang terjadi?</p>', 1, 3, false) returning id into qq;
    insert into public.question_options (question_id, text, is_correct, position) values
      (qq, 'Tetap tercatat izin sakit', false, 0),
      (qq, 'Statusnya berubah menjadi cuti tahunan', true, 1),
      (qq, 'Langsung dihitung alpa dua hari', false, 2);
    insert into public.question_explanations (question_id, explanation) values
      (qq, 'Izin sakit lebih dari satu hari wajib disertai surat dokter dalam 3 hari kerja. Lewat dari itu statusnya berubah jadi cuti tahunan, jadi jatah cuti Anda yang terpakai, bukan dihitung alpa.');
  end if;
end $$;
