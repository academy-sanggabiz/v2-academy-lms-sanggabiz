# Standar Materi Interaktif

Disusun 13 Nov 2026 dari diskusi pemilik produk. **Belum dibangun** — dokumen
ini adalah keputusannya, supaya pekerjaannya bisa dimulai tanpa mengulang
diskusi. Acuan luar: repo `AION-HABMANN/aion-ux` (`UX-STANDARD.md`), milik
pemilik produk sendiri.

Perintah untuk memulai: **"kerjakan fitur materi interaktif"**.

---

## 1. Tujuan, dan apa yang BUKAN tujuannya

**Tujuan.** Memberi penyusun kursus satu cara menyajikan materi yang bisa
dicoba peserta, bukan hanya dibaca — dan cara itu harus bisa dibuat **di luar
LMS** lalu dipindahkan masuk.

Alasan pemilik memilih "dibuat di luar": orang yang menulis materi bukan
programmer. Ia harus bisa meminta ke asisten AI mana pun *"buatkan pelajaran
interaktif tentang X sebagai satu berkas HTML"*, lalu menempelkannya. Menuntut
React membuat fitur ini tidak terpakai.

**Bukan tujuannya:**

- **Mengganti apa pun.** Teks biasa, video, Google Slides, kuis, dan tautan
  dokumen tetap seperti sekarang. Ini pilihan **kelima**, bukan pengganti.
- **Menjadi satu-satunya bentuk materi.** Pemilik menyatakan tegas: kalau
  penyusun hanya ingin teks, atau hanya menyematkan tautan dokumen atau PPT,
  itu tetap sah.
- **Meniru AION-UX sepenuhnya.** AION menulis komponen React per hari; itu
  butuh programmer untuk setiap pelajaran. Yang dipinjam prinsipnya, bukan
  caranya (§6).

---

## 2. Keputusan: HTML tanpa skrip, dirender langsung

Materi interaktif adalah **satu berkas HTML yang tidak memuat satu baris
JavaScript pun**, dan isinya dirender **menjadi bagian halaman kita sendiri** —
bukan di dalam iframe.

Interaktivitasnya datang dari HTML dan CSS modern: `<details>`, radio atau
checkbox dengan `:checked`, `:has()`, dan selector saudara. Itu sudah cukup
untuk ungkap-sembunyi, bandingkan sebelum–sesudah, pilih-lalu-lihat-akibatnya,
langkah demi langkah, dan tab.

### 2.1 Diukur, bukan diperkirakan (13 Nov 2026)

Satu materi contoh tanpa JavaScript diuji di peramban sungguhan:

```
1. awal (50 ms)      "Baru kesan: warna dan bentuk besar…"
2. pilih 1200 ms     "Sudah sempat membaca kalimat pertama."
3. pilih 400 ms      "Mulai menangkap susunan: mana judul, mana tombol."
4. details terbuka   true
5. lewat papan ketik jalan
6. axe INLINE        0 pelanggaran, melihatMateri: TRUE
```

Baris 6 yang paling menentukan: karena materinya menjadi DOM kita, **gerbang
aksesibilitas memeriksanya**.

### 2.2 Kenapa bukan iframe

Pilihan pertama yang dibahas adalah berkas HTML **dengan** skrip, dikurung di
`<iframe sandbox="allow-scripts">`. Isolasinya terbukti kokoh:

```
cookie induk      DITOLAK (SecurityError)
localStorage      DITOLAK (SecurityError)
induk -> iframe   DITOLAK (TypeError)
postMessage       sampai, origin=null
```

Tetapi harganya terlalu mahal untuk dijadikan bawaan:

| | iframe + skrip | HTML tanpa skrip |
|---|---|---|
| Gerbang a11y melihat isinya | **tidak** (`masukIframe: false`, nol simpul) | **ya** |
| Tema kita ikut | harus disuntik | otomatis |
| Ctrl+F dan cetak | mati | jalan |
| Chatbot & terjemahan | lewat ekstraksi teks | langsung |

Pertanyaan pemilik — *"bisa gak kita tetap lihat ke dalam, tapi mereka tidak
bisa masuk ke kita?"* — **tidak perlu dijawab** pada pilihan ini: tidak ada
pihak kedua, karena tidak ada skrip yang bisa mencoba masuk.

**Iframe tetap disimpan sebagai jalan keluar** (§7), bukan dibuang.

---

## 3. Letaknya di sistem

**Jenis pelajaran kelima**, sebaris dengan yang sudah ada. Jenis melekat pada
**pelajaran**, bukan kursus — satu kursus bebas mencampur, dan memang sudah
begitu hari ini (`Dasar Keuangan untuk Usaha Kecil`: quiz + text + video).

```
Kursus
└── Modul
    ├── Pelajaran   Teks
    ├── Pelajaran   Video
    ├── Pelajaran   Interaktif   <- yang baru
    ├── Pelajaran   Slides
    └── Pelajaran   Kuis
```

### 3.1 Nilai enum: `interactive`

**Jangan pakai `mixed`.** Nilai itu ada di enum, nol dipakai (83 teks, 25
kuis, 2 video, 1 ppt, **0 mixed**), dan tidak muncul di pemilih jenis — tetapi
`LessonPane` sudah memperlakukannya **sebagai kuis** di dua tempat. Menumpangi
nilai itu membuat materi interaktif dirender sebagai kuis.

Namanya `interactive`, bukan `html`: yang penting bagi pembaca kode adalah
gunanya, bukan formatnya.

### 3.2 Delapan tempat yang WAJIB diisi

`LessonContentType` punya delapan peta `Record<LessonContentType, …>`.
Menambah nilai baru membuat TypeScript **menolak kompilasi** sampai semuanya
diisi — tidak ada tempat yang bisa terlewat diam-diam:

| Berkas | Isinya |
|---|---|
| `components/admin/courses/tabs/LessonsTab.tsx` | `TYPE_ICON`, dan `lessonTypes()` (pemilih radio) |
| `components/learn/LearnSidebar.tsx` | `typeIcon`, `typeLabel` |
| `components/learner/CourseCurriculum.tsx` | `typeIcon`, `typeLabels()` |
| `components/catalog/PublicCurriculum.tsx` | `IKON`, `labelJenis` |
| `lib/course-markdown/index.ts` | `TYPE_TO_MD` (penanda jenis di berkas impor) |

Urutannya di pemilih: **sebelum Kuis**. Kuis menguji materi sebelumnya, jadi
secara alur ia memang yang terakhir.

### 3.3 Cara masuk dan penyimpanan

- **Unggah berkas `.html`** sebagai jalan utama — cocok dengan "dibuat di
  tempat lain".
- **Ditambah kotak teks** di bawahnya untuk perbaikan kecil. Materi pasti ada
  salah ketik, dan mengunduh–perbaiki–unggah ulang untuk satu huruf menyiksa.
- Disimpan di **`lessons.content`** yang sudah ada (bertipe `text`, sudah
  menampung HTML). **Tidak perlu kolom baru, tidak perlu bucket baru.**
- **Gambar tidak boleh ditempel sebagai `data:` URI** — satu berkas bisa
  membengkak jadi megabyte. Gambar diunggah ke bucket `lesson-content` yang
  sudah ada, lalu ditunjuk lewat URL, sama seperti gambar di pelajaran teks.

---

## 4. Keamanan: tiga lapis, dan dua masalah yang berbeda

Pemilik bertanya apakah perlu "pembersih sendiri". Jawabannya: **profil kedua
pada pembersih yang sudah ada** (`lib/sanitize-content.ts`, memakai
`sanitize-html`), bukan pustaka baru.

Ada **dua** masalah yang sering dikira satu:

### Lapis 1 — Daftar tag dan atribut (keamanan)

Menahan skrip, penangan peristiwa (`onclick`), tautan `javascript:`, dan
formulir yang mengirim ke luar.

Daftar sekarang **34 tag**, dipetakan dari apa yang editor Tiptap bisa
hasilkan. Materi interaktif hancur melewatinya — diuji 13 Nov 2026:

```
DIBUANG : fieldset, legend, label, input, details, summary, style, div
data-for: DIBUANG
-> interaktifnya hilang, tinggal teks
```

**Buat profil terpisah bernama `interaktif`. Jangan melebarkan profil yang
sekarang** — kalau dilebarkan, pelajaran teks biasa, blok halaman depan, dan
keterangan kursus ikut mendapat permukaan yang lebih lebar padahal tidak satu
pun membutuhkannya. Komentar di berkas itu sendiri sudah memperingatkannya.

Yang perlu ditambahkan, sekurang-kurangnya: `div`, `details`, `summary`,
`fieldset`, `legend`, `label`, `input` (hanya `type` checkbox/radio),
`output`, `figure`, `figcaption`, dan atribut `id`, `name`, `type`, `checked`,
`data-*`, `aria-*`.

### Lapis 2 dan 3 — Kerusakan tampilan

**Daftar tag tidak menolong sama sekali di sini.** CSS dari penulis, tanpa satu
pun tag berbahaya, bisa menutupi navigasi kita. Diuji 13 Nov 2026:

```
tanpa penjagaan          nav tertutup: TRUE   halaman meluber: TRUE
contain: layout style    nav tertutup: false  halaman meluber: false
```

`position: fixed` di dalam materi menutupi seluruh header LMS — **termasuk
tombol Keluar** — dan `width: 300vw` membuat halaman meluber, yang langsung
menjatuhkan gerbang reflow 320px.

- **Lapis 2 — lingkup CSS.** `<style>` penulis hanya boleh berlaku di dalam
  materinya. Lewat `@scope`, atau dengan menulis ulang selector-nya di server
  memakai awalan.
- **Lapis 3 — pengurungan tata letak.** `contain: layout style` pada
  pembungkus materi. Satu baris CSS, dan terbukti menahan keduanya.

### Yang TETAP tidak bisa dijaga pembersih

Pembersih menjamin materi tidak merusak halaman. Ia **tidak** menjamin
materinya sendiri bagus: kontras cukup, sasaran sentuh 44px, urutan papan
ketik masuk akal, `prefers-reduced-motion` dihormati.

Itu hanya ketahuan dengan **menjalankan axe pada materinya saat pratinjau di
penyunting, sebelum terbit**. Jadikan itu bagian dari alur simpan, bukan
anjuran: materi yang gagal axe diberi peringatan dengan daftar temuannya.

---

## 5. Brief untuk pembuat materi

**Yang sebenarnya jadi standar bukan perenderannya — itu beberapa puluh baris.
Standarnya adalah brief yang diberikan ke pembuat materi.**

Bangun `docs/TEMPLATE-MATERI-INTERAKTIF.html`: satu berkas kosong yang sudah
benar, yang tinggal dilampirkan ke asisten AI mana pun bersama aturan ini.

Aturan yang harus ada di brief:

1. **Satu berkas, tanpa JavaScript.** Tidak ada `<script>`, tidak ada
   `onclick`, tidak ada `javascript:`.
2. **Tanpa panggilan jaringan apa pun.** Tidak ada `fetch`, font dari luar,
   atau gambar dari domain lain.
3. **Pakai variabel CSS kita** (`var(--ring)`, `var(--foreground)`, …) supaya
   setema; jangan menulis warna lepas.
4. **Terbaca di 390px**, dan tidak ada yang melebar melewati layar.
5. **Sasaran sentuh minimal 44px.**
6. **Hormati `prefers-reduced-motion`.**
7. **Jangan `position: fixed` atau `position: sticky`.**
8. **Setiap gambar punya `alt`;** setiap kontrol punya label.
9. **Angka dan fakta harus benar**, dan sebutkan sumbernya — pinjam
   `UX-STANDARD.md` §2.17 milik AION.

---

## 6. Yang dipinjam dari AION-UX

Repo `AION-HABMANN/aion-ux` membangun materi sebagai komponen React per hari
(±10 berkas tiap hari, kit bersama di `components/sim/`). **Caranya tidak
dipinjam** — itu menuntut programmer untuk setiap pelajaran. **Prinsipnya
dipinjam:**

- **§2.16 — "Every interactive is a working product, not a toggle between
  descriptions."** Interaktif yang hanya berganti kalimat tidak memenuhi
  standar ini. Harus ada sesuatu yang benar-benar berubah perilakunya.
- **§2.21 — tiap perangkat dipakai di tempatnya.** Tabel "dipakai saat" dan
  "tidak dipakai saat" untuk animasi, coba-sendiri, fakta mengejutkan,
  diskusi, dan refleksi. Masukkan tabel itu ke brief §5.
- **§2.10 — sederhana secara bawaan.** Satu kotak "dengan kata sederhana"
  (2–4 kalimat, maksimal 75 kata) di awal; sisanya boleh dilipat. Teksnya
  tetap ada di halaman supaya Ctrl+F dan cetak tetap bekerja.
- **§2.17 — kedalaman diperiksa.** Satu sub-topik dianggap selesai kalau punya
  penjelasan, contoh konkret, fakta nyata bersumber, dan "apa artinya".

---

## 7. Jalan keluar yang sengaja tidak dibangun dulu

Materi yang benar-benar butuh JavaScript — penghitung waktu, pengukur
salah-tekan, simulasi sekelas `TaskLab`-nya AION — **tidak tercakup** standar
ini.

Kalau nanti dibutuhkan, jalannya sudah diukur: berkas dengan skrip, dikurung
di `<iframe sandbox="allow-scripts">`, **tanpa `allow-same-origin` dalam
keadaan apa pun** (kombinasi itu membuat halaman di dalam bisa menghapus
sandbox-nya sendiri; validator HTML pun menolaknya).

Syaratnya: penyunting harus memberi tahu di depan bahwa gerbang a11y **tidak
bisa memeriksa** materi itu, jadi penulisnya yang bertanggung jawab.

**Jangan bangun ini sebelum tingkat pertama terbukti kurang.** Kalau ternyata
cukup, jalan keluar ini tidak pernah perlu dibuka.

---

## 8. Keputusan yang MASIH TERBUKA

Tiga hal belum dijawab pemilik. **Tanyakan sebelum membangun bagian yang
bersangkutan**, jangan ditebak:

1. **`<style>` dari penulis** — dibolehkan tapi dilingkupi (penulis bebas,
   risiko lebih besar), atau dilarang dan kita sediakan kelas siap pakai
   (lebih aman, pola terbatas pada yang kita siapkan)?
2. **Dwibahasa** — satu berkas satu bahasa, mengikuti aturan judul pelajaran
   yang memang tidak diterjemahkan? Atau dua berkas ID/EN seperti halaman
   depan?
3. **Label di katalog publik** — `PublicCurriculum` ikut terdampak, jadi calon
   peserta di `/kelas` akan melihat jenisnya. "Interaktif"?

Dua hal sudah diputuskan dan tidak perlu ditanya lagi:

- **Penyelesaian pelajaran tidak dihitung dari interaktifnya.** Tombol
  "Selesai & lanjut" tetap seperti sekarang. Alasannya: satu berkas yang lupa
  mengirim sinyal akan mengunci peserta.
- **Teks hasil ekstraksi disimpan**, tidak dihitung ulang tiap kali. Asisten
  AI memanggilnya tiap peserta bertanya, dan pencarian kursus nanti juga
  memerlukannya.

---

## 9. Chatbot dan terjemahan: sudah hampir gratis

`keTeks()` di `lib/ai/lesson-assistant.ts` — yang **sudah dipakai asisten AI
hari ini** — diuji pada berkas interaktif dan keluarannya bersih:

```
302 aksara teks materi
skrip ikut terbawa : tidak
gaya ikut terbawa  : tidak
```

Yang perlu ditambahkan hanya pembuang `<script>` dan `<style>` di awal fungsi
itu, supaya logika dan CSS tidak ikut masuk prompt.

**Terjemahan:** jangan ekstrak-lalu-tempel-balik — nomor simpul bergeser dan
`aria-label` gampang terlewat. Kirim berkas utuh ke model, minta kembalikan
berkas utuh dalam bahasa lain dengan struktur sama persis. `lang="id"` →
`lang="en"` ikut benar dengan sendirinya.

---

## 10. Selesai jika

| Pemeriksaan | Kapan |
|---|---|
| `npx tsc --noEmit`, `npm run lint`, `npm run build` | setiap fase |
| `npm run audit:a11y` dengan layar penyunting baru terdaftar | ada layar baru |
| `npm run i18n:check` dengan teks baru di kamus dua bahasa | ada teks baru |
| **axe pada materi contoh di dalam halaman pemutar** | wajib — ini inti §2.1 |
| **Uji pembersih**: materi nakal (`position: fixed`, `width: 300vw`, `<script>`) tidak merusak halaman dan tidak menjalankan apa pun | wajib — ini inti §4 |
| Cek manual 390px dan hanya papan ketik | setiap layar baru |

Satu pelajaran interaktif contoh dimasukkan ke `docs/DATA-DEMO.md` supaya
gerbang punya sesuatu yang nyata untuk diperiksa.
