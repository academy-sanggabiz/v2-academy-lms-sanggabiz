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

## 4. Dua tempat yang mudah terlupa

1. **Skema validasi draf** (`lib/course-draft.ts`). `certificate_type` wajib
   `.nullable()`. Tanpa itu, memilih "Ikut Pengaturan Utama" membuat seluruh
   draf gagal divalidasi dan tombol Simpan diam saja — kelas bug yang sama
   dengan pengurai impor yang pernah menghasilkan draf tak tersimpan.
2. **Antarmuka harus mengatakan apa yang diwarisi.** Ruas kosong tanpa
   keterangan terbaca sebagai "sertifikatnya memang akan kosong". Karena itu
   `resolveCertificateSettings()` mengembalikan `inherited` per ruas, bukan
   hanya nilai akhirnya, dan layar penyusun menampilkan nilai yang akan
   dipakai.

## 5. Jeda antara kode dan basis data

Migrasi proyek ini dijalankan tangan lewat SQL Editor Supabase
(`docs/DEPLOY-VERCEL.md`), jadi selalu ada jeda antara kode ter-deploy dan
SQL-nya dijalankan. Selama jeda itu `certificate_defaults` belum ada.

Karena itu `getCertificateDefaults()` mengembalikan bawaan bawaan-kode ketika
tabelnya tidak ada, bukan melempar galat: sertifikat tetap terbit dengan
bentuk lama, dan layar `/admin/certificates` menjelaskan apa yang perlu
dijalankan alih-alih gagal.
