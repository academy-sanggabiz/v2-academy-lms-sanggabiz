# Standar Pelacakan Belajar

**Data belajar apa yang boleh dikumpulkan, atas dasar apa, dan apa yang perlu persetujuan**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 31 Oktober 2026 |
| Berlaku pada | layar Pelacakan dan Penilaian, `lib/insight-server.ts`, dan rencana pelacakan berikutnya |

---

## 1. Kenapa riset hukumnya didahulukan

Permintaannya: pelacakan yang lebih rinci — di bagian mana peserta kesulitan,
bagaimana kebiasaan belajarnya, jam berapa ia belajar.

Urutannya dibalik dengan sengaja. UU PDP No. 27/2022 mewajibkan **dasar
pemrosesan ada sebelum data dikumpulkan**, dan untuk sebagian data dasarnya
adalah persetujuan yang harus diminta lebih dulu. Membangun fiturnya dulu lalu
mencari dasar hukumnya berarti data sudah terlanjur terkumpul tanpa dasar —
dan data itu tidak bisa ditarik kembali dari basis data dengan cara yang rapi.

## 2. Enam dasar pemrosesan, dan yang relevan di sini

Pasal 20 ayat (2) menyebut enam dasar. Tiga yang relevan untuk LMS:

| Huruf | Dasar | Dipakai untuk |
|---|---|---|
| a | Persetujuan eksplisit untuk tujuan tertentu | Data perilaku di luar keperluan kursus |
| b | Pemenuhan kewajiban perjanjian | Semua yang perlu untuk menyampaikan kursus |
| f | Kepentingan yang sah, dengan uji keseimbangan | Perbaikan materi berbasis angka agregat |

## 3. Pemetaan: apa masuk dasar mana

### Sudah sah tanpa persetujuan tambahan — huruf b

Peserta mendaftar untuk mengikuti kursus. Untuk menyampaikan kursus itu —
menandai kemajuan, menilai kuis, menerbitkan sertifikat — data berikut memang
harus dicatat, dan sudah dicatat sejak awal:

- penyelesaian tiap pelajaran beserta waktunya (`lesson_progress`)
- setiap percobaan kuis: nomor urut, skor, lulus atau tidak, waktu mulai dan
  kirim (`quiz_attempts`)
- jawaban per soal dan benar-salahnya (`quiz_responses`)
- status pendaftaran dan penyelesaian (`enrollments`)

**Pelacakan yang lebih rinci dibangun dari sini, bukan dari data baru.** Dua
hal yang paling diminta ternyata sudah bisa dijawab tanpa menambah satu kolom
pun:

- *Di bagian mana peserta kesulitan* → persentase jawaban benar per soal,
  digabung lintas peserta (`admin_question_difficulty`).
- *Berapa kali mereka mencoba* → rata-rata percobaan sampai lulus, nilai
  percobaan pertama dibanding nilai terbaik (`admin_quiz_effort`).

Keduanya **agregat lintas peserta**, karena pertanyaannya memang tentang
materinya, bukan tentang orangnya. Tampilan per orang tetap ada di layar
Pelacakan, di mana pengajar memang perlu tahu siapa yang tertinggal.

Catatan yang sering disalahpahami: mencabut batas percobaan **tidak**
menghilangkan data percobaan. Tiap percobaan tetap satu baris lengkap dengan
nomor urut, skor, dan waktunya; tidak ada yang dihapus.

### Perlu persetujuan eksplisit lebih dulu — huruf a

Yang berikut ini **belum dikumpulkan**, dan tidak boleh dikumpulkan sebelum
mekanisme persetujuan ada:

| Data | Kenapa tidak masuk huruf b |
|---|---|
| Jam berapa seseorang belajar | Kursus tetap tersampaikan tanpa mengetahui ini |
| Berapa lama halaman dibuka, pola sesi | Sama; ini pengamatan perilaku, bukan penyampaian materi |
| Peringkat "peserta terbaik" | Pemeringkatan orang adalah pemrofilan, bukan penyampaian kursus |

Pemeringkatan punya persoalan tambahan di luar dasar hukumnya: UU PDP memberi
subjek data hak terkait keputusan otomatis dan pemrofilan. Peringkat yang
terlihat pengelola — apalagi yang memengaruhi perlakuan — masuk wilayah itu.

### Boleh dengan uji keseimbangan — huruf f

Statistik agregat yang tidak bisa ditelusuri ke satu orang — misalnya
"72% peserta salah di soal ini" — berkepentingan sah untuk memperbaiki materi,
dan dampaknya ke privasi mendekati nol selama jumlah pesertanya cukup banyak
untuk tidak menunjuk satu orang.

**Ambang kecil harus dijaga.** Kalau sebuah kursus hanya punya dua peserta,
"50% menjawab benar" berarti "satu dari dua orang ini salah" — dan pengelola
tahu siapa keduanya. Karena itu angka agregat selalu ditampilkan bersama
jumlah jawabannya, supaya pembacanya melihat sendiri kapan angkanya tidak
bermakna. API publik memakai aturan yang lebih keras lagi: jumlah peserta di
bawah lima disembunyikan.

## 4. Pelacakan perilaku — sudah dibangun, dengan lima syarat ini

Syarat minimum berdasarkan UU PDP, dan **bagaimana masing-masing ditegakkan**
(bukan sekadar dijanjikan):

1. **Pemberitahuan spesifik sebelum pengumpulan.** Isinya di
   `lib/tracking-notice.ts`: data apa, untuk tujuan apa, disimpan berapa lama,
   siapa yang melihat, dan apa yang **tidak** dilakukan. Versinya ikut dicatat
   pada tiap keputusan — mengubah teksnya berarti menaikkan versinya, karena
   persetujuan atas teks lama tidak mencakup pengumpulan yang baru.
2. **Persetujuan terpisah, bawaannya mati.** Tidak ada saklar yang sudah
   menyala. Menolak tidak mengurangi satu fitur pun; kartunya mengatakan itu
   di kalimat pertama.
3. **Penarikan semudah pemberian**, dan ia **menghapus data yang sudah
   terkumpul** — bukan hanya menghentikan penambahan. Data lama yang tetap
   dipakai berarti penarikannya hanya setengah berlaku.
4. **Batas simpan 12 bulan**, ditulis di `purge_old_learning_events()`. Cukup
   untuk membandingkan satu angkatan dengan berikutnya, tidak lebih.
5. **Tidak dipakai untuk keputusan otomatis.** Tidak memengaruhi nilai maupun
   kelulusan, dan tidak ada pemeringkatan orang.

### Ditegakkan basis data, bukan kode aplikasi

Policy `learning_events` mensyaratkan `has_tracking_consent()` pada setiap
insert. Rute API bisa salah, lupa diperiksa, atau diganti; policy tidak.
**Terbukti:** membuka pelajaran tanpa persetujuan menghasilkan nol baris,
setelah menyetujui satu baris, dan setelah menarik persetujuan nol lagi
dengan data sebelumnya terhapus.

Catatan persetujuannya **hanya bertambah** — tidak ada policy UPDATE maupun
DELETE. Kalau suatu saat dipersoalkan, yang harus bisa ditunjukkan bukan
"sekarang dia setuju" melainkan "dia menyetujui versi ini, pada tanggal ini,
lalu menariknya pada tanggal itu". Terbukti tidak bisa disunting maupun
dihapus dari sesi pemiliknya sendiri.

### Angkanya tidak mewakili seluruh peserta

Karena hanya yang menyetujui yang tercatat, layar superadmin menampilkan
**jumlah yang menyetujui di atas angkanya**, bukan di catatan kaki.
"Rata-rata 40 menit" dari tiga orang terbaca sama meyakinkannya dengan dari
tiga ratus, dan itu kesalahan baca yang paling mahal di layar seperti ini.

Catatan desain: sebagian besar nilai dari "kebiasaan belajar" bisa didapat
tanpa menyimpan jejak per orang sama sekali — misalnya menghitung distribusi
jam belajar secara agregat dan membuang identitasnya saat ditulis. Kalau itu
cukup untuk keperluannya, itu yang dipilih.

## 5. Sumber

- Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 16
  (asas pengumpulan terbatas dan spesifik) dan Pasal 20 (dasar pemrosesan).
  https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf
- Ringkasan enam dasar pemrosesan: https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-20
- Mekanisme persetujuan yang sah menurut UU PDP:
  https://www.hukumku.id/post/mekanisme-persetujuan-consent-pengguna-yang-sah-menurut-uu-pdp
