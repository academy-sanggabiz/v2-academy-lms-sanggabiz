-- Warna halaman depan.
--
-- Lingkupnya sengaja hanya halaman depan, bukan seluruh aplikasi: mengganti
-- warna di sini tidak boleh ikut mengganti warna layar belajar dan layar
-- pengelola, yang keduanya bukan tempat bereksperimen dengan merek.
--
-- Nilainya tetap diperiksa terhadap ambang kontras WCAG sebelum disimpan dan
-- sekali lagi saat dibaca (lib/landing-theme.ts). Satu bidang warna bebas di
-- panel admin bisa meruntuhkan seluruh kerja kontras dalam satu klik, dan yang
-- memilih warnanya tidak akan sadar -- ia melihat layar bagus, sementara orang
-- dengan penglihatan rendah tidak bisa membaca apa pun.
alter table public.landing_content add column if not exists theme jsonb;

comment on column public.landing_content.theme is
  'Warna halaman depan. NULL berarti palet bawaan (lib/landing-theme.ts).';
