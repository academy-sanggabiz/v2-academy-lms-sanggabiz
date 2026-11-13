/**
 * Membuktikan fungsi SQL `admin_course_dropoff` benar, dengan membandingkannya
 * terhadap perhitungan ulang di JavaScript dari tabel mentahnya.
 *
 *   node scripts/dropoff-check.mjs
 *
 * Kenapa ada: fungsi SQL-nya tidak bisa dijalankan di mesin pengembang (tidak
 * ada Postgres lokal), jadi satu-satunya cara membuktikannya adalah
 * menjalankannya di basis data sungguhan lalu membandingkan hasilnya dengan
 * perhitungan kedua yang ditulis terpisah. Dua implementasi yang sepakat jauh
 * lebih meyakinkan daripada satu implementasi yang "kelihatannya benar".
 *
 * Hanya MEMBACA. Keluar 1 bila ada selisih.
 *
 * Fungsi SQL-nya dijaga `owns_course()`, yang membaca `auth.uid()`. Kunci
 * service role tidak punya `auth.uid()`, jadi memanggilnya dengan kunci itu
 * SELALU mengembalikan nol baris -- terbaca seperti fungsinya rusak padahal
 * penjaganya justru bekerja. Karena itu pemanggilannya memakai token
 * pengelola sungguhan, dan hanya kursus milik pengelola itu yang dibandingkan.
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
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE || !KEY) {
  console.log("lewati: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local")
  process.exit(0)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }

/** Token pengelola, untuk memanggil fungsi yang dijaga owns_course(). */
async function masukSebagaiPengelola() {
  // Dicoba berurutan, bukan dipilih salah satu: kata sandi di environment
  // bisa saja sudah tidak berlaku, dan berhenti pada yang pertama gagal
  // membuat alat ini menyerah padahal masih ada akun yang bisa dipakai.
  const kandidat = [
    { email: env.AUDIT_ADMIN_EMAIL, sandi: env.AUDIT_ADMIN_PASSWORD },
    { email: env.DEMO_ADMIN_EMAIL, sandi: env.DEMO_ADMIN_PASSWORD },
  ].filter((k) => k.email && k.sandi)

  for (const k of kandidat) {
    const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: k.email, password: k.sandi }),
    })
    if (!r.ok) {
      console.log(`  (gagal masuk sebagai ${k.email}, mencoba akun berikutnya)`)
      continue
    }
    const d = await r.json()
    if (d.access_token) return { token: d.access_token, userId: d.user?.id, email: k.email }
  }
  return null
}
async function get(path) {
  const r = await fetch(`${URL_BASE}/rest/v1/${path}`, { headers })
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${(await r.text()).slice(0, 160)}`)
  return r.json()
}

/** Perhitungan pembanding, ditulis ulang dari definisi -- bukan dari SQL-nya. */
async function reference(courseId) {
  const sections = await get(`course_sections?select=id,position&course_id=eq.${courseId}&order=position`)
  if (!sections.length) return null
  const sectionIds = sections.map((s) => s.id).join(",")
  const lessons = await get(`lessons?select=id,title,position,section_id&section_id=in.(${sectionIds})`)
  if (!lessons.length) return null

  const sectionPos = Object.fromEntries(sections.map((s) => [s.id, s.position]))
  const ordered = lessons
    .slice()
    .sort((a, b) => sectionPos[a.section_id] - sectionPos[b.section_id] || a.position - b.position)
  const step = new Map(ordered.map((l, i) => [l.id, i + 1]))

  const enrollments = await get(`enrollments?select=id,status&course_id=eq.${courseId}`)
  const lessonIds = ordered.map((l) => l.id).join(",")
  const progress = await get(
    `lesson_progress?select=enrollment_id,lesson_id&completed=is.true&lesson_id=in.(${lessonIds})&limit=10000`
  )

  const furthest = new Map()
  const completedPer = new Map()
  for (const p of progress) {
    const s = step.get(p.lesson_id)
    if (!s) continue
    completedPer.set(p.lesson_id, (completedPer.get(p.lesson_id) ?? 0) + 1)
    if (s > (furthest.get(p.enrollment_id) ?? 0)) furthest.set(p.enrollment_id, s)
  }
  const stalledPer = new Map()
  for (const e of enrollments) {
    const f = furthest.get(e.id)
    if (f && e.status !== "completed") stalledPer.set(f, (stalledPer.get(f) ?? 0) + 1)
  }

  return {
    totalLearners: enrollments.length,
    notStarted: enrollments.filter((e) => !furthest.has(e.id)).length,
    steps: ordered.map((l) => ({
      stepNo: step.get(l.id),
      lessonId: l.id,
      completed: completedPer.get(l.id) ?? 0,
      stalled: stalledPer.get(step.get(l.id)) ?? 0,
    })),
  }
}

async function rpc(courseId, token) {
  const r = await fetch(`${URL_BASE}/rest/v1/rpc/admin_course_dropoff`, {
    method: "POST",
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_course_id: courseId }),
  })
  if (!r.ok) return { error: `${r.status} ${(await r.text()).slice(0, 200)}` }
  return { rows: await r.json() }
}

const pengelola = await masukSebagaiPengelola()
if (!pengelola) {
  console.log("lewati: gagal masuk sebagai pengelola -- periksa AUDIT_ADMIN_* / DEMO_ADMIN_* di .env.local")
  process.exit(0)
}
const [profil] = await get(`profiles?id=eq.${pengelola.userId}&select=role`)
const superadmin = profil?.role === "superadmin"
console.log(`memeriksa sebagai ${pengelola.email}${superadmin ? " (superadmin: semua kursus)" : " (mentor: hanya kursus sendiri)"}\n`)

const courses = await get("courses?select=id,title,created_by&limit=50")
let checked = 0
let mismatches = 0

let dilewati = 0
for (const course of courses) {
  // Kursus milik orang lain memang tidak boleh terbaca; membandingkannya
  // hanya akan menghasilkan "selisih" palsu.
  if (!superadmin && course.created_by !== pengelola.userId) { dilewati++; continue }

  const ref = await reference(course.id)
  if (!ref || ref.totalLearners === 0) continue

  const result = await rpc(course.id, pengelola.token)
  if (result.error) {
    console.log(`\nTIDAK BISA DIUJI: ${result.error}`)
    console.log("Jalankan supabase/migrations/20261101130000_course_dropoff.sql di SQL Editor lebih dulu.")
    process.exit(0)
  }

  checked++
  const byLesson = new Map(result.rows.map((r) => [r.lesson_id, r]))
  const problems = []

  if (result.rows.length !== ref.steps.length)
    problems.push(`jumlah baris ${result.rows.length} != ${ref.steps.length}`)

  for (const s of ref.steps) {
    const row = byLesson.get(s.lessonId)
    if (!row) {
      problems.push(`pelajaran ${s.stepNo} tidak ada di hasil SQL`)
      continue
    }
    if (row.step_no !== s.stepNo) problems.push(`urutan pelajaran ${s.stepNo}: SQL ${row.step_no}`)
    if (row.completed !== s.completed)
      problems.push(`selesai pelajaran ${s.stepNo}: SQL ${row.completed}, pembanding ${s.completed}`)
    if (row.stalled !== s.stalled)
      problems.push(`berhenti pelajaran ${s.stepNo}: SQL ${row.stalled}, pembanding ${s.stalled}`)
  }

  const first = result.rows[0]
  if (first && first.total_learners !== ref.totalLearners)
    problems.push(`total peserta: SQL ${first.total_learners}, pembanding ${ref.totalLearners}`)
  if (first && first.not_started !== ref.notStarted)
    problems.push(`belum mulai: SQL ${first.not_started}, pembanding ${ref.notStarted}`)

  if (problems.length) {
    mismatches++
    console.log(`\nSELISIH  ${course.title}`)
    for (const p of problems) console.log(`   - ${p}`)
  } else {
    console.log(`cocok    ${course.title} (${ref.steps.length} pelajaran, ${ref.totalLearners} peserta)`)
  }
}

console.log(`\n${checked - mismatches}/${checked} kursus cocok antara fungsi SQL dan perhitungan pembanding`)
if (dilewati) console.log(`${dilewati} kursus dilewati: bukan milik pengelola ini, jadi memang tidak terbaca`)
process.exit(mismatches > 0 ? 1 : 0)
