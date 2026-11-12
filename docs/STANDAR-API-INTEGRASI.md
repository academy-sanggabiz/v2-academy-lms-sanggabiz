# Standar API integrasi dan webhook

Ditulis 12 November 2026, saat `/api/v1` dan webhook pertama kali dibuat.
Sebelum ini yang ada hanya `/api/public/stats` (angka agregat, tanpa
autentikasi) dan `/api/learning-events` (internal, memakai sesi peramban) —
tiga tabel integrasi sudah ada sejak migrasi MVP tetapi nol baris dan nol
kode yang menyentuhnya.

---

## 1. Kenapa bukan REST bawaan Supabase

Supabase sudah menyediakan REST atas setiap tabel, dan anon key-nya publik.
Yang dibutuhkan tim IT pelanggan bukan itu: mereka butuh kredensial yang bisa
**dicabut satu per satu** tanpa mengganggu integrasi lain, yang **haknya bisa
dibatasi** (baca saja), dan yang **pemakaiannya terlihat**. Tiga hal itu yang
diberikan `/api/v1`, dan ketiganya mustahil di atas satu kunci bersama.

## 2. Bentuk kunci

```
sgb_<8 huruf awalan>_<48 huruf rahasia>
```

Awalan disimpan apa adanya; **rahasianya tidak pernah disimpan** — hanya
SHA-256 dari kunci utuh. Dua akibat yang disengaja: kunci hanya bisa dilihat
sekali (basis data yang bocor tidak memberi satu pun kunci yang bisa dipakai),
dan pencarian tetap satu baris tanpa membandingkan hash seluruh tabel.

Perbandingan hash memakai `timingSafeEqual`. Perbandingan string biasa
berhenti pada huruf pertama yang berbeda, sehingga lama pemeriksaan
membocorkan berapa huruf awal yang sudah benar.

Awalan sengaja terlihat di layar: ketika sebuah kunci harus dicabut karena
bocor di log, orang perlu tahu kunci yang **mana**.

## 3. Nama ruas tetap bahasa Inggris

Berbeda dari seluruh antarmuka yang dwibahasa. Pembaca API bukan manusia yang
sedang belajar melainkan kode di sistem lain, dan ruas yang namanya berubah
bahasa adalah perubahan yang merusak. Aturan dwibahasa berlaku untuk
antarmuka, bukan kontrak mesin — sama dengan tajuk CSV penilaian.

## 4. Hanya satu jalan tulis

`POST /api/v1/enrollments`, dan itu disengaja. Yang benar-benar diminta
integrasi kepegawaian cuma satu: "orang ini baru masuk bagian itu, daftarkan
ke kursus wajibnya". Menyediakan tulis untuk kursus, pelajaran, atau nilai
berarti membuka jalan kedua ke data yang seluruh pagarnya — validasi kuis,
urutan pelajaran, syarat sertifikat — hidup di dalam aplikasi.

**Tidak pernah membuat akun.** Peserta yang belum ada dijawab `404`. Satu
salah ketik surel seharusnya tidak melahirkan orang yang tidak ada, lengkap
dengan riwayat belajar yang tidak bisa diklaim siapa pun.

## 5. Webhook: diantrekan basis data, dikirim aplikasi

Postgres di proyek ini tidak punya `pg_net` maupun `http`, jadi trigger tidak
bisa memanggil URL sendiri. Tetapi memindahkan pengirimannya ke kode aplikasi
saja juga salah: pendaftaran dibuat lewat **tiga** jalur berbeda, persis
alasan `notify_on_enrollment` dibuat sebagai trigger. Memanggil webhook dari
kode berarti menambah jalur keempat yang bisa dilupakan.

Jadi trigger **mencatat** kejadian ke `webhook_deliveries`, dan satu rute
terjadwal mengirimkannya. Satu kejadian tidak hilang hanya karena jaringan
penerima sedang mati, dan percobaan ulang jadi hal yang wajar.

**Trigger tidak boleh menjatuhkan pendaftaran.** Seluruh badan tiap trigger
dibungkus `exception when others then null`. Webhook adalah kabar keluar, dan
kabar yang gagal terkirim tidak sepadan dengan transaksi yang dibatalkan.

### Jam basis data, bukan jam aplikasi

Versi pertama pengirim menyaring `next_attempt_at <= <waktu dari Node>`,
padahal nilainya ditulis `now()` oleh Postgres. Dua jam yang berbeda
sepersekian detik membuat baris yang baru terantre **lewat** dari pengambilan
pertama lalu terkirim pada pengambilan berikutnya — terlihat seperti webhook
yang sesekali telat satu menit tanpa sebab. Sekarang pengambilannya lewat
fungsi SQL `webhook_antrean_siap()`. Perbandingan waktu harus terjadi di
tempat waktunya ditulis.

### Alamat dalam jaringan ditolak saat DISIMPAN

Rute pengirim berjalan di server kami, jadi URL apa pun yang tersimpan akan
dihubungi oleh server kami — termasuk alamat yang hanya bisa dicapai dari
dalam. Pintunya ditutup di tempat alamatnya disimpan, bukan nanti saat
dikirim: satu baris buruk yang terlanjur tersimpan akan dicoba berkali-kali
oleh penjadwal.

### Tanda tangan

`X-Sanggabiz-Signature: sha256=<hmac badan mentah>`. Tanpa itu penerima tidak
punya cara membedakan kabar dari kami dengan kabar dari siapa pun yang
menebak URL-nya. `deliveryId` tetap sama di tiap percobaan ulang, jadi
penerima bisa membuang kabar kembar.

## 6. Siapa yang boleh mengelola

`/admin/integrations` khusus **superadmin**. Satu kunci API membuka seluruh
daftar peserta dan pendaftaran lintas kursus, jauh melewati apa yang boleh
dilihat seorang mentor atas kursusnya sendiri.

Webhook mengirim nama dan email peserta ke alamat luar. Layarnya mengatakan
itu di tempat alamatnya didaftarkan, bukan di halaman kebijakan.
