-- "Buat otomatis dengan AI" menjadi pekerjaan yang bisa dilihat dan ditinggal.
--
-- == Masalahnya ==
--
-- Penulisan enam modul memakan sekitar satu menit di dalam SATU panggilan.
-- Selama itu layar hanya menampilkan kata "Menulis...", dan menutup dialog
-- berarti kehilangan seluruhnya. Pemilik menyebut ketiganya pada pemakaian
-- pertama (docs/BACKLOG.md bagian Z): tidak ada persen, tidak boleh
-- ditinggal, tidak bisa kembali.
--
-- == Perubahannya ==
--
-- Kemajuan berhenti menjadi keadaan di dalam satu permintaan dan menjadi
-- BARIS di basis data. Tiap modul yang selesai ditulis menaikkan
-- `modul_selesai` dan menyimpan hasilnya di `bagian`. Satu perubahan ini
-- menyelesaikan tiga hal sekaligus:
--
--   * persennya nyata -- modul_selesai / modul_total, bukan pengatur waktu
--     yang mengarang kemajuan;
--   * dialognya boleh ditutup -- layar membaca barisnya, bukan ingatan
--     komponen;
--   * pekerjaan yang mati di tengah bisa DILANJUTKAN, bukan diulang dari
--     nol, karena barisnya tahu modul mana yang sudah jadi.
--
-- Yang terakhir itu bukan kemewahan. Fungsi tanpa server punya batas waktu;
-- pekerjaan satu menit yang tidak bisa dilanjutkan adalah pekerjaan yang
-- sesekali hilang seluruhnya tanpa penjelasan.
--
-- == Keamanan perubahan ==
--
-- Seluruhnya penambahan kolom pada `ai_course_generations`, tabel yang hanya
-- dipakai fitur ini dan belum punya baris apa pun di produksi. Semuanya
-- NULLABLE atau berdefault, jadi baris lama (kalau nanti ada) tetap sah.
-- Tidak ada tabel lain yang disentuh.

alter table public.ai_course_generations
  add column if not exists modul_total int,
  add column if not exists modul_selesai int not null default 0,
  add column if not exists bagian jsonb not null default '[]'::jsonb,
  add column if not exists tahap text,
  add column if not exists galat text,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.ai_course_generations.modul_total is
  'Berapa modul yang harus ditulis. Penyebut persen kemajuan.';
comment on column public.ai_course_generations.modul_selesai is
  'Berapa modul yang sudah selesai ditulis. Pembilang persen kemajuan, sekaligus titik lanjut bila pekerjaannya terputus.';
comment on column public.ai_course_generations.bagian is
  'Markdown tiap modul yang sudah jadi, berurutan. Dipakai merakit hasil akhir tanpa menulis ulang modul yang sudah selesai.';
comment on column public.ai_course_generations.tahap is
  'Tahap yang sedang berjalan, untuk ditampilkan apa adanya: kerangka | menulis | selesai | gagal.';
comment on column public.ai_course_generations.galat is
  'Pesan kegagalan terakhir. Disimpan supaya layar bisa menjelaskan kenapa berhenti, bukan sekadar berhenti.';

-- Dibaca berulang kali oleh layar yang menanyakan kemajuan, selalu dengan
-- penyaring yang sama: pekerjaan milik saya, pada kursus ini, terbaru dulu.
create index if not exists ai_course_generations_pemilik_idx
  on public.ai_course_generations (created_by, course_id, created_at desc);
