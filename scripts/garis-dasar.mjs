/**
 * Merekam keadaan penilaian SEBELUM sebuah perubahan, lalu membandingkannya
 * SESUDAH.
 *
 *   node scripts/garis-dasar.mjs rekam    # simpan ke .garis-dasar.json
 *   node scripts/garis-dasar.mjs banding  # bandingkan dengan rekaman itu
 *
 * **Kenapa ini ada.** Pretest dan posttest menyentuh tiga aturan yang dilewati
 * SETIAP kursus: syarat sertifikat, rumus nilai akhir, dan kunci pelajaran
 * berurutan. Perilaku barunya memang hanya untuk kuis ukur -- untuk kursus
 * tanpa kuis ukur, pengecualiannya mengecualikan himpunan kosong, jadi
 * hasilnya identik secara matematis. Tetapi "identik secara matematis" adalah
 * klaim tentang kode yang benar; yang dijaga berkas ini adalah kode yang
 * SALAH. Tanpa rekaman "sebelum", satu-satunya cara memeriksa adalah melihat
 * layar dan merasa semuanya baik-baik saja.
 *
 * Yang direkam per pendaftaran: status, jumlah pelajaran selesai, jumlah
 * percobaan kuis terkirim beserta skornya, dan apakah sertifikatnya sudah
 * terbit. Itu cukup untuk menangkap ketiga aturan di atas berubah diam-diam.
 *
 * Hanya MEMBACA. Dijalankan dengan service role supaya lintas peserta, karena
 * yang diperiksa justru efeknya pada semua orang.
 */
import fs from "node:fs"

/*
 * Disimpan di dalam proyek (dan diabaikan git), bukan di /tmp.
 *
 * macOS membersihkan /tmp sendiri, dan rekaman "sebelum" yang hilang di
 * tengah pekerjaan membuat `banding` menjawab "belum ada rekaman" -- yaitu
 * tepat saat jaring pengamannya paling dibutuhkan. Sudah terjadi dua kali
 * pada 12-13 November 2026. `GARIS_DASAR_FILE` tetap bisa menimpanya untuk
 * menyimpan beberapa rekaman sekaligus.
 */
const BERKAS = process.env.GARIS_DASAR_FILE ?? ".garis-dasar.json"

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
)

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local")
  process.exit(1)
}

async function ambil(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`)
  return r.json()
}

async function potret() {
  const [enrollments, progress, attempts, certificates, quizzes] = await Promise.all([
    ambil("enrollments?select=id,learner_id,course_id,status&order=id"),
    ambil("lesson_progress?select=enrollment_id,lesson_id,completed"),
    ambil("quiz_attempts?select=id,quiz_id,learner_id,status,score,passed&status=neq.in_progress"),
    ambil("certificates?select=id,enrollment_id"),
    ambil("quizzes?select=id,lesson_id,is_assessment"),
  ])

  const selesaiPer = new Map()
  for (const p of progress) {
    if (!p.completed) continue
    selesaiPer.set(p.enrollment_id, (selesaiPer.get(p.enrollment_id) ?? 0) + 1)
  }
  const sertifikatPer = new Set(certificates.map((c) => c.enrollment_id))

  // Percobaan dikelompokkan per peserta: enrollment tidak punya kolomnya, dan
  // satu peserta bisa terdaftar di beberapa kursus.
  const percobaanPer = new Map()
  for (const a of attempts) {
    const kunci = `${a.learner_id}|${a.quiz_id}`
    percobaanPer.set(kunci, { status: a.status, score: a.score, passed: a.passed })
  }

  return {
    waktu: new Date().toISOString(),
    jumlah: {
      pendaftaran: enrollments.length,
      kuis: quizzes.length,
      percobaanTerkirim: attempts.length,
      sertifikat: certificates.length,
    },
    pendaftaran: enrollments
      .map((e) => ({
        id: e.id,
        course: e.course_id,
        status: e.status,
        pelajaranSelesai: selesaiPer.get(e.id) ?? 0,
        adaSertifikat: sertifikatPer.has(e.id),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    percobaan: [...percobaanPer.entries()]
      .map(([kunci, v]) => ({ kunci, ...v }))
      .sort((a, b) => a.kunci.localeCompare(b.kunci)),
  }
}

function bandingkan(lama, baru) {
  const beda = []

  for (const [k, v] of Object.entries(lama.jumlah)) {
    if (baru.jumlah[k] !== v) beda.push(`jumlah ${k}: ${v} -> ${baru.jumlah[k]}`)
  }

  const petaLama = new Map(lama.pendaftaran.map((e) => [e.id, e]))
  for (const e of baru.pendaftaran) {
    const l = petaLama.get(e.id)
    if (!l) {
      beda.push(`pendaftaran BARU ${e.id.slice(0, 8)} (wajar bila ada orang mendaftar)`)
      continue
    }
    if (l.status !== e.status) beda.push(`pendaftaran ${e.id.slice(0, 8)} status: ${l.status} -> ${e.status}`)
    if (l.adaSertifikat !== e.adaSertifikat)
      beda.push(`pendaftaran ${e.id.slice(0, 8)} sertifikat: ${l.adaSertifikat} -> ${e.adaSertifikat}`)
    if (l.pelajaranSelesai !== e.pelajaranSelesai)
      beda.push(`pendaftaran ${e.id.slice(0, 8)} pelajaran selesai: ${l.pelajaranSelesai} -> ${e.pelajaranSelesai}`)
    petaLama.delete(e.id)
  }
  for (const [id] of petaLama) beda.push(`pendaftaran HILANG ${id.slice(0, 8)}`)

  const pLama = new Map(lama.percobaan.map((a) => [a.kunci, a]))
  for (const a of baru.percobaan) {
    const l = pLama.get(a.kunci)
    if (!l) continue // percobaan baru itu wajar
    if (l.score !== a.score) beda.push(`percobaan ${a.kunci.slice(0, 14)} skor: ${l.score} -> ${a.score}`)
    if (l.passed !== a.passed) beda.push(`percobaan ${a.kunci.slice(0, 14)} lulus: ${l.passed} -> ${a.passed}`)
    pLama.delete(a.kunci)
  }
  for (const [k] of pLama) beda.push(`percobaan HILANG ${k.slice(0, 14)}`)

  return beda
}

const perintah = process.argv[2]

if (perintah === "rekam") {
  const p = await potret()
  fs.writeFileSync(BERKAS, JSON.stringify(p, null, 2))
  console.log(`Garis dasar direkam ke ${BERKAS}`)
  console.log(`  ${p.pendaftaran.length} pendaftaran, ${p.percobaan.length} percobaan, ${p.jumlah.sertifikat} sertifikat`)
} else if (perintah === "banding") {
  if (!fs.existsSync(BERKAS)) {
    console.error(`Belum ada rekaman di ${BERKAS}. Jalankan "rekam" dulu.`)
    process.exit(1)
  }
  const lama = JSON.parse(fs.readFileSync(BERKAS, "utf8"))
  const baru = await potret()
  const beda = bandingkan(lama, baru)

  console.log(`Garis dasar ${lama.waktu} vs sekarang`)
  if (beda.length === 0) {
    console.log("  TIDAK ADA PERUBAHAN pada status, sertifikat, pelajaran selesai, maupun skor.")
    process.exit(0)
  }
  console.log(`  ${beda.length} perbedaan:`)
  for (const b of beda) console.log(`   - ${b}`)
  // Perbedaan belum tentu kesalahan (orang memang bisa belajar di antara dua
  // rekaman). Keluar 1 supaya tetap terlihat dan dibaca, bukan dilewati.
  process.exit(1)
} else {
  console.error('Pakai: node scripts/garis-dasar.mjs rekam | banding')
  process.exit(1)
}
