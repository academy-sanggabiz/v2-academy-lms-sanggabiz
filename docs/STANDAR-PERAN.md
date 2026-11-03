# Standar Peran: Peserta, Mentor, Superadmin

**Siapa boleh melakukan apa, dan kenapa batasnya di situ**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 31 Oktober 2026 |
| Berlaku pada | enum `public.user_role`, `is_admin()` / `is_superadmin()`, `proxy.ts`, seluruh layar `/admin` |

---

## 1. Tiga peran, bukan dua

| Peran | Sebutan di layar | Ringkasnya |
|---|---|---|
| `learner` | Peserta | Mengikuti kursus, mengerjakan kuis, menerima sertifikat |
| `mentor` | Mentor | Menyusun dan mengelola **kursus miliknya sendiri**, menilai peserta di kursus itu |
| `superadmin` | Superadmin | Semuanya, termasuk kursus milik mentor lain dan kursus milik perusahaan |

Pembagian ini mengikuti pola yang sudah mapan di LMS besar: Moodle memisahkan
*Teacher* (hanya kursus yang ditugaskan padanya) dari *Administrator* (akses
penuh ke seluruh situs), dan Canvas memisahkan *Teacher* dari *Account Admin*
dengan batas yang sama. Yang kita sebut Mentor adalah peran Teacher itu; yang
kita sebut Superadmin adalah Administrator.

**Kenapa "Mentor", bukan "Admin".** Orang di level tengah ini bukan pengurus
sistem — ia pengajar. Menyebutnya "admin" membuat dua pekerjaan yang sangat
berbeda terdengar sama, dan membuat peserta mengira ia bagian dari pengelola
platform. Istilah teknis di basis data pun ikut diganti supaya kode tidak
memakai kosakata yang berbeda dari layar.

## 2. Matriks kewenangan

| Kemampuan | Peserta | Mentor | Superadmin |
|---|:--:|:--:|:--:|
| Mengikuti kursus, kuis, sertifikat | ✓ | — | — |
| Membuat kursus baru | — | ✓ | ✓ |
| Menyunting kursus **miliknya** | — | ✓ | ✓ |
| Menyunting kursus **mentor lain** | — | — | ✓ |
| Menerbitkan kursus | — | ✓ (miliknya) | ✓ (semua) |
| Melihat peserta | — | ✓ (di kursusnya) | ✓ (semua) |
| Menilai esai | — | ✓ (di kursusnya) | ✓ (semua) |
| Melihat transaksi | — | ✓ (kursusnya) | ✓ (semua) |
| Menyunting halaman depan | — | — | ✓ |
| Melihat kinerja antar-mentor | — | — | ✓ |
| Mengubah peran orang lain | — | — | ✓ |

Aturan tunggal yang menurunkan separuh tabel di atas: **mentor hanya menyentuh
barisnya sendiri.** Di basis data itu satu ekspresi, `created_by = auth.uid()
or is_superadmin()`, yang dipakai ulang di setiap policy kursus. Tidak ada
daftar pengecualian per layar, karena daftar semacam itu selalu ketinggalan
satu layar.

## 3. Pemilik kursus: mentor atau perusahaan

`courses.created_by` menentukan siapa yang boleh menyuntingnya. Dari situ
muncul dua jenis kursus, tanpa perlu kolom tambahan:

- **Kursus mentor** — `created_by` menunjuk seorang mentor. Mentor itu
  mengelolanya; superadmin tetap bisa masuk dan membantu.
- **Kursus perusahaan** — `created_by` menunjuk seorang superadmin. Tidak ada
  mentor tertentu yang memilikinya; yang mengurus adalah perusahaan.

Dua hal yang sering tertukar dan sengaja dipisah di sini:

| | Menjawab | Disimpan di |
|---|---|---|
| **Pemilik** | Siapa yang boleh menyunting | `courses.created_by` |
| **Pengajar** | Nama siapa yang dilihat peserta di halaman kursus | `course_instructors` → `instructors` |

Satu kursus perusahaan bisa menampilkan mentor sebagai pengajarnya tanpa
memberi mentor itu hak menyunting, dan sebaliknya. Memaksa keduanya jadi satu
kolom akan membuat salah satunya bohong.

## 4. Superadmin menilai mentor

Superadmin bertanggung jawab atas mutu seluruh kursus, jadi ia perlu melihat
kinerja tiap mentor berdampingan — bukan menelusuri kursus satu per satu.
Angka yang ditampilkan dipilih dengan aturan `STANDAR-DIGITAL-LEARNING` §12:
rasio dan hasil, bukan sekadar jumlah yang hanya bisa naik.

| Kolom | Kenapa ini |
|---|---|
| Kursus (terbit / seluruhnya) | Berapa yang benar-benar sampai ke peserta, bukan berapa draf yang menumpuk |
| Peserta | Jangkauan nyata mentor itu |
| Tingkat penyelesaian | Apakah kursusnya diselesaikan, bukan sekadar didaftari |
| Nilai rata-rata ulasan | Suara peserta, dengan jumlah ulasannya supaya satu ulasan tidak terbaca sebagai tren |
| Esai menunggu dinilai | Beban kerja yang tertunggak, dan peserta yang sedang menunggu |

**Angka ini untuk membantu, bukan memeringkat.** Mentor dengan satu kursus
sulit untuk tiga peserta tidak sebanding dengan mentor berisi lima kursus
pengantar untuk dua ratus peserta. Karena itu tabelnya tidak diurutkan menurut
"skor" apa pun dan tidak ada peringkat; jumlah data yang mendasari tiap angka
selalu ikut ditampilkan.

## 5. Dashboard berbeda menurut peran

Satu halaman, dua isi, karena pertanyaan yang dibawa tiap peran berbeda:

- **Mentor** bertanya *"bagaimana kursus saya?"* — angkanya sudah otomatis
  terbatas pada kursus miliknya oleh policy yang sama di §2, jadi yang perlu
  dibenahi hanyalah labelnya: "Kursus Saya", "Peserta di Kursus Saya".
  Tanpa itu, mentor baru melihat "Total Peserta 0" dan mengira sistemnya rusak,
  padahal artinya "belum ada peserta di kursus Anda".
- **Superadmin** bertanya *"bagaimana platform ini?"* — angka seluruh
  platform, ditambah ringkasan per mentor dari §4.

## 6. Bagaimana seseorang menjadi mentor

**Superadmin mengangkat peserta yang sudah ada.** Tidak ada pendaftaran
mandiri sebagai mentor, dan itu disengaja: mentor melihat data peserta dan
membuat kursus. Posisi kepercayaan tidak pantas diambil dengan mengisi
formulir; kalaupun dibuat, ia tetap memerlukan antrean persetujuan — kerja
lebih banyak untuk hasil yang sama.

Tombolnya ada di layar detail peserta (`/admin/learners/<id>`), hanya tampil
untuk superadmin. Jalurnya dua arah: peserta → mentor → superadmin, dan
sebaliknya.

### Kenapa lewat fungsi basis data, bukan policy

Kolom `profiles.role` **tidak bisa ditulis pengguna biasa**. Sudah diuji:
peserta yang mencoba menaikkan perannya sendiri lewat REST ditolak `42501`,
sementara mengubah namanya sendiri tetap berhasil. Melonggarkan itu dengan
policy UPDATE akan membuka celah naik-peran yang sekarang tertutup rapat.

Karena itu perubahan peran lewat satu fungsi `security definer`,
`set_user_role()`, yang memeriksa kewenangan di dalamnya. Kolomnya tetap tidak
bisa disentuh lewat jalur lain mana pun.

Empat penjaga di dalamnya, dan masing-masing menutup kegagalan yang nyata:

| Penjaga | Kalau tidak ada |
|---|---|
| Hanya superadmin | Siapa pun bisa mengangkat dirinya sendiri |
| Tidak boleh mengubah peran sendiri | Satu salah klik mengunci superadmin keluar dari sistemnya |
| Superadmin terakhir tidak bisa diturunkan | Sistem tanpa superadmin hanya bisa dipulihkan lewat akses basis data langsung |
| Setiap perubahan dicatat di `role_changes` | Tidak ada cara menjawab "siapa mengangkat orang ini, kapan" |

Tabel `role_changes` **hanya bertambah** — tidak ada policy INSERT, UPDATE,
maupun DELETE untuk siapa pun; barisnya ditulis fungsi itu sendiri. Jejak yang
bisa disunting bukan jejak.

Terbukti: peserta biasa yang memanggil fungsi itu ditolak, superadmin berhasil
mengangkat dan jejaknya tercatat, dan superadmin yang mencoba mengubah
perannya sendiri ditolak dengan pesan yang menyebutkan alasannya. Penjaga
"superadmin terakhir" belum diuji dengan sengaja — mengujinya menuntut
menurunkan satu-satunya superadmin sungguhan.

### Satu jebakan yang ikut diperbaiki

`getAdminLearnerDetail()` dulu menyaring `role = 'learner'`. Akibatnya halaman
detail berubah menjadi 404 **tepat setelah** seseorang diangkat menjadi
mentor — sehingga tidak ada jalan untuk menurunkannya kembali. Penyaring itu
dicabut.

## 7. Yang tidak diubah

Rute tetap `/admin/**` untuk mentor maupun superadmin. Itu satu area kerja yang
sama dengan isi berbeda, dan mengganti awalan rute hanya memindahkan tautan
tanpa mengubah kewenangan apa pun. Fungsi `public.is_admin()` juga tetap
namanya: artinya "mentor atau superadmin", dan ia dipakai di puluhan policy
yang tidak perlu ikut goyah demi penamaan.

## 8. Sumber

- Moodle, *Managing Your Class* — peran bawaan Manager, Teacher, Non-editing
  Teacher, Student; administrator punya akses penuh ke seluruh situs.
  https://danielneis.github.io/how-to-use-moodle-27/chapter5.html
- Instructure, *Canvas Roles* — lima peran dasar tingkat kursus dan pemisahan
  kewenangan tingkat akun. https://developerdocs.instructure.com/services/canvas/external-tools/file.canvas_roles
- Teachfloor, *LMS User Roles* — pembagian tanggung jawab administrator,
  instruktur, dan peserta. https://www.teachfloor.com/blog/lms-user-roles
