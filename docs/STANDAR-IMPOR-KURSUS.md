# Standar Impor Kursus dari Berkas

**Menyusun kursus dengan bantuan AI, tanpa LMS ini memanggil AI**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 1 November 2026 |
| Berlaku pada | `lib/course-markdown/`, dialog impor di editor kursus, rute panduan |

---

## 1. Bentuk fiturnya

LMS menyediakan dua ujung jembatan, dan tidak pernah memanggil model bahasa
sendiri:

1. **Panduan yang diunduh** — satu berkas `.md` berisi spesifikasi format
   **dan** aturan menulis pelajaran yang baik.
2. **Parser** — menerima `.md` hasil asisten AI milik penyusun kursus dan
   mengisi draf di editor.

Yang didapat dari bentuk ini: tidak ada kunci API, tidak ada biaya token, tidak
ada latensi, dan tidak ada tanggung jawab atas keluaran model. Penyusun kursus
memakai asisten yang sudah ia bayar, dengan materinya sendiri.

## 2. Panduannya membawa standar, bukan hanya skema

Bagian paling bernilai dari berkas panduan bukan spesifikasi formatnya,
melainkan separuh pertamanya: satu sasaran belajar per pelajaran, panjang yang
wajar, bahasa sederhana, contoh dengan angka nyata, soal yang menguji
penerapan dan bukan hafalan, pilihan salah yang masuk akal, penjelasan yang
mengatakan kenapa, dan larangan mengarang data.

Tanpa bagian itu, fitur ini hanya memindahkan pekerjaan mengetik. Dengan bagian
itu, ia memindahkan standar — isinya diringkas dari
`docs/STANDAR-DIGITAL-LEARNING.md`.

## 3. Keputusan format

**Markdown, bukan JSON.** Berkasnya ditulis model, lalu dibaca dan sering
dibetulkan manusia sebelum diimpor. Model jauh lebih andal menjaga struktur
Markdown daripada menghasilkan JSON panjang yang tetap valid sampai kurung
terakhir. Yang lebih menentukan: kalau model keliru sedikit, penyusun kursus
bisa memperbaikinya sendiri dengan mata telanjang. JSON yang rusak hanya bisa
diperbaiki orang yang mengerti kode.

**Penanda eksplisit, bukan tingkat heading.** `## Modul:` dan `### Pelajaran:`
dikenali dari kata penandanya, bukan dari banyaknya pagar. Model sering
menggeser tingkat heading satu tingkat tanpa alasan; kalau strukturnya
bergantung pada itu, satu geseran membuat seluruh berkas gagal dibaca.

**`- [x]` untuk jawaban benar.** Sintaks daftar tugas dikenal setiap model dan
setiap penyunting Markdown. Alternatif seperti menandai dengan bintang atau
menulis "jawaban: B" jauh lebih sering salah.

**Parser harus mematuhi aturan yang sama dengan editor.** Soal esai hanya sah
di dalam studi kasus: `validateQuizzes` menolak esai di kuis biasa, dan menolak
studi kasus yang berisi lebih dari satu soal. Versi pertama parser ini
menjadikan setiap soal tanpa pilihan sebagai esai dan menaruhnya di kuis biasa
— impornya terlihat berhasil, lalu penyimpanan ditolak dengan "1 masalah kuis"
dan penyusun kursus tidak punya petunjuk kenapa.

Itu hanya ketahuan dengan menjalankan alurnya sampai menekan Simpan. Sekarang
studi kasus punya jenis pelajaran sendiri, `tipe: studi-kasus`, dan soal yang
melanggar dilewati dengan penjelasan alih-alih menghasilkan draf yang tidak
mungkin disimpan.

## 4. Parser tidak pernah melempar

Berkas ini datang dari model bahasa. Setengah berhasil dengan daftar jelas apa
yang terlewat jauh lebih berguna daripada satu pesan "format salah" yang
membuat penyusun kursus harus menebak. Yang tidak dikenali dicatat sebagai
peringatan dan dilewati:

| Keadaan | Yang dilakukan |
|---|---|
| Pelajaran sebelum modul pertama | Dibuatkan modul penampung |
| Jenis pelajaran tak dikenal | Dianggap teks, dicatat |
| Soal tanpa `[x]` | Dilewati, menyebutkan soal yang mana |
| Tanpa frontmatter | Tetap dibaca, dicatat |

Peringatannya ditampilkan di dialog setelah berkas dibaca, bukan disimpan diam-diam.

## 5. Pagar keselamatan

**Impor tidak pernah menyimpan.** Hasilnya masuk ke draf di editor; penyusun
memeriksanya lalu menekan Simpan sendiri. Menulis langsung ke basis data akan
membuat satu berkas yang meleset menghapus pekerjaan tanpa jejak.

**Kursus yang sudah punya peserta tidak bisa diimpor.** Syaratnya
`count(enrollments) = 0`, bukan "status draf": kursus draf pun bisa sudah
didaftari peserta oleh pengelola, dan mengganti isinya membuat kemajuan belajar
mereka menunjuk pelajaran yang sudah tidak ada.

Sifat pagar ini **keselamatan, bukan kewenangan** — seorang pengelola memang
sudah boleh mengubah isi kursusnya lewat editor. Tetap ditegakkan di server,
bukan hanya dengan menyembunyikan tombol, karena server action dapat dipanggil
langsung lewat jaringan.

**Isi dari berkas tetap melewati sanitasi** yang sama dengan isi pelajaran
(temuan C-09). Kecuali penjelasan soal, yang disimpan sebagai teks biasa —
menyanitasinya pernah menghapus kalimat setelah tanda `<` secara permanen.

## 6. Yang sengaja tidak bisa diatur dari berkas

Gambar sampul, harga, prasyarat kursus, pengaturan sertifikat, status terbit,
dan pemilik kursus. Sebagian tidak bisa diwakili teks; sebagian lagi berisiko
kalau bisa disetel dari berkas yang ditulis model. Semuanya tetap di editor.

Ekspor memakai format yang sama, jadi alurnya bisa bolak-balik: ekspor kursus
yang ada, minta asisten memperbaikinya, impor lagi.

## 7. Versi format

Frontmatter memuat `format: sanggabiz-course/v1`. Parser memperingatkan bila
nilainya berbeda, supaya berkas dari versi lain tidak dibaca salah diam-diam.

## 8. Membuat kursus otomatis dari dokumen

Jalur kedua ke draf yang sama: mentor mengunggah dokumen, AI menyusunnya
menjadi kursus. Diputuskan 2026-11-10, dibangun di atas impor Markdown yang
sudah ada dan **tidak** sebagai mekanisme baru.

**Dokumen apa pun, bukan hanya SOP.** Lahir dari kebutuhan mengubah SOP
perusahaan menjadi pelatihan, tetapi mesinnya tidak pernah tahu dokumennya
SOP -- ia hanya menerima teks. Ketika janjinya dilebarkan, dua hal ikut
berubah dan keduanya bukan soal nama: prompt sistemnya berhenti menyebut
"penyusun kurikulum pelatihan kerja" (andaian itu memaksa buku panduan dan
peraturan berbunyi seperti pelatihan karyawan), dan Word ikut didukung
(`mammoth`) karena `.docx` adalah format pertama yang dicoba orang. Nama
berkas kode dan bucket `sop-documents` sengaja dibiarkan: keduanya pengenal
internal, dan menggantinya berarti memindahkan objek Storage demi kosmetik.

**Kilau ✨ milik jalur yang benar-benar memanggil AI.** Sampai 2026-11-10
ikon itu terpasang di impor `.md` -- jalur yang dialognya sendiri berbunyi
"Sanggabiz tidak memanggil AI" -- sementara jalur yang sungguh memanggil AI
memakai ikon berkas biasa. Persis terbalik. Sekarang: **"Buat otomatis
dengan AI" ✨** untuk jalur yang memanggil model, **"Impor dari berkas .md"**
dengan ikon unggah untuk jalur yang memindahkan hasil AI milik pengguna
sendiri. Dua-duanya menyebut AI, jadi yang membedakan harus kata kerjanya:
*otomatis* berarti Sanggabiz yang mengerjakan. Jangan menyamakan keduanya
lagi.

**Keluarannya membawa peringatan AI**, sama seperti setiap keluaran AI lain
di aplikasi ini (`discussAiNote`, `assistantAiNote`): "Dibuat AI dan bisa
keliru. Periksa tiap pelajaran dan soal sebelum menyimpan." Kursus hasil AI
justru yang paling perlu membawanya.

**Pintu masuknya dua**, mengikuti pola impor `.md`: baris ketiga di dropdown
"Buat Kursus" (`?ai=1`), dan tombol di editor. Yang pertama yang penting --
di situlah orang sedang berpikir "saya butuh kursus tentang ini", dan sebelum
ini fiturnya terkubur dua langkah di dalam editor yang harus dibuat dulu.

**Berakhir di berkas `.md`, bukan di baris basis data.** `lib/ai/sop.ts`
menghasilkan teks berformat `sanggabiz-course/v1`, lalu
`parseCourseMarkdown()` membacanya seperti berkas yang diketik manusia. Itu
berarti seluruh pagar §5 berlaku apa adanya tanpa ditulis ulang: hasilnya
masuk ke draf dan tidak pernah tersimpan sendiri, kursus yang sudah punya
peserta ditolak, dan isinya tetap disanitasi. Jangan membuat jalur tulis
langsung dari model ke tabel kursus — satu-satunya alasan fitur ini aman
adalah karena ia melewati pintu yang sama.

**Dua langkah yang terlihat, bukan satu tombol.** Langkah pertama hanya
membuat kerangka: daftar modul dan judul pelajaran. Mentor membacanya sebelum
satu kalimat materi pun ditulis, dan berhenti di situ kalau dokumennya
ternyata salah. Langkah kedua menulis isi per modul. Satu panggilan "ubah SOP
ini jadi kursus lengkap" menghasilkan keluaran panjang yang terpotong di
tengah, dan ketika terpotong tidak ada bagian yang bisa diselamatkan.

**Urutan pilihan jawaban diacak di server.** Contoh bentuk di prompt menulis
kunci pada baris pertama, dan model menyalin posisinya: pada percobaan pertama
fitur ini, 18 dari 18 soal berkunci pilihan pertama — kuis yang bisa dilewati
tanpa membaca soalnya. `acakOpsi()` memperbaikinya setelah model menjawab.
Jangan menggantinya dengan permintaan "variasikan posisinya" di prompt;
permintaan seperti itu kadang dipatuhi, dan "kadang" bukan jaminan.

**Dokumennya privat.** Bucket `sop-documents` (migrasi `20261110040000`)
tidak punya policy select sama sekali: SOP adalah dokumen internal perusahaan
pelanggan, bukan aset yang boleh terbaca lewat URL yang bocor. Hanya server
action dengan service role yang membacanya. Teks hasil ekstraksi disimpan di
`ai_course_generations.context` supaya langkah kedua tidak perlu mengunggah
ulang — dan karena itu, menghapus baris generasi berarti menghapus salinan
teksnya juga.

**Isi dokumen dikirim ke penyedia AI pihak ketiga.** Dialognya mengatakan itu
di layar, sebelum tombol unggah, bukan di halaman kebijakan yang tidak dibuka
siapa pun.

**Pembaca PDF memerlukan Node 22 atau lebih baru** (`unpdf` memuat PDF.js yang
memakai global `Iterator`). Vercel menjalankan Node 24; `package.json` memuat
`engines.node: ">=22"` dan `.nvmrc` memuat `22` supaya mesin pengembang tidak
diam-diam memakai Node 20, tempat jalur PDF gagal dengan pesan yang
menyesatkan.
