-- Acak soal menyala secara bawaan.
--
-- Kolom `quizzes.shuffle` sudah ada sejak awal dan ada tombolnya di editor
-- ("Acak Soal"), tetapi tidak satu baris kode pun pernah membacanya -- jadi
-- menyalakannya tidak mengubah apa pun. lib/quiz-shuffle.ts sekarang
-- memakainya di pemutar peserta.
--
-- Bawaannya diubah menjadi menyala karena batas percobaan sudah dicabut
-- (20261101050000): kuis yang boleh diulang tanpa batas dan selalu tampil
-- persis sama mengundang menghafal posisi jawaban alih-alih memahami
-- materinya. Penyusun kursus tetap bisa mematikannya per kuis.
alter table public.quizzes alter column shuffle set default true;

update public.quizzes set shuffle = true where shuffle = false;
