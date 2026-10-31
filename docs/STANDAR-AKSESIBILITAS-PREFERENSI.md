# Standar Preferensi Tampilan

**Kenapa LMS ini tidak memakai widget aksesibilitas, dan apa yang dipakai sebagai gantinya**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 31 Oktober 2026 |
| Berlaku pada | `lib/preferences/`, `components/preferences/`, `app/globals.css` |

---

## 1. Yang diminta dan yang sebenarnya dibutuhkan

Permintaannya: menu aksesibilitas untuk mengganti warna, memperbesar huruf,
dan semacamnya. Risetnya menghasilkan satu temuan yang mengubah bentuk
pekerjaannya, jadi dicatat lebih dulu.

**Produk "accessibility overlay" — widget mengambang yang mengaku membuat
situs patuh WCAG — ditolak keras oleh komunitas aksesibilitas.** Dalam survei
WebAIM, 67% praktisi menilainya tidak efektif, dan angkanya naik menjadi 72%
di antara responden penyandang disabilitas. *Overlay Fact Sheet*, yang
ditandatangani lebih dari 800 profesional aksesibilitas, menyatakan tidak ada
satu pun produk overlay yang bisa membuat situs benar-benar memenuhi standar
mana pun. The A11Y Project menyebutnya "merugikan dan langkah mundur". Pada
2023, 933 bisnis yang memasang widget semacam itu tetap digugat — naik 62%
dari tahun sebelumnya — dan FTC mendenda accessiBe satu juta dolar atas klaim
yang menyesatkan.

Dua alasan teknisnya penting untuk dipahami, bukan sekadar diikuti:

1. **Overlay tidak memperbaiki hambatan yang sebenarnya.** Alt text yang
   hilang, label yang salah, takarir video, urutan fokus, dan akses papan
   ketik ada di struktur halaman. Lapisan JavaScript di atasnya tidak bisa
   menebak apa maksud sebuah gambar.
2. **Banyak overlay justru merusak alat bantu yang sudah bekerja.** Ia
   menimpa peran ARIA dan menangkap fokus, sehingga pembaca layar yang tadinya
   berfungsi jadi kacau.

Ada juga soal privasi: widget yang menanyakan "disabilitas Anda apa" lalu
menyimpan jawabannya sedang mengumpulkan data kesehatan.

## 2. Jadi apa yang kita buat

Kebutuhan di balik permintaan itu nyata: ada orang yang butuh teks lebih besar
atau kontras lebih tegas. Yang dibangun adalah **preferensi tampilan biasa**,
dan tiga hal membedakannya dari overlay:

| | Overlay | Yang kita buat |
|---|---|---|
| Klaim | "Situs ini jadi patuh WCAG" | Tidak mengklaim apa pun |
| Cara kerja | Menyuntikkan ARIA, menimpa struktur | Hanya mengubah CSS milik sendiri |
| Disabilitas pengguna | Ditanyakan dan disimpan | Tidak pernah ditanyakan |
| Pengaturan sistem | Sering diabaikan | Bawaannya mengikuti perangkat |
| Letak | Lencana mengambang | Di deretan preferensi, di sebelah pemilih bahasa |

**Fondasinya tetap halamannya sendiri.** Gerbang `npm run audit:a11y`
memeriksa 56 halaman pada dua lebar layar dan harus tetap bersih. Preferensi
ini tambahan di atas fondasi itu, bukan pengganti — dan itulah bedanya dengan
overlay, yang dijual sebagai pengganti.

## 3. Pilihan yang ada, dan alasan tiap angkanya

**Ukuran teks** — "Ikut perangkat" (bawaan), "Besar" (112,5%), "Lebih besar"
(125%). Dinaikkan lewat `font-size` pada elemen akar, bukan zoom: seluruh
jarak dan ukuran di aplikasi ini memakai satuan `rem`, jadi tata letaknya ikut
melonggar secara proporsional alih-alih berdesakan. Perbesaran peramban
(Ctrl +) tetap bekerja seperti biasa — WCAG 2.2 SC 1.4.4 mensyaratkan halaman
tetap terpakai sampai 200%, dan itu sudah dipenuhi tanpa fitur ini. Keduanya
bisa dipakai bersamaan, dan keterangannya menyebutkan itu.

**Kontras** — "Ikut perangkat" (bawaan) dan "Tinggi". Palet bawaan dirancang
melewati 4,5:1 (SC 1.4.3, tingkat AA). Mode kontras tinggi menaikkannya
melewati **7:1**, yaitu tingkat AAA (SC 1.4.6). Angkanya dihitung, bukan
dikira:

| Pasangan terhadap putih | Rasio | Syarat |
|---|---|---|
| Teks utama `#000000` | 21,00 | 7:1 (AAA) ✓ |
| Teks sekunder `#26383d` | 12,24 | 7:1 (AAA) ✓ |
| Warna utama `#0b4f5a` | 9,21 | 7:1 (AAA) ✓ |
| Garis `#5a6b70` | 5,57 | 3:1 (SC 1.4.11) ✓ |

**Animasi** — "Ikut perangkat" (bawaan) dan "Dikurangi". `globals.css` sudah
menghormati `prefers-reduced-motion` sejak awal; pilihan ini untuk orang yang
perangkatnya tidak diatur demikian tetapi tetap terganggu gerakan.

## 4. Aturan

**A1 — "Ikut perangkat" selalu jadi bawaan.** Atribut `data-*` baru ditulis
ke `<html>` kalau orangnya memang menimpa. Tanpa atribut, aturan
`@media (prefers-*)` yang berlaku. Menimpa pengaturan sistem seseorang tanpa
diminta adalah kesalahan yang sama dengan yang dibuat overlay.

**A2 — Tidak disimpan ke basis data.** Berbeda dari pilihan bahasa, preferensi
ini hanya di cookie perangkat. Dua alasan: keadaan membaca berbeda per
perangkat — layar kecil di bawah matahari butuh hal lain dari layar besar di
ruang gelap — dan menyimpan "orang ini memakai teks besar dan kontras tinggi"
di basis data berarti menyimpan petunjuk tentang kondisi penglihatan
seseorang. UU PDP 27/2022 Pasal 16 menuntut pengumpulan yang terbatas dan
spesifik; kita tidak memerlukannya untuk apa pun.

**A3 — Tidak ada klaim.** Tidak ada tulisan "situs ini aksesibel" atau ikon
penyandang disabilitas di mana pun. Panel ini bernama "Tampilan".

**A4 — Letaknya menyatu.** Tombolnya ada di header bersama pemilih bahasa,
bukan lencana mengambang di pojok. Keduanya preferensi, dan perlakuannya sama.

## 5. Sumber

- WebAIM, *Survey of Web Accessibility Practitioners* — 67% menilai overlay
  tidak efektif, 72% di antara responden penyandang disabilitas.
- *Overlay Fact Sheet* (overlayfactsheet.com), ditandatangani 800+ profesional
  aksesibilitas. Ringkasannya di https://overlayreport.org/
- The A11Y Project, pernyataan bahwa overlay "actively harmful".
- https://shouldiuseanaccessibilityoverlay.com/
- W3C, *WCAG 2.2* SC 1.4.3, 1.4.4, 1.4.6, 1.4.11, dan `prefers-reduced-motion`.
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 16 ayat (2).
