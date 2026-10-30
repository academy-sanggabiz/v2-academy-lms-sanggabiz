# Standar Umpan Balik Antarmuka

Dokumen ini adalah turunan **operasional** dari `STANDAR-DIGITAL-LEARNING.md` §5 (Feedback dan progres), §16 (Angka acuan), §17 (Anti-pattern), dan §18 (Checklist). Dokumen itu menjawab *kenapa*; dokumen ini menjawab *persis apa yang harus ada di kode*.

Masalah yang memicu standar ini: tombol "Buat Kursus" di Manajemen Kursus bekerja dengan benar, tetapi selama server bekerja layar tidak berubah sedikit pun. Pengguna tidak tahu apakah kliknya masuk. Dalam standar kita itu adalah cacat: *"Diam setelah aksi"* (§17) dan *"Setiap aksi mendapat respons dalam ±1 detik"* (§18).

---

## 1. Aturan pokok

Nomor aturan dipakai sebagai rujukan di review kode ("ini melanggar R4").

| # | Aturan |
|---|---|
| **R1** | Setiap kontrol yang memicu kerja server punya **empat keadaan**: diam → sedang bekerja → berhasil → gagal. Tidak boleh ada aksi yang hanya punya keadaan "diam". |
| **R2** | Keadaan "sedang bekerja" muncul **dalam ±0,1 detik** setelah klik, dari state di klien. Jangan menunggu balasan server untuk mulai memberi tanda. |
| **R3** | Bentuk indikator mengikuti lama kerja (tabel §2), bukan selera. |
| **R4** | **`disabled` saja bukan umpan balik.** Tombol yang cuma meredup terbaca sebagai "rusak". Wajib ada perubahan **teks** (dan boleh ditambah spinner). |
| **R5** | **Teks wajib, spinner opsional.** `app/globals.css:149` mematikan animasi untuk `prefers-reduced-motion`, jadi spinner **membeku** jadi ikon diam bagi sebagian pengguna. Indikator yang hanya spinner = tidak ada indikator bagi mereka. |
| **R6** | Keberhasilan dikonfirmasi **sekali**: lewat perubahan UI yang jelas **atau** satu toast — jangan dua-duanya. Perpindahan halaman yang jelas sudah merupakan konfirmasi; jangan tambahi toast (§17: "pop-up setelah setiap klik"). |
| **R7** | Kegagalan tidak pernah diam. Pesan menyebut **apa yang salah dan apa yang harus dilakukan**, dalam Bahasa Indonesia, lewat `lib/db-error-message.ts` / `lib/auth/auth-error-message.ts`. Jangan pernah menampilkan pesan mentah Supabase, dan jangan `catch` yang hanya `console.log`. |
| **R8** | Aksi berisiko atau sulit dibatalkan (hapus, terbitkan, impor nilai, keluarkan peserta) wajib **konfirmasi sebelum** dan **konfirmasi sesudah**. |
| **R9** | Aksi taruhan tinggi milik peserta (kirim kuis, kirim studi kasus, ikut kursus) **tidak boleh terkirim dua kali**: kunci kontrol selama proses, dan beri status yang tidak ambigu sesudahnya. |
| **R10** | Status yang berubah tanpa pindah fokus wajib terbaca screen reader: `aria-busy` pada kontrol, `role="status"` + `aria-live="polite"` pada teks status (WCAG 2.2 SC 4.1.3). |
| **R11** | Fokus keyboard tidak boleh hilang saat kontrol terkunci — pakai `focusableWhenDisabled` pada `Button`, jangan melepas tombol dari urutan tab di tengah aksi. |
| **R12** | Autosave wajib punya indikator tiga keadaan: *Menyimpan… / Tersimpan / Gagal menyimpan* + cara mencoba lagi. Menyimpan diam-diam sama saja dengan tidak menyimpan, dari sudut pandang pengguna. |
| **R13** | Kata yang dipakai mengikuti tabel §4. Satu aksi punya satu nama di seluruh aplikasi (§17: "satu aksi dengan tiga nama"). |

---

## 2. Ambang waktu → bentuk indikator

Dasar: Nielsen 1993 (sudah dikutip di §16), dan panduan NN/g tentang indikator proses.

| Lama kerja | Yang dirasakan pengguna | Yang harus ditampilkan |
|---|---|---|
| < 0,1 detik | Terasa instan | Tidak perlu indikator |
| 0,1 – 1 detik | Alur pikir tidak terputus | Perubahan UI langsung (optimistic) atau spinner inline kecil |
| 1 – 10 detik | Mulai bertanya "ini jalan tidak?" | **Spinner + teks pada kontrol**, kontrol dikunci, sisanya tetap bisa dibaca |
| > 10 detik | Perhatian pindah | Progres yang menyebut kemajuan nyata + cara membatalkan + jangan blokir seluruh layar |

**Semua aksi server di LMS ini masuk kategori 1–10 detik** (query Supabase lintas jaringan + render ulang). Jadi bentuk bakunya: spinner + teks pada kontrol yang diklik.

---

## 3. Mekanisme mana untuk situasi mana

| Situasi | Mekanisme | Dipakai lewat |
|---|---|---|
| `<form action={serverAction}>` | `useFormStatus()` **di komponen anak** (kalau dipanggil di komponen yang sama dengan `<form>`, nilainya selalu `false`) | `<SubmitButton>` |
| `onClick` + `useTransition` | prop `pending` pada tombol | `<Button pending={isPending} pendingLabel="Menyimpan…">` |
| Form dengan hasil dari server (login, daftar) | `useActionState` — `isPending` dari situ | `<SubmitButton>` |
| Daftar yang difilter / diurutkan / dipaginasi | Wilayah daftar diberi `aria-busy`, diredupkan, plus teks "Memuat…" | `<PendingRegion>` |
| Autosave (editor kursus, catatan pelajaran) | Indikator tiga keadaan dekat kolom yang diisi | `<SaveStatus>` |
| Hasil aksi yang tidak mengubah layar secara jelas | Satu toast | `sonner` |
| Muat data awal halaman | Skeleton yang bentuknya menyerupai isi akhir | `<Skeleton>` |
| Aksi berisiko | Dialog konfirmasi + tombol aksi yang punya keadaan pending | `<AlertDialog>` + `<Button pending>` |
| Tombol lain di permukaan yang sama ikut dikunci | Guard sepermukaan; `<Button>` membacanya sendiri | `<BusyGuardProvider busy={…}>` |
| Wilayah yang sedang ditunggu dan tidak boleh disentuh | `inert` + lapisan penanda | `<BusyRegion busy={…} label="…">` |
| Aksi yang berakhir dengan pindah halaman | Seluruh kerangka dikunci + skeleton satu layar | `useAdminBusy().setBusy(true, "…")` lalu `router.push` di dalam transition yang sama |

**Jangan** memakai toast untuk mengumumkan bahwa sesuatu *sedang* berjalan — toast adalah penutup, bukan indikator proses. Indikator proses tinggal di kontrol yang diklik.

---

## 4. Kata baku

Mengikuti `GLOSARIUM-UI.md`: formal, sapaan "Anda", tanpa tanda seru, tanpa emoji. Keadaan "sedang bekerja" memakai **kata kerja + elipsis**; keadaan selesai memakai **bentuk sudah**.

| Aksi | Sedang bekerja | Berhasil | Gagal |
|---|---|---|---|
| Simpan | Menyimpan… | Tersimpan | Gagal menyimpan |
| Buat | Membuat… | (pindah ke halaman baru) | Gagal membuat kursus |
| Kirim (kuis, studi kasus) | Mengirim… | Terkirim | Gagal mengirim |
| Hapus | Menghapus… | Terhapus | Gagal menghapus |
| Terbitkan | Menerbitkan… | Terbit | Gagal menerbitkan |
| Unggah | Mengunggah… | Terunggah | Gagal mengunggah |
| Ikut kursus | Mendaftarkan… | Terdaftar | Gagal mendaftar |
| Muat daftar | Memuat… | (daftar tampil) | Gagal memuat |
| Impor | Mengimpor… | Impor selesai | Gagal mengimpor |

**Pola pesan gagal:** `<apa yang gagal>. <apa yang harus dilakukan>.`
Contoh: "Gagal menyimpan. Periksa koneksi Anda, lalu coba lagi." — bukan "Error", bukan "Terjadi kesalahan", bukan pesan Inggris dari database.

Tombol pemulihan selalu bernama **"Coba lagi"**.

---

## 5. Aksesibilitas (WCAG 2.2 AA)

| Hal | Aturan |
|---|---|
| SC 4.1.3 Status Messages | Teks status yang muncul tanpa pindah fokus dibungkus `role="status"` + `aria-live="polite"`. Untuk kegagalan yang menghentikan pekerjaan, pakai `role="alert"`. |
| Kontrol yang sedang bekerja | `aria-busy="true"` pada tombol/wilayah yang bersangkutan. |
| Fokus | Tombol yang terkunci tetap bisa difokus (`focusableWhenDisabled`), supaya posisi keyboard dan konteks screen reader tidak hilang. |
| Gerak | Spinner tidak boleh menjadi satu-satunya penanda (R5). Ikon spinner diberi `aria-hidden`; yang dibacakan adalah teksnya. |
| Warna | Status tidak disampaikan hanya lewat warna (§18) — "Tersimpan" ditulis sebagai kata, bukan sekadar centang hijau. |

---

## 6. Mengunci selama proses

Aturan §1–§5 membuat pengguna **tahu** ada proses berjalan. Bagian ini mencegahnya **berbuat salah** selama proses itu. Keduanya berbeda: mengunci tombol yang diklik tidak menolong kalau tombol di sebelahnya masih hidup.

| # | Aturan |
|---|---|
| **R14** | Selama satu permukaan menulis ke server, **kontrol lain yang juga menulis di permukaan itu ikut terkunci.** Menekan "Terbitkan" saat "Simpan Draf" masih berjalan mengirim dua tulisan untuk data yang sama. |
| **R15** | Lingkup penguncian mengikuti **jangkauan kerusakannya**, bukan selera (tabel di bawah). Mengunci seluruh layar untuk aksi satu baris adalah kelebihan; mengunci satu tombol untuk impor sepuluh menit adalah kekurangan. |
| **R16** | Jalan keluar ikut dikunci bila meninggalkannya merusak: tombol kembali, pindah tab, tutup dialog, Escape, klik di luar. Untuk aksi yang tidak dapat dibatalkan, ini wajib, dan alasannya ditulis ("Jangan tutup jendela ini sampai impor selesai"). |
| **R17** | Yang sedang dikirim tidak boleh diubah. Selama penyimpanan berjalan, isian, urutan seret-lepas, dan penghapusan baris pada data yang sama dikunci — kalau tidak, yang tersimpan adalah keadaan lama sementara layar menunjukkan yang baru. |
| **R18** | Penguncian tidak boleh membuang fokus keyboard. Pakai `useBusyGuard` untuk sesama kontrol (tetap bisa difokus dan terbaca screen reader), dan `<BusyRegion>` (`inert`) hanya untuk wilayah yang memang sedang **ditunggu** dan tidak memuat tombol pemicunya — `inert` mengeluarkan isinya dari pohon aksesibilitas. |
| **R19** | Perpindahan halaman memakai **skeleton**, bukan penguncian. Pengguna yang sedang menunggu halaman baru tidak sedang merusak apa pun; yang ia butuhkan adalah bentuk halaman yang akan datang (`app/**/loading.tsx` + `components/loading/*`). |
| **R20** | Penguncian di klien bukan pengaman data. Aksi yang benar-benar tidak boleh terjadi dua kali tetap harus dijaga di server (unik di basis data, pemeriksaan status, atau upsert idempoten) — tab kedua, koneksi ulang, dan klik cepat tetap bisa menembus UI. |
| **R21** | **Aksi yang berakhir dengan perpindahan halaman dikunci sampai halaman tujuan tampil**, bukan sampai datanya selesai ditulis. Jalankan navigasinya di dalam `startTransition` yang sama dengan aksinya, dan jangan memakai `redirect()` dari server untuk alur seperti ini: berpindah halaman di tengahnya membatalkan perpindahan sementara datanya sudah terlanjur ditulis, sehingga terlihat gagal dan percobaan ulang meninggalkan baris yatim. Selama itu seluruh kerangka dikunci dan isinya diganti kerangka (skeleton) halaman tujuan. |

**Lingkup penguncian menurut jangkauan kerusakan (R15)**

| Kelas | Keadaan | Yang dikunci | Mekanisme |
|---|---|---|---|
| (a) | Di bawah 1 detik, hanya kontrol itu | Tombolnya saja | `<Button pending>` |
| (b) | Beberapa detik, satu baris atau satu kartu | Baris itu saja; baris lain tetap hidup | state per-baris + `<Button pending>` |
| (c) | Beberapa detik, satu form atau dialog | Semua kontrol penulis di dalamnya, termasuk isiannya | `<BusyGuardProvider>` (+ `<BusyRegion>` untuk isian) |
| (d) | Lama atau tidak dapat dibatalkan | Seluruh permukaan **dan** jalan keluarnya, dengan alasan tertulis | `<BusyRegion>` + penolakan penutupan |
| (e) | Pindah halaman atau muat ulang daftar | Tidak ada | skeleton (`loading.tsx`) atau `<PendingRegion>` |
| (f) | Aksi yang **berakhir** dengan pindah halaman | Seluruh kerangka, sampai halaman tujuan tampil | `AdminBusyProvider` + skeleton satu layar |

**Jangan naikkan kelas tanpa alasan.** Menyelimuti aplikasi dengan lapisan pemblokir melanggar §1 R6 dan membuat aplikasi terasa lambat. Kalau satu aksi hanya mengubah satu baris, cukup baris itu yang membeku.

---

## 7. Anti-pattern

| Jangan | Kenapa |
|---|---|
| Tombol yang hanya `disabled` saat bekerja | Terbaca rusak, bukan sibuk (R4) |
| Spinner tanpa teks | Membeku pada `prefers-reduced-motion` (R5) |
| Toast "Sedang menyimpan…" | Toast adalah penutup, bukan indikator proses |
| Toast sukses **dan** pindah halaman sekaligus | Dua konfirmasi untuk satu aksi (R6) |
| `catch { console.log(e) }` | Kegagalan jadi tak terlihat (R7) |
| Menyimpan diam-diam saat blur | Pengguna tidak tahu pekerjaannya aman (R12) |
| Mengunci seluruh layar untuk aksi kecil | Memblokir pekerjaan lain tanpa alasan |
| Teks pending berbeda-beda untuk aksi yang sama | Satu aksi, satu nama (R13) |

---

## 8. Checklist "selesai" untuk perubahan UI

Tambahan dari checklist yang sudah ada di `CLAUDE.md` (tsc, lint, build, `audit:a11y`, uji 390px dengan keyboard):

- ☐ Setiap kontrol baru yang memanggil server punya empat keadaan (R1).
- ☐ Keadaan pending punya teks, bukan hanya spinner atau `disabled` (R4, R5).
- ☐ Keberhasilan dikonfirmasi tepat satu kali (R6).
- ☐ Jalur gagal sudah dicoba (matikan jaringan, atau paksa error) dan menampilkan pesan Indonesia yang bisa ditindaklanjuti (R7).
- ☐ Aksi berisiko punya konfirmasi sebelum dan sesudah (R8).
- ☐ Tidak mungkin terkirim dua kali untuk aksi peserta (R9).
- ☐ `aria-busy` dan `role="status"` terpasang (R10).
- ☐ Kata mengikuti tabel §4 (R13).

---

## 9. Sumber

- `STANDAR-DIGITAL-LEARNING.md` §5, §16, §17, §18 — prinsip dan angka acuannya.
- Nielsen 1993, *Response Time Limits* (NN/g) — ambang 0,1 / 1 / 10 detik dan pilihan indikator looped vs percent-done.
- Shneiderman et al. 2016 — setiap aksi mendapat umpan balik, setiap tugas punya penutup.
- Hattie & Timperley 2007 — umpan balik menjawab: mau ke mana, di mana saya, apa berikutnya.
- W3C WCAG 2.2 SC 4.1.3 *Status Messages*, SC 2.4.7 *Focus Visible*.
- React 19 — `useFormStatus` (wajib di komponen anak dari `<form>`), `useActionState`, `useOptimistic`.
