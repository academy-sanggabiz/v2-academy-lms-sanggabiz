/**
 * Mengukur sisa kalimat berbahasa Indonesia saat LMS dibuka dalam bahasa
 * Inggris.
 *
 *   node scripts/i18n-check.mjs
 *
 * Kenapa ada: memindahkan ratusan kalimat ke kamus adalah pekerjaan mekanis
 * yang gampang terasa "sudah selesai" padahal belum. Alat ini memberi angka
 * yang bisa diperiksa, per layar, sehingga yang tersisa selalu terlihat.
 *
 * Caranya kasar dengan sengaja: ia mencari kata-kata Indonesia yang sangat
 * umum pada teks yang terlihat. Kata yang sama persis di kedua bahasa (nama
 * orang, judul kursus, istilah teknis) tidak terdeteksi, dan memang tidak
 * perlu -- yang dicari adalah kalimat antarmuka yang lupa dipindahkan.
 *
 * Hanya MEMBACA. Keluar 1 bila ada sisa pada layar yang sudah dinyatakan
 * selesai (daftar SUDAH_SELESAI di bawah).
 */
import { chromium } from "playwright"
import fs from "node:fs"

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3270"
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
)

/** Kata Indonesia yang tidak pernah muncul sebagai kata Inggris. */
const KATA_ID =
  /\b(yang|dan|atau|tidak|untuk|ini|itu|dari|pada|akan|sudah|belum|bisa|dapat|anda|peserta|kursus|soal|kuis|pelajaran|simpan|hapus|tambah|ubah|cari|pilih|kembali|lanjut|selesai|masuk|keluar|nilai|jawaban|tanggal|semua|setiap|dengan|tanpa|lebih|hanya|sedang|belajar)\b/i

/** Layar yang sudah dinyatakan dwibahasa; sisa di sini dianggap kegagalan. */
const SUDAH_SELESAI = new Set([
  "/",
  "/kelas",
  "/learner/dashboard",
  "/learner/courses",
  "/learner/profile",
  "/learner/settings",
  "/learner/notifications",
  "/admin/dashboard",
  "/admin/courses",
  "/admin/learners",
  "/admin/grading",
  "/admin/tracking",
  "/admin/settings",
  "/admin/profile",
  "/admin/mentor",
  "/admin/landing",
  "/admin/certificates",
])

/** Layar dinamis yang juga sudah selesai -- dicocokkan dengan awalan jalur. */
const AWALAN_SELESAI = ["/admin/grading/course/", "/admin/tracking/", "/admin/courses/", "/learner/courses/", "/admin/mentor", "/admin/landing", "/admin/certificates", "/kelas/"]
function sudahSelesai(path) {
  return SUDAH_SELESAI.has(path) || AWALAN_SELESAI.some((a) => path.startsWith(a))
}

async function masuk(browser, path, email, sandi) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  // Cookie bahasa disetel langsung: memencet pemilih bahasa di tiap layar
  // hanya menambah cara gagal yang tidak ada hubungannya dengan yang diukur.
  // Nama cookie-nya "bahasa" (lib/i18n/config.ts), bukan "locale". Memakai
  // nama yang salah membuat seluruh layar terbaca sebagai "belum
  // diterjemahkan" padahal yang salah alat ukurnya.
  await ctx.addCookies([{ name: "bahasa", value: "en", url: BASE }])
  const page = await ctx.newPage()
  await page.goto(BASE + path)
  await page.fill("input[name=email]", email)
  await page.fill("input[name=password]", sandi)
  await page.click("button[type=submit]")
  for (let i = 0; i < 6 && /\/auth\//.test(page.url()); i++) await page.waitForTimeout(1500)
  return /\/auth\//.test(page.url()) ? null : page
}

/**
 * Judul kursus, pelajaran, dan isi notifikasi adalah ISI, bukan antarmuka.
 * Kursus berbahasa Indonesia memang berjudul Indonesia walau layarnya dibuka
 * dalam bahasa Inggris, dan menerjemahkannya bukan pekerjaan dwibahasa
 * antarmuka. Tanpa pengecualian ini angkanya tidak akan pernah nol, dan
 * alat ukur yang tidak bisa mencapai nol berhenti dipakai orang.
 */
/** Semua nilai string di dalam pohon blok halaman depan, rekursif. */
function ambilTeksBlok(simpul) {
  if (typeof simpul === "string") return [simpul]
  if (Array.isArray(simpul)) return simpul.flatMap(ambilTeksBlok)
  if (simpul && typeof simpul === "object") return Object.values(simpul).flatMap(ambilTeksBlok)
  return []
}

async function ambilIsi() {
  const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
  const U = env.NEXT_PUBLIC_SUPABASE_URL
  if (!U || !env.SUPABASE_SERVICE_ROLE_KEY) return []
  const ambil = async (p) => {
    const r = await fetch(`${U}/rest/v1/${p}`, { headers: h })
    return r.ok ? r.json() : []
  }
  const [kursus, pelajaran, modul, notif, soal, halamanDepan, pengajar] = await Promise.all([
    ambil("courses?select=title,description,who_for,requirements"),
    ambil("lessons?select=title&limit=1000"),
    ambil("course_sections?select=title&limit=500"),
    ambil("notifications?select=title,body&limit=500"),
    // Teks soal adalah ISI juga: layar kesulitan peserta dan matriks
    // penilaian menampilkannya. Tag HTML dibuang karena yang dirender teksnya.
    ambil("questions?select=prompt&limit=1000"),
    // Isi halaman depan yang dikarang superadmin (hero, keunggulan, FAQ, CTA)
    // adalah ISI: penyunting /admin/landing menampilkannya apa adanya, dan
    // versi Indonesianya memang harus tetap Indonesia di tab Indonesia.
    ambil("landing_content?select=blocks,blocks_en"),
    // Jabatan dan riwayat singkat pengajar adalah ISI, sekelas judul kursus:
    // satu orang menulisnya sekali tentang dirinya sendiri, bukan kalimat
    // antarmuka yang dipakai ulang di banyak layar. Blok "Pengajar kami" di
    // halaman depan menampilkannya apa adanya, di kedua bahasa.
    ambil("instructors?select=title,bio&limit=200"),
  ])
  return [
    ...kursus.flatMap((x) => [x.title, x.description, ...(x.who_for ?? []), ...(x.requirements ?? [])]),
    ...pelajaran.map((x) => x.title),
    ...modul.map((x) => x.title),
    ...notif.flatMap((x) => [x.title, x.body]),
    ...soal.map((x) => String(x.prompt ?? "").replace(/<[^>]*>/g, " ")),
    ...pengajar.flatMap((x) => [x.title, x.bio]),
    ...halamanDepan.flatMap((row) =>
      [row.blocks, row.blocks_en].flatMap((blok) =>
        ambilTeksBlok(blok).map((teks) => teks.replace(/<[^>]*>/g, " "))
      )
    ),
  ].filter((x) => typeof x === "string" && x.trim().length > 3)
}

/**
 * Spasi disamakan di kedua sisi sebelum dibandingkan. Teks yang dirender
 * melewati pembungkusan baris dan `whitespace-pre-line`, jadi satu paragraf
 * yang sama bisa punya baris baru di tempat berbeda dari nilainya di basis
 * data -- dan perbandingan apa adanya menyatakan "belum diterjemahkan" untuk
 * isi yang justru memang harus tetap Indonesia.
 */
const rapikan = (x) => x.replace(/\s+/g, " ").trim()
const ISI = (await ambilIsi()).map(rapikan)
function adalahIsi(baris) {
  const b = rapikan(baris)
  return ISI.some((t) => b.includes(t) || t.includes(b))
}

const hasil = []
async function periksa(page, path) {
  await page.goto(BASE + path)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(600)
  if (!new URL(page.url()).pathname.startsWith(path.split("?")[0])) {
    console.log(`lewat ${path}: dialihkan, akunnya tidak berwenang`)
    return
  }
  /*
   * Wilayah bertanda `data-pratinjau-bahasa-lain` dibuang sebelum dibaca.
   * Satu-satunya pemakainya adalah kanvas pratinjau /admin/landing, yang
   * memang merender halaman depan dalam bahasa YANG SEDANG DISUNTING -- bukan
   * bahasa antarmukanya. Membacanya sebagai antarmuka membuat gerbang ini
   * menuntut terjemahan untuk isi yang justru harus tetap Indonesia.
   *
   * Disalin dulu, baru dipangkas: halamannya tidak ikut berubah, jadi
   * pemeriksaan ini tetap hanya membaca.
   */
  const teks = await page
    .evaluate(() => {
      const main = document.querySelector("main")
      if (!main) return ""
      const salinan = main.cloneNode(true)
      salinan.querySelectorAll("[data-pratinjau-bahasa-lain]").forEach((el) => el.remove())
      document.body.append(salinan)
      const hasil = salinan.innerText
      salinan.remove()
      return hasil
    })
    .catch(() => "")
  const sisa = teks
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && KATA_ID.test(l) && !adalahIsi(l))
  hasil.push({ path, sisa })
  const tanda = sisa.length === 0 ? "EN penuh" : `${sisa.length} baris masih ID`
  console.log(`${sisa.length === 0 ? "ok   " : "sisa "} ${path.padEnd(34)} ${tanda}`)
  if (sisa.length > 0) for (const l of sisa.slice(0, 3)) console.log(`        "${l.slice(0, 92)}"`)
}

const browser = await chromium.launch()
try {
  // Halaman depan publik: tanpa login, cookie bahasa en. Inilah layar pertama
  // yang dilihat pengunjung, jadi ia diperiksa paling dulu.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await ctx.addCookies([{ name: "bahasa", value: "en", url: BASE }])
    const anon = await ctx.newPage()
    await periksa(anon, "/")
    await periksa(anon, "/kelas")
    // Detail kelas publik: id-nya dicari dari basis data supaya alat ini
    // tidak menyimpan id yang membusuk.
    if (env.SUPABASE_SERVICE_ROLE_KEY) {
      const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
      const k = await fetch(
        `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?select=id&status=eq.published&is_private=eq.false&limit=1`,
        { headers: h }
      ).then((r) => (r.ok ? r.json() : []))
      if (k[0]) await periksa(anon, `/kelas/${k[0].id}`)
    }
    await ctx.close()
  }

  const learner = await masuk(browser, "/auth/learner/login", env.AUDIT_LEARNER_EMAIL, env.AUDIT_LEARNER_PASSWORD)
  if (learner) {
    for (const p of ["/learner/dashboard", "/learner/courses", "/learner/profile", "/learner/settings", "/learner/notifications"])
      await periksa(learner, p)
    // Detail kursus (dinamis): kursus pertama yang diikuti akun audit.
    if (env.SUPABASE_SERVICE_ROLE_KEY) {
      const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
      const profil = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(env.AUDIT_LEARNER_EMAIL)}`, { headers: h }).then((r) => (r.ok ? r.json() : []))
      if (profil[0]) {
        const e = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/enrollments?select=course_id&learner_id=eq.${profil[0].id}&limit=1`, { headers: h }).then((r) => (r.ok ? r.json() : []))
        if (e[0]) await periksa(learner, `/learner/courses/${e[0].course_id}`)
      }
    }
  } else console.log("lewat layar peserta: gagal masuk")

  const adminEmail = env.AUDIT_ADMIN_EMAIL || env.DEMO_ADMIN_EMAIL
  const adminSandi = env.AUDIT_ADMIN_PASSWORD || env.DEMO_ADMIN_PASSWORD
  let admin = await masuk(browser, "/auth/admin/login", adminEmail, adminSandi)
  if (!admin && env.DEMO_ADMIN_EMAIL) admin = await masuk(browser, "/auth/admin/login", env.DEMO_ADMIN_EMAIL, env.DEMO_ADMIN_PASSWORD)
  if (admin) {
    for (const p of ["/admin/dashboard", "/admin/courses", "/admin/learners", "/admin/grading", "/admin/tracking", "/admin/settings", "/admin/profile", "/admin/mentor", "/admin/landing", "/admin/certificates"])
      await periksa(admin, p)

    // Layar dinamis: matriks penilaian dan rincian pelacakan. Id-nya dicari
    // dari basis data (kursus milik admin demo yang punya pendaftaran) supaya
    // alat ini tidak menyimpan id yang membusuk.
    const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
    const U = env.NEXT_PUBLIC_SUPABASE_URL
    if (U && env.SUPABASE_SERVICE_ROLE_KEY) {
      const profil = await fetch(`${U}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(adminEmail)}`, { headers: h }).then((r) => (r.ok ? r.json() : []))
      const adminId = profil[0]?.id
      if (adminId) {
        const kursus = await fetch(`${U}/rest/v1/courses?select=id&created_by=eq.${adminId}&limit=10`, { headers: h }).then((r) => (r.ok ? r.json() : []))
        let pendaftaran = null
        for (const k of kursus) {
          const e = await fetch(`${U}/rest/v1/enrollments?select=id,course_id&course_id=eq.${k.id}&limit=1`, { headers: h }).then((r) => (r.ok ? r.json() : []))
          if (e[0]) { pendaftaran = e[0]; break }
        }
        if (!pendaftaran) {
          // Superadmin audit tidak punya kursus sendiri, tetapi bisa membaca
          // semuanya (owns_course lewat is_superadmin) -- pakai pendaftaran
          // mana pun supaya layar dinamisnya tetap teruji.
          const e = await fetch(`${U}/rest/v1/enrollments?select=id,course_id&limit=1`, { headers: h }).then((r) => (r.ok ? r.json() : []))
          if (e[0]) pendaftaran = e[0]
        }
        if (pendaftaran) {
          await periksa(admin, `/admin/grading/course/${pendaftaran.course_id}`)
          await periksa(admin, `/admin/tracking/${pendaftaran.id}`)
          await periksa(admin, `/admin/courses/${pendaftaran.course_id}/edit`)
          await periksa(admin, `/admin/courses/preview/${pendaftaran.course_id}`)
        } else console.log("lewat matriks penilaian/pelacakan: admin demo belum punya kursus berpendaftaran")
      }
    } else console.log("lewat layar dinamis: SUPABASE_SERVICE_ROLE_KEY tidak ada")
  } else console.log("lewat layar pengelola: gagal masuk")
} finally {
  await browser.close()
}

const total = hasil.reduce((n, r) => n + r.sisa.length, 0)
const gagal = hasil.filter((r) => sudahSelesai(r.path) && r.sisa.length > 0)
console.log(
  `\n${hasil.filter((r) => r.sisa.length === 0).length}/${hasil.length} layar sudah penuh bahasa Inggris, ` +
    `${total} baris antarmuka tersisa (judul kursus, pelajaran, profil pengajar, dan isi notifikasi tidak dihitung)`
)
if (gagal.length) {
  console.log(`GAGAL: ${gagal.map((r) => r.path).join(", ")} seharusnya sudah selesai`)
  process.exit(1)
}
