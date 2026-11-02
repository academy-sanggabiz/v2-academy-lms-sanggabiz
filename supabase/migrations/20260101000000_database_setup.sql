-- Penanda saja. Sengaja tidak berisi DDL apa pun.
--
-- Skema dasar proyek ini dipasang dari `databaseSetup.sql` -- skrip
-- pasang-dari-nol yang berisi seluruh tabel, policy, dan fungsi awal. Skrip
-- itu BUKAN migrasi dan tidak boleh dijadikan migrasi: isinya tumpang tindih
-- dengan migrasi-migrasi setelahnya, jadi menjalankannya pada basis data yang
-- sudah berisi akan menerapkan ulang hal-hal yang sudah ada.
--
-- Tetapi riwayat migrasi di sisi remote sudah mencatat versi 20260101000000
-- sebagai penanda "skema dasar terpasang". Tanpa berkas ini, `supabase db
-- push` menolak jalan dengan DbPushMissingLocalError karena ada versi di
-- remote yang tidak punya berkas lokal.
--
-- Berkas ini menutup celah itu: riwayatnya sejajar, dan tidak ada satu pun
-- perintah yang dijalankan ulang.
--
-- Memasang lingkungan baru: jalankan `databaseSetup.sql` lebih dulu di SQL
-- Editor, baru `supabase db push`. Lihat docs/DEPLOY-VERCEL.md.

select 1 where false;
