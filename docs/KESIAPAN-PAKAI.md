# Kesiapan pakai

Catatan jujur tentang apa yang sudah terbukti bekerja dan apa yang belum, per
2026-10-31. "Terbukti" di sini berarti dijalankan sendiri di aplikasi dan
hasilnya diperiksa di basis data -- bukan dibaca dari kode.

## Sudah terbukti bekerja

| Alur | Cara dibuktikan |
| --- | --- |
| Masuk peserta dan admin | Masuk sebagai tiga akun demo dan superadmin |
| Daftar kursus sendiri | Menekan "Ikuti kursus"; baris `enrollments` dan `transactions` muncul |
| Membaca pelajaran teks, video, slide | Dibuka satu per satu; transkrip video tampil |
| Menandai pelajaran selesai | "Selesai & lanjut"; `lesson_progress` berubah dan pindah pelajaran |
| Catatan pribadi per pelajaran | Tersimpan otomatis, hanya terlihat pemiliknya |
| Mengerjakan kuis dan mengulang | Percobaan ke-2 Dewi: 2 dari 2 benar, lulus, penjelasan per soal tampil |
| Menuntaskan kursus | `enrollments.status` jadi `completed` lewat jalur aplikasi |
| Sertifikat terbit dan diunduh | PDF nyata terbentuk, HTTP 200, tombol "Unduh" aktif tanpa syarat |
| Profil dan ganti kata sandi | Nama diubah lewat form, tersimpan dan tampil |
| Riwayat pembelian | Enam transaksi tampil dengan tanggal dan status |
| Notifikasi | Tiga pemberitahuan, seluruhnya Bahasa Indonesia |
| Membuat kursus dari nol | Draf dibuat, modul dan pelajaran ditambah, tersimpan |
| Gerbang terbit | Menolak kursus berisi pelajaran kosong dengan alasan yang jelas |
| Layar admin | Dashboard, peserta, pelacakan, penilaian, halaman depan, pengaturan |
| API publik | Angka agregat benar; jumlah peserta di bawah 5 disembunyikan |
| Aksesibilitas | `npm run audit:a11y` 54/54 halaman, dua lebar layar, tiga kali berturut |

## Belum siap, dan kenapa

### 1. Pengiriman email -- ini penghalang sebenarnya

Supabase memakai layanan email bawaannya, yang dibatasi beberapa email per jam
dan memang dinyatakan bukan untuk produksi. Sementara itu
`auth.email.enable_confirmations = true`, artinya pendaftar baru harus
mengonfirmasi lewat email sebelum bisa masuk.

Akibatnya begitu ada lebih dari segelintir pendaftaran dalam satu jam, email
konfirmasi dan email atur-ulang kata sandi berhenti terkirim, tanpa pesan galat
yang terlihat peserta.

Yang perlu Anda sediakan: satu akun penyedia email (Resend, SendGrid, Amazon
SES, atau SMTP kantor), lalu isi `[auth.email.smtp]` di `supabase/config.toml`
dan jalankan `supabase config push`. Saya tidak bisa membuatkan akunnya.

Kalau belum mau mengurus itu sekarang, pilihan lain: matikan konfirmasi email
(`enable_confirmations = false`) sehingga pendaftaran langsung aktif. Lebih
longgar dari sisi keamanan, dan atur-ulang kata sandi tetap butuh email.
Pilihan ini milik Anda, bukan saya.

### 2. Pembayaran

Tidak ada gerbang pembayaran di aplikasi ini. Kursus berbayar kini **ditolak**
untuk pendaftaran mandiri, dengan pesan yang mengarahkan peserta ke pengelola;
admin yang mendaftarkan peserta dari `/admin/learners` tetap bisa, dan
transaksinya tercatat. Jadi penjualan bisa berjalan dengan konfirmasi
pembayaran di luar sistem.

Kalau Anda ingin peserta membayar sendiri, itu pekerjaan tersendiri:
memasang Midtrans/Xendit, halaman pembayaran, dan webhook yang membuka akses
hanya setelah pembayaran sah.

### 3. Berkas sertifikat bisa dibaca siapa pun yang punya tautannya

Bucket `certificate-assets` bersifat publik. Isinya tidak bisa didaftar tanpa
izin -- sudah diuji dengan kunci anon, hasilnya kosong -- tetapi satu tautan
langsung berisi UUID acak dapat dibuka siapa saja, dan di dalamnya ada nama
peserta dan judul kursus.

Untuk sertifikat yang memang dimaksudkan untuk dibagikan, ini wajar dan sama
seperti kebanyakan platform. Kalau Anda ingin lebih tertutup, perlu diubah jadi
bucket privat dengan tautan bertanda tangan berumur pendek. Itu keputusan Anda.

### 4. Isi video masih contoh

Lihat `docs/DATA-DEMO.md`. Pemutar hanya menerima tautan YouTube.

### 5. Pengaturan notifikasi email belum berfungsi

Pilihannya tersimpan, tapi tidak ada yang mengirim email pemberitahuan.
Keterangannya di layar sudah menyebutkan hal ini apa adanya. Begitu butir 1
selesai, ini bisa dihidupkan.

## Yang sudah diatur di Supabase

- `site_url` dan daftar redirect sudah menunjuk domain produksi dan
  `localhost:3270`; atur-ulang kata sandi mendarat di tempat yang benar.
- Panjang minimum kata sandi dinaikkan dari 6 ke 8 (NIST SP 800-63B), dan
  aplikasi memakai satu konstanta `MIN_PASSWORD_LENGTH` agar tidak berbeda
  dengan pengaturan server.
- Masuk dengan Google aktif dan sudah diuji mengarah ke Google dengan benar.
  Rahasianya tersimpan di proyek Supabase, bukan di repositori; karena
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` tidak diisi di mesin pengembang,
  `supabase config push` melewatinya dan tidak akan menghapusnya.
- Kebijakan RLS, view agregat publik, dan penguncian penerbitan sertifikat
  sudah diterapkan (lihat `docs/SECURITY-REVIEW.md`).
