/**
 * Contoh dokumen untuk mencoba "Buat otomatis dengan AI".
 *
 * == Kenapa ini ada ==
 *
 * Fitur yang meminta unggahan tidak bisa dicoba oleh orang yang belum punya
 * berkasnya. Tanpa contoh, mentor pertama kali membuka dialognya, sadar ia
 * harus mencari dokumen dulu, lalu menutupnya -- dan sering tidak kembali.
 * Pola yang sama dipakai impor Markdown, yang menawarkan panduannya untuk
 * diunduh di langkah pertama.
 *
 * == Kenapa dokumen INI ==
 *
 * Ia sekaligus acuan "seberapa bagus dokumennya harus". Tiap ciri di bawah
 * dipilih karena menentukan mutu kursus yang keluar, dan semuanya ada di
 * contoh ini:
 *
 *   1. Bagian bernomor dengan judul -- jadi batas modul yang jelas. Tanpa
 *      ini model menebak sendiri di mana satu topik berakhir.
 *   2. Angka dan ambang yang pasti (Rp 2.000.000, 2 x 24 jam, 5%) -- inilah
 *      yang membuat soal kuis punya jawaban benar tunggal. Dokumen tanpa
 *      angka menghasilkan soal yang jawabannya bisa diperdebatkan.
 *   3. Nama benda yang khas (Formulir TB-02, Berita Acara Selisih) -- model
 *      memakainya apa adanya, jadi istilah di kursus sama dengan istilah di
 *      lapangan.
 *   4. Bagian definisi -- hampir selalu jadi modul pertama yang baik.
 *   5. Siapa melakukan apa (petugas, kepala gudang, manajer) -- batas
 *      kewenangan adalah materi yang paling sering ditanyakan peserta.
 *   6. Larangan dan perkecualian -- bahan soal terkuat, karena di situlah
 *      orang paling sering keliru.
 *
 * Yang membuat dokumen BURUK, dan tidak bisa ditolong fitur ini: PDF hasil
 * pindai (tidak ada teksnya sama sekali), prosa mengalir tanpa bagian, dan
 * pernyataan kebijakan tanpa langkah yang bisa dikerjakan.
 *
 * Perusahaannya rekaan. Aturan yang sama dengan blok bukti sosial di halaman
 * depan (docs/STANDAR-HALAMAN-DEPAN.md): jangan menyebut perusahaan nyata di
 * contoh yang akan dibaca orang banyak.
 */
export const CONTOH_SOP_MARKDOWN = `STANDAR OPERASIONAL PROSEDUR
PENERIMAAN BARANG MASUK DI GUDANG
PT Sarana Contoh Nusantara — Dokumen internal, revisi 4

1. TUJUAN

Prosedur ini memastikan setiap barang yang masuk gudang diperiksa dengan cara
yang sama, dicatat di tempat yang sama, dan dipertanggungjawabkan oleh orang
yang jelas — siapa pun petugas yang sedang berjaga.

2. RUANG LINGKUP

Berlaku untuk seluruh barang yang masuk ke gudang pusat dan gudang cabang,
baik dari pemasok, retur pelanggan, maupun pindahan antargudang.

Tidak berlaku untuk barang contoh (sample) dari pemasok yang tidak masuk
catatan persediaan, dan tidak berlaku untuk perlengkapan kantor.

3. DEFINISI

3.1 Surat Jalan: dokumen dari pemasok yang menyebut jenis dan jumlah barang
    yang dikirim.
3.2 Formulir TB-02: formulir penerimaan barang milik gudang, tersedia di meja
    penerimaan dan wajib diisi untuk setiap kedatangan.
3.3 Selisih: perbedaan antara jumlah di Surat Jalan dan jumlah yang benar-benar
    diterima.
3.4 Berita Acara Selisih: dokumen yang dibuat bila ada selisih, ditandatangani
    petugas gudang dan pengantar barang.
3.5 Barang rusak tampak: kerusakan yang terlihat tanpa membuka kemasan dalam,
    misalnya kardus sobek, basah, atau penyok.

4. PERSIAPAN SEBELUM BARANG DATANG

4.1 Petugas memeriksa jadwal kedatangan di papan gudang setiap pagi pukul
    07.30.
4.2 Petugas menyiapkan area bongkar kosong minimal 2 x 3 meter.
4.3 Petugas menyiapkan Formulir TB-02, timbangan, dan alat ukur.
4.4 Kedatangan tanpa jadwal tetap diterima, tetapi dicatat sebagai
    "kedatangan tidak terjadwal" pada kolom keterangan.

5. PEMERIKSAAN SAAT BARANG DATANG

5.1 Petugas meminta Surat Jalan sebelum satu koli pun diturunkan.
5.2 Petugas mencocokkan nama pemasok dan nomor pesanan di Surat Jalan dengan
    jadwal kedatangan.
5.3 Petugas menghitung jumlah koli dan mencocokkannya dengan Surat Jalan.
5.4 Petugas memeriksa kerusakan tampak pada setiap koli.
5.5 Untuk barang bernilai lebih dari Rp 2.000.000 per koli, petugas membuka
    kemasan dan memeriksa isinya satu per satu.
5.6 Untuk barang di bawah nilai itu, petugas memeriksa isi secara acak
    sebanyak 5% dari jumlah koli, minimal satu koli.

6. MENCATAT HASIL PEMERIKSAAN

6.1 Petugas mengisi Formulir TB-02: tanggal, jam kedatangan, nama pemasok,
    nomor Surat Jalan, jumlah koli, dan hasil pemeriksaan.
6.2 Petugas membubuhkan tanda tangan dan nama terang.
6.3 Pengantar barang ikut menandatangani Formulir TB-02.
6.4 Satu salinan Formulir TB-02 diberikan kepada pengantar barang.
6.5 Formulir TB-02 asli disimpan di map penerimaan gudang.

7. BILA ADA SELISIH ATAU KERUSAKAN

7.1 Petugas tidak boleh menolak seluruh kiriman hanya karena satu koli rusak.
7.2 Petugas memisahkan barang bermasalah ke area karantina, diberi label
    merah.
7.3 Petugas membuat Berita Acara Selisih dan memintanya ditandatangani
    pengantar barang sebelum pengantar meninggalkan gudang.
7.4 Selisih sampai dengan 2% dari jumlah kiriman diselesaikan kepala gudang.
7.5 Selisih di atas 2% dinaikkan ke Manajer Logistik pada hari yang sama.
7.6 Barang di area karantina harus sudah diputuskan nasibnya dalam 2 x 24 jam.

8. MEMASUKKAN BARANG KE PERSEDIAAN

8.1 Hanya barang yang lolos pemeriksaan yang dimasukkan ke sistem persediaan.
8.2 Petugas memasukkan data dalam hari yang sama, paling lambat pukul 16.00.
8.3 Petugas menempelkan label lokasi rak pada setiap koli sebelum disimpan.
8.4 Barang yang masuk lebih dulu diletakkan di posisi yang lebih mudah
    diambil, supaya keluar lebih dulu juga.

9. PELAPORAN

9.1 Kepala gudang merekap penerimaan setiap akhir pekan: jumlah kedatangan,
    jumlah selisih, dan jumlah barang rusak.
9.2 Rekap dikirim ke Manajer Logistik paling lambat hari Senin pukul 12.00.
9.3 Pemasok dengan selisih lebih dari tiga kali dalam satu bulan dilaporkan
    secara terpisah.

10. LARANGAN

10.1 Petugas dilarang menandatangani Surat Jalan sebelum penghitungan selesai.
10.2 Petugas dilarang menerima barang tanpa Surat Jalan, meski pengantarnya
     sudah dikenal.
10.3 Petugas dilarang memasukkan barang karantina ke sistem persediaan.
10.4 Petugas dilarang mengubah angka di Formulir TB-02 yang sudah
     ditandatangani; koreksi dibuat pada formulir baru.
`
