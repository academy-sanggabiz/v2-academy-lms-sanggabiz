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
  values (s, 'Simulasi: sore itu, di meja Anda', 2, 'interactive', '<style>.materi-interaktif { --utama:#13707f; --garis:#d6e2e5; --redup:#566a70; --gelap:#14252a; --bahaya:#8a2b2b; --aman:#0f5c3f; }

.materi-interaktif .tugas { background: var(--gelap); color: #fff; border-radius: 0.7rem; padding: 0.9rem 1.1rem; margin-bottom: 1rem; }
.materi-interaktif .tugas b { display: block; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.75; margin-bottom: 0.3rem; }
.materi-interaktif .tugas p { margin: 0; font-size: 0.97rem; line-height: 1.55; }

.materi-interaktif .panggung { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(17rem,100%),1fr)); gap: 1rem; align-items: start; }

/* ---------- telepon ---------- */
.materi-interaktif .telepon { border: 10px solid #1b1b1f; border-radius: 1.6rem; overflow: hidden; background: #fff; max-width: 21rem; margin: 0 auto; }
.materi-interaktif .bar { background: #075e54; color: #fff; padding: 0.45rem 0.8rem; font-size: 0.72rem; display: flex; justify-content: space-between; }
.materi-interaktif .kontak { background: #075e54; color: #fff; padding: 0 0.8rem 0.6rem; }
.materi-interaktif .kontak b { display: block; font-size: 0.9rem; }
.materi-interaktif .kontak span { font-size: 0.72rem; opacity: 0.85; }
.materi-interaktif .layar { background: #ece5dd; padding: 0.8rem; min-height: 17rem; position: relative; }

.materi-interaktif .gelembung { background: #fff; border-radius: 0.6rem; padding: 0.6rem 0.7rem; margin-bottom: 0.5rem; font-size: 0.85rem; line-height: 1.55; box-shadow: 0 1px 1px rgba(0,0,0,0.08); }
.materi-interaktif .gelembung .jam { display: block; text-align: right; font-size: 0.65rem; color: var(--redup); margin-top: 0.25rem; }
.materi-interaktif .kunci { background: #fff8d6; }
.materi-interaktif .saya { background: #dcf8c6; }

/* Layar diganti sesuai tindakan. Semua ada di DOM, yang tampil diatur :has(). */
.materi-interaktif .layar > .adegan { display: none; }
.materi-interaktif .sim:has(#t0:checked) .adegan-awal,
.materi-interaktif .sim:has(#t1:checked) .adegan-transfer,
.materi-interaktif .sim:has(#t2:checked) .adegan-balas,
.materi-interaktif .sim:has(#t3:checked) .adegan-telepon,
.materi-interaktif .sim:has(#t4:checked) .adegan-grup { display: block; }

/* ---------- tindakan ---------- */
.materi-interaktif .tindakan { background: #f4f7f8; padding: 0.7rem; border-top: 1px solid var(--garis); }
.materi-interaktif .tindakan > p { margin: 0 0 0.5rem; font-size: 0.72rem; color: var(--redup); text-transform: uppercase; letter-spacing: 0.05em; }
.materi-interaktif .tindakan input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.materi-interaktif .tindakan label { display: block; background: #fff; border: 1px solid var(--garis); border-radius: 0.5rem; padding: 0.55rem 0.7rem; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.85rem; min-height: 24px; }
.materi-interaktif .tindakan input:focus-visible + label { outline: 2px solid var(--utama); outline-offset: 2px; }
.materi-interaktif .tindakan input:checked + label { border-color: var(--utama); background: #eef6f7; font-weight: 600; }
.materi-interaktif .ulang { display: none; }
.materi-interaktif .sim:not(:has(#t0:checked)) .ulang { display: block; background: var(--gelap); color: #fff; border-color: var(--gelap); text-align: center; font-weight: 600; margin-top: 0.6rem; }

/* ---------- akibat ---------- */
.materi-interaktif .akibat { border-radius: 0.6rem; padding: 0.7rem 0.8rem; margin-top: 0.6rem; font-size: 0.84rem; line-height: 1.6; }
.materi-interaktif .rugi { background: #fdf0f0; border: 1px solid #e8c4c4; color: var(--bahaya); }
.materi-interaktif .selamat { background: #eef6f7; border: 1px solid var(--utama); color: var(--aman); }
.materi-interaktif .netral { background: #fff8e8; border: 1px solid #e6d5a8; color: #6b4e13; }
.materi-interaktif .akibat b { display: block; margin-bottom: 0.2rem; }
.materi-interaktif .sim-akibat .akibat { display: none; }
.materi-interaktif .sim:has(#t1:checked) .akibat-t1,
.materi-interaktif .sim:has(#t2:checked) .akibat-t2,
.materi-interaktif .sim:has(#t3:checked) .akibat-t3,
.materi-interaktif .sim:has(#t4:checked) .akibat-t4 { display: block; }

.materi-interaktif .struk { background: #fff; border: 1px dashed var(--garis); border-radius: 0.5rem; padding: 0.7rem; font-size: 0.8rem; margin-bottom: 0.5rem; }
.materi-interaktif .struk .jml { font-size: 1.15rem; font-weight: 700; display: block; margin: 0.2rem 0; }

/* ---------- keadaan ---------- */
.materi-interaktif .keadaan { border: 1px solid var(--garis); border-radius: 0.7rem; padding: 0.9rem 1rem; }
.materi-interaktif .keadaan h3 { margin: 0 0 0.2rem; font-size: 0.97rem; }
.materi-interaktif .keadaan > p { margin: 0 0 0.7rem; font-size: 0.83rem; color: var(--redup); }
.materi-interaktif .keadaan label { display: flex; gap: 0.55rem; align-items: flex-start; border: 1px solid var(--garis); border-radius: 0.5rem; padding: 0.55rem 0.7rem; margin-bottom: 0.45rem; cursor: pointer; font-size: 0.87rem; line-height: 1.5; min-height: 24px; }
.materi-interaktif .keadaan input { margin-top: 0.15rem; width: 1rem; height: 1rem; flex-shrink: 0; accent-color: var(--utama); }
.materi-interaktif .keadaan label:focus-within { outline: 2px solid var(--utama); outline-offset: 2px; }
.materi-interaktif .catatan { font-size: 0.8rem; color: var(--redup); line-height: 1.6; margin: 0.7rem 0 0; }

/* Buru-buru: pesan pendesak menyusul, dan tanda kuncinya tenggelam. */
.materi-interaktif .desakan { display: none; }
.materi-interaktif .sim:has(#k1:checked) .desakan { display: block; }
.materi-interaktif .sim:has(#k1:checked) .kunci { background: #fff; }

/* Silau: kontras turun, persis seperti layar kena matahari. */
.materi-interaktif .sim:has(#k2:checked) .layar { filter: contrast(0.42) brightness(1.22); }

/* Layar kecil: teks panjang terpotong, seperti ponsel sempit. */
.materi-interaktif .sim:has(#k3:checked) .telepon { max-width: 14.5rem; }
.materi-interaktif .sim:has(#k3:checked) .gelembung { font-size: 0.78rem; max-height: 4.6rem; overflow: hidden; }
.materi-interaktif .sim:has(#k3:checked) .potong { display: block; font-size: 0.7rem; color: var(--redup); font-style: italic; }
.materi-interaktif .potong { display: none; }

@media (prefers-reduced-motion: reduce) { .materi-interaktif * { transition: none !important; animation: none !important; } }</style>


<h2>Simulasi: sore itu, di meja Anda</h2>

<div class="tugas">
  <b>Tugas Anda</b>
  <p>Anda Rina, staf keuangan. Pesan ini baru masuk. Lakukan apa yang akan Anda lakukan sungguhan, lalu lihat akibatnya.</p>
</div>

<div class="sim">
<div class="panggung">

  <div class="telepon">
    <div class="bar"><span>16.47</span><span>WiFi</span></div>
    <div class="kontak"><b>Pak Hendra</b><span>+62 812-xxxx-9931 · nomor baru</span></div>

    <div class="layar">

      <div class="adegan adegan-awal">
        <div class="gelembung">
          Selamat sore Bu Rina. Ini Pak Hendra, pakai nomor baru, yang lama rusak kemarin.
          <span class="jam">16.47</span>
        </div>
        <div class="gelembung">
          Tolong dibantu ya, ada pembayaran vendor yang harus masuk sore ini juga.
          Rp 46.200.000. Invoice saya kirim besok pagi.
          <span class="jam">16.47</span>
        </div>
        <div class="gelembung kunci">
          Ini jangan lewat Pak Agus dulu ya, beliau lagi di lapangan. Langsung ke saya aja.
          <span class="jam">16.48</span>
          <span class="potong">(terpotong di layar sempit)</span>
        </div>
        <div class="gelembung desakan">
          Bu, ini bank mau tutup. Saya lagi rapat, tolong sekarang ya.
          <span class="jam">16.51</span>
        </div>
      </div>

      <div class="adegan adegan-transfer">
        <div class="struk">
          Transfer berhasil
          <span class="jml">Rp 46.200.000</span>
          ke PT Sumber Rejeki Abadi · 16.58
        </div>
        <div class="gelembung">Terima kasih Bu Rina. <span class="jam">16.59</span></div>
        <div class="gelembung">
          <b>Jumat, 09.12 — Pak Hendra (nomor lama)</b><br />
          Bu Rina, transfer apa ya kemarin? Saya tidak pernah minta.
          <span class="jam">09.12</span>
        </div>
      </div>

      <div class="adegan adegan-balas">
        <div class="gelembung saya">Baik Pak, boleh invoicenya dulu? <span class="jam">16.49</span></div>
        <div class="gelembung">Ini Bu, invoice_nordwind_046.pdf <span class="jam">16.50</span></div>
        <div class="gelembung">Sudah ya Bu, tinggal 8 menit lagi sebelum bank tutup. <span class="jam">16.52</span></div>
      </div>

      <div class="adegan adegan-telepon">
        <div class="struk">
          Menelepon Pak Hendra
          <span class="jml">nomor tersimpan sejak 2021</span>
          tersambung 47 detik
        </div>
        <div class="gelembung">"Nomor baru apa, Bu? Nomor saya ya yang ini."<span class="jam">16.50</span></div>
      </div>

      <div class="adegan adegan-grup">
        <div class="gelembung"><b>Grup Keuangan</b><br />Rina: Pak Agus, ada permintaan transfer 46,2 jt dari nomor baru Pak Hendra. Benar? <span class="jam">16.49</span></div>
        <div class="gelembung">Pak Agus: Saya tidak tahu apa-apa. Jangan diproses. <span class="jam">16.50</span></div>
        <div class="gelembung">Pak Agus: Saya umumkan ke semua staf sekarang. <span class="jam">16.51</span></div>
      </div>

    </div>

    <div class="tindakan">
      <p>Apa yang Anda lakukan?</p>
      <input type="radio" name="t" id="t0" checked /><label for="t0" class="ulang">Ulangi dari awal</label>
      <input type="radio" name="t" id="t1" /><label for="t1">Siapkan transfernya sekarang</label>
      <input type="radio" name="t" id="t2" /><label for="t2">Balas, minta invoice dulu</label>
      <input type="radio" name="t" id="t3" /><label for="t3">Telepon nomor lama Pak Hendra</label>
      <input type="radio" name="t" id="t4" />
      <label for="t4">Tanya Pak Agus di grup keuangan</label>
    </div>
  </div>

  <div>
    <div class="keadaan">
      <h3>Ubah keadaannya</h3>
      <p>Nyalakan satu, lalu coba lagi. Inilah yang membedakan orang yang tertipu dan yang tidak.</p>
      <label><input type="checkbox" id="k1" /><span>Anda sedang diburu waktu</span></label>
      <label><input type="checkbox" id="k2" /><span>Layar kena matahari</span></label>
      <label><input type="checkbox" id="k3" /><span>Ponsel kecil</span></label>
      <p class="catatan">Tandanya tidak hilang. Ia cuma jadi lebih sulit dilihat, persis seperti di hari kerja yang sibuk.</p>
    </div>

    <div class="sim-akibat">
      <div class="akibat rugi akibat-t1"><b>Uangnya hilang.</b> Rp 46.200.000 keluar dalam sebelas menit. Yang Anda lewatkan bukan tanda yang rumit, hanya satu kalimat: pembayaran yang melompati Pak Agus. Perusahaan menanggung, dan Anda menanggung ceritanya.</div>
      <div class="akibat netral akibat-t2"><b>Anda masih di tangan dia.</b> Invoice palsu dibuat dalam satu menit. Bertanya kepada penipu selalu dijawab penipu, dan jawabannya selalu meyakinkan. Tekanan justru naik.</div>
      <div class="akibat selamat akibat-t3"><b>Berhenti di sini.</b> Nomor lama itu satu-satunya yang tidak bisa ditiru. Empat puluh tujuh detik menahan Rp 46.200.000.</div>
      <div class="akibat selamat akibat-t4"><b>Berhenti, dan tidak cuma untuk Anda.</b> Pak Agus memperingatkan semua staf sore itu juga. Satu pertanyaan melindungi dua puluh dua orang.</div>
    </div>
  </div>

</div>
</div>

<p class="catatan">Semua nama dan perusahaan di simulasi ini dibuat untuk pelajaran ini.</p>', 420);

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
