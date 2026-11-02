# Analisis Sistem Desain LMS

**Apa yang membuatnya terasa belum profesional, dan apa yang sebaiknya dikerjakan**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 2 November 2026 |
| Dasar | Audit kode + tangkapan layar produksi di lms.sanggabiz.com |

---

## 0. Rekomendasi utama: jangan ganti ke Material Design

Material Design 3 adalah sistem yang matang, tetapi mengadopsinya di sini
keliru karena tiga alasan:

1. **Masalahnya bukan ketiadaan sistem.** LMS ini sudah punya token warna,
   28 komponen UI, dan palet merek. Masalahnya sistem itu **tidak diikuti** —
   13 ukuran huruf di luar skala, 45 warna ditulis langsung, 45 keadaan kosong
   ditulis ulang satu per satu.
2. **MD3 membawa identitas Google.** Anda sendiri bilang warnanya sudah benar
   karena itu warna Sanggabiz. MD3 akan membuatnya terlihat seperti aplikasi
   Android, bukan seperti Sanggabiz.
3. **Ongkos dan risikonya besar.** Mengganti sistem berarti menyentuh 28
   komponen dan ratusan pemakaiannya, tepat setelah LMS mulai dipakai.

**Yang sebaiknya dilakukan:** pinjam *anatomi* dari MD3 — terutama bentuk
ruas isian dan keadaan interaksi — lalu rapikan sistem yang sudah ada.
Hasilnya terlihat profesional tanpa kehilangan identitas.

---

## 1. Form: ini penyebab utamanya, dan dugaan Anda tepat

### 1.1 Ruas isian tidak punya label yang terlihat

Form masuk, daftar, lupa sandi, umpan balik kursus, dan beberapa dialog
memakai `placeholder` sebagai pengganti label, dengan `aria-label` untuk
pembaca layar. Pembaca layar aman — **tetapi mata tidak**.

Begitu pengguna mengetik, namanya hilang. Orang tidak bisa memeriksa ulang
apa yang sedang ia isi, dan pada form berisi empat ruas seperti pendaftaran
itu terasa seperti purwarupa, bukan produk.

Ini juga sebabnya gerbang aksesibilitas kita lolos padahal masalahnya nyata:
alat otomatis memeriksa keberadaan nama yang terbaca mesin, bukan apakah
manusia masih bisa melihatnya.

**Terdampak:** 14 berkas dengan ruas isian tanpa satu pun `<Label>`.

### 1.2 Ruas isian terlalu pendek

`components/ui/input.tsx` memakai `h-8` — **32 piksel**. Sebagai pembanding,
Material Design 3 menetapkan **56dp** untuk ruas normal dan **48dp** untuk
varian padat.

Ruas setinggi 32px terbaca sebagai panel admin internal, bukan produk yang
dipakai peserta. Ia juga sempit untuk disentuh di ponsel.

### 1.3 Tidak ada tempat untuk teks bantuan

Tidak ada slot baku untuk keterangan di bawah ruas. Akibatnya aturan seperti
"kata sandi minimal 8 karakter" baru muncul **setelah** pengguna gagal,
bukan sebelum ia mengetik.

---

## 2. Warna: Anda benar, warnanya bukan masalah — tetapi ada kebocoran

Palet Sanggabiz tidak perlu diganti. Yang bermasalah adalah **45 warna hex
yang ditulis langsung di komponen**, di luar sistem token.

Akibatnya nyata, bukan soal kerapian: LMS ini punya **mode kontras tinggi**
(`html[data-contrast="high"]`) yang mendefinisikan ulang token warna. Setiap
warna yang ditulis langsung **tidak ikut berubah** — jadi fitur aksesibilitas
yang sudah Anda punya bolong persis di tempat-tempat itu.

Temuan sampingan: ada 52 gaya `dark:` di komponen, tetapi kelas `.dark`
**tidak pernah dipasang di mana pun**. Mode gelap adalah kode mati, dan
pekerjaan menulis gaya itu terbuang.

---

## 3. Notifikasi dan keadaan kosong: peluang terbesar yang belum dipakai

Dugaan Anda tepat. **45 keadaan kosong** tersebar di aplikasi, masing-masing
ditulis ulang sendiri, dan hampir semuanya hanya satu kalimat abu-abu:
"Belum ada pendaftaran", "Belum ada kursus", "Belum ada sertifikat".

Di dasbor pengelola, tiga kalimat seperti itu muncul sekaligus di satu layar.
Bagi pengelola baru, layar pertamanya adalah tiga kotak kosong — tidak ada
yang memberi tahu apa yang harus ia lakukan.

Keadaan kosong adalah tempat terbaik untuk mengajari pengguna, dan di sini ia
sepenuhnya terbuang. Tidak ada komponen bersama untuknya.

---

## 4. Ritme visual

| Temuan | Angka |
|---|---|
| Ukuran huruf di luar skala | 13 ukuran, 129 pemakaian (`13px`, `13.5px`, `14px`, `14.5px`, `15px` — lima yang nyaris tak terbedakan) |
| Sudut membulat | 5 langkah skala + 2 nilai sembarang, tanpa aturan kapan memakai yang mana |
| Bayangan | Campuran skala Tailwind dan 3 bayangan buatan sendiri |
| Spasi | **Bersih** — hanya 2 nilai sembarang |

Dasbor peserta memakai sekitar sepertiga tinggi layar; sisanya kosong. Kartu
statistik selebar setengah layar hanya untuk menampilkan angka "1".

---

## 5. Daftar pekerjaan, berurutan menurut dampak terhadap kesan profesional

| # | Pekerjaan | Kenapa di urutan ini | Perkiraan |
|---|---|---|---|
| 1 | **Bangun ulang komponen ruas isian**: label di atas yang selalu terlihat, tinggi 44–48px, slot teks bantuan, slot galat | Satu perubahan yang terlihat di hampir setiap layar | Sedang |
| 2 | **Pasang label pada 14 berkas form** yang sekarang hanya punya placeholder | Memperbaiki kesan sekaligus kegunaan | Kecil |
| 3 | **Komponen keadaan kosong bersama**: ikon, satu kalimat penjelas, satu tombol tindakan | Mengubah 45 layar kosong menjadi 45 ajakan | Sedang |
| 4 | **Pindahkan 45 warna hex ke token** | Menambal kebocoran mode kontras tinggi | Kecil |
| 5 | **Rapikan skala huruf** jadi 6 langkah, hapus 13 ukuran sembarang | Menghilangkan kesan "hampir rapi" | Sedang |
| 6 | **Tetapkan aturan sudut dan bayangan** (mana untuk kartu, mana untuk dialog) | Konsistensi yang terasa walau tak disadari | Kecil |
| 7 | **Perbaiki kepadatan dasbor**: kartu statistik lebih ringkas, isi mengisi layar | Layar pertama menentukan kesan | Sedang |
| 8 | **Putuskan nasib mode gelap**: hidupkan atau hapus 52 gaya `dark:` | Kode mati yang menyesatkan | Kecil |
| 9 | **Gambar sampul kursus bawaan** yang pantas, menggantikan placeholder sekarang | Terlihat di katalog dan dasbor | Kecil |

Nomor 1 sampai 4 memberi perubahan kesan terbesar dengan risiko terkecil, dan
tidak satu pun menyentuh warna merek.

## 6. Hasil: kesembilan butir sudah dikerjakan

Dikerjakan di branch `gaya-sistem-desain`, dua commit (`9d6eea6` untuk butir
1–4, `a96c411` untuk butir 5–9). Gerbang a11y 83/83 bersih, `tsc` dan `build`
bersih.

| # | Hasil |
|---|---|
| 1 | `components/ui/field.tsx` baru (label + kendali + bantuan + galat, `id`/`aria-describedby`/`aria-invalid` disambungkan sendiri). Tinggi bawaan ruas isian 32px → 44px, dengan ragam `sm` 36px untuk bilah penyaring. |
| 2 | Form masuk, daftar, dan lupa sandi dipindah ke `<Field>`. `confirmPassword` dihapus — sudah ada tombol lihat sandi, dan satu ruas lebih sedikit berarti satu kegagalan lebih sedikit. |
| 3 | `components/ui/empty-state.tsx` baru: ikon, judul, satu kalimat yang menjelaskan kapan layarnya akan terisi, dan tombol tindakan bila ada. |
| 4 | **Angkanya salah di analisis awal: 12, bukan 45.** Warna merek Google, PDF sertifikat (tanpa CSS), dan palet teks pilihan penulis memang harus tetap hex. Yang dipindah ke token: `--danger-surface`, `--quiz-surface`, `--rating`, `--profile-tint`, dan tiga bayangan. |
| 5 | 129 ukuran lepas di 62 berkas (bukan 13 — itu pun salah hitung) jadi enam langkah: 12/14/16/20/24/30. |
| 6 | Tiga bayangan jadi token dengan tugas masing-masing; sudut lepas dipetakan ke skala. |
| 7 | `StatCard` dipadatkan; dasbor peserta dari dua kartu besar jadi empat angka. |
| 8 | **Dihapus, tidak dihidupkan.** Juga salah hitung: 23 gaya `dark:`, dan 18 di antaranya bawaan komponen base-ui, bukan milik kita. Blok `.dark` berisi 36 abu-abu shadcn dibuang karena kelasnya tidak pernah dipasang di mana pun dan belasan token kita tidak punya pasangan gelap. Alasan lengkapnya ada di `app/globals.css`. |
| 9 | `components/CourseThumb.tsx` baru: bidang warna dari keluarga warna Sanggabiz dengan inisial judul, lima ragam yang ditentukan dari id kursus. Tujuh layar yang mengulang blok yang sama kini memakai satu komponen. |

### Dua hal yang ketahuan saat mengerjakan, bukan dari analisis awal

**Semua `<Select>` menampilkan nilai mentah, bukan label.** Penyaring kursus
dan riwayat pembelian bertuliskan `all`; pemilih baris bertuliskan `25`
alih-alih `25 / halaman`; pemilih prasyarat dan kursus unggulan akan
menampilkan UUID begitu ada isinya. base-ui butuh `items` di `Select.Root`
untuk menampilkan label. Enam pemanggil diperbaiki.

**Tombol "Lanjutkan belajar" menyembul keluar dari batasnya.** Penentunya
lebar kartu, bukan lebar layar — di layar lebar pun kartu itu hanya sepertiga
kisi. Ambangnya pindah ke container query. Sekalian ketahuan bahwa `flex-1`
pada arah kolom meratakan tinggi tombol jadi nol, yang membuat tombol di
layar sempit tergencet.
