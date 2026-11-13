/**
 * Membuat akun peserta secara massal, langsung terkonfirmasi.
 *
 *   node scripts/buat-akun-massal.mjs daftar.csv              # uji coba, tidak menulis
 *   APPLY=1 node scripts/buat-akun-massal.mjs daftar.csv      # benar-benar membuat
 *
 * Berkas masukan: CSV sederhana `nama,email`, satu peserta per baris.
 * Baris pertama boleh berupa judul kolom; ia dilewati bila berisi kata "email".
 *
 * KENAPA ALAT INI ADA
 *
 * Mendaftarkan ratusan orang lewat formulir pada hari acara menabrak dua batas
 * sekaligus, dan keduanya tidak terlihat sampai terlambat:
 *
 *   1. Email konfirmasi. Layanan email bawaan Supabase hanya 2 pesan per jam
 *      dan memang tidak ditujukan untuk produksi. Dengan SMTP sendiri pun
 *      bawaannya 30 per jam sampai dinaikkan.
 *   2. Batas per ALAMAT IP: 30 pendaftaran/masuk per 5 menit. Peserta satu
 *      ruangan memakai satu WiFi, jadi mereka berbagi satu IP publik --
 *      ratusan orang mendaftar bersamaan akan saling memblokir.
 *
 * Akun yang dibuat lewat jalur admin ini tidak mengirim email sama sekali dan
 * tidak menyentuh batas pendaftaran. Dibuat jauh hari, hari-H tinggal masuk.
 *
 * Keluaran kata sandi ditulis ke berkas, tidak pernah ke layar: apa pun yang
 * tercetak di terminal ikut tersimpan di riwayat shell dan log.
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

/**
 * Akar proyek dihitung dari letak berkas ini, bukan dari direktori tempat
 * perintah dijalankan. Alat ini dipanggil sambil lalu -- sering dari folder
 * induk -- dan `.env.local` yang tidak ketemu hanya karena salah direktori
 * adalah kegagalan yang membingungkan tanpa perlu.
 */
const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const APPLY = process.env.APPLY === "1"
const inputPath = process.argv[2]

if (!inputPath) {
  console.log("Pemakaian: node scripts/buat-akun-massal.mjs <berkas.csv>")
  console.log("Isi berkas: satu baris per peserta, format `nama,email`.")
  console.log(`Contoh siap pakai: ${path.join(AKAR, "contoh-daftar-peserta.csv")}`)
  process.exit(1)
}

// Dicari relatif terhadap direktori kerja dulu, baru terhadap akar proyek.
const berkasMasukan = [inputPath, path.join(AKAR, inputPath)].find((p) => fs.existsSync(p))
if (!berkasMasukan) {
  console.error(`Berkas "${inputPath}" tidak ditemukan.`)
  console.error(`Dicari di: ${path.resolve(inputPath)}`)
  console.error(`       dan: ${path.join(AKAR, inputPath)}`)
  console.error(`\nContoh berkas daftar ada di ${path.join(AKAR, "contoh-daftar-peserta.csv")}`)
  process.exit(1)
}

const berkasEnv = path.join(AKAR, ".env.local")
if (!fs.existsSync(berkasEnv)) {
  console.error(`.env.local tidak ditemukan di ${AKAR}`)
  process.exit(1)
}
/**
 * Melepas tanda kutip pembungkus nilai .env.
 *
 * Harus ada karena dotenv dan pembaca buatan sendiri ini HARUS sepakat. Nilai
 * tanpa kutip yang memuat `#` dipotong dotenv di tanda itu, sedangkan pembaca
 * ini menyimpannya utuh -- dua skrip membaca kata sandi yang sama dan
 * mendapat dua nilai berbeda. Terukur 14 Nov 2026: kata sandi akun demo
 * dibaca `DemoSanggabiz` oleh satu gerbang dan `DemoSanggabiz#2026` oleh
 * gerbang lain, dan gerbang yang salah menyimpulkan kredensialnya keliru.
 * Nilainya kini dikutip di .env.local; baris ini yang membuat kutipnya tidak
 * ikut terbaca sebagai bagian dari nilai.
 */
function lepasKutip(v) {
  return /^(["']).*\1$/s.test(v) ? v.slice(1, -1) : v
}

const env = Object.fromEntries(
  fs.readFileSync(berkasEnv, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), lepasKutip(l.slice(l.indexOf("=") + 1).trim())])
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local")
  process.exit(1)
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }

/**
 * Kata sandi yang bisa dibacakan dan diketik ulang tanpa salah.
 *
 * Huruf yang mudah tertukar (0/O, 1/l/I) sengaja tidak dipakai: kata sandi ini
 * akan dibagikan di atas kertas atau layar, dan satu karakter salah baca
 * berarti satu peserta tidak bisa masuk saat acara sedang berjalan.
 */
function buatKataSandi() {
  const huruf = "abcdefghjkmnpqrstuvwxyz"
  const besar = "ABCDEFGHJKMNPQRSTUVWXYZ"
  const angka = "23456789"
  const semua = huruf + besar + angka
  const ambil = (set) => set[crypto.randomInt(set.length)]
  // Minimal satu dari tiap jenis, lalu diisi sampai 12 karakter.
  const inti = [ambil(besar), ambil(huruf), ambil(angka), "#"]
  while (inti.length < 12) inti.push(ambil(semua))
  // Diacak supaya "#" tidak selalu di posisi yang sama.
  for (let i = inti.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[inti[i], inti[j]] = [inti[j], inti[i]]
  }
  return inti.join("")
}

const baris = fs.readFileSync(berkasMasukan, "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
if (baris.length && /email/i.test(baris[0]) && !baris[0].includes("@")) baris.shift()

const peserta = baris.map((l) => {
  const koma = l.lastIndexOf(",")
  const nama = koma > 0 ? l.slice(0, koma).trim().replace(/^"|"$/g, "") : ""
  const email = (koma > 0 ? l.slice(koma + 1) : l).trim().toLowerCase()
  return { nama: nama || email.split("@")[0], email }
})

const tidakSah = peserta.filter((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email))
if (tidakSah.length) {
  console.log(`${tidakSah.length} baris dilewati karena emailnya tidak sah:`)
  for (const p of tidakSah.slice(0, 10)) console.log("  -", p.email)
}
const sah = peserta.filter((p) => !tidakSah.includes(p))

// Email ganda di dalam berkas sendiri -- lebih sering terjadi daripada dikira
// ketika daftar digabung dari beberapa sumber.
const terlihat = new Set()
const ganda = []
const unik = sah.filter((p) => {
  if (terlihat.has(p.email)) { ganda.push(p.email); return false }
  terlihat.add(p.email)
  return true
})
if (ganda.length) console.log(`${ganda.length} email ganda di dalam berkas, hanya yang pertama dipakai`)

console.log(`\n${unik.length} peserta akan diproses. ${APPLY ? "MEMBUAT AKUN." : "Uji coba -- tidak ada yang ditulis."}\n`)

const hasil = []
let dibuat = 0, sudahAda = 0, gagal = 0

for (const p of unik) {
  // Dicek lebih dulu supaya alat ini aman dijalankan ulang pada daftar yang
  // sama -- misalnya setelah menambah 20 nama di akhir berkas.
  const adaRes = await fetch(`${URL_BASE}/rest/v1/profiles?email=eq.${encodeURIComponent(p.email)}&select=id`, { headers })
  const ada = await adaRes.json()
  if (Array.isArray(ada) && ada.length > 0) {
    sudahAda++
    hasil.push({ ...p, status: "sudah ada", kataSandi: "" })
    continue
  }

  if (!APPLY) {
    hasil.push({ ...p, status: "akan dibuat", kataSandi: "" })
    dibuat++
    continue
  }

  const kataSandi = buatKataSandi()
  const res = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: p.email,
      password: kataSandi,
      // Tanpa ini Supabase mengirim email konfirmasi, dan seluruh alasan alat
      // ini ada ikut hilang.
      email_confirm: true,
      user_metadata: { full_name: p.nama },
    }),
  })

  if (res.ok) {
    dibuat++
    hasil.push({ ...p, status: "dibuat", kataSandi })
  } else {
    gagal++
    const pesan = await res.text()
    hasil.push({ ...p, status: `gagal: ${pesan.slice(0, 120)}`, kataSandi: "" })
  }
}

const keluaran = berkasMasukan.replace(/\.csv$/i, "") + "-kredensial.csv"
if (APPLY) {
  const csv = ["nama,email,kata_sandi,status",
    ...hasil.map((h) => `"${h.nama.replaceAll('"', "'")}",${h.email},${h.kataSandi},"${h.status}"`)].join("\n")
  fs.writeFileSync(keluaran, csv, { mode: 0o600 })
}

console.log(`dibuat: ${dibuat}   sudah ada: ${sudahAda}   gagal: ${gagal}`)
if (APPLY) {
  console.log(`\nKata sandi ditulis ke ${keluaran} (hanya bisa dibaca pemilik berkas).`)
  console.log("Bagikan lewat jalur yang aman, lalu hapus berkasnya setelah acara.")
} else {
  console.log("\nJalankan ulang dengan APPLY=1 untuk benar-benar membuat akunnya.")
}
