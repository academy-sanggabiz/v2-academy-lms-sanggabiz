# Status MVP AI Korporat

Acuan: `BRIEF-MVP-AI-KORPORAT.docx` (5 Nov 2026).
Dikerjakan: 10 Nov 2026, branch `mvp-ai-korporat`.

## Ringkas

| Kode | Fitur | Keadaan |
|---|---|---|
| F4 | Asisten AI di pelajaran | **Selesai, memakai Gemini sungguhan** |
| F5 | Bahas jawaban saya | **Selesai, memakai Gemini sungguhan** |
| F6 | Kursus untuk jabatan Anda | **Selesai** (tanpa AI, memang aturan) |
| F3 | Laporan per departemen | Belum — fondasi datanya sudah ada |
| F1 | Buat kursus dari dokumen | Belum |
| F2 | Integrasi API dan webhook | Belum — tabelnya sudah ada |

Ketiga yang selesai adalah persis yang brief sendiri sebut realistis di §10
("realistisnya yang nyata adalah F5, F4, dan F6").

## Yang tidak berubah di v2

Tidak satu pun fitur lama disentuh. Yang paling mudah salah, dan karena itu
diperiksa langsung:

- **Dasbor peserta tanpa jabatan** tampil persis seperti sebelumnya.
  `getMyJobCourses()` mengembalikan daftar kosong, bukan melempar, dan
  halamanlah yang memilih kartu mana yang dirender. Peserta UMKM yang memakai
  LMS ini hari ini memang tidak punya jabatan.
- **Layar hasil kuis**: skor, langkah berikutnya, penjelasan penyusun per soal,
  "Pelajari lagi", kotak "3 kali salah", dan tombol "Coba lagi" tidak berubah
  sedikit pun. F5 duduk *setelah* kotak adaptif.
- **Sidebar pemutar**: isi tab "Isi kursus" (centang per pelajaran, kunci
  kursus berurutan, hitungan per modul) tidak berubah. Tab kedua hanya muncul
  bila AI aktif.
- **`/api/public/stats` dan `/api/learning-events`** tidak disentuh.
- **Halaman depan, katalog publik, SEO** tidak disentuh.

## Model AI: kenapa `gemini-3.1-flash-lite`

Diukur 10 Nov 2026 dengan kunci proyek 430885087073:

| Model | Hasil |
|---|---|
| `gemini-2.5-flash`, `gemini-2.5-flash-lite` | **404** — "no longer available to new users" |
| `gemini-flash-latest` (= gemini-3.8-flash) | Jalan, tetapi sering **503** saat ramai, dan **berpikir 331 token untuk prompt 7 token**: 40 detik untuk satu kalimat |
| `gemini-3.1-flash-lite` | **1,5–2,4 detik**, `thinkingBudget: 0` diterima, JSON terstruktur sah |

`thinkingBudget: 0` wajib dan bukan penghematan biaya: tanpa itu fungsi
serverless Vercel habis waktunya sebelum jawaban datang.

503 masih muncul sesekali, jadi `lib/ai/client.ts` mencoba ulang **sekali**
untuk 503/429 saja — galat lain (kunci salah, model tidak ada, permintaan
cacat) tidak akan membaik dengan diulang.

## Sakelar

```
AI_ENABLED=true
AI_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=...        # server saja, tidak pernah NEXT_PUBLIC_*
```

Dengan `AI_ENABLED` mati atau kunci kosong, **F4 dan F5 tidak dirender sama
sekali** — bukan tampil lalu gagal. F6 tetap jalan karena tidak memakai AI.
`aiAktif()` diputuskan di server lalu dioper ke bawah lewat props.

## Keamanan yang dibuktikan, bukan diasumsikan

`npm run test:rls:mvp` — 18 pemeriksaan lewat REST sebagai peserta sungguhan:

```
peserta TIDAK bisa mengubah job_title_id / department_id / external_id / role
peserta BOLEH membaca job_titles, departments, job_title_courses
peserta tidak mendapat baris integration_api_keys / webhook_* 
peserta tidak bisa menyisipkan ke ai_chat_messages / ai_quiz_feedback /
  ai_report_summaries / ai_usage

18 lulus, 0 gagal
```

Yang pertama adalah jaminan utama F6: kalau bocor, siapa pun bisa mengangkat
dirinya ke jabatan mana pun dan dengan itu mengubah kursus wajibnya sendiri.

**Kenapa ada pemeriksa baru.** `npm run test:rls` sudah rusak sebelum
pekerjaan ini, dua kali: `redirect-check.mjs` mengimpor berkas `.ts` yang tidak
bisa dimuat Node 20, dan `rls-check.mjs` berhenti di baris pertama karena akun
fixture `admin@test.local` tidak ada di proyek ini. Keduanya tidak disebabkan
perubahan ini, tetapi artinya gerbang yang diklaim CLAUDE.md tidak berjalan.

## Privasi

- **Percakapan asisten** (`ai_chat_messages`) hanya bisa dibaca pemiliknya.
  Sengaja **tidak ada** policy baca untuk pengelola maupun superadmin — sama
  seperti `lesson_notes`. Keputusan pemilik 10 Nov 2026.
- **"Catatan saya" tidak pernah masuk prompt.** Mengirimnya akan menembus
  jaminan privat itu lewat pintu belakang.
- **`ai_usage` tidak menyimpan isi prompt**, hanya jumlah token: yang
  dibutuhkan untuk batas harian dan biaya, bukan isi pertanyaan orang.

## Cacat yang ditemukan dan diperbaiki

**F5 membahas UUID, bukan jawaban.** Pilihan ganda disimpan sebagai *id opsi*,
bukan teksnya (`QuizPlayer` menggabungkan id dengan koma). Jadi yang dikirim ke
model adalah `Jawaban peserta: 8d90f692-e882-4ecb-...`. Modelnya tetap
menjawab dengan masuk akal — itulah yang berbahaya — padahal ia menebak isi
pilihannya, yang membatalkan seluruh guna fitur ini. Hanya ketahuan karena
keluaran AI-nya diperiksa terhadap jawaban yang sebenarnya.

```
sebelum: "8d90f692-e882-4ecb-afc0-87..."
sesudah: "Kompiler menolak program karena panjang larik tidak sama"
```

**F4 memakai kolom yang tidak ada.** Versi pertama merakit kueri sendiri dengan
`lessons.course_id` — kolom itu tidak ada, relasinya lewat `section_id` — dan
menutup ketidakcocokan bentuknya dengan `as never`, cast yang membungkam
pemeriksa tipe alih-alih memperbaiki panggilannya. Diganti `getLearnData()`,
pembaca yang sama dengan halaman pemutar.

## Yang belum dikerjakan, dan apa yang sudah siap untuknya

### F3 — Laporan per departemen
Fondasinya **sudah ada**: `departments`, `job_titles`, `profiles.department_id`,
dan tabel `ai_report_summaries`. Yang kurang: fungsi agregat per departemen di
`lib/insight-server.ts`, tab di `/admin/tracking`, dan `lib/ai/report-summary.ts`.
Aturan yang harus dihormati: kelompok di bawah 5 orang disembunyikan, ringkasan
hanya dari angka agregat, tidak ada pemeringkatan orang.

### F1 — Buat kursus dari dokumen
Belum ada apa pun selain tabel `ai_course_generations`. Perlu keputusan
tertulis: ini **membalik** `docs/STANDAR-IMPOR-KURSUS.md §1` ("LMS tidak pernah
memanggil model bahasa"). Jalur `.md` lama harus tetap ada sebagai cadangan.

### F2 — Integrasi API dan webhook
Tabelnya **sudah ada** (`integration_api_keys`, `webhook_endpoints`,
`webhook_deliveries`) lengkap dengan RLS superadmin. Yang kurang: rute
`/api/v1/*`, hash kunci, penandatanganan HMAC, antrean kiriman, layar
Integrasi, dan simulator HRIS. Ini pekerjaan terbesar dari keenamnya dan satu-
satunya yang tidak memakai AI sama sekali.

## Gerbang

| Pemeriksaan | Hasil |
|---|---|
| `npx tsc --noEmit` | 0 galat |
| `npm run lint` | 0 galat |
| `npm run build` | lolos |
| `npm run cek:bahasa` | F1 & F2 lolos |
| `npm run i18n:check` | **25/25** layar, 0 baris tersisa |
| `npm run audit:a11y` | **104/104** tanpa pelanggaran WCAG 2.2 A/AA |
| `npm run test:rls:mvp` | **18 lulus, 0 gagal** |

## Cara mencoba

1. Masuk sebagai superadmin, buka **Jabatan & Departemen**.
2. Tambah departemen, tambah jabatan, lalu tambahkan satu kursus sebagai
   **Wajib** dengan tenggat 30 hari.
3. Di tabel Peserta di bawahnya, berikan jabatan itu kepada seorang peserta.
4. Masuk sebagai peserta itu — dasbornya menampilkan **"Untuk jabatan Anda"**
   dengan alasan dan tenggatnya.
5. Buka satu pelajaran teks → tab **Asisten AI** → tanyakan sesuatu tentang
   isinya, lalu tanyakan sesuatu di luarnya.
6. Kerjakan satu kuis sampai ada jawaban salah → di halaman hasil, tekan
   **"Bahas jawaban saya"**.

Kembali ke keadaan sebelum pekerjaan ini: `git checkout main`.
