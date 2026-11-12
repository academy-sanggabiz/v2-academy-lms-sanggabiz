# Status MVP AI Korporat

Acuan: `BRIEF-MVP-AI-KORPORAT.docx` (5 Nov 2026).
Dikerjakan: 10 Nov 2026, branch `mvp-ai-korporat`.

## Ringkas

| Kode | Fitur | Keadaan |
|---|---|---|
| F4 | Asisten AI di pelajaran | **Selesai, memakai Gemini sungguhan** |
| F5 | Bahas jawaban saya | **Selesai, memakai Gemini sungguhan** |
| F6 | Kursus untuk jabatan Anda | **Selesai** (tanpa AI, memang aturan) |
| F1 | Buat kursus dari dokumen | **Selesai** (12 Nov 2026) |
| F2 | Integrasi API dan webhook | **Selesai** (12 Nov 2026) |
| F3 | Laporan per departemen | **Selesai** (13 Nov 2026) |

Tiga yang pertama selesai adalah persis yang brief sendiri sebut realistis di
§10 ("realistisnya yang nyata adalah F5, F4, dan F6"). Tiga sisanya menyusul
pada 12-13 November 2026; keenamnya kini ada.

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

## Penyedia AI: bisa diganti lewat env

`lib/ai/client.ts` punya dua adapter berdampingan. Yang di luarnya --
`tanyaTeks`, `tanyaJson`, `aiAktif`, dan pemanggilnya -- tidak tahu penyedia
mana yang dipakai.

| Env | Arti |
|---|---|
| `AI_PROVIDER` | `openai` (DeepSeek dan yang kompatibel) atau `gemini`. Kosong = `gemini`, perilaku lama |
| `AI_BASE_URL`, `AI_API_KEY` | dipakai adapter `openai` |
| `GEMINI_API_KEY` | dipakai adapter `gemini` |
| `AI_MODEL` | kosong = bawaan per penyedia |

**Diukur 10 Nov 2026 lewat kode yang sebenarnya**, bukan lewat curl yang
meniru bentuknya:

| Penyedia | Teks | JSON terstruktur |
|---|---|---|
| `deepseek-flash` | **1,4 dtk** | **2,0 dtk** |
| `gemini-3.1-flash-lite` | 7,2 dtk | 4,4 dtk |

Keduanya mengembalikan JSON yang lolos `periksa()` dengan 0 id karangan.

Lewat aplikasi sungguhan dengan DeepSeek, pelajaran "Kenapa uang usaha harus
dipisah":

- **di dalam materi, 3,1 dtk** -- menyebut tiga kerugian yang memang ada di
  pelajarannya (laba semu, modal termakan, sulit pinjam);
- **di luar materi, 2,2 dtk** -- menolak, lalu menunjuk pelajaran nyata dari
  daftar isi ("Membedakan omzet, laba kotor, dan laba bersih" di Modul 2).

Model yang TIDAK bisa dipakai, juga diukur:

- `gemini-2.5-flash` dan `-lite`: 404, "no longer available to new users".
- `gemini-flash-latest` (= gemini-3.8-flash): sering 503, dan berpikir 331
  token untuk prompt 7 token -- 40 detik untuk satu kalimat.

Mematikan mode berpikir wajib di kedua penyedia (`thinkingBudget: 0` /
`thinking: {type: "disabled"}`) dan bukan demi biaya: fungsi serverless Vercel
punya batas durasi, jadi penalaran bawaan bukan sekadar lambat -- ia gagal.

### Ketentuan data DeepSeek

Pemrosesan berlangsung di Republik Rakyat Tiongkok, dan menurut ketentuan
DeepSeek masukan dapat dipakai melatih model mereka. Untuk demo dengan data
contoh itu memadai. Untuk klien yang SOP-nya rahasia, ganti `AI_PROVIDER`.
Jangan pernah menjanjikan "data tidak keluar negeri" selama memakai DeepSeek
langsung. Halaman `/legal/privasi` menyebut penyedia dan negaranya; panel
Asisten dan tombol "Bahas jawaban saya" menyebutnya juga, di tempat orang
mengetik.

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

## Tiga yang menyusul

### F3 — Laporan per departemen (13 Nov 2026)
`lib/laporan-departemen.ts` (logika murni), `lib/laporan-departemen-server.ts`
(pembaca, klien pemanggil), `lib/ai/report-summary.ts`, dan bagian
`LaporanDepartemen` di `/admin/tracking` — superadmin saja, sepagar dengan
"Lama belajar".

Ketiga aturan brief dihormati, dan dua di antaranya dijaga oleh **tipe**, bukan
oleh niat baik:

- **Kelompok di bawah lima orang tidak menampilkan angka** (`AMBANG_LAPORAN`).
  Yang ditahan angkanya, bukan barisnya: menghilangkan departemennya membuat
  jumlah tidak pernah cocok dan terbaca seperti data rusak.
- **Ringkasan hanya melihat angka agregat.** Yang dikirim ke model adalah
  `AngkaRingkas`, tipe yang tidak punya ruas untuk id, nama orang, surel,
  maupun judul kursus.
- **Tidak ada pemeringkatan orang.** Tidak satu pun fungsi di modul itu
  mengembalikan baris per orang.

Dibuat sebagai BAGIAN di `/admin/tracking`, bukan layar sendiri seperti
rencana awal "tab": menu pengelola sudah di sebelas entri (butir A4 standar
platform), dan halaman itu memang sudah tempat angka agregat tinggal.
Agregatnya juga tidak jadi diletakkan di `lib/insight-server.ts` — berkas itu
seluruhnya ber-lingkup satu kursus, sementara laporan ini lintas organisasi.

Ringkasan disimpan **satu per bahasa** (`scope` = `departemen:id` /
`departemen:en`). Dengan satu baris untuk semua bahasa, pembaca Inggris
mendapat antarmuka Inggris berisi ringkasan Indonesia, karena penulis terakhir
yang menang.

### F1 — Buat kursus dari dokumen (12 Nov 2026)
`lib/ai/sop.ts` + `app/admin/courses/sop-actions.ts` + `SopDialog`. Menerima
`.pdf`, `.docx`, `.md`, `.txt`. Jalur `.md` lama tetap ada sebagai cadangan,
sesuai syarat yang dicatat di sini sebelumnya.

### F2 — Integrasi API dan webhook (12 Nov 2026)
`/api/v1/*` dengan kunci ber-hash SHA-256 dan lingkup `read`/`write`, webhook
bertanda tangan HMAC yang diantrekan **oleh trigger basis data**, dan layar
Integrasi beserta halaman petunjuknya. Pengirimannya tidak bergantung
penjadwal: paket Hobby menolak cron lebih sering dari sekali sehari, jadi
antrean dikirim lewat `after()` tepat sesudah kejadian terantre. Simulator
HRIS tidak dibuat — halaman petunjuk berisi contoh `curl` yang bisa disalin,
dan itu memenuhi kebutuhan yang sama tanpa layar tambahan.

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

## Alur branch

`dev` adalah tempat perubahan diuji di lingkungan yang sudah ter-deploy,
sebelum masuk `main`. Urutannya: kerjakan di branch fitur -> merge ke `dev` ->
buka `dev` yang sudah ter-deploy dan coba sendiri -> baru PR `dev` -> `main`.

**Yang dipisahkan `dev` adalah KODE, bukan DATA.** `NEXT_PUBLIC_SUPABASE_URL`
dan `SUPABASE_SERVICE_ROLE_KEY` di lingkungan Preview menunjuk proyek Supabase
yang sama persis dengan Production. Artinya menguji di `dev`:

- membuat jabatan, departemen, dan penugasan jabatan yang SUNGGUHAN, dan
  langsung terlihat di produksi;
- menulis baris `ai_chat_messages`, `ai_quiz_feedback`, dan `ai_usage` yang
  sungguhan, serta memakai kuota Gemini yang sungguhan.

Jadi `dev` melindungi dari cacat KODE -- halaman yang gagal dirender, galat
500, tata letak yang rusak, alur yang buntu. Ia tidak melindungi dari
perubahan data. Untuk itu perlu proyek Supabase kedua, dan migrasi dijalankan
ulang di sana.

Kembali ke keadaan sebelum pekerjaan ini: `git checkout main`.
