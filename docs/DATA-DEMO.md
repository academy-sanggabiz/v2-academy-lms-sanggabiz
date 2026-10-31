# Data demo

Isi demo ini ada supaya setiap fitur LMS bisa dilihat bekerja tanpa menunggu
peserta sungguhan. Semuanya bertanda jelas: slug kursus diawali `kursus-demo-`
dan API publik menandainya `is_demo: true`, email peserta memakai domain
`contoh.test` yang memang dicadangkan untuk pengujian (RFC 6761) sehingga tidak
mungkin menabrak alamat milik orang lain.

## Akun peserta

| Nama | Email | Keadaan yang diperlihatkan |
| --- | --- | --- |
| Siti Rahayu | `siti.rahayu@contoh.test` | Satu kursus tuntas lengkap dengan sertifikat terbit, satu kursus baru dimulai |
| Budi Santoso | `budi.santoso@contoh.test` | Satu kursus tuntas tanpa sertifikat (kursusnya memang tidak mengaktifkan sertifikat), satu kursus tersendat di video yang belum selesai ditonton |
| Dewi Lestari | `dewi.lestari@contoh.test` | Baru mendaftar di satu kursus, dan gagal di percobaan pertama kuis kursus lain |

Kata sandinya sama untuk ketiganya dan **tidak ditulis di repositori ini**.
Ambil dari `.env.local` (`AUDIT_LEARNER_PASSWORD`), yang tidak ikut ke Git.
Ketiganya hanya berperan `learner`; tidak ada akun admin demo.

Akun-akun ini juga dipakai gerbang aksesibilitas. Dengan `AUDIT_LEARNER_EMAIL`
dan `AUDIT_LEARNER_PASSWORD` terisi, `npm run audit:a11y` ikut memeriksa
delapan halaman di balik login, bukan hanya halaman publik.

## Isi kursus

| Kursus | Status | Isi |
| --- | --- | --- |
| Dasar Keuangan untuk Usaha Kecil | terbit | 2 bagian, 5 pelajaran (teks, video bertranskrip, kuis 3 soal berpenjelasan), sertifikat aktif |
| Melayani Pelanggan lewat WhatsApp Bisnis | terbit | 1 bagian, 3 pelajaran, kuis 2 soal |
| Menyusun Laporan Penjualan Bulanan | draf | 1 pelajaran -- memperlihatkan tampilan kursus yang belum terbit |

## Cara data ini dibuat

`supabase/seed/01-kursus-demo.sql` dan `supabase/seed/02-peserta-demo.sql`
adalah catatan persis apa yang dijalankan, bukan skrip yang bisa diulang
sembarangan: id di dalamnya menunjuk baris yang sudah ada di basis data
produksi. Akun peserta sendiri dibuat lewat Admin API Supabase, bukan SQL,
supaya trigger `handle_new_user` ikut berjalan dan membuat baris `profiles`.

Satu hal yang sengaja **tidak** dipalsukan: nilai kuis. Percobaan kuis disisipkan
kosong lalu dinilai dengan memanggil `public.grade_attempt()` -- fungsi yang sama
dipakai `QuizPlayer` -- jadi angka 67, 100, dan 50 yang muncul di layar admin
benar-benar hasil penilaian aplikasi, bukan angka yang diketik tangan. Sertifikat
Siti pun terbit lewat `checkAndIssueCertificate()` saat akunnya membuka kursus,
lengkap dengan berkas PDF-nya, bukan baris `certificates` yang disisipkan manual.

## Yang masih placeholder

Kedua pelajaran video memakai cuplikan "Big Buck Bunny" dari Blender Foundation
(`YE7VzlLtp-4`) semata-mata untuk membuktikan pemutar video dan transkripnya
bekerja. Isinya jelas bukan materi kursus. Ganti `lessons.video_url` dengan
tautan YouTube Anda sendiri sebelum LMS ini ditunjukkan ke peserta sungguhan --
pemutar hanya menerima YouTube (`lib/courses.ts`, `getYouTubeEmbedUrl`), bukan
berkas MP4 langsung.

## Menghapus data demo

Hapus kursusnya (`delete from courses where slug like 'kursus-demo-%'`; bagian,
pelajaran, kuis, pendaftaran, dan progres ikut terhapus lewat cascade), lalu
hapus ketiga akun `@contoh.test` dari Authentication di dasbor Supabase.
