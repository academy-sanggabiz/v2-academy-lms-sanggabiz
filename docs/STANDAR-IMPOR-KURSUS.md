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

**Soal tanpa pilihan otomatis menjadi esai.** Itu kelalaian yang paling sering
terjadi, dan menebaknya sebagai esai hampir selalu benar — jauh lebih berguna
daripada menolak berkasnya.

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
