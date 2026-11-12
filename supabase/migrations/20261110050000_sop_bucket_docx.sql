-- Bucket dokumen sumber kursus menerima Word.
--
-- Janji fiturnya berubah dari "SOP" menjadi "dokumen apa pun" (2026-11-10),
-- dan Word adalah format pertama yang dicoba orang. Tanpa jenis MIME ini,
-- Storage menolak unggahannya dengan pesan yang tidak menjelaskan apa pun.
--
-- `allowed_mime_types` ditimpa seluruhnya, bukan ditambah: kolomnya array,
-- bukan himpunan yang bisa disisipi. Tiga jenis lama ditulis ulang di sini
-- supaya tidak ada yang hilang.
--
-- Nama bucketnya tetap 'sop-documents'. Itu pengenal internal yang tidak
-- pernah dilihat pengguna; menggantinya berarti memindahkan objek yang sudah
-- ada demi kosmetik.

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
]
where id = 'sop-documents';
