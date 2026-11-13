/**
 * Mengisi data peserta contoh untuk melihat layar "Titik kesulitan".
 *
 *   node scripts/seed-kesulitan-demo.mjs            # uji coba
 *   APPLY=1 node scripts/seed-kesulitan-demo.mjs    # benar-benar menulis
 *   HAPUS=1 node scripts/seed-kesulitan-demo.mjs    # membersihkan kembali
 *
 * Datanya sengaja dibuat dengan tiga pola berbeda, bukan acak, supaya ketiga
 * keadaan layar terlihat sekaligus:
 *
 *   Rina  -- gagal soal yang sama berkali-kali dan belum pernah benar
 *   Agus  -- sempat salah lalu akhirnya menguasainya
 *   Sari  -- benar sejak percobaan pertama, jadi TIDAK muncul di daftar
 *
 * Yang ketiga penting: layar yang hanya diuji dengan data bermasalah tidak
 * pernah membuktikan bahwa ia diam saat tidak ada masalah.
 *
 * Semua akun diberi awalan "demo.kesulitan." supaya bisa dihapus bersih.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
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
  fs.readFileSync(path.join(AKAR, ".env.local"), "utf8").split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), lepasKutip(l.slice(l.indexOf("=") + 1).trim())])
)
const U = env.NEXT_PUBLIC_SUPABASE_URL
const K = env.SUPABASE_SERVICE_ROLE_KEY
const h = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json", Prefer: "return=representation" }
const APPLY = process.env.APPLY === "1"
const HAPUS = process.env.HAPUS === "1"
const KURSUS = process.env.KURSUS || "94e31ce1-98b9-4849-a7ad-d987996a5eee"
const AWALAN = "demo.kesulitan."

const j = async (p, o) => {
  const r = await fetch(U + p, { headers: h, ...o })
  const t = await r.text()
  if (!r.ok) throw new Error(`${p} -> ${r.status} ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

if (HAPUS) {
  const orang = await j(`/rest/v1/profiles?select=id,email&email=like.${AWALAN}*`)
  for (const o of orang) {
    await j(`/auth/v1/admin/users/${o.id}`, { method: "DELETE" })
    console.log("dihapus:", o.email)
  }
  console.log(`\n${orang.length} akun contoh dihapus. Percobaan, jawaban, dan pendaftarannya ikut terhapus.`)
  process.exit(0)
}

// --- bahan dari kursusnya -----------------------------------------------
const secs = await j(`/rest/v1/course_sections?select=id&course_id=eq.${KURSUS}`)
const lessons = await j(`/rest/v1/lessons?select=id,title&section_id=in.(${secs.map((s) => s.id).join(",")})`)
const quizzes = await j(
  `/rest/v1/quizzes?select=id,lesson_id,pass_score,is_assessment&lesson_id=in.(${lessons.map((l) => l.id).join(",")})&is_assessment=is.false`
)
if (quizzes.length === 0) {
  console.log("Kursus ini tidak punya kuis biasa. Tidak ada yang bisa diisi.")
  process.exit(1)
}
const kuis = quizzes[0]
const soal = await j(`/rest/v1/questions?select=id,prompt&quiz_id=eq.${kuis.id}&order=position`)
const pilihan = await j(
  `/rest/v1/question_options?select=id,question_id,is_correct&question_id=in.(${soal.map((q) => q.id).join(",")})`
)
const benar = (qid) => pilihan.find((o) => o.question_id === qid && o.is_correct)
const salah = (qid) => pilihan.find((o) => o.question_id === qid && !o.is_correct)

console.log(`Kursus  : ${KURSUS}`)
console.log(`Kuis    : ${(lessons.find((l) => l.id === kuis.lesson_id) || {}).title} (${soal.length} soal)`)

/**
 * Tiap percobaan adalah larik benar/salah, satu nilai per soal, berurutan.
 * `false` berarti soal itu dijawab salah pada percobaan tersebut.
 */
const POLA = [
  { nama: "Rina Kartika", catatan: "gagal berulang, belum dikuasai", percobaan: [[false, true], [false, true], [false, true]] },
  { nama: "Agus Prasetyo", catatan: "sempat salah lalu menguasai", percobaan: [[false, false], [true, true]] },
  { nama: "Sari Dewi", catatan: "benar sejak awal, tidak muncul di daftar", percobaan: [[true, true]] },
]

console.log(`\n${POLA.length} peserta contoh. ${APPLY ? "MENULIS." : "Uji coba -- tidak ada yang ditulis."}\n`)
for (const p of POLA) {
  const total = p.percobaan.length
  const salahTotal = p.percobaan.flat().filter((x) => !x).length
  console.log(`  ${p.nama.padEnd(16)} ${total} percobaan, ${salahTotal} jawaban salah  (${p.catatan})`)
}

if (!APPLY) {
  console.log("\nJalankan ulang dengan APPLY=1 untuk benar-benar menulisnya.")
  process.exit(0)
}

for (const p of POLA) {
  const email = `${AWALAN}${p.nama.toLowerCase().split(" ")[0]}@contoh.test`
  const ada = await j(`/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(email)}`)
  if (ada.length > 0) { console.log(`lewat ${email}: sudah ada`); continue }

  const u = await j(`/auth/v1/admin/users`, {
    method: "POST",
    body: JSON.stringify({ email, password: `Demo#${Date.now()}x`, email_confirm: true, user_metadata: { full_name: p.nama } }),
  })
  const [en] = await j(`/rest/v1/enrollments`, {
    method: "POST",
    body: JSON.stringify({ learner_id: u.id, course_id: KURSUS, status: "active" }),
  })

  for (let i = 0; i < p.percobaan.length; i++) {
    const hasil = p.percobaan[i]
    const nBenar = hasil.filter(Boolean).length
    const skor = Math.round((nBenar / hasil.length) * 100)
    const [att] = await j(`/rest/v1/quiz_attempts`, {
      method: "POST",
      body: JSON.stringify({
        quiz_id: kuis.id, learner_id: u.id, attempt_number: i + 1,
        started_at: new Date(Date.now() - (p.percobaan.length - i) * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - (p.percobaan.length - i) * 86400000 + 600000).toISOString(),
        status: "graded", score: skor, passed: skor >= kuis.pass_score,
      }),
    })
    await j(`/rest/v1/quiz_responses`, {
      method: "POST",
      body: JSON.stringify(
        soal.map((q, idx) => {
          const ok = hasil[idx] ?? true
          const opt = ok ? benar(q.id) : salah(q.id)
          return { attempt_id: att.id, question_id: q.id, response: opt ? opt.id : "", is_correct: ok, points_awarded: ok ? 1 : 0 }
        })
      ),
    })
  }
  console.log(`dibuat: ${p.nama} (${email}) -- pendaftaran ${en.id}`)
}

console.log("\nSelesai. Buka Pelacakan di layar pengelola, pilih salah satu peserta contoh.")
console.log("Membersihkan kembali: HAPUS=1 node scripts/seed-kesulitan-demo.mjs")
