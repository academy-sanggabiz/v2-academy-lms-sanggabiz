import { COURSE_MARKDOWN_FORMAT } from "@/lib/course-markdown"

/**
 * Panduan yang diunduh penyusun kursus dan diberikan ke AI mereka sendiri.
 *
 * Isinya dua lapis, dan lapisan keduanya yang menentukan mutu hasilnya.
 * Lapisan pertama adalah spesifikasi format -- itu yang membuat berkasnya bisa
 * diimpor. Lapisan kedua adalah aturan penulisan dari
 * docs/STANDAR-DIGITAL-LEARNING.md: satu sasaran belajar per pelajaran, bahasa
 * sederhana, soal yang menguji penerapan dan bukan hafalan, penjelasan yang
 * mengatakan kenapa.
 *
 * Tanpa lapisan kedua, fitur ini hanya memindahkan pekerjaan mengetik. Dengan
 * lapisan kedua, ia memindahkan standar.
 */
export const COURSE_GUIDE_MARKDOWN = `# Panduan menyusun kursus Sanggabiz Academy

Berkas ini adalah bahan untuk Anda berikan ke asisten AI (ChatGPT, Claude, atau
lainnya) bersama materi dan SOP Anda sendiri. Keluarannya satu berkas \`.md\`
yang bisa langsung diimpor ke Sanggabiz Academy.

## Cara memakainya

1. Buka asisten AI Anda.
2. Unggah berkas ini, lalu unggah juga materi Anda: SOP, catatan pelatihan,
   slide, transkrip, apa pun yang sudah ada.
3. Minta: *"Susun kursus dari materi saya, ikuti panduan ini persis. Keluarkan
   satu berkas .md saja."*
4. Simpan hasilnya sebagai \`.md\`, lalu unggah di Sanggabiz Academy.

Hasilnya masuk sebagai **draf**. Anda tetap memeriksa dan membetulkannya di
editor sebelum menyimpan, jadi tidak apa-apa kalau belum sempurna.

---

# Bagian 1 — Cara menulis kursus yang baik

Aturan di bawah ini lebih penting daripada formatnya. Format yang benar dengan
isi yang buruk tetap kursus yang buruk.

## Satu pelajaran, satu sasaran

Setiap pelajaran menyelesaikan **satu** hal yang bisa dilakukan peserta
sesudahnya. Kalau sebuah pelajaran butuh kata "dan" untuk menjelaskan isinya,
pecah jadi dua.

Mulai pelajaran dengan menyebutkan sasarannya dalam satu kalimat, memakai kata
kerja yang bisa diamati: *"Setelah pelajaran ini Anda akan mampu menghitung
titik impas usaha Anda."* Bukan *"memahami"* atau *"mengetahui"* — keduanya
tidak bisa dilihat.

## Panjang yang wajar

Satu pelajaran sebaiknya selesai dalam 5–10 menit. Pelajaran teks sekitar
400–700 kata. Lebih panjang dari itu, peserta berhenti di tengah dan tidak
kembali.

Satu modul berisi 3–6 pelajaran.

## Bahasa

Tulis untuk orang yang sedang sibuk dan mungkin membaca di ponsel.

- Kalimat pendek. Satu gagasan per kalimat.
- Sapa pembaca dengan "Anda".
- Hindari istilah asing bila ada padanan yang lazim. Kalau istilahnya memang
  perlu, jelaskan sekali saat pertama kali muncul.
- Pakai contoh konkret dengan angka nyata, bukan "misalnya produk A".
- Jangan memakai nada menggurui. Peserta adalah orang dewasa yang sudah
  menjalankan usahanya.

## Contoh membuat perbedaan

Setiap pelajaran yang mengajarkan cara melakukan sesuatu harus memuat
**setidaknya satu contoh nyata** dengan angka atau situasi spesifik. Contoh
yang baik membuat peserta berkata "oh, jadi begitu". Penjelasan tanpa contoh
jarang menempel.

## Soal menguji penerapan, bukan hafalan

Soal yang baik menanyakan apa yang harus **dilakukan** dalam sebuah situasi.

- Buruk: *"Apa definisi titik impas?"*
- Baik: *"Warung Bu Siti menjual 40 porsi per hari dengan laba Rp 3.000 per
  porsi dan biaya tetap Rp 90.000 per hari. Apa yang terjadi?"*

Pilihan yang salah harus **masuk akal** — kesalahan yang memang sering
dilakukan orang, bukan pilihan konyol yang jelas salah. Pilihan konyol membuat
soal bisa dijawab benar tanpa paham apa pun.

Setiap soal wajib punya penjelasan yang mengatakan **kenapa** jawabannya benar,
dan sebaiknya juga kenapa pilihan yang menggoda itu salah. Penjelasan ini
dibaca peserta setelah menjawab, dan sering jadi bagian paling berharga dari
kuis.

## Yang tidak boleh

- Jangan mengarang data, angka statistik, atau kutipan. Kalau materi sumber
  tidak menyebut angkanya, jangan buat angka.
- Jangan menyalin materi berhak cipta milik orang lain.
- Jangan membuat janji hasil: "dijamin omzet naik" bukan kalimat yang boleh ada
  di materi belajar.

---

# Bagian 2 — Format berkas

Keluarkan **satu berkas Markdown**. Mulai dengan blok frontmatter berikut,
persis seperti ini:

\`\`\`
---
format: ${COURSE_MARKDOWN_FORMAT}
judul: Judul kursus
tingkat: Pemula
nilai_kelulusan: 70
---
\`\`\`

\`tingkat\` boleh diisi Pemula, Menengah, atau Lanjutan.
\`nilai_kelulusan\` adalah nilai minimum 0–100 untuk dinyatakan lulus kursus.

## Bagian kursus

Tiga bagian ini ditulis sekali, sebelum modul pertama:

\`\`\`
## Deskripsi

Satu sampai dua paragraf tentang apa yang didapat peserta.

## Persyaratan

- Satu persyaratan per baris
- Boleh dikosongkan kalau memang tidak ada

## Untuk siapa

- Satu sasaran peserta per baris
\`\`\`

## Modul dan pelajaran

Penanda \`Modul:\` dan \`Pelajaran:\` wajib ditulis persis seperti ini. Jumlah
tanda pagar boleh berbeda, tetapi kata penandanya tidak boleh hilang.

\`\`\`
## Modul: Nama modul

### Pelajaran: Judul pelajaran
tipe: teks
durasi: 7 menit

Isi pelajaran di sini. Boleh memakai **tebal**, *miring*, daftar berpoin,
daftar bernomor, kutipan dengan >, dan subjudul dengan ###.
\`\`\`

Baris atribut (\`tipe\`, \`durasi\`, dan seterusnya) ditulis langsung di bawah
judul pelajaran tanpa baris kosong di antaranya.

### Jenis pelajaran

| \`tipe\` | Untuk apa | Atribut tambahan |
|---|---|---|
| \`teks\` | Bacaan | — |
| \`video\` | Video YouTube | \`video:\` berisi tautan YouTube |
| \`slide\` | Google Slides | \`video:\` berisi tautan slide |
| \`kuis\` | Latihan soal pilihan ganda | \`nilai_lulus:\` 0–100 |
| \`studi-kasus\` | Satu soal esai, dinilai pengajar | — |

Pelajaran video dan slide **wajib** disertai transkrip. Peserta yang tidak bisa
mendengar, sedang di tempat ramai, atau koneksinya lambat membaca transkrip itu.

\`\`\`
### Pelajaran: Menghitung titik impas
tipe: video
video: https://www.youtube.com/watch?v=xxxxxxxxxxx
durasi: 9 menit

Paragraf pengantar sebelum video.

#### Transkrip

Isi transkrip, ditulis sebagai teks biasa.
\`\`\`

### Kuis

Setiap soal diawali \`#### Soal\`. Jawaban benar ditandai \`[x]\`, yang salah
\`[ ]\`. Penjelasan ditulis sebagai kutipan diawali \`Penjelasan:\`.

\`\`\`
### Pelajaran: Latihan membaca angka usaha
tipe: kuis
nilai_lulus: 70

#### Soal

Warung Bu Siti terlihat untung Rp 4 juta sebulan, tetapi Rp 2,6 juta di
antaranya titipan arisan. Berapa laba usahanya?

- [ ] Rp 4 juta
- [x] Rp 1,4 juta
- [ ] Rp 2,6 juta

> Penjelasan: Uang titipan bukan milik usaha. Mencampurnya dengan kas usaha
> membuat laba terlihat lebih besar daripada yang sebenarnya.

#### Soal

Ceritakan satu hal yang paling sulit Anda catat dalam sebulan terakhir.
\`\`\`

Setiap soal di dalam \`tipe: kuis\` **wajib punya pilihan jawaban** dengan tepat
satu \`[x]\`. Soal tanpa pilihan akan dilewati saat impor.

Usahakan 3–5 soal per kuis, masing-masing dengan 3–4 pilihan.

### Studi kasus

Pertanyaan terbuka yang dijawab dengan tulisan dan dinilai pengajar ditulis
sebagai pelajaran tersendiri bertipe \`studi-kasus\`, berisi **tepat satu**
soal tanpa pilihan jawaban.

\`\`\`
### Pelajaran: Studi kasus — keluhan yang sulit
tipe: studi-kasus

#### Soal

Ceritakan satu keluhan pelanggan yang paling sulit Anda tangani, dan apa yang
akan Anda ubah setelah mengikuti modul ini.
\`\`\`

Jangan mencampur soal esai ke dalam \`tipe: kuis\`, dan jangan menaruh lebih
dari satu soal di dalam \`tipe: studi-kasus\`. Keduanya akan dilewati saat
impor.

## Batasan yang perlu diketahui

- Gambar dan berkas tidak bisa ikut lewat berkas ini. Hanya tautan video
  YouTube dan Google Slides yang terbawa. Gambar sampul kursus diunggah di
  editor.
- Harga, prasyarat kursus, dan pengaturan sertifikat tidak diatur dari berkas
  ini. Semuanya ada di tab Pengaturan pada editor.
- Untuk kursus besar, susun **per modul** dalam beberapa berkas. Berkas yang
  terlalu panjang sering terpotong oleh asisten AI di tengah jalan.
- Kursus yang sudah punya peserta tidak bisa diimpor ulang, supaya kemajuan
  belajar mereka tidak menunjuk pelajaran yang sudah tidak ada.

---

# Bagian 3 — Contoh lengkap yang bisa ditiru

\`\`\`
---
format: ${COURSE_MARKDOWN_FORMAT}
judul: Menyusun Laporan Penjualan Bulanan
tingkat: Pemula
nilai_kelulusan: 70
---

## Deskripsi

Ubah catatan harian yang berserakan menjadi satu laporan bulanan yang bisa
dibaca bank, mitra, atau Anda sendiri saat mengambil keputusan.

## Persyaratan

- Sudah mencatat penjualan harian, walau masih di buku tulis

## Untuk siapa

- Pemilik usaha kecil yang mencatat keuangannya sendiri

## Modul: Merapikan Catatan Harian

### Pelajaran: Tiga kolom yang wajib ada
tipe: teks
durasi: 6 menit

Setelah pelajaran ini Anda akan mampu menyiapkan format catatan harian yang
cukup untuk menyusun laporan bulanan.

Catatan yang berguna hanya perlu tiga kolom: tanggal, jumlah uang masuk, dan
keterangan singkat. Kolom lain boleh ditambahkan nanti.

- **Tanggal** — tanpa ini, laporan bulanan tidak bisa disusun sama sekali.
- **Jumlah** — tulis angka apa adanya, jangan dibulatkan.
- **Keterangan** — cukup tiga kata, misalnya "20 porsi ayam".

Bu Rina mencatat "12 Okt, 340.000, 20 porsi". Tiga bulan kemudian ia masih
bisa menjelaskan angka itu ke petugas bank.

### Pelajaran: Latihan merapikan catatan
tipe: kuis
nilai_lulus: 70

#### Soal

Anda menemukan catatan bertuliskan "jual ayam 340rb" tanpa tanggal. Apa
langkah terbaik?

- [ ] Buang saja karena tidak lengkap
- [x] Perkirakan tanggalnya dari urutan catatan, lalu beri tanda bahwa itu perkiraan
- [ ] Masukkan ke tanggal hari ini

> Penjelasan: Angkanya tetap berguna dan tidak boleh dibuang, tetapi
> memasukkannya ke tanggal hari ini membuat laporan bulan ini salah. Menandai
> perkiraan menjaga laporan tetap jujur.

### Pelajaran: Studi kasus — catatan Anda sendiri
tipe: studi-kasus

#### Soal

Ambil catatan penjualan Anda satu minggu terakhir. Sebutkan satu hal yang
hilang dari catatan itu, dan bagaimana Anda akan melengkapinya mulai besok.
\`\`\`
`
