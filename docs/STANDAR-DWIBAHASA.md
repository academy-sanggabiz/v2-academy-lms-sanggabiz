# Standar Dwibahasa

**Bagaimana teks di LMS ini disajikan dalam Bahasa Indonesia dan Inggris**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 31 Oktober 2026 |
| Berlaku pada | `lib/i18n/`, `components/i18n/`, `app/layout.tsx`, seluruh komponen berteks |

---

## 1. Keputusan arsitektur: bahasa tidak ada di alamat URL

Panduan resmi Next.js menganjurkan `/[lang]/...` dan menyarankan menyarangkan
seluruh `app/` di bawah satu segmen bahasa. Untuk situs publik itu memang
pilihan yang benar. LMS ini tidak memakainya, dan alasannya perlu dicatat
supaya keputusan ini bisa ditinjau ulang kalau keadaannya berubah.

**Yang didapat dari alamat berbahasa** hampir seluruhnya untuk halaman publik:
tautan bisa dibagikan dalam bahasa tertentu, dan mesin pencari bisa mengindeks
kedua bahasa. Di LMS ini halaman publiknya hanya halaman depan, halaman masuk
dan daftar, serta halaman kebijakan. Sisanya — seluruh area peserta dan
pengelola — ada di balik login dan tidak pernah diindeks siapa pun.

**Ongkosnya** adalah setiap penjaga peran di `proxy.ts` harus sadar bahasa.
Penjaga-penjaga itu mencocokkan awalan jalur (`/learner`, `/admin`,
`/auth/sandi-baru`), dan ketiganya baru saja ketahuan tidak pernah berfungsi
selama berbulan-bulan tanpa satu galat pun — karena klaim peran di JWT kosong.
Menambahkan satu segmen di depan setiap pencocokan adalah cara paling mudah
mengulangi kejadian itu, dan kegagalannya akan sama diamnya.

Karena itu bahasa disimpan sebagai **preferensi orangnya**:

| Tempat | Perannya |
|---|---|
| Cookie `bahasa` | Menentukan tampilan permintaan ini; berlaku juga sebelum masuk |
| `profiles.locale` | Menyimpan pilihan supaya ikut berpindah perangkat |
| Header `Accept-Language` | Dipakai hanya bila belum pernah memilih |

Cookie yang dibaca saat render, bukan kolomnya, supaya tiap halaman tidak
membayar satu query basis data tambahan.

## 2. Harga yang dibayar, apa adanya

Membaca cookie di layout akar membuat **seluruh halaman menjadi dinamis**.
Sebelum perubahan ini, `/auth/lupa-sandi`, `/legal/privasi`,
`/auth/learner/signup`, dan `/auth/auth-code-error` dirender saat build dan
disajikan dari CDN. Sekarang keempatnya dirender per permintaan.

Halaman depan `/` tidak terpengaruh — ia memang sudah dinamis sejak awal
karena membaca daftar kursus dari basis data.

Ini trade-off sungguhan, bukan sesuatu yang bisa dihindari dengan cara lain
selain alamat berbahasa. Keempat halaman itu lalu lintasnya rendah dan
fungsinya berjalan di Singapura bersama basis datanya, jadi dampaknya kecil —
tetapi kalau suatu saat halaman publik perlu statis lagi, caranya adalah
memberi **halaman publik saja** alamat berbahasa, tanpa menyentuh area di
balik login.

## 3. Aturan menulis teks

**B1 — Tidak ada kalimat baru yang ditulis langsung di komponen.** Semua teks
antarmuka masuk `lib/i18n/dictionaries.ts`. Tipe `Dictionary` membuat
TypeScript menolak kunci yang hanya ada di satu bahasa, jadi terjemahan yang
tertinggal ketahuan saat kompilasi, bukan saat dibaca pengguna.

**B2 — Kedua bahasa berdampingan dalam satu berkas.** Bukan satu berkas per
bahasa. Saat menyunting sebuah kalimat, pasangannya terlihat tepat di bawahnya.

**B3 — `<html lang>` wajib ikut berganti.** Bukan hanya teksnya. Pembaca layar
memilih suara dan aturan pelafalan dari atribut itu (WCAG 2.2 SC 3.1.1);
halaman berbahasa Inggris dengan `lang="id"` akan dibacakan dengan pelafalan
Indonesia dan sering tidak bisa dipahami.

**B4 — Nama bahasa ditulis dalam bahasanya sendiri.** "English", bukan
"Inggris". Orang yang tidak bisa membaca bahasa yang sedang aktif tetap harus
bisa mengenali pilihannya.

**B5 — Isi kursus bukan urusan kamus ini.** Judul pelajaran, materi, dan soal
ditulis pengajar dan tersimpan di basis data. Menerjemahkannya berarti kolom
terjemahan per baris dan alur penyuntingan dwibahasa di editor kursus —
pekerjaan tersendiri yang dicatat di `docs/BACKLOG.md`.

## 4. Keadaan saat ini

Kerangkanya sudah berdiri dan dipakai. Yang sudah diterjemahkan: atribut
`lang`, tautan lewati-ke-konten, dan seluruh halaman masuk. Sisanya menyusul
bertahap; setiap layar yang disentuh berikutnya dipindahkan ke kamus sekalian.

Pemilih bahasanya berupa dua tombol, bukan menu: untuk dua pilihan, dropdown
hanya menyembunyikan keduanya di balik satu ketukan tambahan. Keadaan aktif
dinyatakan `aria-pressed`, jadi pembaca layar menyebutkannya tanpa perlu
membuka apa pun.

## 5. Sumber

- Next.js, *Internationalization* (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`)
- W3C, *WCAG 2.2* SC 3.1.1 Language of Page dan SC 2.5.8 Target Size
