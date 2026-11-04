# Daftar Permintaan

Peta seluruh permintaan yang belum selesai, beserta urutan pengerjaan dan
alasannya. Diperbarui 1 November 2026.

---

## Belum dikerjakan

### A. Sertifikat kustom, tata letak, dan pratinjau — ✅ selesai dan terbukti

Lihat `docs/STANDAR-SERTIFIKAT.md`. Pengaturan utama perusahaan ada di
`/admin/certificates` (khusus superadmin); kursus mewarisinya **per ruas**,
sehingga satu kursus bisa memakai nama penanda tangan sendiri sambil tetap
mewarisi jabatan, templat, dan deskripsi.

Migrasinya sudah dijalankan (2 November 2026, lewat `supabase db query
--linked`). Terbukti di layar: opsi "Ikut Pengaturan Utama" dan pemilih tata
letak muncul, bingkai pratinjau ter-render. Baris sertifikat kursus yang sudah
ada tetap `layout = null` (ikut pengaturan utama), jadi tidak ada kursus yang
berubah perilakunya.

Ditambahkan kemudian: tiga **tata letak** yang bisa dipilih di dalam LMS
(klasik, modern, formal) dan **pratinjau** yang merender PDF sungguhan dengan
dokumen yang sama persis dengan hasil terbitnya — ada di layar pengaturan
utama maupun di tab Sertifikat tiap kursus.

Belum terbukti dengan mata: tampilan PDF di dalam bingkai halaman, karena
tidak ada penampil PDF di browser yang tersedia di mesin ini. Yang terbukti:
rutenya mengembalikan PDF sah (`%PDF-`) untuk ketiga tata letak, dan
ketiganya menghasilkan berkas berbeda. Juga belum terbukti: layar
`/admin/certificates` sendiri, karena
kata sandi superadmin sudah diganti dan `AUDIT_ADMIN_PASSWORD` di
`.env.local` sudah tidak berlaku. Gerbang a11y kini mengatakannya terus
terang ("dialihkan ke /admin/dashboard, akunnya tidak berwenang") alih-alih
mencetak "ok" untuk halaman yang tidak pernah terbuka — kelemahan yang
ternyata juga membuat `/admin/landing` dan `/admin/mentor` selama ini
terhitung lolos tanpa pernah diaudit.

### B. Pelacakan perilaku — ✅ selesai

Dua bagian, keduanya ada sekarang.

**Titik berhenti** (tanpa persetujuan tambahan, dasar huruf b): sudah selesai
lebih dulu — lihat bagian 3.

**Lama membuka dan sedang membuka apa** (dasar huruf a): mekanisme
persetujuannya dibangun lebih dulu, baru pengumpulannya. Peserta memutuskan di
Pengaturan dengan pemberitahuan lengkap; bawaannya mati; menolak tidak
mengurangi fitur apa pun; penarikan menghapus data yang sudah terkumpul.

Penegakannya di basis data, bukan di kode aplikasi: policy `learning_events`
mensyaratkan `has_tracking_consent()` pada setiap insert. Terbukti ujung ke
ujung — membuka pelajaran tanpa persetujuan menghasilkan nol baris, setelah
menyetujui satu baris berisi 9 detik, setelah menarik nol lagi dengan data
sebelumnya terhapus. Catatan persetujuannya terbukti tidak bisa disunting
maupun dihapus.

Superadmin melihat lama belajar per kursus di layar Pelacakan, dengan jumlah
peserta yang menyetujui ditampilkan di atas angkanya — angka itu menggambarkan
kelompok yang menyetujui saja, bukan seluruh peserta.

Syarat lengkap dan cara masing-masing ditegakkan ada di
`docs/STANDAR-PELACAKAN.md` §4.

### C. Riwayat migrasi Supabase — ✅ selesai

Dulu: riwayat di sisi remote hanya mencatat satu migrasi padahal 37 berkas
lain sudah benar-benar diterapkan, karena SQL-nya dijalankan langsung dan
bukan lewat `db push`. Akibatnya `db push` berikutnya akan mencoba menerapkan
ulang semuanya.

Sebelum dicatat, setiap migrasi diperiksa dulu: tiap berkas dibaca untuk
mencari objek yang ia buat (tabel, fungsi, view, kolom), lalu keberadaan
objek itu dicek ke `information_schema` dan `pg_proc`. Dari 45 objek, 43 ada.
Dua yang tidak ada — fungsi `admin_grading_quizzes` dan kolom
`quizzes.weight` — ternyata memang **dihapus** oleh migrasi berikutnya, jadi
ketidakhadirannya benar. Barulah ke-37 versi dicatat.

Satu entri remote tanpa berkas lokal (`20260101000000`, penanda skema dasar
dari `databaseSetup.sql`) ditutup dengan berkas penanda tanpa DDL — riwayatnya
sejajar tanpa menggandakan satu perintah pun. `supabase db push --dry-run`
kini menjawab "Remote database is up to date".

**Cara menerapkan SQL di proyek ini:** `supabase db query --linked -f <berkas>`
menjalankan SQL lewat Management API tanpa menyentuh riwayat migrasi — berguna
untuk perbaikan sekali jalan. Untuk migrasi biasa, `supabase db push` kini
sudah bisa dipakai seperti biasa.

### D. Teks penjelasan bocor ke dalam teks soal (impor .md)

Ditemukan saat menguji layar titik kesulitan. Pada kursus **Menangani Keluhan
Pelanggan di Toko** (draf), **2 dari 3 soal** punya potongan kalimat penjelasan
yang ikut tersimpan di dalam `questions.prompt` sebagai `<blockquote>`:

> `<p>Pelanggan mengirim pesan: "Barangnya rusak waktu sampai!" ...</p>`
> `<blockquote><p>membuat percakapan bergerak ke penyelesaian. Membantah di pesan pertama</p></blockquote>`

Kalimatnya terpotong di tengah, jadi ini bukan sekadar salah tempat —
penjelasannya juga tidak utuh. Keluarga bug yang sama dengan `<p>` yang dulu
muncul di deskripsi kursus: pengurai impor salah menempatkan isi.

Belum diperbaiki karena **isi yang benar tidak bisa disimpulkan** dari
potongan yang tersisa; penyusunnya yang tahu kalimat utuhnya. Cakupannya
terbatas pada satu kursus draf.

Layar titik kesulitan menampilkan paragraf pertama saja, jadi cacat ini tidak
terlihat di sana — tetapi itu menutupi, bukan memperbaiki.

### 0. Impor kursus dari berkas .md — ✅ selesai

Lihat `docs/STANDAR-IMPOR-KURSUS.md`. LMS tidak memanggil AI; ia menyediakan
panduan yang diunduh dan parser yang menerima hasilnya. Terbuka untuk
dikembangkan kalau diperlukan: impor per modul ke kursus yang sudah ada, dan
tampilan perbandingan supaya kursus yang sudah punya peserta pun bisa
diperbarui sebagian.

### 1. Dwibahasa Indonesia–Inggris — ✅ seluruh antarmuka selesai (17/17 layar terukur)

**Ada alat ukurnya sekarang:** `node scripts/i18n-check.mjs` membuka LMS dalam
bahasa Inggris dan menghitung berapa baris antarmuka yang masih berbahasa
Indonesia, per layar. Judul kursus, judul pelajaran, dan isi notifikasi
dikecualikan — itu **isi**, bukan antarmuka, dan kursus berbahasa Indonesia
memang berjudul Indonesia walau layarnya dibuka dalam bahasa Inggris. Tanpa
pengecualian itu angkanya tidak akan pernah nol, dan alat ukur yang tidak bisa
mencapai nol berhenti dipakai orang.

Angkanya: **81 → 0 baris** pada 12 layar utama. `12/12 layar penuh bahasa Inggris`.

Dua temuan yang layak dicatat:

- Beberapa kalimat **sudah punya terjemahannya di kamus** tetapi komponennya
  menulis ulang teks Indonesianya. `settings.emailNotificationsHint` adalah
  contohnya: ada lengkap dalam dua bahasa, tidak pernah dipanggil.
- Nama cookie bahasanya `bahasa`, bukan `locale`. Alat ukur versi pertama
  memakai nama yang salah dan melaporkan seluruh layar "belum diterjemahkan" —
  yang salah alat ukurnya.

**Pembaruan (4 Nov 2026) — halaman depan.** Yang dilaporkan pemilik: "dwibahasa di
halaman depan tidak bekerja". Benar, dan sebabnya bukan terjemahan yang
tertinggal: isi halaman depan **dikarang superadmin** dan tersimpan sebagai satu
susunan blok, jadi ia tidak mungkin ikut berganti lewat kamus. Yang ditambahkan:
kolom `blocks_en` (nullable — kosong berarti pengunjung Inggris melihat versi
Indonesia, bukan halaman kosong), tab bahasa di `/admin/landing`, dan tombol
"mulai dari salinan versi Indonesia" supaya menerjemahkan tidak berarti menyusun
ulang dari nol.

Dua cacat lama ikut ketahuan saat mengerjakannya:

- **Formulir halaman depan yang tidak mengubah apa pun.** Formulir panjang di
  bawah `/admin/landing` menulis ke kolom `heading`, `features`, dan
  `featured_course_ids` — kolom yang hanya dipakai sebagai nilai bawaan ketika
  `blocks` masih kosong. Karena `blocks` sudah terisi sejak 1 Nov, setiap
  suntingan di sana tidak pernah tampil di halaman depan. Inilah yang paling
  mungkin membuat pemiliknya menyimpulkan "dwibahasanya tidak bekerja".
  Formulirnya dihapus; satu-satunya kendali hidup di dalamnya (pemilih kursus
  unggulan) dipindahkan ke blok "Kursus Pilihan", tempat `courseIds` memang
  dirender. Sebelum ini `courseIds` sama sekali tidak punya antarmuka.
- **Blok Keunggulan tidak bisa disunting dari penyusun blok** — hanya
  menampilkan catatan "isinya disunting di bagian Keunggulan", yang menunjuk
  formulir mati di atas. Kini bisa disunting penuh, per bahasa.

Pemeriksa i18n sekarang juga membuka halaman depan publik dan tiga layar
superadmin: **21/21 layar, 0 baris tersisa**. Gerbang a11y ikut naik dari 83
menjadi 92 halaman karena akun audit kini benar-benar superadmin — dan langsung
menemukan satu pelanggaran reflow 320px di `/admin/landing` yang selama ini tidak
pernah terukur karena halamannya selalu dilewati.

**Pembaruan (3 Nov 2026):** sisanya sudah selesai. Editor kursus lengkap (tab
Pelajaran, editor kuis, pengaturan + sertifikat, dialog impor .md dan bank
soal, editor teks kaya beserta pengumuman seret-lepas untuk pembaca layar),
matriks penilaian beserta ekspor/impor CSV, wawasan/pelacakan rinci, detail
kursus peserta, dan ketiga layar superadmin (mentor, halaman depan,
sertifikat bawaan) semuanya pindah ke kamus. Alat ukurnya kini membuka 17
layar (termasuk rute dinamis yang id-nya dicari dari basis data saat
berjalan) dan menguncinya sebagai selesai: 0 baris tersisa.

Dua batas yang jujur dicatat:

- **Pesan validasi rakitan masih Indonesia** — `describeDraftIssue`,
  `validateQuizzes`, dan pesan zod di `lib/course-draft*.ts` merakit kalimat
  dari potongan. Ia hanya muncul pada simpanan yang gagal, dan menerjemahkannya
  berarti mengoper kamus ke pustaka validasi; ditunda sampai ada penutur
  Inggris yang benar-benar menyusun kursus.
- **Layar superadmin belum terbukti di browser** — kata sandi akun superadmin
  audit sudah diganti pemiliknya, jadi render EN-nya baru terbukti lewat
  tsc/build, bukan kunjungan. Pemeriksa akan menjangkaunya begitu kredensial
  audit superadmin tersedia lagi.

Satu jebakan yang ikut diperbaiki di alat ukurnya: spasi harus disamakan di
kedua sisi sebelum membandingkan teks terender dengan isi di basis data.
Teks yang dirender melewati pembungkusan baris dan `whitespace-pre-line`,
jadi paragraf yang sama bisa punya baris baru di tempat berbeda — dan
perbandingan apa adanya menyatakan "belum diterjemahkan" untuk deskripsi
kursus yang justru memang harus tetap berbahasa Indonesia.

Juga belum: teks notifikasi, yang ditulis trigger basis data dan karena itu
tidak tersentuh kamus antarmuka. Menerjemahkannya berarti menyimpan kunci di
baris notifikasi, bukan kalimat jadi.

Dua kehati-hatian yang sudah terbukti perlu saat melanjutkan: daftar di luar
komponen menyimpan kunci dan bukan label jadi, dan Server Component memakai
`getTranslations()` bukan hook `useI18n()`.

### 2. Menu aksesibilitas — ✅ selesai, lihat `docs/STANDAR-AKSESIBILITAS-PREFERENSI.md`

Riset dulu standar yang berlaku, lalu terapkan. Yang sudah pasti relevan:
WCAG 2.2 sudah dipenuhi di tingkat halaman (gerbang 56/56), tetapi
**preferensi pengguna** adalah lapisan berbeda — ukuran teks, kontras tinggi,
mengurangi animasi, jarak antarbaris. Perlu diperiksa juga apakah panel
semacam ini justru dianjurkan atau tidak oleh pedoman internasional, karena
sebagian ahli menilai "widget aksesibilitas" menutupi masalah alih-alih
memperbaikinya.

Letak dan gayanya harus menyatu dengan antarmuka, bukan tombol mengambang
yang terasa ditempel.

### 3. Pelacakan belajar yang lebih rinci — ✅ tahap pertama selesai, lihat `docs/STANDAR-PELACAKAN.md`

Layar Pelacakan sekarang hanya menampilkan persentase modul dan tugas.
Yang diminta: di bagian mana peserta kesulitan, kebiasaan belajarnya, jam
berapa ia belajar, dan sejenisnya.

**Riset hukum harus lebih dulu, bukan sesudah.** Data jam belajar dan pola
perilaku adalah data pribadi; UU PDP No. 27/2022 menuntut pengumpulan yang
terbatas, spesifik, dan dengan dasar yang sah — dan persetujuan harus diminta
sebelum data dikumpulkan, bukan setelah. Membangun fiturnya dulu lalu mencari
dasar hukumnya berarti sudah terlanjur mengumpulkan.

Keluaran risetnya: daftar data apa yang boleh dikumpulkan, dasar hukum untuk
masing-masing, bentuk pemberitahuan dan persetujuan yang perlu ditampilkan,
dan berapa lama data boleh disimpan.

Yang sudah tersedia dan tinggal ditampilkan: **jumlah percobaan kuis dan
seluruh riwayat skornya**. Mencabut batas percobaan tidak menghilangkan data
ini -- tiap percobaan tetap satu baris di `quiz_attempts` lengkap dengan nomor
urut, skor, dan waktunya, dan tidak ada yang dihapus. Jadi "berapa kali seorang
peserta mencoba sampai lulus" dan "peserta mana yang paling konsisten" bisa
dihitung kapan saja tanpa perubahan basis data.

### 4. Halaman depan yang bisa dikustomisasi superadmin — ✅ selesai

Meniru pola CMS di `github.com/attoyibi/cms-online-store-glasses`. Acuan itu
sudah ditelaah: ia menyusun halaman depan dari **blok modular** — hero,
keunggulan, kategori, deretan produk, testimoni, FAQ, spanduk — yang bisa
diseret untuk diurutkan, disembunyikan, diduplikasi, dibatalkan (undo/redo),
dan punya alur draf lalu terbit, dengan pratinjau langsung di sebelah
formulirnya.

Keadaan sekarang: `landing_content` adalah satu baris berbentuk tetap
(`heading`, `highlight_word`, `subheading`, `features` jsonb,
`featured_course_ids`). Editornya ada di `/admin/landing`, khusus superadmin,
tetapi susunan bagiannya tidak bisa diubah.

Selesai: model blok (`lib/landing-blocks.ts`), migrasi yang memindahkan baris
lama ke bentuk blok tanpa mengubah tampilan, enam jenis blok termasuk testimoni
dari `course_feedback`, dan penyusun di `/admin/landing` untuk menambah,
menghapus, menyembunyikan, dan mengurutkan.

Belum, dan hanya kalau memang diperlukan: pratinjau langsung di sebelah
formulir, undo/redo, serta alur draf lalu terbit. Ketiganya ada di acuan tetapi
tidak diperlukan untuk menyusun halaman.

### 5. Bank soal, pengacakan, dan penarikan — ✅ selesai

Ketiganya ada dan terbukti:

- **Pengacakan urutan** (`quizzes.shuffle`), berbenih id percobaan.
- **Bank soal** — lihat bagian 9 di bawah.
- **Penarikan sebagian** (`quizzes.draw_count`): penyusun menulis 30 soal lalu
  menampilkan 10 acak tiap percobaan.

Soal yang ditarik disimpan di `quiz_attempts.question_ids` dan dipilih
**trigger basis data**, bukan aplikasi — percobaan dibuat oleh sesi peserta,
jadi daftar yang dikirim aplikasi bisa diganti lewat REST oleh orang yang
dinilai. Terbukti: percobaan yang dikirim dengan empat soal pilihan sendiri
tersimpan hanya berisi satu soal pilihan server, dan penilaiannya menghasilkan
100 atas satu soal itu — bukan 25 atas keempatnya.

Alasan lengkap kenapa disimpan dan bukan dihitung ulang ada di
`docs/STANDAR-BANK-SOAL.md` §4.

### 9. Bank soal — ✅ selesai dan terbukti

Lihat `docs/STANDAR-BANK-SOAL.md`. Soal yang sudah ditulis bisa disimpan ke
bank lalu **disalin** ke kuis lain — bukan dirujuk, karena soal yang dirujuk
berarti menyunting satu soal mengubah kuis yang sudah dikerjakan orang, dan
riwayat nilainya jadi tidak bisa dipertanggungjawabkan.

Migrasinya sudah dijalankan, dan perjalanan datanya **terbukti penuh**:
simpan ke bank → muncul di daftar dialog → tersalin ke kuis (jumlah soal
bertambah dari 2 menjadi 3). Dialognya juga lolos audit WCAG 2.2 AA. Data uji
yang dipakai sudah dihapus kembali.

Yang masih terbuka adalah bagian kedua permintaan lama: menarik sebagian soal
secara acak dari bank (misalnya 10 dari 50). Itu membuat tiap peserta
menghadapi kumpulan berbeda, sehingga nilai antarpeserta tidak lagi langsung
sebanding dan wawasan kesulitan soal harus dibaca ulang per soal.

### 6. Pembayaran mentor

Ditunda atas permintaan Anda sampai alur sistemnya rapi. Catatan terkait:
pembayaran peserta juga belum ada gerbangnya sama sekali — lihat
`docs/KESIAPAN-PAKAI.md` bagian 2.

---

### 7. Navigasi berurutan, ukuran teks, dan urutan yang bisa digeser — ✅ selesai, lihat `docs/STANDAR-NAVIGASI-DAN-PENYUSUNAN.md`

Tiga permintaan sekaligus, semuanya terbukti berjalan:

- **Navigasi** — `courses.sequential` per kursus, bawaannya bebas seperti
  Udemy. Pelajaran kuis dibuka dengan **lulus**, bukan sekadar dicentang,
  supaya kuis tidak bisa dilewati. Ditegakkan di server, bukan hanya dengan
  menyembunyikan tautan. Terbukti: satu pelajaran tampil "Terkunci", dan
  melompat lewat alamat langsung dialihkan kembali.
- **Ukuran teks** — toolbar editor dapat Kecil/Normal/Besar/Lebih besar dalam
  satuan `em`, supaya ikut membesar saat peserta menaikkan ukuran teksnya
  sendiri. Pembersih hanya meloloskan `em`/`rem` 0,5–2; piksel dibuang.
  Terbukti: diterapkan → disimpan → dimuat ulang → masih ada, dan tampil di
  pratinjau peserta.
- **Urutan** — modul dan soal kini bisa digeser, bukan hanya pelajaran.
  Terbukti lewat papan ketik saja (Spasi → panah → Spasi).

### 8. Teks mentah `<p>` dari impor `.md` — ✅ selesai

`course.description` adalah teks biasa yang dirender apa adanya, tetapi
pengurai menulis HTML ke sana. Diperbaiki di dua lapis sekaligus, bukan satu:
`markdownToPlainText()` untuk ruas teks biasa, penjaga `looksLikeHtml()` yang
memunculkan peringatan bila HTML tetap lolos, dan satu bagian baru di panduan
unduhan yang melarang AI menulis HTML.

## Selesai dan sudah ter-push

| | Hasil |
|---|---|
| Data demo | 3 kursus berisi penuh, 3 peserta di tiga tingkat kemajuan, 1 mentor; `docs/DATA-DEMO.md` |
| Aksesibilitas | 14 → 56 halaman bersih WCAG 2.2 AA di dua lebar layar, termasuk seluruh layar peserta dan pengelola |
| Peran | Level tengah jadi Mentor, dashboard berbeda per peran, layar evaluasi mentor untuk superadmin; `docs/STANDAR-PERAN.md` |
| Klaim peran di JWT | Hook JWT tidak pernah berjalan karena RLS; seluruh penjaga peran di proxy ternyata mati, kini hidup |
| Profil peserta | Foto, nama sertifikat terpisah, kontak, asal usaha; `docs/STANDAR-PROFIL-PESERTA.md` |
| Sertifikat | Gerbang ulasan dicabut, janji palsu dihentikan, syarat yang kurang kini dijelaskan ke peserta |
| Keamanan | Kursus berbayar tidak bisa diikuti gratis, gerbang terbit, kata sandi minimal 8, batas unggahan di server |
| Kesiapan | `docs/KESIAPAN-PAKAI.md` — 16 alur terbukti, 5 hal yang belum siap beserta alasannya |
