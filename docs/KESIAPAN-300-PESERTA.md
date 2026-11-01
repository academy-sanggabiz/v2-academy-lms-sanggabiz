# Kesiapan untuk 300 Peserta

**Batas yang akan ditabrak saat acara, dan urutan menanganinya**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 1 November 2026 |
| Berlaku pada | Pengaturan Supabase Auth, `scripts/buat-akun-massal.mjs` |

---

## 1. Ringkasnya

| Batas | Angka | Lingkup | Bisa diubah? |
|---|---|---|---|
| Email layanan bawaan Supabase | **2 per jam** | per proyek | hanya dengan SMTP sendiri |
| Email setelah SMTP sendiri dipasang | 30 per jam (bawaan) | per proyek | ya, di Rate Limits |
| **Pendaftaran + masuk** | **30 per 5 menit** | **per alamat IP** | ya |
| Penyegaran token | 150 per 5 menit | per alamat IP | ya |
| Lupa sandi | 30 per 5 menit | per alamat IP | ya |
| Brevo paket gratis | 300 per hari, **gabungan** kampanye + transaksional | per akun Brevo | paket berbayar |

Keadaan proyek saat dokumen ini ditulis: `mailer_autoconfirm = false` (konfirmasi
email **menyala**) dan belum ada SMTP sendiri — jadi setiap pendaftaran
mengirim email lewat layanan **2 pesan per jam**. Orang ketiga yang mendaftar
dalam satu jam sudah tidak menerima apa-apa. Masuk Google sudah aktif, dan
pendaftaran lewat Google tidak mengirim email konfirmasi sama sekali.

## 2. Risiko terbesarnya bukan email

Yang paling sering luput: **batas pendaftaran dan masuk dihitung per alamat
IP, bukan per orang.** Tiga ratus peserta di satu ruangan memakai satu WiFi,
dan dari sisi Supabase mereka adalah satu alamat IP yang sama.

30 permintaan per 5 menit berarti, dalam skenario paling baik, 300 orang butuh
**sekitar 50 menit** hanya untuk masuk bergantian — dan yang kena batas tidak
melihat pesan yang menolong, mereka hanya melihat gagal masuk. Di tengah
presentasi, itu terbaca sebagai "aplikasinya rusak".

Menaikkan batas email tanpa menaikkan batas per-IP tidak menyelesaikan apa pun.

## 3. Urutan yang disarankan

**Pertama — buat akunnya jauh hari, jangan pada hari acara.**

```bash
cd "/Users/muhammadmuchson/claude code/v2-academy-lms-sanggabiz"
node scripts/buat-akun-massal.mjs daftar.csv            # uji coba
APPLY=1 node scripts/buat-akun-massal.mjs daftar.csv    # benar-benar membuat
```

Berkas daftarnya CSV sederhana `nama,email`, satu peserta per baris; contoh
siap pakai ada di `contoh-daftar-peserta.csv`. Berkas masukan dan `.env.local`
dicari relatif terhadap akar proyek, jadi perintahnya tetap jalan walau
dipanggil dari folder lain.

Akun dibuat lewat jalur admin: langsung terkonfirmasi, **tanpa mengirim satu
email pun**, dan tanpa menyentuh batas pendaftaran per-IP. Kata sandinya
ditulis ke berkas ber-izin `600`, tidak pernah ke layar. Alatnya aman
dijalankan ulang — email yang sudah punya akun dilewati.

Ini menyelesaikan dua masalah sekaligus dan tidak bergantung pada pengaturan
apa pun yang harus diubah lebih dulu.

**Kedua — naikkan batas per-IP di dasbor Supabase.**
Authentication → Rate Limits:

- *Sign ups and sign ins*: dari 30 per 5 menit → **300** per 5 menit
- *Token refreshes*: dari 150 → **1000** per 5 menit
- *Password verifications*: dari 30 → **100** per 5 menit

Tetap dibutuhkan walau akun dibuat lebih dulu: 300 orang **masuk** pada menit
yang sama tetap satu IP yang sama.

**Ketiga — pasang SMTP sendiri.**
Authentication → Emails → SMTP Settings. Setelahnya naikkan juga
*Rate Limits → Emails* dari 30 per jam ke angka yang masuk akal.

Soal Brevo: paket gratisnya **300 email per hari, gabungan** kampanye dan
transaksional. Kalau 300 orang mendaftar sendiri pada hari yang sama, kuota
itu habis persis di angka itu — tanpa sisa untuk lupa sandi, percobaan ulang,
atau email yang nyasar. Dengan akun dibuat lebih dulu, email hanya terpakai
untuk lupa sandi, dan 300 per hari lebih dari cukup.

Kesimpulannya: **Brevo gratis memadai bila akun dibuat lebih dulu; tidak
memadai bila 300 orang mendaftar sendiri pada hari-H.**

## 4. Yang sudah dipastikan aman

- **Jumlah pengguna.** Paket gratis Supabase menampung 50.000 pengguna aktif
  bulanan; 300 tidak mendekati batas itu.
- **Koneksi basis data.** Aplikasi memakai PostgREST lewat HTTP, bukan koneksi
  Postgres langsung, jadi 300 orang membuka halaman bersamaan tidak menghabiskan
  pool koneksi.
- **Pembuatan akun massal** sudah diuji ujung ke ujung: akun dibuat, profil
  peserta ikut terbentuk, dan akunnya terbukti bisa dipakai masuk.

## 5. Yang masih perlu dicoba sebelum hari-H

Angka di atas berasal dari dokumentasi dan dari konfigurasi proyek yang dibaca
langsung, bukan dari uji beban. Yang belum pernah diuji: 300 orang benar-benar
masuk bersamaan dari satu jaringan. Sebelum acara, coba sekali dengan 20-30
orang dari satu WiFi yang sama; kalau batas per-IP sudah dinaikkan, itu sudah
cukup untuk memastikan jalurnya bersih.
