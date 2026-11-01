-- Urutan belajar: bebas, atau harus berurutan.
--
-- Bawaannya `false` -- bebas, seperti Udemy -- karena itulah perilaku seluruh
-- kursus yang sudah ada. Mengubah bawaannya menjadi berurutan akan mengunci
-- peserta yang sedang berjalan di tengah kursus, pada pelajaran yang sebelumnya
-- boleh mereka lewati.
--
-- Penegakannya ada di server (app/learn/[courseId]/page.tsx), bukan hanya pada
-- tautan yang dinonaktifkan di sidebar: alamat pelajaran bisa diketik langsung.
alter table public.courses
  add column if not exists sequential boolean not null default false;

comment on column public.courses.sequential is
  'true = peserta harus menyelesaikan pelajaran berurutan; false = bebas memilih.';
