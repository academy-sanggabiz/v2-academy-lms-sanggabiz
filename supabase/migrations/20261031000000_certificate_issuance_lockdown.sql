-- C-05 (High, docs/SECURITY-REVIEW.md): penerbitan sertifikat berjalan di sesi
-- peserta, sehingga peserta dapat menyisipkan baris `certificates` sendiri,
-- mengubah `enrollments.status` menjadi 'completed', dan mengunggah PDF buatan
-- sendiri -- semuanya langsung lewat REST, tanpa menyentuh aplikasi. Sertifikat
-- palsu terbukti bisa dibuat.
--
-- Perbaikannya: cabut seluruh jalur tulis peserta. Setelah ini satu-satunya
-- yang boleh menulis adalah admin pemilik kursus dan kode server kita sendiri
-- memakai service role (lib/certificates.ts), yang baru menulis setelah
-- menghitung ulang kelayakannya: semua pelajaran selesai, semua kuis lulus, dan
-- nilai akhir >= courses.passing_grade.
--
-- Yang sengaja DIPERTAHANKAN untuk peserta: membaca sertifikatnya sendiri dan
-- membaca berkas PDF-nya sendiri. Mengunduh tetap berfungsi; hanya menulis yang
-- hilang.

drop policy if exists "own certificates insertable" on public.certificates;
drop policy if exists "own certificates updatable" on public.certificates;

-- Satu-satunya pengubah status enrollment di kode adalah penerbitan sertifikat,
-- yang kini memakai service role. Peserta tetap boleh mendaftar sendiri
-- (policy INSERT) dan membaca barisnya sendiri (policy SELECT).
drop policy if exists "own enrollments updatable" on public.enrollments;

-- PDF sertifikat kini dibuat dan diunggah oleh server. Tanpa pencabutan ini,
-- peserta masih bisa menimpa berkas PDF di foldernya sendiri dengan berkas apa
-- pun, meski baris sertifikatnya sudah tidak bisa ia buat.
drop policy if exists "learners can upload own certificate pdfs" on storage.objects;
drop policy if exists "learners can update own certificate pdfs" on storage.objects;
