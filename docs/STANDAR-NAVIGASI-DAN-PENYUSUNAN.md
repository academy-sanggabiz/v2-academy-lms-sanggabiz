# Standar Navigasi Kursus dan Penyusunan Materi

**Kapan pelajaran boleh dilewati, bagaimana penyusun mengatur ukuran teks, dan
syarat setiap daftar yang bisa diurutkan**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 1 November 2026 |
| Berlaku pada | `lib/lesson-access.ts`, `lib/dnd-announcements.ts`, `components/admin/courses/`, `lib/sanitize-content.ts` |

---

## 1. Dua mazhab navigasi, dan kenapa keduanya dibutuhkan

Permintaannya: kursus bisa dilewati seperti Udemy, atau wajib berurutan.

Keduanya memang dipakai di industri, dan bukan karena selera:

- **Marketplace terbuka** (Udemy, Coursera versi gratis) membiarkan peserta
  melompat. Peserta datang dengan bekal berbeda-beda dan sering hanya
  memerlukan satu bagian. Mengunci mereka membuat kursus terasa menggurui dan
  menaikkan angka berhenti.
- **Pelatihan kepatuhan dan sertifikasi** (K3, anti-pencucian uang, pelatihan
  wajib perusahaan) mengunci urutan. Di sana sertifikat adalah bukti bahwa
  seluruh materi benar-benar dilalui; kalau bisa dilompati, sertifikatnya
  tidak berarti apa-apa.

LMS ini melayani keduanya, jadi ini **pengaturan per kursus**, bukan pilihan
global dan bukan sesuatu yang dipaksakan ke semua kursus.

**Bawaannya bebas** (`courses.sequential` default `false`). Alasannya: bawaan
yang mengunci akan diam-diam mengubah perilaku kursus yang sudah berjalan,
sedangkan bawaan yang bebas tidak pernah merugikan siapa pun secara mendadak.
Penyusun yang memang butuh urutan akan sadar menyalakannya.

### Aturan yang mengikat

1. **Pelajaran kuis dibuka dengan lulus, bukan dengan dicentang.** Kalau
   syaratnya sekadar "pernah dibuka", peserta cukup membuka kuis lalu lanjut —
   dan seluruh kuis dalam kursus berurutan menjadi hiasan. Lihat
   `computeUnlockedLessons()`: pelajaran kuis memakai `passedQuizIds`,
   pelajaran lain memakai `completedLessonIds`.
2. **Penguncian ditegakkan di server.** Menyembunyikan tautan saja tidak cukup;
   alamat pelajaran bisa diketik langsung. `app/learn/[courseId]/page.tsx`
   mengalihkan ke pelajaran terbuka terakhir bila tujuan masih terkunci.
3. **Yang terkunci bukan tautan mati.** Tautan yang dinonaktifkan tetap
   menjadi perhentian Tab dan membingungkan pengguna pembaca layar. Pelajaran
   terkunci dirender sebagai teks biasa dengan ikon gembok.
4. **Menyalakannya pada kursus berjalan akan mengunci peserta yang sedang di
   tengah.** Ini wajib diperingatkan di layar pengaturan, bukan ditemukan
   sendiri oleh penyusun setelah peserta mengeluh.
5. **Peserta yang sudah dinyatakan lulus terbuka seluruhnya**, apa pun keadaan
   pelajarannya. Ini bukan kelonggaran melainkan koreksi: ketika penyusun
   menyisipkan pelajaran baru di tengah kursus yang sudah dikerjakan orang,
   pelajaran baru itu belum tuntas -- dan tanpa pengecualian ini, seluruh
   pelajaran SETELAHNYA ikut terkunci, termasuk yang sudah ia selesaikan dan
   yang sertifikatnya sudah ia terima. Orang yang sudah lulus tetap lulus;
   materi tambahan tersedia untuk dikerjakan, bukan dipaksakan dengan
   mencabut akses yang sudah diperoleh. Peserta yang belum lulus tetap harus
   menuntaskan materi baru itu seperti pelajaran lain.

---

## 2. Ukuran teks: `em`, tidak pernah `px`

Penyusun bisa membesar-kecilkan teks lewat toolbar editor. Pilihannya sengaja
hanya empat — Kecil, Normal, Besar, Lebih besar — karena daftar ukuran yang
panjang menghasilkan halaman dengan delapan ukuran berbeda tanpa satu pun
yang lebih mudah dibaca.

**Satuannya `em`, dan ini bukan detail teknis.** `docs/STANDAR-AKSESIBILITAS-PREFERENSI.md`
memberi peserta kendali atas ukuran teks. Ukuran dalam piksel akan mengunci
teks pada satu ukuran mutlak dan **membatalkan pilihan peserta itu** — persis
kerusakan yang membuat kita menolak widget aksesibilitas. Dengan `em`, teks
yang dibesarkan penyusun ikut membesar saat peserta menaikkan ukuran teks.

Karena isi pelajaran melewati pembersih sebelum disimpan, `lib/sanitize-content.ts`
harus mengizinkan `font-size` — tetapi **hanya satuan relatif dan hanya
rentang masuk akal** (`0.5em`–`2em`). Piksel, `vw`, dan ukuran ekstrem
dibuang. Pembersih adalah tempat aturan ini ditegakkan; toolbar hanya
antarmukanya, dan isi yang masuk lewat impor `.md` tidak melewati toolbar.

---

## 3. Setiap daftar yang punya urutan harus bisa digeser — dan bisa lewat papan ketik

Sebelumnya hanya pelajaran yang bisa digeser; modul dan soal tidak. Tidak ada
alasan prinsipnya — hanya belum dikerjakan. Aturannya sekarang: **kalau
urutannya berarti bagi peserta, urutannya bisa diatur dengan menggeser.**

Syarat yang tidak boleh ditawar:

1. **Papan ketik, bukan hanya tetikus** (WCAG 2.1.1). dnd-kit menyediakan
   `KeyboardSensor`; pegangannya wajib berupa `<button>` sungguhan, bukan
   `<div>` ber-`onPointerDown`.
2. **Pegangan punya label yang menyebut isinya**, bukan "seret". Label yang
   dipakai: `Pindahkan soal 2: tekan Spasi untuk mengambil, tombol panah untuk
   memindahkan, Spasi untuk melepas`.
3. **Pengumuman menyebut jenis yang benar.** `dndAnnouncements(noun)` dibuat
   justru karena versi sebelumnya menyebut "pelajaran" saat yang dipindahkan
   adalah modul.
4. **Soal hanya berpindah di dalam kuisnya sendiri.** Memindahkan soal antar
   kuis tidak punya arti dan akan merusak penilaian.
5. **Hasil `useSortable` didestrukturisasi.** Menyimpannya sebagai objek lalu
   mengakses `sortable.transform` saat render ditolak React Compiler
   ("Cannot access refs during render") — bukan gaya penulisan, tapi galat
   lint yang menggagalkan pemeriksaan.
