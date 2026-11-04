-- Satu kosakata untuk `courses.level`.
--
-- Kolom ini diisi dua penulis dengan dua kosakata: pemilih di editor kursus
-- menyimpan `beginner`/`intermediate`/`advanced`, sedangkan pengimpor .md
-- menyimpan "Pemula"/"Menengah"/"Lanjutan" apa adanya dari berkas penyusun.
-- Selama tingkat tidak pernah ditampilkan kepada peserta, perbedaan itu tidak
-- terlihat -- begitu katalog publik menyaring menurut tingkat, satu gagasan
-- yang sama pecah jadi dua kelompok yang tidak pernah bertemu.
--
-- Nilai yang tidak dikenali sengaja dijadikan NULL, bukan ditebak: "tingkat
-- yang belum diisi" adalah kenyataan yang bisa ditampilkan apa adanya,
-- sedangkan tebakan diam-diam menempatkan kursus di saringan yang salah.
update public.courses
set level = case lower(btrim(level))
  when 'beginner' then 'beginner'
  when 'pemula' then 'beginner'
  when 'dasar' then 'beginner'
  when 'basic' then 'beginner'
  when 'intermediate' then 'intermediate'
  when 'menengah' then 'intermediate'
  when 'advanced' then 'advanced'
  when 'lanjutan' then 'advanced'
  when 'mahir' then 'advanced'
  else null
end
where level is not null;

comment on column public.courses.level is
  'Tingkat kursus: beginner | intermediate | advanced, atau NULL bila belum diisi. Labelnya diterjemahkan di antarmuka (lib/course-level.ts), bukan disimpan sebagai teks Indonesia.';
