# Standar bentuk modul

Ditetapkan 14 November 2026. Berlaku untuk **setiap** kursus di Sanggabiz
Academy, baik yang disusun tangan, lewat berkas `.md`, maupun yang dihasilkan
AI dari dokumen yang diunggah.

## 1. Bentuknya

Satu modul berisi empat jenis pelajaran, dalam urutan ini:

| # | Jenis | `tipe` di `.md` | Gunanya |
| --- | --- | --- | --- |
| 1 | Teks | `teks` | Menjelaskan konsepnya. Satu sampai dua pelajaran. |
| 2 | Cerita | `teks` | Satu kejadian yang bisa dibayangkan, memperlihatkan konsep itu bekerja atau gagal. Paling banyak satu. |
| 3 | Simulasi | `interaktif` | Satu hal yang harus dikerjakan, bukan dihafal. Paling banyak satu. |
| 4 | Kuis | `kuis` | Menutup modul. |

Cerita memakai `tipe: teks` dan bukan jenis tersendiri. Yang berbeda cara
menulisnya, bukan cara menyimpannya — dan menambah jenis basis data untuk
perbedaan gaya berarti menambah satu nilai enum yang harus diurus delapan peta
`Record<LessonContentType, …>` selamanya.

## 2. Kapan simulasi TIDAK dipakai

Hanya bila bahannya memuat tindakan yang punya pilihan dan akibat berbeda:
memutuskan, memilih, menangani, melaporkan, memeriksa.

Bila isinya definisi, daftar, atau angka, cukup teks. Simulasi yang dipaksakan
di atas bahan yang tidak punya pilihan akan terasa kosong, dan peserta belajar
bahwa bagian interaktif boleh dilewati.

## 3. Aturan tiap jenis

**Teks** — mulai dengan satu paragraf yang menjawab "kenapa ini penting bagi
saya". Tiga sampai enam paragraf pendek. Subjudul mulai dari `h2`.

**Cerita** — sebutkan orangnya, pekerjaannya, dan jamnya. Perlihatkan
keputusannya diambil bagaimana, termasuk yang sempat salah. Sebutkan akibatnya
dengan angka atau kejadian, bukan dengan penilaian. Tutup dengan
menghubungkannya kembali ke konsep sebelumnya. Nama orang dan perusahaan
dibuat-buat, dan itu disebut di kalimat terakhir.

**Simulasi** — satu tugas yang jelas, tiga sampai empat tindakan yang masing-
masing mengganti layar dan memunculkan akibat berbeda, tombol ulangi, dan dua
sampai tiga varian situasi. Akibat diceritakan, bukan dinilai. Tanpa
JavaScript. Aturan lengkapnya di `docs/STANDAR-MATERI-INTERAKTIF.md`.

**Kuis** — soal menguji penerapan, bukan hafalan. Tiap penjelasan mengatakan
*kenapa* sebuah jawaban benar, bukan hanya bahwa ia benar.

## 4. Uji varian

Ini aturan yang paling mudah dilanggar tanpa sadar, jadi ia berdiri sendiri:

> **Kalau tindakan yang menyelamatkan tetap sama di semua varian, variannya
> tidak mengajarkan apa-apa dan lebih baik dihapus.**

Varian yang baik menghilangkan satu tanda yang tadinya menolong, atau menutup
salah satu jalan keluar. Varian yang hanya mengaburkan layar, menurunkan
kontras, atau mempersempit lebar **bukan** varian — kecuali pelajarannya
memang tentang keterbacaan.

Versi pertama simulasi di kursus acuan melanggar ini: ada tombol "sedang
diburu waktu", "layar kena matahari", dan "ponsel kecil". Ketiganya mengubah
tampilan, tidak satu pun mengubah jawabannya.

## 5. Di mana standar ini ditegakkan

Satu standar, tiga pintu masuk — supaya tidak ada jalan yang melewatinya:

| Pintu | Berkas | Caranya |
| --- | --- | --- |
| Tim memberi panduan ke AI mereka sendiri | `lib/course-markdown/guide.ts` | Bagian "Bentuk satu modul", "Menulis pelajaran cerita", "Menulis pelajaran simulasi" |
| AI bawaan mengubah dokumen jadi kursus | `lib/ai/sop.ts` | `BENTUK_MODUL` pada tahap kerangka; penulisan per jenis dan `promptSimulasi()` pada tahap isi |
| Penyusun mengunggah materi interaktif sendiri | `lib/interactive-guide.ts` | `PERINTAH_AI` |

Aturan keamanan (`ATURAN_SISTEM`) dipakai bersama oleh pintu kedua dan ketiga,
dari satu tempat, supaya keduanya tidak bisa menua sendiri-sendiri.

## 6. Yang dijaga gerbang

- `npm run test:markdown` — kursus disusun, ditulis ke `.md`, dibaca lagi, lalu
  dibandingkan. Yang hilang di perjalanan hilang diam-diam, jadi ini yang
  membuktikan jalur `.md` tidak membuang apa pun: tingkat judul, gaya penulis
  pada simulasi, kunci jawaban, dan penjelasan.
- `npm run test:interaktif` — termasuk bahwa pembersih bersifat idempoten.
  Isi yang sama melewatinya lebih dari sekali (penyunting, pintu simpan, impor
  `.md`), dan pembersih yang tidak idempoten merusak CSS penulis pada
  pembersihan kedua tanpa pesan apa pun.

## 7. Alur AI bawaan

Tiga tahap, bukan satu:

1. **Kerangka** — modul, pelajaran, dan **jenis tiap pelajaran**. Jenisnya
   diputuskan di sini, sebelum satu kalimat pun ditulis, karena jenis
   menentukan cara menulisnya. Penyusun melihat dan boleh mengubahnya di
   layar, sebelum biaya penulisan keluar.
2. **Isi modul** — teks, cerita, dan kuis. Pelajaran simulasi hanya
   mendapat kepalanya plus satu penanda.
3. **Simulasi** — satu panggilan tersendiri per simulasi. Satu simulasi
   berukuran enam sampai tiga belas kilobita HTML, sedangkan satu modul
   dijatah 4.200 token untuk seluruh isinya. Digabung, yang terpotong adalah
   simulasinya, dan HTML yang terpotong di tengah tidak menyisakan apa pun.

Kegagalan satu simulasi tidak menggagalkan modulnya. Penandanya diganti
kalimat yang memberi tahu penyusun, dan pelajarannya tetap ada untuk diisi
tangan. Modul tanpa satu pelajaran lebih buruk daripada modul dengan satu
pelajaran yang perlu dikerjakan sendiri.
