-- Takarir/transkrip untuk pelajaran video dan slide (WCAG 2.2 SC 1.2.2).
--
-- Audit aksesibilitas menemukan tidak ada mekanisme apa pun untuk ini: video
-- disematkan dari YouTube tanpa syarat bertakarir, tanpa transkrip, dan tanpa
-- panduan bagi penulis materi. Akibatnya peserta tuli atau yang menonton tanpa
-- suara berhenti total di konten inti kursus.
--
-- Transkrip disimpan sebagai teks biasa, bukan HTML: isinya memang kalimat,
-- dan teks biasa menghapus seluruh permukaan serangan yang baru saja ditutup
-- untuk isi pelajaran (C-09).
alter table public.lessons
  add column if not exists transcript text;

comment on column public.lessons.transcript is
  'Transkrip/takarir teks untuk pelajaran video dan slide (WCAG 1.2.2). Teks biasa, bukan HTML.';
