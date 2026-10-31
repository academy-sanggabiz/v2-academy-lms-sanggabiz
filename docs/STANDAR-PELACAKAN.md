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

## 4. Kalau nanti pelacakan perilaku jadi dibangun

Syarat minimum, berdasarkan UU PDP:

1. **Pemberitahuan sebelum pengumpulan**, menyebutkan secara spesifik: data apa,
   untuk tujuan apa, disimpan berapa lama, dan siapa yang bisa melihatnya.
   Bukan satu kalimat umum di kebijakan privasi.
2. **Persetujuan yang bisa dipisahkan.** Peserta harus bisa menolak pelacakan
   perilaku dan tetap memakai LMS sepenuhnya. Persetujuan yang menjadi syarat
   memakai layanan bukan persetujuan yang bebas.
3. **Bisa ditarik semudah diberikan**, dan penarikan menghentikan pengumpulan
   berikutnya.
4. **Batas penyimpanan yang ditentukan di awal**, bukan "selamanya".
5. **Tidak dipakai untuk keputusan otomatis** tentang orangnya tanpa jalur
   peninjauan manusia.

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
