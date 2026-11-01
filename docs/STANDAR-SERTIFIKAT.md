# Standar Sertifikat

**Pengaturan utama perusahaan, dan bagaimana sebuah kursus mewarisinya**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 1 November 2026 |
| Berlaku pada | `lib/certificate-settings.ts`, `lib/certificate-defaults-server.ts`, `app/admin/certificates/`, `lib/certificates.ts` |

---

## 1. Masalahnya: penanda tangan yang sama diketik berulang

Sebelum ini setiap kursus harus mengisi sendiri nama penanda tangan,
jabatannya, dan gambar tanda tangannya. Untuk kursus milik perusahaan sendiri
itu pekerjaan yang sama persis setiap kali — dan setiap salinan adalah satu
kesempatan salah ketik. Perbedaan sungguhan baru muncul saat bekerja sama
dengan perusahaan lain, yang memang ingin nama dan tanda tangannya sendiri.

Jadi yang dibutuhkan bukan "sertifikat yang bisa dikustomisasi" saja,
melainkan **satu pengaturan utama yang diwarisi, dengan kemungkinan
menyimpang per kursus**.

## 2. Aturannya satu kalimat

> **NULL pada kolom kursus berarti "ikut pengaturan utama", bukan
> "kosongkan".**

Pewarisannya **per ruas**, bukan satu saklar untuk seluruh sertifikat. Sebuah
kursus bisa memakai nama penanda tangan sendiri sambil tetap mewarisi
jabatan, templat, dan deskripsinya. Saklar tunggal akan memaksa penyusun
menyalin ulang semua ruas lain hanya untuk mengubah satu nama — persis
masalah yang sedang dipecahkan.

`enabled` sengaja **tidak** diwarisi: apakah sebuah kursus menerbitkan
sertifikat sama sekali adalah keputusan kursus itu, bukan keputusan
perusahaan.

### Konsekuensi yang harus disadari

Kursus tidak bisa lagi menyatakan "tanpa penanda tangan" dengan mengosongkan
ruasnya. Itu disengaja: sertifikat tanpa penanda tangan terlihat belum
selesai, dan tidak pernah ada yang memintanya. Kalau suatu saat dibutuhkan,
tambahkan penanda eksplisit — **jangan memaknai ulang NULL.**

Baris pengaturan kursus yang dibuat sebelum perubahan ini menyimpan
`certificate_type = 'completion'` secara eksplisit, jadi kursus itu tidak
ikut mewarisi jenis sertifikat sampai penyusunnya memilih "Ikut Pengaturan
Utama". Tidak ada kursus yang berubah perilakunya karena migrasi.

## 3. Siapa yang boleh mengubah apa

Pengaturan utama hanya bisa diubah **superadmin** (`/admin/certificates`,
RLS `is_superadmin()`). Ini wajah perusahaan pada dokumen resmi; mentor
mengatur sertifikat kursusnya sendiri, bukan milik semua orang
(`docs/STANDAR-PERAN.md` §2).

Letaknya sengaja terpisah dari `/admin/settings`, yang berisi pengaturan
pribadi akun — notifikasi dan kata sandi. Mencampur keduanya membuat
pengaturan perusahaan terlihat seperti preferensi pribadi.

**Tabelnya bisa dibaca anon dan authenticated, dan itu disengaja.**
Penerbitan sertifikat (`lib/certificates.ts`) membaca pengaturan memakai
klien milik **peserta**. Kalau tabel ini hanya bisa dibaca pengelola, setiap
sertifikat yang mewarisi pengaturan utama akan terbit tanpa penanda tangan —
gagal diam-diam, pada dokumen yang justru paling terlihat. Isinya memang
tampil di muka sertifikat yang dibagikan, jadi tidak ada yang rahasia.

## 4. Satu kelas bug yang sudah dua kali terjadi

Bentuknya selalu sama: sebuah ruas sertifikat baru ditambahkan ke skema draf,
kolomnya belum ada di basis data karena migrasi dijalankan tangan, baris lama
mengembalikan `undefined`, dan validasi menolak **seluruh** draf. Akibatnya
setiap kursus yang punya baris sertifikat tidak bisa disimpan sama sekali --
dengan pesan yang menunjuk sertifikat padahal penyusunnya sedang menyunting
deskripsi.

Penutupnya `normalizeCourseCertificateSettings()`: satu fungsi yang melengkapi
baris dari basis data sehingga setiap ruas pasti ada. **Menambah ruas
sertifikat baru berarti menambahkannya di sana juga.** Dengan begitu kolom
yang belum ada menghasilkan NULL ("ikut pengaturan utama"), bukan draf yang
gagal divalidasi.

Setiap ruas sertifikat juga wajib punya entri di `CERTIFICATE_LABEL_OF`
(`lib/course-draft-issues.ts`). Tanpa itu pesannya jatuh ke sebutan umum
"Pengaturan sertifikat", dan penyusun membaca keluhan tentang ruas yang tidak
pernah ia sentuh.

## 5. Dua tempat yang mudah terlupa

1. **Skema validasi draf** (`lib/course-draft.ts`). `certificate_type` wajib
   `.nullable()`. Tanpa itu, memilih "Ikut Pengaturan Utama" membuat seluruh
   draf gagal divalidasi dan tombol Simpan diam saja — kelas bug yang sama
   dengan pengurai impor yang pernah menghasilkan draf tak tersimpan.
2. **Antarmuka harus mengatakan apa yang diwarisi.** Ruas kosong tanpa
   keterangan terbaca sebagai "sertifikatnya memang akan kosong". Karena itu
   `resolveCertificateSettings()` mengembalikan `inherited` per ruas, bukan
   hanya nilai akhirnya, dan layar penyusun menampilkan nilai yang akan
   dipakai.

## 6. Jeda antara kode dan basis data

Migrasi proyek ini dijalankan tangan lewat SQL Editor Supabase
(`docs/DEPLOY-VERCEL.md`), jadi selalu ada jeda antara kode ter-deploy dan
SQL-nya dijalankan. Selama jeda itu `certificate_defaults` belum ada.

Karena itu `getCertificateDefaults()` mengembalikan bawaan bawaan-kode ketika
tabelnya tidak ada, bukan melempar galat: sertifikat tetap terbit dengan
bentuk lama, dan layar `/admin/certificates` menjelaskan apa yang perlu
dijalankan alih-alih gagal.

## 7. Tata letak, dan kenapa hanya tiga

`klasik` (bingkai ganda, rata tengah), `modern` (pita warna di tepi kiri,
teks rata kiri), `formal` (garis tipis, penanda tangan di tengah bawah).
Masing-masing menjawab keperluan berbeda, bukan selera: bentuk yang paling
dikenali di Indonesia, bentuk korporat, dan bentuk dokumen resmi
antarlembaga.

Daftarnya sengaja pendek. Tata letak yang banyak membuat penyusun memilih
berdasarkan tampilan kecil di layar pengaturan, lalu sertifikat satu lembaga
jadi berbeda-beda antar kursus tanpa alasan.

Menambah tata letak berarti menambah **dua** hal: satu entri di
`CERTIFICATE_LAYOUTS` dan satu nilai di check constraint migrasi
`20261101120000`. Menambah salah satunya saja menghasilkan pilihan yang
ditolak basis data saat disimpan.

## 8. Pratinjau memakai dokumen yang sama dengan hasil terbitnya

`/admin/certificates/preview` merender **PDF sungguhan** lewat
`CertificateDocument` yang sama persis dengan yang dipakai saat sertifikat
diterbitkan. Tiruan HTML akan jauh lebih ringan, tetapi ia menua sendiri:
begitu dokumen aslinya berubah, pratinjaunya berbohong — dan pratinjau yang
berbohong lebih buruk daripada tidak ada pratinjau, karena orang memutuskan
berdasarkan apa yang dilihatnya.

Dua hal yang perlu diingat saat menyentuh bagian ini:

1. **Permintaan dijeda, bukan dikirim per ketikan.** Tiap render memanggil
   server; merender di setiap ketikan berarti puluhan permintaan untuk satu
   kalimat deskripsi. Balasan yang sudah usang juga dibuang, supaya
   permintaan lambat yang dikirim lebih dulu tidak menimpa hasil terbaru.
2. **Bingkainya tidak di-`sandbox`.** Penampil PDF bawaan browser tidak
   berjalan di dalam bingkai ber-`sandbox` kosong, dan hasilnya bingkai putih
   tanpa pesan apa pun. Dokumennya memang buatan sendiri — react-pdf tidak
   menyisipkan skrip, dan gambarnya diambil di server. Tautan "Buka di tab
   baru" tetap selalu ada untuk browser yang tidak menampilkan PDF di dalam
   halaman.
