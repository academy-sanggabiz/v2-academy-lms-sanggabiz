# Menghubungkan lms.sanggabiz.com ke LMS

**Apa itu CNAME, dan apa persisnya yang dikirim ke CTO**

| | |
|---|---|
| Disusun untuk | Sanggabiz Academy |
| Tanggal | 2 November 2026 |
| Berlaku pada | Domain `sanggabiz.com` di Hostinger, proyek Vercel `lms-sanggabiz-v2` |

---

## 1. CNAME itu apa

Bayangkan DNS sebagai buku alamat internet. Ketika seseorang mengetik
`lms.sanggabiz.com`, peramban bertanya ke buku alamat itu: "ini di mana?"

**CNAME adalah catatan penerusan.** Isinya kira-kira: "`lms.sanggabiz.com`
bukan tempat tersendiri — carilah di alamat Vercel ini." Jadi Anda tidak perlu
tahu nomor IP server Vercel, dan kalau Vercel suatu saat pindah server, alamat
Anda ikut mengikuti dengan sendirinya.

Satu catatan CNAME hanya tiga kolom: **jenisnya CNAME**, **namanya** (bagian
di depan, yaitu `lms`), dan **tujuannya** (alamat Vercel).

## 2. Kenapa subdomain, bukan domain utama

`lms.sanggabiz.com` adalah **subdomain**. Ini pilihan yang aman:

- Situs di `sanggabiz.com` tetap berjalan seperti biasa, tidak tersentuh.
- Email `@sanggabiz.com` tidak terpengaruh sama sekali.
- Kalau nanti ingin dibatalkan, cukup hapus satu baris catatan itu.

Kalau yang diminta justru domain utamanya (`sanggabiz.com` tanpa `lms.`),
itu **bukan CNAME melainkan A record** — CNAME tidak boleh dipakai di domain
akar karena bentrok dengan catatan NS dan SOA domain itu. Dan yang lebih
penting: apa pun yang sekarang ada di `sanggabiz.com` akan berpindah ke LMS.

## 3. Mengambil nilai tujuannya

**Nilai ini tidak bisa ditebak dan tidak boleh disalin dari proyek lain.**
Vercel sekarang memberi tiap proyek alamat CNAME-nya sendiri — bentuknya
seperti `d1d4fc829fe7bc7c.vercel-dns-017.com`, berbeda untuk tiap proyek.
Dokumentasi Vercel menyebutnya langsung: *"Each project has a unique CNAME
record."* Memakai nilai proyek lain menghasilkan galat **Invalid
Configuration**.

Nilainya baru muncul setelah domainnya didaftarkan. Caranya:

1. Buka [dasbor Vercel](https://vercel.com/dashboard), pilih proyek
   **lms-sanggabiz-v2**
2. **Settings** → **Domains**
3. **Add Domain**, ketik `lms.sanggabiz.com`, lalu **Add**
4. Vercel langsung menampilkan tabel berisi **Type**, **Name**, dan **Value**

Langkah ini **tidak mengubah apa pun** di Hostinger maupun di situs yang
sekarang berjalan. Ia hanya mendaftarkan niat, dan menghasilkan nilai yang
harus dipasang. Selama catatan DNS-nya belum dibuat, Vercel akan menandainya
"Invalid Configuration" — itu wajar dan memang menunggu langkah berikutnya.

## 4. Yang dikirim ke CTO

Setelah nilai dari langkah 3 didapat, kirimkan ini:

> Tolong tambahkan satu DNS record di Hostinger untuk domain `sanggabiz.com`:
>
> - **Type:** CNAME
> - **Name:** `lms`
> - **Points to:** `<nilai dari dasbor Vercel>`
> - **TTL:** biarkan bawaan (biasanya 14400)
>
> Letaknya di hPanel → **Domains** → pilih `sanggabiz.com` → **DNS /
> Nameservers** → **Manage DNS records**.
>
> Catatan penting: kalau sudah ada record **A** atau **CNAME** lain dengan
> nama `lms`, hapus dulu. Record A mengalahkan CNAME dan membuat CNAME-nya
> tidak pernah terpakai — ini penyebab galat yang paling sering.
>
> Jangan ubah nameserver domainnya. Kita hanya menambah satu record; sisa DNS
> `sanggabiz.com`, termasuk email, tetap seperti sekarang.

## 5. Sesudahnya

Perubahan DNS butuh waktu menyebar — biasanya beberapa menit, kadang sampai
beberapa jam. Setelah itu halaman **Settings → Domains** di Vercel berubah
menjadi tanda centang, dan sertifikat HTTPS-nya terbit otomatis tanpa perlu
diminta.

Kalau statusnya tidak berubah setelah beberapa jam, yang perlu diperiksa ada
dua, dan hampir selalu salah satu dari keduanya:

1. Ada record A atau CNAME lain bernama `lms` yang bentrok.
2. Nilai **Points to** tersalin tidak utuh — sebagian penyedia DNS menambahkan
   titik di akhir, dan sebagian lagi menolaknya.

## 6. Sesudah domainnya hidup — sudah dikerjakan

Gejalanya muncul persis seperti yang diduga: masuk lewat Google melempar
peserta kembali ke alamat `.vercel.app` lama. Penyebabnya bukan di kode —
`signInWithOAuth` memakai `window.location.origin`, yang sudah benar.
Penyebabnya di Supabase: alamat baru belum ada di daftar izin, dan ketika
tujuan tidak dikenali Supabase memakai **Site URL** sebagai gantinya, yang
masih alamat lama.

Diperbaiki lewat `supabase/config.toml` lalu `supabase config push`, bukan
lewat dasbor, supaya setelannya tercatat di repositori dan tidak hilang kalau
proyek dibuat ulang:

- `site_url` menjadi `https://lms.sanggabiz.com`
- `additional_redirect_urls` menambahkan `https://lms.sanggabiz.com/**`

Alamat `.vercel.app` **sengaja tetap diizinkan**. Deployment pratinjau
memakai alamat itu untuk menguji sebelum rilis, dan ia juga jadi jalan masuk
cadangan kalau suatu saat DNS `sanggabiz.com` bermasalah.

Terbukti: menekan tombol Google di `lms.sanggabiz.com` kini mengirim
`redirect_to=https://lms.sanggabiz.com/auth/callback`, dan Google menerimanya.

Satu catatan untuk lain kali: `supabase config push` mendorong **seluruh**
konfigurasi, bukan hanya yang Anda ubah. Jalankan `supabase config diff`
lebih dulu dan baca daftarnya — setelan yang pernah diubah lewat dasbor bisa
tertimpa oleh isi `config.toml`.
