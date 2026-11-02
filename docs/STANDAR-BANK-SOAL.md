# Standar Bank Soal

**Kenapa soal disalin, bukan dirujuk**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 1 November 2026 |
| Berlaku pada | `lib/question-bank-server.ts`, `app/admin/courses/bank-actions.ts`, `components/admin/courses/bank/` |

---

## 1. Keputusan yang menentukan segalanya: salin, bukan rujuk

Bank soal bisa dirancang dua cara.

**Merujuk** terlihat lebih rapi: satu soal hidup di satu tempat, dipakai
banyak kuis, sekali diperbaiki selesai untuk semuanya.

**Menyalin** terlihat boros: satu soal yang sama bisa punya sepuluh salinan,
dan memperbaiki salah ketik di bank tidak ikut memperbaiki salinan yang sudah
dipakai.

Yang dipilih adalah menyalin, karena merujuk punya satu akibat yang tidak
bisa ditawar: **menyunting sebuah soal akan mengubah kuis yang sudah
dikerjakan orang.** Jawaban peserta tersimpan sebagai `quiz_responses` yang
menunjuk `question_options`. Kalau soalnya berubah setelah dikerjakan,
riwayat penilaian bercerita hal yang berbeda dari yang sebenarnya dihadapi
peserta — dan nilai lama tidak bisa lagi dipertanggungjawabkan kalau ada yang
mempersoalkannya.

Harga dari menyalin adalah salah ketik yang harus diperbaiki dua kali. Harga
dari merujuk adalah riwayat nilai yang berubah sendiri. Yang kedua jauh lebih
mahal.

Konsekuensi langsungnya, dan ini harus tetap benar:

- Id soal dan id pilihan jawaban **dibuat ulang saat disisipkan**
  (`insertQuestions` di `CourseDraftContext`). Kalau id-nya ikut disalin,
  mengambil soal yang sama dua kali menghasilkan dua soal ber-id sama, dan
  setiap penyuntingan setelahnya mengenai keduanya sekaligus.
- Peserta tidak pernah menyentuh tabel bank. Soal yang dikerjakan peserta
  selalu salinan di `questions`.

## 2. Kepemilikan

Bank adalah milik penulisnya. Superadmin melihat semuanya, sejalan dengan
perannya yang memang bisa membantu mentor mengelola kursusnya
(`docs/STANDAR-PERAN.md` §2). Ditegakkan RLS, bukan oleh layar: server action
bisa dipanggil langsung lewat jaringan, jadi tombol yang tidak tampil bukan
penjaga.

`source_course_id` memakai `on delete set null` dengan sengaja — menghapus
kursus tidak boleh ikut menghapus soal yang sudah masuk bank.

## 3. Dua hal kecil yang menentukan apakah fiturnya terpakai

1. **Label (`tags`) dan pencarian.** Bank berisi 300 soal yang hanya bisa
   ditelusuri dengan menggulir sama saja dengan tidak punya bank. Pencariannya
   menyentuh teks soal maupun labelnya, karena penyusun mengingat soal lewat
   salah satu dari keduanya dan tidak selalu yang sama.
2. **Menyimpan borongan memaafkan soal yang belum jadi.** "Simpan N soal ke
   Bank" melewati soal yang teksnya masih kosong alih-alih menolak seluruh
   kumpulan. Penyusun biasanya menekannya setelah menulis sebagian; menolak
   semuanya karena satu soal kosong membuat tombolnya terasa rusak.

## 4. Pengacakan dan penarikan

Dua hal berbeda, keduanya sudah ada:

- **`quizzes.shuffle`** mengacak *urutan* soal dan pilihan jawaban. Benihnya
  id percobaan, jadi urutannya tetap selama percobaan berlangsung.
- **`quizzes.draw_count`** menarik *sebagian* soal — misalnya 10 dari 30 —
  sehingga tiap peserta menghadapi kumpulan yang berbeda. NULL berarti
  tampilkan semuanya.

### Soal yang ditarik disimpan, tidak dihitung ulang

Soal yang ditarik dicatat di `quiz_attempts.question_ids`, bukan diturunkan
dari benih seperti pengacakan urutan. Tiga alasannya:

1. **Penilaian harus memakai daftar yang persis sama dengan yang dilihat
   peserta.** Dua perhitungan terpisah — satu di JavaScript untuk tampilan,
   satu di plpgsql untuk penilaian — harus sepakat sampai elemen terakhir,
   selamanya. Sekali tidak sepakat, peserta dinilai atas soal yang tidak
   pernah ia lihat.
2. **Kalau nilainya dipersoalkan, harus bisa ditunjukkan soal mana saja yang
   ia hadapi.** Benih tidak menjawab itu dengan jujur.
3. **Penyusun bisa menambah atau menghapus soal kapan saja.** Daftar yang
   dihitung ulang akan ikut berubah, termasuk untuk percobaan yang sedang
   berlangsung.

### Pemilihannya di basis data, bukan di aplikasi

Percobaan dibuat oleh sesi **peserta**. Kalau aplikasi yang mengirim daftar
soalnya, peserta bisa mengirim daftarnya sendiri lewat REST — memilih sepuluh
soal termudah, atau satu soal saja. Trigger `draw_attempt_questions` menimpa
apa pun yang dikirim, jadi pemilihannya tidak pernah ada di tangan yang
dinilai. **Terbukti:** percobaan yang dikirim dengan empat soal pilihan
sendiri tersimpan hanya berisi satu soal yang dipilih server.

### Akibat yang harus disadari penyusun

Begitu tiap peserta mengerjakan kumpulan berbeda, **nilai antarpeserta tidak
lagi langsung sebanding**. Layar editor mengatakannya terus terang saat
penarikan dinyalakan, bukan membiarkannya ditemukan sendiri. Seluruh soal
karena itu harus setara tingkat kesulitannya.

`admin_question_difficulty` tetap benar tanpa perubahan: ia menghitung per
soal dari jawaban yang masuk, bukan per kuis.
