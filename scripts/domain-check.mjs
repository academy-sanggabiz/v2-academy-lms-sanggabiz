/**
 * Memeriksa seluruh halaman benar-benar memakai domain produksi.
 *
 *   node scripts/domain-check.mjs
 *   DOMAIN=https://contoh.com node scripts/domain-check.mjs
 *
 * Tiga hal diperiksa per halaman, dan ketiganya pernah gagal diam-diam:
 *
 * 1. **Halamannya mendarat di domain yang diminta.** Pengalihan ke alamat
 *    lain berarti ada tautan atau konfigurasi yang masih menunjuk ke sana.
 * 2. **Tidak ada alamat lama di dalam HTML-nya.** Tautan, gambar, atau URL
 *    yang tertanam di data bisa membawa pengunjung keluar tanpa disadari.
 * 3. **Permintaan jaringan tidak menyeberang ke host lain** selain yang
 *    memang diharapkan (Supabase, CDN font).
 *
 * Hanya MEMBACA. Keluar 1 bila ada yang gagal.
 */
import { chromium } from "playwright"
import fs from "node:fs"

const DOMAIN = process.env.DOMAIN || "https://lms.sanggabiz.com"
const HOST = new URL(DOMAIN).host
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
)

/** Host yang memang boleh dihubungi dari halaman. */
const HOST_SAH = [HOST, "supabase.co", "fonts.googleapis.com", "fonts.gstatic.com", "youtube.com", "ytimg.com", "vercel.live"]
const bolehHost = (u) => { try { const h = new URL(u).host; return HOST_SAH.some((s) => h === s || h.endsWith("." + s)) } catch { return true } }

/** Pola alamat lama yang tidak boleh muncul di halaman produksi. */
const ALAMAT_LAMA = /lms-sanggabiz-v2[a-z0-9-]*\.vercel\.app/gi

const PUBLIK = ["/", "/auth/login", "/auth/learner/login", "/auth/learner/signup", "/auth/admin/login", "/auth/lupa-sandi", "/auth/auth-code-error", "/legal/privasi"]
const PESERTA = ["/learner/dashboard", "/learner/courses", "/learner/purchase", "/learner/profile", "/learner/settings", "/learner/notifications"]
const PENGELOLA = ["/admin/dashboard", "/admin/courses", "/admin/learners", "/admin/purchases", "/admin/grading", "/admin/tracking", "/admin/settings", "/admin/profile", "/admin/mentor", "/admin/landing", "/admin/certificates"]

const hasil = []
async function periksa(page, path, peran) {
  const lintas = []
  const pendengar = (r) => { if (!bolehHost(r.url())) lintas.push(r.url()) }
  page.on("request", pendengar)
  try {
    await page.goto(DOMAIN + path, { waitUntil: "networkidle", timeout: 45000 })
    await page.waitForTimeout(400)
  } catch {
    page.off("request", pendengar)
    hasil.push({ path, peran, status: "GAGAL MUAT" })
    console.log(`GAGAL  ${path.padEnd(32)} halaman tidak terbuka`)
    return
  }
  page.off("request", pendengar)

  // Halaman yang mengalihkan (mis. layar superadmin dibuka mentor) masih
  // berpindah saat ini. Membaca isinya di tengah navigasi melempar galat yang
  // terbaca seperti halaman rusak, padahal pengalihannya normal.
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 })
  } catch {
    /* biarkan: yang penting isinya terbaca di bawah */
  }
  const mendarat = new URL(page.url())
  let html = ""
  for (let i = 0; i < 3; i++) {
    try { html = await page.content(); break } catch { await page.waitForTimeout(700) }
  }
  const lama = [...new Set(html.match(ALAMAT_LAMA) || [])]
  const pindah = mendarat.host !== HOST

  const masalah = []
  if (pindah) masalah.push(`pindah ke ${mendarat.host}`)
  if (lama.length) masalah.push(`alamat lama di HTML: ${lama.join(", ")}`)
  if (lintas.length) masalah.push(`permintaan ke host lain: ${[...new Set(lintas.map((u) => new URL(u).host))].join(", ")}`)

  const gagal = masalah.length > 0
  // Halaman yang dialihkan TIDAK pernah dirender, jadi isinya belum diperiksa.
  // Menghitungnya sebagai "ok" akan mengaku memeriksa sesuatu yang tidak
  // pernah dibuka -- kesalahan yang sama pernah terjadi di gerbang a11y.
  const dialihkan = !gagal && mendarat.pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")

  hasil.push({ path, peran, gagal, dialihkan, masalah })
  if (gagal) console.log(`GAGAL  ${path.padEnd(32)} ${masalah.join(" | ")}`)
  else if (dialihkan) console.log(`lewat  ${path.padEnd(32)} dialihkan ke ${mendarat.pathname} -- isinya tidak diperiksa`)
  else console.log(`ok     ${path.padEnd(32)}`)
}

async function masuk(browser, loginPath, email, sandi) {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
  await page.goto(DOMAIN + loginPath, { waitUntil: "networkidle" })
  await page.fill("input[name=email]", email)
  await page.fill("input[name=password]", sandi)
  await page.click("button[type=submit]")
  for (let i = 0; i < 8 && /\/auth\//.test(page.url()); i++) await page.waitForTimeout(2000)
  if (/\/auth\//.test(page.url())) { await page.close(); return null }
  return page
}

const browser = await chromium.launch()
try {
  console.log(`Memeriksa ${DOMAIN}\n`)
  const anon = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
  for (const p of PUBLIK) await periksa(anon, p, "publik")

  const learner = await masuk(browser, "/auth/learner/login", env.AUDIT_LEARNER_EMAIL, env.AUDIT_LEARNER_PASSWORD)
  if (learner) {
    for (const p of PESERTA) await periksa(learner, p, "peserta")
    const href = await learner.locator('a[href^="/learner/courses/"]').first().getAttribute("href").catch(() => null)
    if (href) {
      await periksa(learner, href, "peserta")
      await periksa(learner, href.replace("/learner/courses/", "/learn/"), "peserta")
    }
  } else console.log("lewat halaman peserta: gagal masuk")

  const adminEmail = env.AUDIT_ADMIN_EMAIL, adminSandi = env.AUDIT_ADMIN_PASSWORD
  let admin = adminEmail && adminSandi ? await masuk(browser, "/auth/admin/login", adminEmail, adminSandi) : null
  if (!admin && env.DEMO_ADMIN_EMAIL) admin = await masuk(browser, "/auth/admin/login", env.DEMO_ADMIN_EMAIL, env.DEMO_ADMIN_PASSWORD)
  if (admin) {
    for (const p of PENGELOLA) await periksa(admin, p, "pengelola")
    const href = await admin.locator('a[href^="/admin/courses/"]').first().getAttribute("href").catch(() => null)
    if (href) await periksa(admin, href, "pengelola")
  } else console.log("lewat halaman pengelola: gagal masuk")
} finally {
  await browser.close()
}

const gagal = hasil.filter((r) => r.gagal || r.status)
const dialihkan = hasil.filter((r) => r.dialihkan)
const diperiksa = hasil.length - gagal.length - dialihkan.length
console.log(`\n${diperiksa}/${hasil.length} halaman benar-benar dirender dan bersih dari alamat lama`)
if (dialihkan.length) console.log(`${dialihkan.length} dialihkan, jadi belum diperiksa: ${dialihkan.map((r) => r.path).join(", ")}`)
process.exit(gagal.length > 0 ? 1 : 0)
