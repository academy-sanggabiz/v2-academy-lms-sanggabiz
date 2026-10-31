# Daftar Permintaan

Peta seluruh permintaan yang belum selesai, beserta urutan pengerjaan dan
alasannya. Diperbarui 31 Oktober 2026.

---

## Belum dikerjakan

### 1. Dwibahasa Indonesia–Inggris — *sedang berjalan*

**Sudah selesai:** kerangkanya (`lib/i18n/`), pemilih bahasa di header peserta
dan pengelola, atribut `lang` yang ikut berganti, judul tab, dan **seluruh
layar yang dilihat peserta**: masuk, daftar, lupa dan ganti kata sandi,
navigasi, dasbor, katalog kursus, riwayat pembelian, notifikasi, pengaturan,
profil beserta form penyuntingannya, pemutar pelajaran, dan kotak catatan.

**Belum:** seluruh area pengelola (`/admin/**`) — dasbor, kursus, editor
kursus, peserta, penilaian, pelacakan, mentor, halaman depan, pengaturan.
Juga: teks notifikasi, yang ditulis trigger basis data dan karena itu tidak
tersentuh kamus antarmuka; menerjemahkannya berarti menyimpan kedua bahasa di
baris notifikasi atau menyimpan kunci alih-alih kalimat jadi.

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

### 2. Menu aksesibilitas (ukuran huruf, warna, kontras)

Riset dulu standar yang berlaku, lalu terapkan. Yang sudah pasti relevan:
WCAG 2.2 sudah dipenuhi di tingkat halaman (gerbang 56/56), tetapi
**preferensi pengguna** adalah lapisan berbeda — ukuran teks, kontras tinggi,
mengurangi animasi, jarak antarbaris. Perlu diperiksa juga apakah panel
semacam ini justru dianjurkan atau tidak oleh pedoman internasional, karena
sebagian ahli menilai "widget aksesibilitas" menutupi masalah alih-alih
memperbaikinya.

Letak dan gayanya harus menyatu dengan antarmuka, bukan tombol mengambang
yang terasa ditempel.

### 3. Pelacakan belajar yang lebih rinci

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

### 4. Halaman depan yang bisa dikustomisasi superadmin

Meniru pola CMS di `github.com/attoyibi/cms-online-store-glasses`. Editor
halaman depan sudah ada (`/admin/landing`, khusus superadmin) tetapi bagiannya
tetap: bagian utama, keunggulan, dan daftar kursus. Yang diminta adalah
bagian yang bisa ditambah, dihapus, dan diurutkan sendiri.

### 5. Bank soal dan pengacakan

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
