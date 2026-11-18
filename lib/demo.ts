/**
 * Sakelar tampilan untuk acara 19 November 2026.
 *
 * Yang disembunyikan HANYA antarmukanya, bukan fiturnya. Rutenya tetap ada,
 * server action-nya tetap jalan, basis datanya tidak disentuh sama sekali.
 * Alasannya diminta pemilik dengan jelas: memperbaiki atau mematikan
 * fiturnya berarti ada banyak hal yang harus diperiksa ulang satu per satu
 * saat dinyalakan lagi, sedangkan menyembunyikan tampilannya bisa dibatalkan
 * dengan mengubah satu baris di bawah ini.
 *
 * Yang disembunyikan dan kenapa:
 *
 *  - **Tautan "Daftar" di halaman masuk.** Pendaftaran lewat surel memakai
 *    pengirim bawaan Supabase, yang dibatasi beberapa surel per jam. Di acara
 *    dengan banyak orang mencoba bersamaan, kuotanya habis dan pendaftaran
 *    tampak rusak -- termasuk bagi orang yang benar-benar ingin mendaftar.
 *
 *  - **Menu "Pembelian" peserta.** Belum ada gerbang pembayaran sama sekali
 *    (lihat catatan commerce di CLAUDE.md), jadi menu itu etalase tanpa kasir.
 *
 * Yang SENGAJA tidak disembunyikan, supaya tidak ada yang mengira ini
 * terlewat:
 *
 *  - **"Masuk dengan Google" tetap ada.** Justru inilah jalan masuk yang
 *    aman untuk acara ramai: ia tidak mengirim satu surel pun, jadi tidak
 *    bisa kena batas kuota di atas. Sudah terbukti dipakai -- pada
 *    17 November 2026 ada 8 akun produksi yang lahir lewat jalur ini, semua
 *    namanya terisi benar.
 *
 *  - **"Lupa sandi" tetap ada**, atas keputusan pemilik. Ia memang memakai
 *    pengirim surel yang sama, jadi batas kuotanya berlaku; risikonya
 *    diterima karena yang memakainya hanya orang yang sudah punya akun.
 *
 *  - **Kartu notifikasi surel di Pengaturan tetap ada.** Ia sudah mengaku
 *    sendiri di layar bahwa pengiriman surel belum aktif, jadi tidak ada
 *    yang gagal dan tidak ada yang dijanjikan palsu. Menyembunyikannya
 *    malah menghapus keterangan jujur itu.
 *
 * SESUDAH 19 NOVEMBER: ubah menjadi `false`. Hanya itu. Tidak ada kode lain
 * yang perlu dikembalikan, dan tidak ada data yang perlu dibereskan.
 */
export const SEMBUNYIKAN_UNTUK_DEMO = true
