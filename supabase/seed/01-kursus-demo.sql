-- Kursus contoh berisi, supaya seluruh fitur LMS terlihat: kurikulum bermodul,
-- pelajaran teks dan video (dengan transkrip), kuis dengan penjelasan per soal,
-- sertifikat, dan statistik publik.
--
-- Semua slug berawalan `kursus-demo-` sehingga API publik menandainya
-- `is_demo: true` dan menyatakan sendiri bahwa isinya data contoh. Itu juga
-- cara menemukannya kembali untuk dihapus:
--   delete from public.courses where slug like 'kursus-demo-%';

do $$
declare
  v_admin uuid;
  c1 uuid; c2 uuid; c3 uuid;
  s uuid; l uuid; q uuid; qq uuid;
begin
  select id into v_admin from public.profiles
   where role in ('admin','superadmin') order by created_at limit 1;

  ---------------------------------------------------------------- kursus 1
  insert into public.courses
    (title, slug, description, level, language, status, is_private, price,
     lesson_count, duration_hours, passing_grade, who_for, requirements, created_by)
  values (
    'Dasar Keuangan untuk Usaha Kecil',
    'kursus-demo-dasar-keuangan-usaha-kecil',
    'Pisahkan uang usaha dari uang pribadi, baca laporan sederhana, dan tahu apakah usaha Anda benar-benar untung. Untuk pemilik usaha yang mencatat sendiri keuangannya.',
    'Pemula', 'Bahasa Indonesia', 'published', false, 0,
    5, 2, 70,
    array['Pemilik usaha kecil yang mencatat keuangannya sendiri','Calon wirausaha yang belum pernah menyusun pembukuan'],
    array['Tidak perlu latar belakang akuntansi','Siapkan catatan penjualan satu bulan terakhir bila ada'],
    v_admin
  ) returning id into c1;

  insert into public.course_sections (course_id, title, position)
  values (c1, 'Modul 1 · Memisahkan Uang Usaha', 1) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Kenapa uang usaha harus dipisah', 1, 'text',
    '<h2>Satu rekening, dua kantong</h2><p>Banyak usaha kecil terlihat untung padahal tidak. Penyebabnya hampir selalu sama: uang usaha dan uang pribadi bercampur di satu rekening, sehingga tidak ada yang tahu mana modal, mana laba, mana belanja dapur.</p><p><strong>Setelah pelajaran ini Anda akan mampu</strong> menjelaskan tiga kerugian nyata dari mencampur uang usaha dan uang pribadi.</p><h3>Tiga kerugian yang paling sering terjadi</h3><ul><li><strong>Laba semu.</strong> Saldo terlihat besar karena ada uang pribadi di dalamnya.</li><li><strong>Modal termakan.</strong> Belanja harian mengambil uang yang seharusnya memutar stok.</li><li><strong>Sulit mengajukan pinjaman.</strong> Bank meminta mutasi rekening usaha, bukan rekening campur.</li></ul><blockquote>Warung Bu Siti terlihat untung Rp 4 juta sebulan. Setelah dipisah, ternyata Rp 2,6 juta di antaranya adalah titipan arisan.</blockquote><p>Langkah pertamanya sederhana: buka satu rekening khusus usaha, dan biasakan semua penjualan masuk ke sana.</p>',
    420);

  insert into public.lessons (section_id, title, position, content_type, video_url, transcript, duration_seconds)
  values (s, 'Membuka rekening usaha dan mencatat kas harian', 2, 'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    E'Di video ini kita membuka rekening khusus usaha dan menyiapkan catatan kas harian.\n\nLangkah pertama, siapkan dokumen: KTP, dan bila ada, surat keterangan usaha dari kelurahan. Sebagian bank sudah menerima pembukaan rekening usaha perorangan tanpa akta notaris.\n\nLangkah kedua, tentukan satu aturan yang tidak boleh dilanggar: semua uang masuk dari penjualan masuk ke rekening ini, tanpa kecuali. Kalau pelanggan membayar tunai, setorkan di akhir hari.\n\nLangkah ketiga, buat catatan kas harian. Tiga kolom saja sudah cukup: tanggal, keterangan, dan jumlah. Pisahkan uang masuk dan uang keluar di dua kolom berbeda.\n\nLangkah keempat, tetapkan gaji untuk diri sendiri. Ini yang paling sering dilewati. Kalau Anda mengambil uang usaha sesuka waktu, Anda tidak akan pernah tahu berapa biaya tenaga kerja usaha Anda yang sebenarnya.\n\nDi akhir bulan, jumlahkan kolom masuk dan kolom keluar. Selisihnya adalah arus kas bulan itu — dan itu bahan untuk pelajaran berikutnya.',
    540);

  insert into public.course_sections (course_id, title, position)
  values (c1, 'Modul 2 · Membaca Angka Usaha', 2) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Membedakan omzet, laba kotor, dan laba bersih', 1, 'text',
    '<h2>Tiga angka yang sering tertukar</h2><p>Ketiganya sering disebut "untung", padahal artinya berbeda jauh. Tertukar di sini membuat pemilik usaha merasa aman padahal sedang rugi.</p><table><tbody><tr><th>Istilah</th><th>Artinya</th></tr><tr><td><strong>Omzet</strong></td><td>Seluruh uang penjualan, sebelum dikurangi apa pun.</td></tr><tr><td><strong>Laba kotor</strong></td><td>Omzet dikurangi biaya barang yang dijual.</td></tr><tr><td><strong>Laba bersih</strong></td><td>Laba kotor dikurangi semua biaya lain: sewa, listrik, gaji, transport.</td></tr></tbody></table><h3>Contoh satu bulan</h3><p>Omzet Rp 20.000.000. Biaya bahan Rp 12.000.000, jadi laba kotor Rp 8.000.000. Sewa, listrik, dan gaji Rp 6.500.000, jadi <strong>laba bersih Rp 1.500.000</strong>.</p><p>Usaha ini beromzet dua puluh juta, tetapi yang benar-benar menjadi milik pemiliknya satu setengah juta. Angka itulah yang menentukan apakah usaha layak dilanjutkan apa adanya, atau perlu diubah.</p>',
    480);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Menghitung titik impas', 2, 'text',
    '<h2>Berapa yang harus terjual agar tidak rugi</h2><p>Titik impas adalah jumlah penjualan saat usaha tidak untung dan tidak rugi. Di bawah angka itu Anda menombok; di atasnya barulah untung.</p><p><strong>Rumusnya:</strong> biaya tetap dibagi (harga jual dikurangi biaya per unit).</p><h3>Contoh</h3><p>Sewa dan gaji Rp 6.000.000 per bulan. Satu porsi dijual Rp 20.000 dengan biaya bahan Rp 12.000, jadi setiap porsi menyumbang Rp 8.000.</p><p>Rp 6.000.000 dibagi Rp 8.000 sama dengan <strong>750 porsi sebulan</strong>, atau sekitar 25 porsi sehari. Di bawah itu, usaha rugi meski kelihatan ramai.</p><p>Angka ini berguna karena mengubah pertanyaan "apakah hari ini ramai?" menjadi "apakah hari ini lewat 25 porsi?" — pertanyaan yang bisa dijawab dengan pasti.</p>',
    420);

  insert into public.lessons (section_id, title, position, content_type, duration_seconds)
  values (s, 'Latihan: membaca angka usaha', 3, 'quiz', 300) returning id into l;

  insert into public.quizzes (lesson_id, title, pass_score, max_attempts, shuffle, is_assessment)
  values (l, 'Latihan: membaca angka usaha', 70, 3, false, false) returning id into q;

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (q, 'multiple_choice', '<p>Omzet sebulan Rp 20.000.000, biaya bahan Rp 12.000.000, biaya sewa dan gaji Rp 6.500.000. Berapa laba bersihnya?</p>', 1, 1, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Rp 20.000.000', false, 1),
    (qq, 'Rp 8.000.000', false, 2),
    (qq, 'Rp 1.500.000', true, 3),
    (qq, 'Rp 6.500.000', false, 4);
  insert into public.question_explanations (question_id, explanation) values
    (qq, 'Laba kotor = 20 juta - 12 juta = 8 juta. Laba bersih = 8 juta - 6,5 juta = 1,5 juta. Rp 8.000.000 adalah laba kotor, bukan laba bersih.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (q, 'true_false', '<p>Omzet yang besar selalu berarti usaha sedang untung.</p>', 1, 2, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Benar', false, 1),
    (qq, 'Salah', true, 2);
  insert into public.question_explanations (question_id, explanation) values
    (qq, 'Omzet belum dikurangi biaya apa pun. Usaha beromzet besar tetap bisa rugi bila biaya bahan dan biaya tetapnya lebih besar.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (q, 'multiple_choice', '<p>Biaya tetap Rp 6.000.000 per bulan. Satu porsi dijual Rp 20.000 dengan biaya bahan Rp 12.000. Berapa porsi per bulan agar mencapai titik impas?</p>', 1, 3, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, '300 porsi', false, 1),
    (qq, '750 porsi', true, 2),
    (qq, '500 porsi', false, 3);
  insert into public.question_explanations (question_id, explanation) values
    (qq, 'Setiap porsi menyumbang Rp 20.000 - Rp 12.000 = Rp 8.000. Rp 6.000.000 dibagi Rp 8.000 = 750 porsi.');

  ---------------------------------------------------------------- kursus 2
  insert into public.courses
    (title, slug, description, level, language, status, is_private, price,
     lesson_count, duration_hours, passing_grade, who_for, requirements, created_by)
  values (
    'Melayani Pelanggan lewat WhatsApp Bisnis',
    'kursus-demo-layanan-whatsapp-bisnis',
    'Balas lebih cepat tanpa kewalahan: menyusun pesan pembuka, menangani keluhan, dan memakai fitur katalog serta pesan otomatis.',
    'Pemula', 'Bahasa Indonesia', 'published', false, 0,
    3, 1, 70,
    array['Pemilik usaha yang melayani pesanan lewat WhatsApp','Staf yang memegang nomor layanan pelanggan'],
    array['Punya WhatsApp Business terpasang di ponsel'],
    v_admin
  ) returning id into c2;

  insert into public.course_sections (course_id, title, position)
  values (c2, 'Modul 1 · Dasar Layanan yang Cepat', 1) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Menyusun balasan pertama yang menenangkan', 1, 'text',
    '<h2>Tiga puluh detik pertama</h2><p>Pelanggan menilai layanan Anda dari balasan pertama, bukan dari produk. Balasan yang baik melakukan tiga hal sekaligus: menyapa, memastikan maksudnya, dan memberi tahu langkah berikutnya.</p><p><strong>Setelah pelajaran ini Anda akan mampu</strong> menulis satu balasan pembuka yang bisa dipakai berulang.</p><h3>Pola yang bisa dipakai</h3><p>"Selamat siang, Bapak/Ibu. Terima kasih sudah menghubungi [nama usaha]. Benar ingin menanyakan [produk]? Saya cek ketersediaannya dulu ya, mohon tunggu sebentar."</p><ul><li><strong>Sapa dengan waktu</strong>, bukan sekadar "halo".</li><li><strong>Ulangi maksudnya</strong> supaya tidak salah paham sejak awal.</li><li><strong>Sebut langkah berikutnya</strong> agar pelanggan tahu harus menunggu, bukan diabaikan.</li></ul>',
    360);

  insert into public.lessons (section_id, title, position, content_type, video_url, transcript, duration_seconds)
  values (s, 'Menangani keluhan tanpa berdebat', 2, 'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    E'Keluhan yang ditangani baik sering menghasilkan pelanggan yang lebih setia daripada yang tidak pernah komplain sama sekali.\n\nPertama, akui dulu sebelum menjelaskan. Kalimat seperti "Mohon maaf atas ketidaknyamanannya" terdengar sepele, tapi ia menghentikan pelanggan dari perlu meninggikan suara untuk didengar.\n\nKedua, jangan membantah fakta versi pelanggan di pesan pertama. Tanyakan detail: nomor pesanan, kapan diterima, apa yang terjadi. Pertanyaan membuat percakapan bergerak; pembelaan membuatnya berputar.\n\nKetiga, tawarkan pilihan, bukan keputusan sepihak. "Kami bisa kirim ulang, atau kembalikan dananya. Bapak lebih nyaman yang mana?" Pelanggan yang diberi pilihan merasa dihargai.\n\nKeempat, sebutkan waktu. "Barang pengganti kami kirim besok sebelum jam dua belas." Janji tanpa waktu akan ditagih berkali-kali.\n\nTerakhir, catat keluhannya. Kalau keluhan yang sama muncul tiga kali, masalahnya bukan di pelanggan.',
    480);

  insert into public.lessons (section_id, title, position, content_type, duration_seconds)
  values (s, 'Latihan: menangani keluhan', 3, 'quiz', 240) returning id into l;

  insert into public.quizzes (lesson_id, title, pass_score, max_attempts, shuffle, is_assessment)
  values (l, 'Latihan: menangani keluhan', 70, 3, false, false) returning id into q;

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (q, 'multiple_choice', '<p>Pelanggan mengeluh barangnya rusak saat diterima. Apa yang sebaiknya dilakukan lebih dulu?</p>', 1, 1, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Menjelaskan bahwa barang dikirim dalam keadaan baik', false, 1),
    (qq, 'Meminta maaf atas ketidaknyamanannya, lalu menanyakan detailnya', true, 2),
    (qq, 'Meminta pelanggan menghubungi pihak ekspedisi sendiri', false, 3);
  insert into public.question_explanations (question_id, explanation) values
    (qq, 'Mengakui lebih dulu menurunkan ketegangan, dan pertanyaan detail membuat percakapan bergerak ke penyelesaian. Membantah di pesan pertama membuat pelanggan merasa harus membuktikan diri.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (q, 'true_false', '<p>Menjanjikan penyelesaian tanpa menyebutkan waktu sudah cukup untuk menenangkan pelanggan.</p>', 1, 2, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Benar', false, 1),
    (qq, 'Salah', true, 2);
  insert into public.question_explanations (question_id, explanation) values
    (qq, 'Janji tanpa waktu akan ditagih berulang kali. Sebutkan tenggat yang pasti, misalnya "besok sebelum pukul dua belas".');

  ---------------------------------------------------------------- kursus 3 (draf)
  insert into public.courses
    (title, slug, description, level, language, status, is_private, price,
     lesson_count, duration_hours, passing_grade, who_for, requirements, created_by)
  values (
    'Menyusun Laporan Penjualan Bulanan',
    'kursus-demo-laporan-penjualan-bulanan',
    'Merapikan catatan penjualan menjadi satu laporan bulanan yang bisa dibaca dalam lima menit. Masih disusun.',
    'Menengah', 'Bahasa Indonesia', 'draft', false, 0,
    1, 1, 70,
    array['Pemilik usaha yang sudah punya catatan penjualan harian'],
    array['Sudah menyelesaikan Dasar Keuangan untuk Usaha Kecil'],
    v_admin
  ) returning id into c3;

  insert into public.course_sections (course_id, title, position)
  values (c3, 'Modul 1 · Menyiapkan Data', 1) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Merapikan catatan harian', 1, 'text',
    '<h2>Dari buku tulis ke satu tabel</h2><p>Laporan bulanan yang baik dimulai dari catatan harian yang konsisten. Bab ini masih disusun.</p>',
    300);
end $$;
