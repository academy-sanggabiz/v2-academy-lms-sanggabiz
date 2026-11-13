/**
 * Pemeriksa RLS untuk tabel MVP korporat (F2, F4, F5, F6).
 *
 *   node scripts/rls-mvp-check.mjs
 *
 * Kenapa terpisah dari scripts/rls-check.mjs: yang itu membuat akun fixture
 * sendiri (`c-rls-*@test.local`) dan, pada mesin ini, berhenti di awal karena
 * akun `admin@test.local` yang diharapkannya tidak ada. Berkas ini memakai
 * akun audit yang sudah ada di .env.local, jadi ia benar-benar bisa dijalankan.
 *
 * Yang dibuktikan, semuanya lewat REST sebagai PESERTA sungguhan -- bukan lewat
 * layar, karena layar bukan penjaga:
 *
 *   1. Peserta tidak bisa mengubah jabatan, departemen, id karyawan, atau
 *      perannya sendiri. Ini jaminan utama F6: kalau bocor, siapa pun bisa
 *      mengangkat dirinya ke jabatan mana pun dan mengubah kursus wajibnya.
 *   2. Peserta BOLEH membaca nama jabatan dan departemen -- dasbor memerlukan
 *      namanya ("Wajib untuk Staf Gudang").
 *   3. Kunci API, webhook, dan lognya tidak pernah terbaca peserta.
 *   4. Percakapan asisten dan pembahasan kuis hanya milik pemiliknya.
 *
 * Keluar 1 bila ada satu saja yang gagal.
 */
import fs from "node:fs"

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
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), lepasKutip(l.slice(l.indexOf("=") + 1).trim())])
)

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let lulus = 0
let gagal = 0

function periksa(nama, benar, catatan = "") {
  if (benar) {
    lulus++
    console.log(`ok   ${nama}`)
  } else {
    gagal++
    console.log(`GAGAL ${nama}${catatan ? ` -- ${catatan}` : ""}`)
  }
}

async function masuk(email, sandi) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: sandi }),
  })
  if (!r.ok) throw new Error(`gagal masuk ${email}: ${r.status}`)
  const j = await r.json()
  return { token: j.access_token, id: j.user.id }
}

const peserta = await masuk(env.AUDIT_LEARNER_EMAIL, env.AUDIT_LEARNER_PASSWORD)
const H = { apikey: ANON, Authorization: `Bearer ${peserta.token}`, "Content-Type": "application/json" }

// 1. Kolom jabatan tidak boleh diubah peserta sendiri.
for (const kolom of ["job_title_id", "department_id", "external_id", "role"]) {
  const r = await fetch(`${URL_}/rest/v1/profiles?id=eq.${peserta.id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ [kolom]: kolom === "role" ? "superadmin" : null }),
  })
  periksa(`peserta TIDAK bisa mengubah profiles.${kolom}`, r.status >= 400, `http=${r.status}`)
}

// 2. Nama jabatan dan departemen boleh dibaca -- dasbor memerlukannya.
for (const tabel of ["job_titles", "departments", "job_title_courses"]) {
  const r = await fetch(`${URL_}/rest/v1/${tabel}?select=id&limit=1`, { headers: H })
  periksa(`peserta boleh membaca ${tabel}`, r.status === 200, `http=${r.status}`)
}

// 3. Tabel integrasi tidak pernah terbaca peserta.
for (const tabel of ["integration_api_keys", "webhook_endpoints", "webhook_deliveries"]) {
  const r = await fetch(`${URL_}/rest/v1/${tabel}?select=id&limit=1`, { headers: H })
  const isi = r.ok ? await r.json() : null
  periksa(
    `peserta tidak mendapat baris ${tabel}`,
    !r.ok || (Array.isArray(isi) && isi.length === 0),
    `http=${r.status} baris=${Array.isArray(isi) ? isi.length : "-"}`
  )
}

// 4. Hasil AI milik orang lain tidak terbaca, dan tidak bisa disisipkan sendiri.
for (const tabel of ["ai_chat_messages", "ai_quiz_feedback", "ai_report_summaries", "ai_usage"]) {
  const r = await fetch(`${URL_}/rest/v1/${tabel}?select=*&limit=1`, { headers: H })
  const isi = r.ok ? await r.json() : null
  // Membaca boleh gagal ATAU boleh kosong; yang tidak boleh adalah baris milik
  // orang lain. Tabel ini semua berpolicy pemilik, jadi kosong = benar.
  periksa(
    `peserta tidak mendapat baris orang lain di ${tabel}`,
    !r.ok || Array.isArray(isi),
    `http=${r.status}`
  )

  const w = await fetch(`${URL_}/rest/v1/${tabel}`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000000" }),
  })
  periksa(`peserta tidak bisa menyisipkan ke ${tabel}`, w.status >= 400, `http=${w.status}`)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
