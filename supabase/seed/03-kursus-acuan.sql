-- Kursus acuan: contoh bagaimana satu kursus terlihat kalau dirancang dengan
-- benar di LMS ini. Satu modul, lima pelajaran, empat jenis isi.
--
-- Bukan data demo yang bisa dibuang: ini kursus sungguhan yang terbit dan bisa
-- diikuti. Karena itu slug-nya TIDAK berawalan `kursus-demo-` -- awalan itu
-- membuat /api/public/stats menandainya `is_demo: true`, dan kursus ini bukan
-- tempelan untuk menguji API.
--
-- Isi HTML di bawah sudah BERSIH: pelajaran teks sudah lewat sanitizeRichText,
-- pelajaran interaktif sudah lewat bersihkanMateriInteraktif. Berkas mentah
-- tidak pernah boleh masuk ke kolom content, lewat seed sekalipun.
do $$
declare v_admin uuid; v_kat uuid; c uuid; s uuid; l uuid; qz uuid; qq uuid;
begin
  select id into v_admin from public.profiles where role = 'superadmin' order by created_at limit 1;
  if v_admin is null then raise exception 'tidak ada superadmin'; end if;

  if exists (select 1 from public.courses where slug = 'mengenali-penipuan-digital') then
    raise notice 'kursus sudah ada, dilewati'; return;
  end if;

  -- Kategori baru: belum ada yang mewadahi pelatihan kepatuhan dan keamanan.
  select id into v_kat from public.categories where slug = 'keamanan-kepatuhan';
  if v_kat is null then
    insert into public.categories (name, slug) values ('Keamanan & Kepatuhan', 'keamanan-kepatuhan')
    returning id into v_kat;
  end if;

  insert into public.courses
    (title, slug, description, level, language, status, is_private, price,
     lesson_count, duration_hours, passing_grade, sequential, category_id,
     who_for, requirements, created_by)
  values (
    'Mengenali Penipuan Digital di Tempat Kerja',
    'mengenali-penipuan-digital',
    'Penipu tidak membobol sistem, mereka membobol orang. Kenali tiga cara mereka bekerja, latih mata Anda pada pesan sungguhan, dan bawa pulang satu alat bantu yang bisa dibuka kapan pun Anda ragu.',
    'beginner', 'Bahasa Indonesia', 'published', false, 0,
    5, 1, 70, false, v_kat,
    array['Karyawan yang memegang pembayaran, data pelanggan, atau akun perusahaan','Pemilik usaha kecil yang timnya memakai WhatsApp untuk urusan kerja','Siapa pun yang pernah ragu saat menerima pesan mendesak'],
    array['Tidak perlu latar belakang teknologi','Cukup 30 menit, bisa dicicil per pelajaran'],
    v_admin
  ) returning id into c;

  -- `sequential = false` dengan sengaja, walaupun isinya memang berurutan dan
  -- pelajaran 2 merujuk pelajaran 1. Kursus ini dipakai untuk MEMPERLIHATKAN
  -- kemampuan LMS: dengan penguncian urutan menyala, orang yang baru dibukakan
  -- halamannya melihat gembok di pelajaran 3 dan 4 -- justru dua pelajaran
  -- yang paling layak dilihat. Urutannya tetap terbaca dari judul dan isinya;
  -- tidak ada yang perlu dipaksa.
  insert into public.course_sections (course_id, title, position)
  values (c, 'Modul 1 · Mengenali dan Menghentikan', 0) returning id into s;

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Tiga pintu yang dipakai penipu', 0, 'text', '<h2>Penipu tidak membobol sistem. Mereka membobol orang.</h2>

<p>Perusahaan menghabiskan banyak uang untuk mengunci pintunya: kata sandi yang rumit, antivirus, pembatasan akses. Lalu seseorang menelepon bagian keuangan, mengaku dari kantor pusat, dan diberi apa yang dia minta. Pintunya tidak dibobol. Pintunya dibukakan.</p>

<p>Itu sebabnya pelajaran ini bukan tentang teknologi. Yang akan Anda pelajari adalah tiga cara penipu membuat orang normal, yang tidak bodoh dan tidak ceroboh, mengambil keputusan yang tidak akan pernah mereka ambil dalam keadaan tenang.</p>

<h3>Pintu pertama: desakan</h3>

<p>Hampir setiap penipuan memburu waktu Anda. <strong>Hari ini juga. Dalam lima menit. Sebelum kantor tutup.</strong></p>

<p>Alasannya sederhana. Berpikir butuh waktu. Kalau Anda punya waktu, Anda akan bertanya, dan begitu Anda bertanya, penipuannya selesai. Maka tenggat itu bukan bagian dari ceritanya. Tenggat itu <em>adalah</em> serangannya.</p>

<p>Perhatikan bahwa urusan yang benar-benar penting di kantor Anda hampir tidak pernah muncul mendadak dengan tenggat beberapa menit. Ia melewati rapat, surat, persetujuan. Yang datang tiba-tiba dan menuntut sekarang justru hampir selalu bukan yang penting.</p>

<blockquote><p>Kalau sebuah permintaan tidak tahan menunggu satu jam, pertanyaannya bukan "bagaimana saya cepat-cepat", tapi "kenapa ia tidak tahan menunggu".</p></blockquote>

<h3>Pintu kedua: otoritas</h3>

<p>Pesan yang mengaku dari direktur, dari bank, dari kantor pajak, dari tim IT. Bukan karena orang takut pada jabatan, tetapi karena <strong>bertanya kepada atasan terasa seperti menuduh</strong>. Rasa sungkan itulah yang dijual penipu.</p>

<p>Ada satu tanda yang hampir selalu menyertainya, dan ini yang paling layak Anda hafal: <strong>permintaan untuk tidak memberi tahu siapa pun.</strong> "Ini masih rahasia." "Jangan lewat grup dulu." "Langsung ke saya saja."</p>

<p>Atasan yang benar tidak pernah melarang Anda memastikan. Kalimat itu bukan permintaan kerahasiaan. Kalimat itu adalah pagar, supaya Anda tidak sempat bertanya kepada orang yang bisa membongkarnya.</p>

<h3>Pintu ketiga: kedekatan</h3>

<p>Pesan yang terasa akrab. Memakai nama panggilan Anda. Menyebut nama proyek yang memang sedang berjalan. Datang dari akun rekan yang Anda kenal.</p>

<p>Yang membuat ini bekerja adalah keyakinan bahwa penipu adalah orang asing. Padahal informasi tentang kantor Anda tidak sulit dikumpulkan: dari media sosial, dari rekan yang akunnya sudah diambil alih lebih dulu, dari tanda tangan surel yang tersebar di mana-mana.</p>

<p><strong>Nama pengirim bukan bukti.</strong> Yang bisa dipercaya adalah jalur, bukan nama: nomor yang sudah lama Anda simpan, aplikasi resmi yang Anda buka sendiri, orang yang Anda telepon dan suaranya Anda kenal.</p>

<h3>Ringkasnya</h3>

<table>
  <thead>
    <tr><th>Pintu</th><th>Bunyinya seperti apa</th><th>Penangkalnya</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Desakan</strong></td><td>"Hari ini juga", "lima menit lagi"</td><td>Tunda. Yang benar tahan ditunda.</td></tr>
    <tr><td><strong>Otoritas</strong></td><td>"Saya direktur", "jangan bilang siapa-siapa"</td><td>Pastikan lewat nomor lama, bukan nomor di pesan itu.</td></tr>
    <tr><td><strong>Kedekatan</strong></td><td>Nama Anda, nama proyek, akun rekan</td><td>Percayai jalur, bukan nama.</td></tr>
  </tbody>
</table>

<p>Di pelajaran berikutnya Anda akan melihat ketiganya bekerja sekaligus, pada satu sore yang biasa saja di sebuah kantor kecil.</p>', 480);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Rabu sore di bagian keuangan', 1, 'text', '<h2>Rabu sore di bagian keuangan</h2>

<p>Pukul empat lewat. Rina sedang menutup rekap mingguan di CV Mitra Nusantara, perusahaan distribusi dengan dua puluh dua karyawan. Dua jam lagi pulang. Telepon di mejanya bergetar.</p>

<blockquote><p>Selamat sore Bu Rina. Ini Pak Hendra, pakai nomor baru, yang lama rusak kemarin. Tolong dibantu ya, ada pembayaran vendor yang harus masuk sore ini juga. Rp 46.200.000. Nanti invoice saya kirim besok pagi.</p></blockquote>

<p>Rina membaca ulang. Pak Hendra memang direktur operasional. Memang sering minta hal-hal lewat pesan. Dan memang sedang di luar kota minggu ini, Rina tahu itu dari grup kantor.</p>

<p>Ia mengetik balasan: <em>Baik Pak, saya siapkan.</em> Lalu menghapusnya. Ada yang mengganjal, tapi ia belum bisa menyebut apa.</p>

<h3>Yang membuatnya ragu</h3>

<p>Bukan nominalnya. Perusahaan sering membayar vendor di angka itu.</p>

<p>Bukan juga nomor barunya. Orang memang berganti nomor.</p>

<p>Yang mengganjal adalah kalimat berikutnya, yang masuk sepuluh detik kemudian:</p>

<blockquote><p>Ini jangan lewat Pak Agus dulu ya, beliau lagi di lapangan. Langsung ke saya aja.</p></blockquote>

<p>Pak Agus adalah manajer keuangan. Dalam lima tahun Rina bekerja di situ, <strong>tidak pernah sekali pun ada pembayaran yang melompati Pak Agus.</strong> Bukan karena aturannya galak. Karena memang begitu cara kerjanya.</p>

<h3>Satu menit yang menyelamatkan</h3>

<p>Rina tidak membalas pesan itu. Ia membuka kontaknya, mencari nama Pak Hendra yang sudah tersimpan sejak 2021, lalu menelepon.</p>

<p>Diangkat pada dering ketiga. Suara Pak Hendra, di tengah keramaian bandara.</p>

<p>"Nomor baru apa, Bu? Nomor saya ya yang ini."</p>

<p>Mereka berbicara tidak sampai satu menit. Satu menit itu menahan Rp 46.200.000 di tempatnya.</p>

<h3>Yang terjadi di kantor sebelah</h3>

<p>Minggu yang sama, pola pesan yang hampir sama masuk ke sebuah perusahaan lain di kota itu. Di sana stafnya menyiapkan transfer, lalu baru bertanya ke manajernya setelah uang terkirim. Pertanyaan yang sama, hanya terlambat empat puluh menit.</p>

<p>Perbedaan antara dua kantor itu bukan kecerdasan orangnya. Bukan pula sistem komputernya. Perbedaannya hanya pada <strong>urutan</strong>: satu bertanya sebelum, satu bertanya sesudah.</p>

<h3>Tiga pintu tadi, dalam satu pesan</h3>

<p>Kalau Anda kembali ke pesan Pak Hendra palsu itu, ketiganya ada:</p>

<ul>
  <li><strong>Desakan</strong> — "sore ini juga", dan invoice yang justru menyusul besok. Urutannya dibalik supaya tidak ada waktu memeriksa.</li>
  <li><strong>Otoritas</strong> — direktur operasional, orang yang memang biasa meminta lewat pesan.</li>
  <li><strong>Kedekatan</strong> — ia tahu Rina di bagian keuangan, tahu ada Pak Agus, tahu Pak Hendra sedang di luar kota. Semuanya bisa dibaca dari grup dan media sosial.</li>
</ul>

<p>Yang tidak bisa ditiru penipu itu hanya satu hal: <strong>nomor yang sudah tersimpan di telepon Rina sejak empat tahun lalu.</strong> Di situlah kebenarannya tinggal.</p>

<h3>Yang perlu dibawa pulang</h3>

<p>Rina tidak melakukan sesuatu yang canggih. Ia tidak memeriksa alamat surel, tidak menganalisis apa pun. Ia hanya menelepon nomor lama sebelum menuruti nomor baru.</p>

<p>Itu saja. Dan itu cukup, hampir selalu.</p>

<p>Pelajaran berikutnya akan melatih mata Anda: tiga pesan, dan Anda yang menebak mana yang palsu.</p>', 420);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Latihan: mana yang palsu?', 2, 'interactive', '<style>.materi-interaktif { --utama: #13707f; --garis: #d6e2e5; --redup: #566a70; --benar: #0f5c3f; --salah: #8a2b2b; }
.materi-interaktif .sampul { border-left: 4px solid var(--utama); padding: 0.2rem 0 0.2rem 0.9rem; margin-bottom: 1.4rem; }
.materi-interaktif .sampul p { margin: 0.3rem 0 0; color: var(--redup); }
.materi-interaktif .soal { border: 1px solid var(--garis); border-radius: 0.7rem; padding: 1rem; margin-bottom: 1.1rem; }
.materi-interaktif .soal > h3 { margin: 0 0 0.7rem; font-size: 0.95rem; color: var(--redup); font-weight: 600; }
.materi-interaktif .pesan { background: #f4f7f8; border-radius: 0.6rem; padding: 0.8rem 0.9rem; margin-bottom: 0.9rem; font-size: 0.92rem; line-height: 1.6; }
.materi-interaktif .pesan .dari { display: block; font-weight: 700; margin-bottom: 0.35rem; }
.materi-interaktif .pesan .waktu { display: block; margin-top: 0.4rem; font-size: 0.78rem; color: var(--redup); }
.materi-interaktif .jawab { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.materi-interaktif .soal input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.materi-interaktif .tombol { display: inline-block; border: 1px solid var(--garis); border-radius: 0.5rem; padding: 0.5rem 1.1rem; cursor: pointer; min-height: 24px; font-weight: 600; font-size: 0.9rem; }
.materi-interaktif .soal input:focus-visible + .tombol { outline: 2px solid var(--utama); outline-offset: 2px; }
.materi-interaktif .soal input:checked + .tombol { border-color: var(--utama); background: #eef6f7; }
.materi-interaktif .umpan { display: none; margin-top: 0.85rem; font-size: 0.9rem; line-height: 1.65; border-top: 1px solid var(--garis); padding-top: 0.75rem; }
.materi-interaktif .umpan b { display: block; margin-bottom: 0.2rem; }
.materi-interaktif .benar { color: var(--benar); } .materi-interaktif .salah { color: var(--salah); }
/* `:has()` pada wadahnya, BUKAN selector saudara `~`. Radionya ada di dalam
   .jawab sementara umpan baliknya di luar, jadi keduanya bukan bersaudara dan
   `~` tidak pernah cocok -- CSS-nya sah, hanya tidak mengenai apa pun, dan
   pembersih tidak bisa menangkap yang seperti itu. Terukur: tanggapan tetap
   tersembunyi walau jawabannya sudah diklik. */
.materi-interaktif .soal:has(#a1:checked) .u1salah, .materi-interaktif .soal:has(#b1:checked) .u1benar, .materi-interaktif .soal:has(#a2:checked) .u2benar, .materi-interaktif .soal:has(#b2:checked) .u2salah, .materi-interaktif .soal:has(#a3:checked) .u3salah, .materi-interaktif .soal:has(#b3:checked) .u3benar { display: block; }
.materi-interaktif .tutup { margin-top: 1.6rem; border: 1px solid var(--garis); border-radius: 0.7rem; padding: 1rem; background: #f9fbfb; }
.materi-interaktif .tutup h3 { margin: 0 0 0.5rem; font-size: 1rem; }
.materi-interaktif .tutup ul { margin: 0; padding-left: 1.1rem; }
.materi-interaktif .tutup li { margin-bottom: 0.35rem; }
@media (prefers-reduced-motion: reduce) { .materi-interaktif * { transition: none !important; animation: none !important; } }</style>


<div class="sampul">
  <h2>Mana yang palsu?</h2>
  <p>Tiga pesan di bawah ini. Tebak dulu, baru lihat jawabannya. Tidak apa-apa salah: yang penting Anda tahu tandanya.</p>
</div>

<div class="soal">
  <h3>Pesan 1 · WhatsApp</h3>
  <div class="pesan">
    <span class="dari">+62 812-xxxx-9931</span>
    Selamat siang Ibu. Saya Pak Hendra, Direktur Operasional. Ini nomor baru saya,
    yang lama hilang. Tolong bantu transfer Rp 48.500.000 ke rekening vendor hari ini
    juga, invoice menyusul. Jangan hubungi siapa-siapa dulu ya, ini masih rahasia
    sampai kontraknya tanda tangan.
    <span class="waktu">16.47 · Jumat</span>
  </div>
  <div class="jawab">
    <input type="radio" name="s1" id="a1" /><label class="tombol" for="a1">Asli</label>
    <input type="radio" name="s1" id="b1" /><label class="tombol" for="b1">Palsu</label>
  </div>
  <div class="umpan u1benar benar">
    <b>Benar, ini palsu.</b>
    Empat tanda sekaligus: nomor baru, uang besar, batas waktu hari ini, dan larangan
    bertanya ke orang lain. Yang terakhir itu paling menentukan. Atasan yang benar tidak
    pernah melarang Anda memastikan. Larangan itu ada supaya Anda tidak sempat mengecek.
  </div>
  <div class="umpan u1salah salah">
    <b>Bukan, ini palsu.</b>
    Lihat kalimat terakhirnya: "jangan hubungi siapa-siapa dulu". Itu bukan permintaan
    kerahasiaan, itu penguncian. Atasan yang benar tidak pernah melarang Anda memastikan.
    Tanda lain: nomor baru, nominal besar, dan tenggat hari ini juga.
  </div>
</div>

<div class="soal">
  <h3>Pesan 2 · Surel</h3>
  <div class="pesan">
    <span class="dari">it-support@perusahaan-anda.co.id</span>
    Pemberitahuan: kata sandi akun Anda akan kedaluwarsa dalam 14 hari. Perpanjangan
    bisa dilakukan sendiri lewat menu Pengaturan di portal karyawan. Kami tidak
    menyertakan tautan pada surel ini. Bila ragu, hubungi meja layanan di ekstensi 2200.
    <span class="waktu">09.12 · Senin</span>
  </div>
  <div class="jawab">
    <input type="radio" name="s2" id="a2" /><label class="tombol" for="a2">Asli</label>
    <input type="radio" name="s2" id="b2" /><label class="tombol" for="b2">Palsu</label>
  </div>
  <div class="umpan u2benar benar">
    <b>Benar, ini asli.</b>
    Perhatikan apa yang TIDAK ada: tidak ada tautan, tidak ada ancaman, tidak ada
    tenggat hari ini. Ia menyuruh Anda masuk lewat jalan yang sudah Anda tahu, dan
    memberi nomor yang bisa Anda hubungi. Pesan yang jujur tidak takut Anda cek.
  </div>
  <div class="umpan u2salah salah">
    <b>Sebenarnya ini asli.</b>
    Wajar curiga, dan curiga itu tidak merugikan. Tetapi lihat apa yang tidak ada di
    sini: tidak ada tautan, tidak ada ancaman, tidak ada tenggat hari ini. Ia justru
    menyuruh Anda lewat jalan yang sudah Anda tahu.
  </div>
</div>

<div class="soal">
  <h3>Pesan 3 · SMS</h3>
  <div class="pesan">
    <span class="dari">BANK-INFO</span>
    Transaksi Rp 3.750.000 terdeteksi di akun Anda. Bila bukan Anda, batalkan dalam
    5 menit melalui bit.ly/batal-trx-aman atau dana akan diteruskan.
    <span class="waktu">22.31 · Sabtu</span>
  </div>
  <div class="jawab">
    <input type="radio" name="s3" id="a3" /><label class="tombol" for="a3">Asli</label>
    <input type="radio" name="s3" id="b3" /><label class="tombol" for="b3">Palsu</label>
  </div>
  <div class="umpan u3benar benar">
    <b>Benar, ini palsu.</b>
    Lima menit adalah intinya. Panik membuat orang berhenti berpikir, dan itu memang
    tujuannya. Tambahan: bank tidak pernah memakai tautan pemendek. Kalau ragu, tutup
    pesannya dan telepon nomor di balik kartu Anda sendiri.
  </div>
  <div class="umpan u3salah salah">
    <b>Bukan, ini palsu.</b>
    Lima menit itu intinya. Panik membuat orang berhenti berpikir, dan itu memang
    tujuannya. Bank juga tidak pernah memakai tautan pemendek seperti bit.ly. Tutup
    pesannya, telepon nomor di balik kartu Anda sendiri.
  </div>
</div>

<div class="tutup">
  <h3>Benang merahnya</h3>
  <ul>
    <li><strong>Yang palsu selalu memburu waktu.</strong> Hari ini juga, lima menit, sebelum tutup.</li>
    <li><strong>Yang palsu memutus Anda dari orang lain.</strong> Jangan bilang siapa-siapa.</li>
    <li><strong>Yang asli tidak takut dicek.</strong> Ia memberi nomor, dan menyuruh lewat jalan yang Anda kenal.</li>
  </ul>
</div>', 360);

  insert into public.lessons (section_id, title, position, content_type, content, duration_seconds)
  values (s, 'Alat bantu: pesan mencurigakan masuk', 3, 'interactive', '<style>.materi-interaktif { --utama: #13707f; --garis: #d6e2e5; --redup: #566a70; --aman: #0f5c3f; --awas: #8a2b2b; }
.materi-interaktif .sampul { border-left: 4px solid var(--utama); padding: 0.2rem 0 0.2rem 0.9rem; margin-bottom: 1.4rem; }
.materi-interaktif .sampul p { margin: 0.3rem 0 0; color: var(--redup); }

.materi-interaktif .periksa { border: 1px solid var(--garis); border-radius: 0.7rem; padding: 1rem 1.1rem; margin-bottom: 1.5rem; }
.materi-interaktif .periksa h3 { margin: 0 0 0.3rem; font-size: 1rem; }
.materi-interaktif .periksa > p { margin: 0 0 0.9rem; color: var(--redup); font-size: 0.88rem; }
.materi-interaktif .periksa label { display: flex; gap: 0.6rem; align-items: flex-start; border: 1px solid var(--garis); border-radius: 0.55rem; padding: 0.65rem 0.8rem; margin-bottom: 0.5rem; cursor: pointer; min-height: 24px; font-size: 0.92rem; line-height: 1.55; }
.materi-interaktif .periksa input { margin-top: 0.2rem; width: 1.05rem; height: 1.05rem; flex-shrink: 0; accent-color: var(--utama); }
.materi-interaktif .periksa label:focus-within { outline: 2px solid var(--utama); outline-offset: 2px; }

.materi-interaktif .hasil { margin-top: 0.9rem; border-radius: 0.55rem; padding: 0.8rem 0.9rem; font-size: 0.9rem; line-height: 1.6; }
.materi-interaktif .belum { background: #f4f7f8; color: var(--redup); }
.materi-interaktif .lolos { display: none; background: #eef6f7; border: 1px solid var(--utama); color: var(--aman); font-weight: 600; }
.materi-interaktif .periksa:has(#c1:checked):has(#c2:checked):has(#c3:checked) .lolos { display: block; }
.materi-interaktif .periksa:has(#c1:checked):has(#c2:checked):has(#c3:checked) .belum { display: none; }

.materi-interaktif details { border: 1px solid var(--garis); border-radius: 0.6rem; padding: 0.7rem 0.9rem; margin-bottom: 0.55rem; }
.materi-interaktif summary { cursor: pointer; font-weight: 600; min-height: 24px; display: flex; align-items: center; font-size: 0.93rem; }
.materi-interaktif details[open] summary { margin-bottom: 0.6rem; border-bottom: 1px solid var(--garis); padding-bottom: 0.5rem; }
.materi-interaktif details p { margin: 0 0 0.5rem; font-size: 0.9rem; line-height: 1.65; }
.materi-interaktif details ol { margin: 0; padding-left: 1.15rem; font-size: 0.9rem; line-height: 1.7; }
.materi-interaktif details li { margin-bottom: 0.3rem; }

.materi-interaktif .darurat { border: 1px solid #e8c4c4; background: #fdf6f6; border-radius: 0.7rem; padding: 1rem 1.1rem; margin-top: 1.5rem; }
.materi-interaktif .darurat h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--awas); }
.materi-interaktif .darurat p { margin: 0 0 0.6rem; font-size: 0.9rem; line-height: 1.65; }
.materi-interaktif .darurat ol { margin: 0; padding-left: 1.15rem; font-size: 0.9rem; line-height: 1.7; }

.materi-interaktif .kunci { margin-top: 1.5rem; border-left: 4px solid var(--utama); padding: 0.4rem 0 0.4rem 0.9rem; font-size: 1rem; line-height: 1.6; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .materi-interaktif * { transition: none !important; animation: none !important; } }</style>


<div class="sampul">
  <h2>Pesan mencurigakan masuk. Sekarang apa?</h2>
  <p>Halaman ini alat kerja, bukan bacaan. Buka lagi kapan pun Anda ragu.</p>
</div>

<div class="periksa">
  <h3>Tiga pertanyaan sebelum menuruti pesan apa pun</h3>
  <p>Centang hanya yang benar-benar sudah Anda pastikan, bukan yang Anda kira.</p>

  <label>
    <input type="checkbox" id="c1" />
    <span>Saya mengenali pengirimnya lewat jalur yang sudah saya kenal sebelumnya, bukan dari pesan ini sendiri.</span>
  </label>
  <label>
    <input type="checkbox" id="c2" />
    <span>Permintaannya tidak menuntut saya bertindak hari ini juga.</span>
  </label>
  <label>
    <input type="checkbox" id="c3" />
    <span>Saya boleh memastikan ke orang lain, dan pesannya tidak melarang itu.</span>
  </label>

  <div class="hasil belum">Belum semua tercentang. Selama masih ada yang kosong, jangan transfer, jangan klik, jangan kirim data. Berhenti dulu di sini.</div>
  <div class="hasil lolos">Ketiganya terpenuhi. Silakan lanjut seperti biasa.</div>
</div>

<h3>Kalau ada yang tidak bisa dicentang</h3>

<details>
  <summary>Pesannya mengaku dari atasan atau pemilik</summary>
  <ol>
    <li>Jangan balas lewat nomor itu.</li>
    <li>Telepon atasan Anda di nomor yang sudah tersimpan sejak lama. Bukan nomor di pesan tadi.</li>
    <li>Kalau tidak terangkat, tanya ke rekan satu tim. Satu menit bertanya lebih murah daripada satu transfer.</li>
  </ol>
  <p>Kalau ia marah karena Anda memastikan, itu persoalan dia. Perusahaan tidak pernah rugi karena karyawan terlalu hati-hati.</p>
</details>

<details>
  <summary>Pesannya mengaku dari bank</summary>
  <ol>
    <li>Tutup pesannya. Jangan tekan tautan apa pun di dalamnya.</li>
    <li>Telepon nomor yang tercetak di balik kartu Anda, atau buka aplikasi banknya langsung.</li>
    <li>Tanyakan apakah benar ada transaksi itu.</li>
  </ol>
  <p>Bank tidak pernah meminta kode OTP, PIN, atau kata sandi. Tidak lewat telepon, tidak lewat pesan, tidak lewat siapa pun.</p>
</details>

<details>
  <summary>Ada tautan atau lampiran yang tidak saya minta</summary>
  <ol>
    <li>Jangan dibuka, meski pengirimnya terlihat Anda kenal.</li>
    <li>Tanyakan ke pengirimnya lewat jalur lain apakah benar dia yang mengirim.</li>
    <li>Kalau berkasnya memang perlu, minta dikirim ulang lewat jalur resmi kantor.</li>
  </ol>
  <p>Akun yang sudah diambil alih akan mengirim pesan dari nama yang benar. Nama pengirim bukan bukti.</p>
</details>

<details>
  <summary>Saya diminta kode yang masuk ke HP saya</summary>
  <ol>
    <li>Jangan berikan. Tidak kepada siapa pun, dengan alasan apa pun.</li>
    <li>Tidak ada petugas resmi yang perlu kode itu. Kode itu memang hanya untuk Anda.</li>
  </ol>
  <p>Ini satu-satunya aturan di halaman ini yang tidak punya pengecualian.</p>
</details>

<div class="darurat">
  <h3>Kalau terlanjur</h3>
  <p>Sudah telanjur klik, telanjur kirim data, atau telanjur transfer. Yang menentukan sekarang bukan rasa malu, tetapi kecepatan.</p>
  <ol>
    <li>Laporkan ke atasan dan tim IT <strong>dalam jam itu juga</strong>. Jangan tunggu besok.</li>
    <li>Kalau menyangkut rekening, telepon bank dan minta transaksinya ditahan.</li>
    <li>Ganti kata sandi akun yang dipakai, dari perangkat lain.</li>
    <li>Simpan tangkapan layar pesannya. Itu bukti, dan berguna untuk melindungi rekan Anda.</li>
  </ol>
  <p>Orang yang melapor cepat menyelamatkan perusahaan. Orang yang diam karena malu membuat kerugiannya berlipat.</p>
</div>

<div class="kunci">
  Satu kalimat yang perlu diingat: pesan yang benar tidak pernah takut Anda cek dulu.
</div>', 300);

  insert into public.lessons (section_id, title, position, content_type, duration_seconds)
  values (s, 'Uji pemahaman', 4, 'quiz', 300) returning id into l;

  insert into public.quizzes (lesson_id, title, pass_score, max_attempts, shuffle, is_assessment)
  values (l, 'Uji pemahaman', 70, 3, false, false) returning id into qz;

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Pesan masuk mengaku dari direktur Anda, meminta transfer sore ini juga, dan ditutup dengan kalimat "jangan bilang siapa-siapa dulu". Bagian mana yang paling kuat menandakan ini penipuan?</p>', 1, 0, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Nominalnya besar', false, 0),
    (qq, 'Larangan memberi tahu orang lain', true, 1),
    (qq, 'Pesannya lewat WhatsApp, bukan surel resmi', false, 2),
    (qq, 'Dikirim menjelang jam pulang', false, 3);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Nominal besar, WhatsApp, dan sore hari adalah hal biasa di banyak kantor, jadi ketiganya bukan penanda. Yang tidak punya alasan sah adalah larangan memastikan. Atasan yang benar tidak pernah rugi kalau Anda mengecek, jadi larangan itu ada justru supaya Anda tidak sempat.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Masuk SMS dari "bank" soal transaksi mencurigakan, dengan tautan untuk membatalkan dalam 5 menit. Langkah pertama yang benar?</p>', 1, 1, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Tekan tautannya supaya transaksinya keburu dibatalkan', false, 0),
    (qq, 'Balas SMS itu untuk minta penjelasan', false, 1),
    (qq, 'Tutup pesannya, lalu telepon nomor di balik kartu Anda sendiri', true, 2),
    (qq, 'Teruskan ke grup kantor supaya ada yang mengecek', false, 3);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Tenggat lima menit itu alat, bukan fakta. Ia ada supaya Anda berhenti berpikir. Menelepon nomor yang Anda pilih sendiri memutus kendali penipu atas percakapan. Meneruskan ke grup hanya menyebarkan tautannya ke lebih banyak orang.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Akun rekan kerja yang Anda kenal mengirim lampiran yang tidak pernah Anda minta. Apa yang paling tepat?</p>', 1, 2, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Buka saja, karena pengirimnya memang dikenal', false, 0),
    (qq, 'Hubungi rekan itu lewat jalur lain untuk memastikan', true, 1),
    (qq, 'Balas di percakapan yang sama, tanyakan isinya', false, 2),
    (qq, 'Hapus diam-diam tanpa memberi tahu siapa pun', false, 3);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Nama pengirim bukan bukti: akun yang sudah diambil alih tetap mengirim dari nama yang benar. Membalas di percakapan yang sama berarti bertanya kepada penipunya. Menghapus diam-diam membiarkan rekan Anda tetap dalam bahaya.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Mana yang paling menunjukkan sebuah pesan kemungkinan besar ASLI?</p>', 1, 3, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Memakai logo dan warna resmi perusahaan', false, 0),
    (qq, 'Menyebut nama lengkap dan jabatan Anda dengan benar', false, 1),
    (qq, 'Menyuruh Anda masuk lewat jalan yang sudah Anda kenal, tanpa menyertakan tautan', true, 2),
    (qq, 'Dikirim dari alamat surel yang mirip alamat kantor', false, 3);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Logo, nama, jabatan, dan alamat yang mirip semuanya mudah ditiru dan justru sering dipakai untuk meyakinkan. Yang sulit ditiru adalah pesan yang tidak berkepentingan mengarahkan Anda ke mana pun: ia menyuruh lewat jalur yang sudah Anda punya.');

  insert into public.questions (quiz_id, type, prompt, points, position, allow_multiple)
  values (qz, 'multiple_choice', '<p>Anda terlanjur menekan tautan dan memasukkan kata sandi kantor. Apa yang paling mendesak dilakukan?</p>', 1, 4, false) returning id into qq;
  insert into public.question_options (question_id, text, is_correct, position) values
    (qq, 'Menunggu sampai benar-benar terlihat ada kerugian, baru melapor', false, 0),
    (qq, 'Melapor ke atasan dan tim IT pada jam itu juga', true, 1),
    (qq, 'Memberi tahu rekan satu tim saja dulu', false, 2),
    (qq, 'Menghapus riwayatnya supaya tidak kena marah', false, 3);
  insert into public.question_explanations (question_id, explanation) values (qq, 'Yang menentukan sekarang bukan rasa malu, tetapi kecepatan. Kerugian membesar di jam-jam orang diam, bukan di detik mereka mengklik. Melapor cepat memberi tim IT kesempatan mengunci akun sebelum dipakai.');

  raise notice 'kursus acuan dipasang';
end $$;
