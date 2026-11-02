# Standar Platform Digital Learning

**Acuan untuk memeriksa LMS ini — apa yang harus benar, dan cara membuktikannya**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 2 November 2026 |
| Sumber | Kurikulum *Habmann Aufstiegsakademie · Digital Learning · Educational UX/UI Design*, 16 hari materi ([AION-HABMANN/aion-digital-learning](https://github.com/AION-HABMANN/aion-digital-learning)) |
| Dipakai oleh | Setiap pemeriksaan fitur baru dan setiap peninjauan berkala |

---

## 0. Cara memakai berkas ini

Ini **daftar periksa**, bukan bacaan. Setiap butir punya tiga bagian:

- **Aturan** — apa yang harus benar
- **Cara periksa** — bagaimana membuktikannya, bukan menduganya
- **Status** — keadaan LMS ini pada tanggal di atas

Status diisi dari pemeriksaan sungguhan. Butir yang belum pernah diperiksa
ditulis **belum diperiksa**, bukan dikosongkan — perbedaan antara "lolos" dan
"belum pernah dilihat" adalah perbedaan yang paling sering hilang.

## 1. Aturan pokok yang mengatur semua aturan lain

> **Pemeriksa otomatis hanya menemukan sebagian masalah. Jangan menyebut
> sebuah halaman aksesibel karena sebuah alat lolos.**

Ini kalimat langsung dari materi Hari 7 dan Hari 13, dan **LMS ini sudah
membuktikannya sendiri**: gerbang axe kami melaporkan 58/58 halaman bersih
WCAG 2.2 AA, padahal dua halaman gagal kriteria 1.4.10 Reflow — isinya
melebar sampai 437px pada layar 320px sehingga harus digulir ke samping.
axe tidak menguji reflow, dan gerbang kami hanya menguji di 1366px dan 375px.

Konsekuensinya untuk berkas ini: **setiap butir aksesibilitas butuh tiga
jenis bukti**, dan satu saja tidak pernah cukup —

1. **Alat otomatis** (berapa banyak) — axe, pemeriksa kontras
2. **Pemeriksaan manual** (apakah memenuhi) — papan ketik, pembaca layar
3. **Uji dengan pengguna** (kenapa) — termasuk pengguna dengan hambatan

---

## A. Struktur dan navigasi

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| A1 | Tiga pertanyaan navigasi terjawab di tiap layar: **di mana saya** (judul, menu tersorot, jejak langkah sepakat), **ke mana bisa pergi**, **apa berikutnya** (tombol Lanjut) | Buka 5 layar acak, jawab ketiganya tanpa menebak | ✅ sidebar belajar punya ketiganya |
| A2 | **Satu isi, satu rumah.** Isi yang sama tidak boleh dicapai dari tiga tempat dengan tiga nama | Telusuri peta rute, cari duplikat | belum diperiksa |
| A3 | Menu dinamai menurut **yang dilakukan peserta** (Belajar, Cari, Kemajuan), bukan menurut modul sistem | Baca label menu; adakah yang menyebut tabel atau modul? | ✅ Dasbor, Kursus, Pembelian, Notifikasi |
| A4 | Menu utama sekitar **enam entri**; sisanya satu klik di bawah | Hitung entri menu utama | ⚠️ menu pengelola 11 entri untuk superadmin |
| A5 | Struktur diuji **sebelum** dibangun: *card sort* untuk pengelompokan, *tree test* untuk ketemuan | Adakah catatan hasil ujinya? | ❌ belum pernah |
| A6 | Perbaiki **struktur dulu, lalu hierarki, lalu panduan, baru tampilan.** Perubahan tampilan di atas struktur rusak tidak menurunkan angka berhenti | Saat menerima permintaan "ganti warna", tanya dulu masalahnya di lapisan mana | — aturan kerja |

## B. Beban kognitif dan penyajian

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| B1 | Jika satu layar menampilkan **lebih dari sekitar empat hal terpisah** yang harus ditangani peserta, kelompokkan atau sembunyikan sebagian | Hitung elemen yang menuntut keputusan di layar pelajaran | belum diperiksa |
| B2 | Bedakan beban **intrinsik** (dari materinya — hanya boleh diurutkan) dari **ekstrinsik** (dari cara layar dibangun — harus dipotong) | Saat ada keluhan "terlalu rumit", tentukan dulu jenis bebannya | — aturan kerja |
| B3 | Satu unit pelajaran = **satu tujuan belajar**, sekitar 3–7 menit | Periksa panduan penyusunan dan contoh kursus | ✅ panduan menyebut 5–7 menit |
| B4 | Ada hierarki visual yang menjawab "mana yang dilihat duluan": judul → kalimat kunci → penjelasan | Lihat satu layar pelajaran; apakah lima hal berukuran sama? | belum diperiksa |
| B5 | **Jangan hapus beban intrinsik** dengan membuang isi yang dibutuhkan peserta. Pecah, urutkan, dukung | Saat menyederhanakan, catat apa yang dipindahkan, bukan dihapus | — aturan kerja |

## C. Umpan balik dan kemajuan

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| C1 | Umpan balik menjawab **tiga hal**: tindakan tercatat, kenapa hasilnya begitu, apa langkah berikutnya. "Bagus!" saja bukan umpan balik | Kerjakan satu kuis sampai salah, baca tanggapannya | ✅ ada penjelasan per soal dan tautan ke materi |
| C2 | Setiap tindakan mendapat tanggapan terlihat **dalam sekitar satu detik**; kalau lebih lama, tampilkan bahwa sesuatu sedang berjalan | Klik Simpan pada koneksi lambat | ✅ tombol punya status menunggu |
| C3 | Tampilan kemajuan berdasar **sesuatu yang nyata** dan **diberi label** ("3 dari 8"), bukan angka telanjang | Lihat sidebar dan kartu kursus | ✅ "N dari M selesai" |
| C4 | Untuk kursus panjang, tampilkan **tujuan kecil lebih dulu** (modul pertama) selain keseluruhan | Buka kursus 60 pelajaran, lihat apa yang ditampilkan | ⚠️ kursus PBO 64 pelajaran hanya menampilkan total |
| C5 | Umpan balik diberikan **di tempat yang berarti** (tugas selesai, kesalahan, tonggak); selebihnya diam. Terlalu banyak = beban | Hitung notifikasi dalam satu sesi belajar | belum diperiksa |

## D. Motivasi dan gamifikasi

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| D1 | Tiap elemen harus mendukung salah satu dari **otonomi, kompetensi, keterhubungan**. Yang tidak mendukung satu pun kemungkinan hanya hiasan | Daftar elemen motivasi, petakan ke tiga kebutuhan itu | ✅ tidak ada elemen gamifikasi — tidak ada yang perlu dibela |
| D2 | **Aktivitas bukan pembelajaran.** Hadiah untuk tindakan (masuk, klik, lama membuka) berbeda dari hadiah untuk pencapaian | Sebelum menambah poin/lencana, tanya: ini menghargai belajar atau kehadiran? | — aturan kerja |
| D3 | Hadiah ekstrinsik bisa **mematikan minat yang sudah ada**. Menambah poin pada hal yang sudah disukai bisa memperburuk | Jangan tambahkan gamifikasi tanpa masalah motivasi yang terbukti | — aturan kerja |
| D4 | **Papan peringkat adalah pemrofilan.** Selain berisiko mematahkan semangat, ia membawa kewajiban hukum tersendiri | Lihat `docs/STANDAR-PELACAKAN.md` sebelum membangunnya | ✅ sengaja belum dibuat |

## E. Aksesibilitas dan inklusi

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| E1 | **Kontras** teks biasa minimal 4,5 : 1; teks besar 3 : 1 | axe otomatis | ✅ 58/58 halaman |
| E2 | **Alternatif teks** untuk tiap gambar/diagram yang membawa isi; gambar hiasan tidak perlu | axe + periksa manual diagram | ✅ otomatis; ⚠️ diagram materi belum ditinjau manusia |
| E3 | **Papan ketik**: semua yang bisa dengan tetikus harus bisa dengan papan ketik, urutan masuk akal, fokus terlihat | Telusuri satu kursus penuh hanya dengan Tab/Enter/Spasi | ⚠️ sebagian (geser urutan terbukti; alur belajar penuh belum) |
| E4 | **Reflow (WCAG 1.4.10)**: pada lebar 320px tidak boleh ada gulir mendatar | Buka tiap layar di 320px, bandingkan `scrollWidth` dengan `innerWidth` | ❌ **gagal**: beranda publik (425px) dan katalog peserta (360px) |
| E5 | **Ukuran sasaran sentuh** minimal 24px (WCAG 2.2 AA); 44px lebih baik | axe 2.5.8 + ukur manual di ponsel | ✅ otomatis; belum diukur di perangkat nyata |
| E6 | **Video butuh takarir**; batas waktu harus bisa disesuaikan | Periksa tiap pelajaran video | ⚠️ ada kolom transkrip tapi **tidak diwajibkan**; tidak ada batas waktu (aman) |
| E7 | **Judul nyata dan berurutan**, menu dangkal dan sama di tiap halaman, tiap halaman punya judul jelas | axe + baca struktur judul | ✅ otomatis |
| E8 | **Uji dengan pembaca layar** (VoiceOver/NVDA), bukan hanya alat otomatis | Satu alur belajar penuh dengan pembaca layar | ❌ **belum pernah** |
| E9 | **Uji dengan pengguna yang punya hambatan** | Catatan hasil uji | ❌ belum pernah |
| E10 | **Perbaiki di sumbernya** (isi dan kode), jangan menambah lapisan di atasnya. Widget aksesibilitas tidak menghapus hambatan di bawahnya | Tolak usulan overlay | ✅ sudah diputuskan, lihat `docs/STANDAR-AKSESIBILITAS-PREFERENSI.md` |
| E11 | **Ukur per kelompok.** Nilai rata-rata menyembunyikan kelompok yang sama sekali tidak bisa memakai platform | Pecah angka penyelesaian per kelompok | ❌ belum ada |

## F. Bahasa sederhana

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| F1 | Kalimat pendek (satu gagasan), kata sehari-hari, hal terpenting di depan | Baca ulang 5 layar; adakah kalimat >25 kata? | belum diperiksa |
| F2 | Tiap singkatan dijelaskan saat pertama muncul | Cari singkatan di antarmuka | belum diperiksa |
| F3 | **Pesan galat menyebut apa yang salah DAN apa yang harus dilakukan** | Picu 5 galat berbeda, baca pesannya | ⚠️ sebagian — pesan simpan kursus sudah menyebut ruasnya, pesan lain belum ditinjau |
| F4 | **Jangan jawab platform yang membingungkan dengan pusat bantuan.** Intuitif berarti bisa dipahami tanpa penjelasan | Saat tergoda menambah tooltip, perbaiki labelnya dulu | — aturan kerja |

## G. Mobile

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| G1 | Isi diprioritaskan per perangkat: apa yang sama di mana-mana, apa yang pertama di ponsel, apa yang hanya muat di layar besar | Bandingkan layar yang sama di 375px dan 1366px | ✅ diaudit di dua lebar |
| G2 | Teks mengalir mengikuti lebar layar; **tidak ada gulir menyamping** | Sama dengan E4 | ❌ gagal di dua halaman |
| G3 | Kemajuan, penanda, dan posisi terakhir **tersinkron antar perangkat** | Mulai di ponsel, lanjut di laptop | ✅ tersimpan di basis data |
| G4 | Nama dan logika sama di tiap perangkat; **hanya tata letaknya yang menyesuaikan** | Bandingkan label antar lebar | ✅ komponen sama |
| G5 | Diuji di **ponsel sungguhan**, sebagian sambil bergerak — meja lab menyembunyikan konteks | Catatan uji | ❌ belum pernah |

## H. Adaptif dan personalisasi

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| H1 | **Setiap adaptasi harus terlihat dan bisa dijelaskan**: peserta tahu apa yang berubah dan kenapa | Jika sistem memilihkan sesuatu, adakah alasannya di layar? | ✅ belum ada adaptasi — tidak ada yang tersembunyi |
| H2 | Tiap pola personalisasi punya **jalan kembali** | Adakah cara membatalkan? | — belum berlaku |
| H3 | Mulai dari **aturan sederhana**, bukan model. Model butuh data banyak dan berkualitas | Sebelum membangun rekomendasi, periksa dasar datanya | — aturan kerja |
| H4 | Tanpa masalah peserta yang nyata, data memadai, dan varian isi — adaptif adalah **rekayasa berlebih** | Tiga pertanyaan itu dijawab sebelum membangun | — aturan kerja |

## I. Pengukuran dan KPI

| | Aturan | Cara periksa | Status |
|---|---|---|---|
| I1 | KPI punya **nama, definisi (apa persis yang dihitung), dan target**; yang utama sekitar **tiga** saja | Baca dasbor: adakah definisinya? | ❌ dasbor menampilkan angka tanpa definisi maupun target |
| I2 | Utamakan KPI yang menunjukkan **hasil**: penyelesaian, berhenti minggu pertama, kembali dalam 7 hari. Jumlah tayangan dan total pendaftar hanya naik | Tinjau kartu statistik | ⚠️ ada penyelesaian; tidak ada berhenti-minggu-pertama maupun kembali-7-hari |
| I3 | **Angka adalah gejala, bukan sebab.** Pasangkan dengan uji yang menunjukkan penyebabnya | Setiap kali mengutip angka berhenti, sebutkan apa yang belum diketahui | ✅ analisis titik berhenti menyebut batasnya |
| I4 | Bandingkan yang **sebanding**: hari yang sama, jenis peserta yang sama, bukan musim libur lawan hari biasa | Saat membandingkan periode, catat asumsinya | — aturan kerja |
| I5 | Hipotesis ditulis **"kami percaya …, maka kami akan …, dan memperkirakan …"** dengan angka, satu perubahan pada satu waktu | Format itu dipakai saat mengusulkan perubahan | — aturan kerja |
| I6 | Kumpulkan **hanya yang dibutuhkan pertanyaan**, beri tahu, minta persetujuan bila perlu | `docs/STANDAR-PELACAKAN.md` | ✅ persetujuan ditegakkan di basis data |

## J. Disiplin mengambil keputusan

Dipakai setiap kali menilai usulan fitur. Ini yang paling sering dilewati.

| | Aturan |
|---|---|
| J1 | **Keputusan dalam ketidakpastian menyebut empat hal**: apa yang diputuskan, apa yang belum diketahui, apa yang akan membatalkannya dan kapan, serta apa yang dikorbankan |
| J2 | **Syarat pembatalan harus punya angka dan waktu** ("di bawah 25% setelah enam minggu"), bukan perasaan ("kalau tidak berhasil") |
| J3 | **Tidak mengorbankan apa pun berarti belum memutuskan.** Sebutkan apa yang ditunda |
| J4 | Utamakan keputusan yang **murah dibatalkan** selagi belajar; sisakan yang mahal untuk gerbangnya |
| J5 | Usulan yang **tidak menjawab satu pun temuan** (fitur baru, tampilan baru, lebih banyak kursus) adalah pilihan lemah betapa pun menariknya |
| J6 | Aturan keputusan menyebut **siapa yang memutuskan dan bukti apa yang dibutuhkan** — pendapat, bahkan dari atasan, bukan bukti |

---

## K. Hasil pemeriksaan 2 November 2026

**Temuan yang harus diperbaiki:**

1. **E4/G2 — Reflow gagal.** Beranda publik melebar 425px dan katalog peserta
   360px pada layar 320px. Penyebab di beranda: tombol header dan kartu kursus
   pilihan. Ini kegagalan WCAG 2.2 AA yang luput karena axe tidak menguji
   reflow dan gerbang kami hanya menguji 1366px dan 375px.
2. **E8 — Belum pernah diuji dengan pembaca layar.** Seluruh klaim
   aksesibilitas kami bersandar pada satu alat otomatis.
3. **I1 — KPI tanpa definisi dan target.** Dasbor menampilkan angka yang tidak
   bisa diperiksa benar-salahnya.
4. **A5, E9, G5 — Belum pernah ada uji dengan pengguna sungguhan**, baik
   pengujian struktur, pengguna berkebutuhan khusus, maupun ponsel nyata.

**Yang sudah kuat:** struktur navigasi, umpan balik kuis, pelabelan kemajuan,
penegakan persetujuan pelacakan di basis data, dan penolakan jalan pintas
(widget aksesibilitas, papan peringkat) yang terlihat menarik tetapi merugikan.

---

## L. Cara memelihara berkas ini

- Setiap fitur baru diperiksa terhadap bagian yang relevan **sebelum** disebut selesai.
- Status "belum diperiksa" hanya boleh berubah setelah ada pemeriksaan sungguhan — bukan setelah dibaca.
- Pemeriksaan yang bisa diotomatiskan **dipindahkan ke `scripts/a11y-audit.mjs`**, supaya tidak bergantung pada ingatan. Reflow 320px sudah dipindahkan ke sana.
- Angka ambang (kontras 4,5 : 1, sasaran 24px, unit 3–7 menit, menu ~6 entri) berasal dari kurikulum sumber. Kalau diubah, sebutkan alasannya di sini.
