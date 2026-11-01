# Daftar Permintaan

Peta seluruh permintaan yang belum selesai, beserta urutan pengerjaan dan
alasannya. Diperbarui 1 November 2026.

---

## Belum dikerjakan

### A. Sertifikat yang bisa dikustomisasi per kursus — ✅ kode selesai, **menunggu satu langkah SQL**

Lihat `docs/STANDAR-SERTIFIKAT.md`. Pengaturan utama perusahaan ada di
`/admin/certificates` (khusus superadmin); kursus mewarisinya **per ruas**,
sehingga satu kursus bisa memakai nama penanda tangan sendiri sambil tetap
mewarisi jabatan, templat, dan deskripsi.

**Langkah yang tersisa:** jalankan
`supabase/migrations/20261101120000_certificate_defaults.sql` di SQL Editor
Supabase. Selama belum dijalankan, aplikasinya tetap berjalan dengan bentuk
lama — `getCertificateDefaults()` jatuh ke bawaan bawaan-kode dan layar
`/admin/certificates` menjelaskan apa yang kurang, bukan gagal.

Belum terbukti dengan mata: layar `/admin/certificates` sendiri, karena
kata sandi superadmin sudah diganti dan `AUDIT_ADMIN_PASSWORD` di
`.env.local` sudah tidak berlaku. Gerbang a11y kini mengatakannya terus
terang ("dialihkan ke /admin/dashboard, akunnya tidak berwenang") alih-alih
mencetak "ok" untuk halaman yang tidak pernah terbuka — kelemahan yang
ternyata juga membuat `/admin/landing` dan `/admin/mentor` selama ini
terhitung lolos tanpa pernah diaudit.

### B. Pelacakan perilaku: siapa membuka apa, berapa lama — **butuh persetujuan lebih dulu**

Diminta untuk analisis titik berhenti peserta: di bagian mana orang paling
sering tidak melanjutkan, dan bagian mana yang sudah bagus.

**Ini tidak bisa langsung dibangun.** `docs/STANDAR-PELACAKAN.md` §3 sudah
memetakannya: lama membuka halaman, pola sesi, dan jejak per orang bukan
keperluan menyampaikan kursus, jadi dasarnya bukan UU PDP Pasal 20 huruf b
melainkan huruf a — persetujuan eksplisit, yang **harus diminta sebelum data
dikumpulkan**, bisa ditolak tanpa kehilangan akses, dan bisa ditarik.

Urutan kerjanya karena itu: mekanisme pemberitahuan dan persetujuan lebih
dulu, baru pengumpulannya.

Catatan desain yang menghemat banyak kerja: pertanyaan "di bagian mana orang
berhenti" bisa dijawab **tanpa** jejak per orang — cukup menghitung berapa
peserta yang menyelesaikan tiap pelajaran dibanding yang memulainya, dari
`lesson_progress` yang sudah ada dan sudah sah dikumpulkan. Yang benar-benar
butuh persetujuan hanyalah "berapa lama" dan "sedang membuka apa saat ini".
Sebaiknya bagian agregat itu dikerjakan lebih dulu; mungkin sudah cukup.


### C. Riwayat migrasi Supabase tidak sinkron — risiko saat menyiapkan lingkungan baru

`supabase migration list --linked` hanya mencatat satu migrasi di sisi remote
(`20260101000000`), padahal 34 berkas migrasi lain sudah benar-benar
diterapkan — skemanya lengkap dan aplikasinya berjalan. Penyebabnya: migrasi
dijalankan sebagai SQL langsung, bukan lewat `supabase db push`, sehingga
tabel `supabase_migrations.schema_migrations` tidak ikut terisi.

Tidak ada yang rusak sekarang. Risikonya muncul nanti: `db push` berikutnya
akan mengira seluruh 34 migrasi itu belum pernah jalan dan mencoba
menerapkannya lagi. Sebagian akan gagal (kolom sudah ada), sebagian justru
berbahaya kalau tidak idempoten.

Perbaikannya `supabase migration repair --status applied <versi>` untuk tiap
versi yang sudah terlanjur diterapkan. **Belum dikerjakan karena ini menyentuh
pembukuan basis data produksi dan sebaiknya dijalankan dengan sepengetahuan
pemilik proyek,** bukan diselipkan di tengah pekerjaan lain.

### 0. Impor kursus dari berkas .md — ✅ selesai

Lihat `docs/STANDAR-IMPOR-KURSUS.md`. LMS tidak memanggil AI; ia menyediakan
panduan yang diunduh dan parser yang menerima hasilnya. Terbuka untuk
dikembangkan kalau diperlukan: impor per modul ke kursus yang sudah ada, dan
tampilan perbandingan supaya kursus yang sudah punya peserta pun bisa
diperbarui sebagian.

### 1. Dwibahasa Indonesia–Inggris — *kerangka dan seluruh layar utama selesai*

**Sudah selesai:** kerangkanya (`lib/i18n/`), pemilih bahasa di header peserta
dan pengelola, atribut `lang` yang ikut berganti, judul tab, dan **seluruh
layar yang dilihat peserta**: masuk, daftar, lupa dan ganti kata sandi,
navigasi, dasbor, katalog kursus, riwayat pembelian, notifikasi, pengaturan,
profil beserta form penyuntingannya, pemutar pelajaran, dan kotak catatan.

**Juga selesai:** navigasi dan dasbor pengelola, serta judul tiap layar
pengelola.

**Belum:** isi rinci di dalam layar pengelola — tabel, dialog, dan pesan di
editor kursus, penilaian, dan pelacakan. Sifatnya mekanis: tiap kalimat
dipindahkan ke `lib/i18n/dictionaries.ts` dan diganti pemanggilan kamus, dengan
dua kehati-hatian yang sudah terbukti perlu — daftar di luar komponen menyimpan
kunci, bukan label jadi, dan Server Component memakai `getTranslations()`
bukan hook `useI18n()`.

Juga belum: teks notifikasi, yang ditulis trigger basis data dan karena itu
tidak tersentuh kamus antarmuka. Menerjemahkannya berarti menyimpan kunci di
baris notifikasi, bukan kalimat jadi.

**Kenapa ini lebih dulu.** Hampir setiap kalimat di aplikasi ini masih ditulis
langsung di dalam komponen. Setiap fitur baru yang ditambahkan sebelum
dwibahasa terpasang berarti satu set kalimat lagi yang harus dipindahkan
nanti — ongkosnya naik terus selama ditunda. Ini satu-satunya pekerjaan di
daftar ini yang makin mahal kalau dikerjakan belakangan.

Yang perlu diputuskan saat mengerjakannya: apakah bahasa mengikuti pilihan
peserta (disimpan di profil) atau alamat URL (`/en/...`). Pilihan kedua
membuat halaman bisa dibagikan dalam bahasa tertentu dan lebih baik untuk
mesin pencari, tetapi mengubah seluruh struktur rute.

Termasuk: isi kursus. Judul dan materi pelajaran ada di basis data, jadi
dwibahasa penuh berarti kolom terjemahan per pelajaran — itu pekerjaan
tersendiri yang bisa menyusul setelah antarmukanya selesai.

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

### 5. Bank soal dan pengacakan — ✅ pengacakan selesai, bank soal masih terbuka

Diminta bersama pencabutan batas percobaan: kalau peserta boleh mengulang
sampai lulus, soalnya sebaiknya tidak selalu sama persis. Kolom
`quizzes.shuffle` sudah ada di basis data tetapi **tidak pernah dibaca kode
mana pun** -- jadi pengacakan sama sekali belum berfungsi.

Dua tingkat, bisa dikerjakan bertahap:

1. Mengacak urutan soal dan urutan pilihan jawaban per percobaan, diacak dengan
   benih tetap dari id percobaan supaya menyegarkan halaman tidak mengacak
   ulang di tengah jalan. Kecil, dan sudah cukup mencegah peserta menghafal
   "jawabannya pilihan kedua".
2. Bank soal sungguhan: satu kumpulan soal per kuis, dan tiap percobaan
   mengambil sebagian secara acak. Ini menyentuh editor kuis, penilaian, dan
   tampilan hasil.

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
