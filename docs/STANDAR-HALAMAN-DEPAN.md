# Standar Halaman Depan

Disusun 5 Nov 2026 dari dua masukan pemilik: "tata letaknya sama semua" dan
"dipercaya oleh bukan cuma kata-kata, langsung logonya". Acuan tata letaknya
halaman depan RevoU (revou.co, diukur 5 Nov 2026); warnanya tetap token kita
(`app/globals.css`). Dokumen ini mengikat `components/landing/LandingBlocks.tsx`
dan penyunting `/admin/landing`.

## 1. Temuan dari RevoU — yang ditiru dan yang tidak

| Yang diukur | RevoU | Kita |
|---|---|---|
| Judul utama | 80px, kapital, bold (Oswald) | `text-5xl sm:text-7xl`, kapital, bold, font kita |
| Judul bagian | 36px, kapital, rata tengah | `text-3xl sm:text-4xl`, kapital, rata tengah |
| Lebar isi | 1352px | `max-w-[1352px]` |
| Tombol utama | pil kuning | pil `bg-brand-gradient` |
| Latar hero | krem (#FEF6DC) | `bg-card` → `bg-background` (token kita) |
| **Urutan** | hero → bukti (rating + logo pemberi kerja) → program → sertifikasi univ → bisnis → alumni → komunitas (grid 9 foto) → kursus gratis → kontak | hero → logo → kursus/bidang → keunggulan → alumni → galeri → testimoni → pengajar → FAQ → CTA (urutan tetap bisa diubah penyusun) |

Prinsip yang diambil, bukan sekadar bentuknya:

1. **Bukti dulu, janji belakangan.** Rating dan logo pemberi kerja ada
   *sebelum* daftar program. Hero kita punya pita kepercayaan (teks +
   lencana rating), dan blok logo ada tepat di bawahnya.
2. **Logo adalah gambar, dengan angka.** Dinding logo RevoU menulis jumlah
   alumni di tiap logo ("BCA 56") dan menutup dengan "dan 500+ lainnya".
   Blok logo kita: gambar wajib (nama hanya `alt`), angka opsional per logo,
   keterangan penutup opsional. Dua varian: **dinding** (ubin ber-grid) dan
   **pita** (satu baris, untuk klien/institusi).
3. **Alumni = sebelum → sesudah + logo tempat kerja.** Kartu alumni: foto
   bulat 64px, nama, posisi sebelum, posisi sesudah, logo perusahaan,
   kutipan pendek (≤125 karakter), tautan profil.
4. **Komunitas difoto, bukan dideskripsikan.** Grid 9 foto. Blok **galeri**.
5. **Setiap bagian punya bentuk sendiri.** Tidak ada dua bagian berurutan
   dengan pola "judul tengah + grid kartu berbingkai". Hero dua kolom;
   logo dinding ubin; alumni kartu dengan foto; galeri mozaik; angka
   besar tanpa bingkai; CTA dua kolom (teks kiri, tombol kanan).

## 2. Tiga sumber isi — dan tombol pemilihnya

Isi halaman depan datang dari tiga sumber, dan penyusun harus tahu yang mana:

| Sumber | Blok | Aturan |
|---|---|---|
| **Diketik** (di luar LMS) | hero, logo, alumni, galeri, keunggulan, langkah, FAQ, CTA | Datanya memang tidak ada di LMS (mitra, alumni, foto acara). Diunggah manual lewat penyunting, **banyak sekaligus**. |
| **Data real** (dari LMS) | kategori, kursus | Selalu real: isinya memang tabel LMS. |
| **Pilih: real / manual** | angka platform, testimoni, pengajar | LMS punya datanya, tetapi pemilik boleh memilih mengetik sendiri. Pemilihannya tombol dua pilihan di blok, dengan peringatan: *angka manual tidak memperbarui dirinya*. Bawaan: real. |

Keputusan pemilik 5 Nov 2026: tombol real/manual menggantikan aturan lama
"angka tidak boleh diketik". Risiko basinya tetap disebut di petunjuk blok.

## 3. Unggah massal

Blok yang isinya gambar (logo, galeri) punya **zona unggah banyak berkas**:
pilih atau seret belasan berkas sekaligus, masing-masing jadi satu butir,
nama butir diturunkan dari nama berkas dan boleh disunting. Unggah satu per
satu tetap ada untuk mengganti satu gambar.

Berkas masuk bucket **`landing-assets`** (publik baca, admin tulis; migrasi
`20261105020000_landing_assets_bucket.sql`). PNG/JPG/WebP, maksimal 5 MB.
SVG sengaja ditolak (bisa memuat skrip di bucket publik — kebijakan yang
sama dengan bucket lain); ekspor logo ke PNG/WebP dengan latar transparan.

## 3b. Huruf, latar, dan irama bidang

| | RevoU | Kita |
|---|---|---|
| Huruf judul | Oswald, padat, kapital | **Oswald** juga -- lisensi SIL OFL, bebas dipakai |
| Huruf isi | geometris | Poppins (tetap) |
| Latar hero | krem polos | teal lembut + kisi samar (`.landing-grid`) |
| Bidang gelap | navy, untuk komunitas | `bg-foreground` + `text-background`, untuk galeri |

Tiga hal yang mengikat:

1. **Oswald hanya untuk halaman depan.** Tokennya `--font-display`, dipakai
   `LandingBlocks`. Token `--font-heading` yang menata judul dialog dan kartu
   di seluruh aplikasi tidak disentuh: mengganti huruf di sana berarti
   mengganti huruf layar belajar dan layar pengelola juga.
2. **Kapital hanya untuk frasa pendek.** Judul bagian dan judul hero boleh
   kapital semua; judul langkah tidak, karena itu kalimat, dan kalimat penuh
   berhuruf kapital lebih lambat dibaca.
3. **Bidang gelap memakai pasangan `foreground`/`background`, bukan warna
   lepas.** Pasangan itu persis yang sudah dijamin `checkTheme()` melewati
   4,5:1, jadi bidang gelap ikut tema pilihan pemilik tanpa bisa menjatuhkan
   kontras. Garis kisi di hero ditarik dari `--ring` dengan alasan yang sama.

## 4. Yang tidak berubah

- Blok tetap jsonb (`landing_content.blocks` / `blocks_en`), dua bahasa,
  pratinjau langsung memakai perender yang sama dengan halaman publik.
- Social proof memakai pihak rekaan sampai pemiliknya mengganti dengan yang
  nyata dan berizin (lihat CLAUDE.md "Social proof names invented parties").
- Blok kosong tidak dirender.
