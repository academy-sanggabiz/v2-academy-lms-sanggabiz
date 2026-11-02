# Prototipe Desain

Halaman HTML mandiri untuk **melihat usulan perbaikan tampilan sebelum
dikerjakan di LMS**. Bukan bagian dari aplikasi: tidak diimpor, tidak
dibangun, tidak dideploy. Buka langsung di peramban.

- `perbaikan-tampilan.html` — pembanding "sekarang" vs "usulan" untuk empat
  perbaikan berdampak terbesar (ruas isian, form, keadaan kosong, kepadatan
  dasbor), plus skala huruf.

Sisi **"sekarang"** dibangun dari nilai yang benar-benar berjalan di
`components/ui/input.tsx` dan `app/globals.css` — tinggi 32px, `rounded-lg`,
tanpa label terlihat — bukan dari ingatan. Sisi **"usulan"** memakai token
merek yang sama (`#13707f`, Poppins), jadi yang berubah hanya bentuknya,
bukan identitasnya.

Dasar temuannya: `docs/ANALISIS-SISTEM-DESAIN.md`.
