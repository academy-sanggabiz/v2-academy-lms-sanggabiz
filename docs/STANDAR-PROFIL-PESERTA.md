# Standar Profil Peserta

**Data apa yang boleh dan perlu disimpan tentang seorang peserta, dan kenapa**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 31 Oktober 2026 |
| Berlaku pada | tabel `profiles`, layar `/learner/profile`, sertifikat, dan layar admin peserta |

---

## 1. Aturan pokok

**P1 — Setiap kolom harus punya tujuan yang bisa disebutkan.** UU PDP No. 27/2022
Pasal 16 ayat (2) huruf b mewajibkan pengumpulan data pribadi dilakukan
"secara terbatas dan spesifik": terbatas pada yang diperlukan, dan tujuannya
sudah ditentukan **saat dikumpulkan**, bukan dicari-cari belakangan. Kolom yang
tidak bisa dijelaskan tujuannya tidak boleh ditambahkan, betapapun "mungkin
berguna nanti".

**P2 — Nama yang dipakai sehari-hari dan nama di sertifikat adalah dua hal
berbeda.** Panduan praktik nama (lihat §6) menyarankan: tanyakan dulu nama yang
orang itu pakai, dan baru minta nama resmi kalau memang diperlukan secara
hukum atau administratif. Sertifikat adalah salah satu keperluan itu.

**P3 — Yang tidak wajib, harus benar-benar boleh dikosongkan.** Hanya nama yang
wajib. Sisanya opsional, dan layar tidak boleh menghukum peserta yang
melewatinya.

**P4 — Peserta harus tahu untuk apa data itu dipakai, di tempat ia mengisinya.**
Bukan di halaman kebijakan privasi terpisah. Satu kalimat di bawah isian.

**P5 — Data peserta tidak pernah tampil ke peserta lain.** LMS ini bukan jejaring
sosial; tidak ada profil publik. Yang bisa melihat: peserta itu sendiri dan
pengelola.

## 2. Kolom yang dipakai, dan tujuannya

| Kolom | Wajib | Tujuan | Terlihat oleh |
|---|---|---|---|
| `full_name` | ya | Menyapa peserta, dan nama yang dilihat pengelola di daftar peserta | peserta, pengelola |
| `email` | ya (dari akun) | Masuk, atur-ulang kata sandi, pemberitahuan | peserta, pengelola |
| `avatar_url` | tidak | Mengenali diri sendiri di antarmuka; membantu pengelola mengenali peserta di kelas kecil | peserta, pengelola |
| `certificate_name` | tidak | Nama yang dicetak di sertifikat. Kosong berarti pakai `full_name` | peserta, pengelola |
| `phone` | tidak | Dihubungi pengelola saat ada perubahan jadwal atau kendala akses | peserta, pengelola |
| `organization` | tidak | Pengelola tahu peserta datang dari usaha atau instansi mana | peserta, pengelola |

### Yang sengaja TIDAK dikumpulkan

- **Tanggal lahir, NIK, nomor identitas.** Tidak ada satu pun fitur di LMS ini
  yang memerlukannya. NIK termasuk data pribadi spesifik dalam UU PDP, dan
  menyimpannya menambah kewajiban pengamanan tanpa menambah manfaat. Kalau
  nanti ada program bersertifikasi resmi yang mewajibkannya, kumpulkan **saat
  itu**, untuk program itu, bukan dari semua orang sejak awal.
- **Alamat lengkap.** Tidak ada pengiriman barang.
- **Bio, tautan media sosial, jabatan.** Tidak ada profil publik yang
  menampilkannya (P5), jadi tidak ada yang akan membacanya.

## 3. Nama di sertifikat

Sertifikat mencetak `certificate_name`, dan jatuh ke `full_name` bila kosong.
Alasan pemisahan ini:

- Orang sering memakai nama panggilan di antarmuka ("Dewi", "Pak Budi").
  Sertifikat yang berguna untuk melamar kerja atau mengajukan pembiayaan perlu
  nama yang cocok dengan identitas resminya.
- Sebaliknya, memaksa nama resmi sebagai satu-satunya nama membuat antarmuka
  memanggil orang dengan nama yang bukan nama panggilannya.

Isian ini disertai keterangan: *"Nama ini yang akan dicetak di sertifikat.
Samakan dengan identitas resmi Anda bila sertifikatnya akan dipakai untuk
keperluan formal."*

**Sertifikat yang sudah terbit tidak ikut berubah** saat nama diubah. Berkas
PDF-nya sudah jadi dan nomor serinya sudah tercatat. Mengubah nama hanya
memengaruhi sertifikat berikutnya. Ini disebutkan di layar, supaya peserta
tidak mengira sertifikat lamanya akan diperbarui sendiri.

Penerbit juga harus bisa diperiksa. Open Badges 3.0 (1EdTech) mensyaratkan
sebuah kredensial memuat penerbit, penerima, capaian, dan tanggal terbit.
Sertifikat di LMS ini sudah memuat keempatnya plus nomor seri unik
(`certificates.serial`). Yang belum ada: halaman verifikasi publik yang
menerima nomor seri. Itu pekerjaan tersendiri, dicatat di
`docs/KESIAPAN-PAKAI.md`.

## 4. Foto profil: aturan keamanan

Foto adalah berkas yang diunggah orang lain dan disajikan kembali ke peramban.
Empat hal wajib:

**F1 — Batasi jenis berkas di server, bukan hanya di klien.** Pemeriksaan di
browser (`file.type`) berasal dari browser itu sendiri dan bisa dilewati dengan
memanggil Storage langsung. Bucket harus punya `allowed_mime_types`.

**F2 — SVG dilarang.** SVG bisa memuat `<script>`. Berkas yang disajikan dari
bucket publik dan dibuka langsung akan menjalankannya. Hanya PNG, JPEG, dan
WebP.

**F3 — Satu peserta hanya boleh menulis di foldernya sendiri.** Jalur berkas
diawali id penggunanya, dan policy Storage memeriksa `auth.uid()` terhadap
segmen pertama jalur itu. Tanpa ini, siapa pun yang punya kunci anon bisa
menimpa foto peserta lain.

**F4 — Batasi ukuran di server.** `file_size_limit` pada bucket, bukan hanya
pemeriksaan di klien.

Catatan privasi: foto dari ponsel sering membawa metadata EXIF, termasuk titik
koordinat tempat foto diambil. Kita tidak memprosesnya di server, jadi metadata
itu ikut tersimpan apa adanya. Untuk foto profil yang biasanya diambil di rumah
atau tempat usaha, ini kebocoran lokasi yang nyata meski kecil. Dicatat sebagai
pekerjaan lanjutan; penyelesaiannya adalah menggambar ulang gambar di kanvas
sebelum diunggah, yang sekaligus menyeragamkan ukurannya.

## 5. Aksesibilitas isian profil

- Setiap isian yang menanyakan data tentang diri pengguna wajib punya atribut
  `autocomplete` sesuai WCAG 2.2 SC 1.3.5 (*Identify Input Purpose*):
  `name` untuk nama, `tel` untuk nomor telepon, `organization` untuk nama usaha,
  `email` untuk surel.
- Tombol unggah foto harus berupa kontrol yang bisa difokus dan punya nama yang
  terbaca, bukan hanya area yang bisa diklik.
- Status unggah diumumkan lewat satu `role="status"` yang tetap ada di DOM,
  sesuai `STANDAR-UMPAN-BALIK-UI.md` R11 — bukan elemen yang muncul-hilang.
- Sasaran sentuh minimal 24x24 px (SC 2.5.8).

## 6. Sumber

- Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 16
  ayat (2) — asas pengumpulan "terbatas dan spesifik" dan sesuai tujuan.
  https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf
- 1EdTech, *Open Badges Specification v3.0* — unsur wajib sebuah kredensial:
  penerbit, penerima, capaian, tanggal terbit, bukti.
  https://www.imsglobal.org/spec/ob/v3p0
- Michigan State University, *Personal Pronouns and Names* — anjuran memakai
  "Nama" untuk nama yang dipakai sehari-hari dan meminta "Nama Legal" hanya bila
  memang diperlukan. https://gscc.msu.edu/education/pp-names.html
- W3C, *WCAG 2.2* SC 1.3.5 Identify Input Purpose dan SC 2.5.8 Target Size.
