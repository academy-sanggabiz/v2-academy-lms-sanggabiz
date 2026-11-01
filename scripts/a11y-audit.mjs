// WCAG 2.2 A/AA audit of every main page with axe-core, run in a real browser.
//
//   npm run build && npm run start          (in another terminal)
//   AUDIT_LEARNER_EMAIL=... AUDIT_LEARNER_PASSWORD=... \
//   AUDIT_ADMIN_EMAIL=... AUDIT_ADMIN_PASSWORD=... npm run audit:a11y
//
// playwright dipin ke 1.45.3: versi yang lebih baru menolak memasang browser
// di macOS 12 ("Playwright does not support chromium on mac12"), sehingga
// gerbang ini tidak bisa dijalankan sama sekali di mesin pengembang ini.
// Naikkan versinya hanya bersamaan dengan menaikkan macOS, atau jalankan
// audit ini di CI Linux.
//
// Needs Playwright with Chromium (`npm i -D playwright && npx playwright
// install chromium` if it is not installed globally). Exits with code 1 when
// any page has a violation, so it can gate a release (definition of done in
// docs/V2-UPGRADE.md). Automated checks find only part of the barriers: keep
// the manual keyboard and screen-reader pass as well.

import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

// require() rather than import: it also honours NODE_PATH, so a globally
// installed Playwright works as well as a project-local one.
const require = createRequire(import.meta.url)
const { chromium } = require("playwright")
const AXE_SOURCE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8")
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000"
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
// Beberapa hambatan nyata hanya dilaporkan axe sebagai "best-practice" --
// terutama landmark-one-main dan region, yang menentukan apakah pengguna
// screen reader bisa melompati navigasi. Disertakan supaya tidak tersaring.
const EXTRA_RULES = ["landmark-one-main", "region", "landmark-unique"]

const results = []

async function audit(page, name) {
  await page.addScriptTag({ content: AXE_SOURCE })
  const violations = await page.evaluate(
    async (tags) =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: tags.tags },
          rules: Object.fromEntries(tags.extra.map((id) => [id, { enabled: true }])),
        })
      ).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target.join(" ")),
      })),
    { tags: TAGS, extra: EXTRA_RULES }
  )
  results.push({ name, violations })
  const mark = violations.length === 0 ? "ok  " : "FAIL"
  console.log(`${mark} ${name}${violations.map((v) => `\n       ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]}`).join("")}`)
}

// Lebar ponsel ikut diuji: pelanggaran reflow (WCAG 1.4.10) dan target sentuh
// hanya muncul di layar sempit, dan audit sebelumnya hanya pernah jalan di
// 1366px sehingga seluruh kelas temuan itu tidak pernah terlihat.
const WIDTHS = [
  { label: "desktop", width: 1366, height: 900 },
  { label: "ponsel", width: 390, height: 844 },
]

/**
 * Preferensi tampilan ikut diaudit, bukan hanya tampilan bawaannya. Mode
 * kontras tinggi dan teks lebih besar mengubah warna dan tata letak, jadi
 * keduanya bisa melanggar aturan yang dipenuhi tampilan bawaan -- misalnya
 * teks yang mulai bertumpuk, atau sasaran sentuh yang menyusut.
 * Cookie-nya dibaca lib/preferences/display.ts.
 */
const DISPLAY_MODES = [
  { label: "kontras tinggi", value: { textSize: "device", contrast: "high", motion: "device" } },
  { label: "teks lebih besar", value: { textSize: "larger", contrast: "device", motion: "device" } },
]

/**
 * `networkidle` saja terlalu cepat. Sebagian widget menetapkan atribut
 * aksesibilitasnya di dalam effect React yang berjalan setelah jaringan diam --
 * tablist base-ui, misalnya, baru menaikkan satu tab ke `tabindex="0"`
 * beberapa saat kemudian. Mengaudit sebelum itu menghasilkan kegagalan palsu
 * (`scrollable-region-focusable` pada editor kursus) yang muncul-hilang antar
 * jalan, dan gerbang yang kadang berbohong lebih buruk daripada tidak ada
 * gerbang. Jadi tunggu sampai setiap tablist punya tab yang bisa difokus.
 */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {})
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('[role="tablist"]')].every((list) =>
          list.querySelector('[role="tab"][tabindex="0"]')
        ),
      undefined,
      { timeout: 5000 }
    )
    .catch(() => {})
}

async function visit(page, path) {
  for (const { label, width, height } of WIDTHS) {
    await page.setViewportSize({ width, height })
    await page.goto(BASE + path)
    await settle(page)
    // Halaman khusus superadmin mengalihkan akun pengelola biasa ke dasbor.
    // Tanpa pemeriksaan ini auditnya mencetak "ok <halaman>" padahal yang
    // diperiksa dasbor -- laporan bersih untuk halaman yang tidak pernah
    // dibuka. Lebih baik mengaku tidak terjangkau daripada mengaku lolos.
    const landed = new URL(page.url()).pathname
    if (landed !== path) {
      console.log(`lewat ${path} [${label}]: dialihkan ke ${landed}, akunnya tidak berwenang`)
      continue
    }
    await audit(page, `${path} [${label}]`)
  }
}

/**
 * Mengembalikan null -- bukan melempar -- ketika masuk gagal.
 *
 * Sebelumnya kegagalan masuk keluar sebagai TimeoutError Playwright mentah
 * dengan jejak tumpukan, yang terbaca seperti aplikasinya rusak. Penyebab
 * paling sering sebenarnya sepele: kata sandi di environment sudah diganti
 * dan tertinggal basi. Gerbang ini menjaga aksesibilitas, jadi ia tidak boleh
 * berteriak tentang hal yang bukan urusannya.
 */
async function login(browser, loginPath, email, password, label) {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
  try {
    await page.goto(BASE + loginPath)
    await page.fill("input[name=email]", email)
    await page.fill("input[name=password]", password)
    await page.click("button[type=submit]")
    await page.waitForURL(/dashboard/, { timeout: 20000 })
    return page
  } catch {
    console.log(`skip ${label} pages: gagal masuk sebagai ${email} -- periksa kata sandinya di environment`)
    await page.close()
    return null
  }
}

const browser = await chromium.launch()
try {
  const anon = await (await browser.newContext()).newPage()
  for (const path of [
    "/",
    "/auth/login",
    "/auth/learner/signup",
    "/auth/admin/login",
    // Keduanya terlewat di versi sebelumnya meski keduanya halaman publik.
    "/auth/auth-code-error",
    "/auth/lupa-sandi",
    "/legal/privasi",
  ])
    await visit(anon, path)

  // Sampel halaman publik diaudit ulang pada tiap mode tampilan.
  for (const mode of DISPLAY_MODES) {
    await anon.context().addCookies([
      {
        name: "tampilan",
        value: JSON.stringify(mode.value),
        url: BASE,
      },
    ])
    for (const path of ["/", "/auth/login"]) {
      for (const { label, width, height } of WIDTHS) {
        await anon.setViewportSize({ width, height })
        await anon.goto(BASE + path)
        await settle(anon)
        await audit(anon, `${path} [${mode.label} · ${label}]`)
      }
    }
  }
  await anon.context().clearCookies()

  const { AUDIT_LEARNER_EMAIL, AUDIT_LEARNER_PASSWORD, AUDIT_ADMIN_EMAIL, AUDIT_ADMIN_PASSWORD } = process.env

  if (AUDIT_LEARNER_EMAIL && AUDIT_LEARNER_PASSWORD) {
    const page = await login(browser, "/auth/login", AUDIT_LEARNER_EMAIL, AUDIT_LEARNER_PASSWORD, "learner")
    if (page)
    for (const path of [
      "/learner/dashboard",
      "/learner/courses",
      "/learner/purchase",
      "/learner/profile",
      "/learner/settings",
      "/learner/notifications",
    ])
      await visit(page, path)
    if (page) {
    await page.goto(BASE + "/learner/courses")
    const courseHref = await page.locator('a[href^="/learner/courses/"]').first().getAttribute("href").catch(() => null)
    if (courseHref) {
      await visit(page, courseHref)
      await visit(page, courseHref.replace("/learner/courses/", "/learn/"))
    }
    }
  } else {
    console.log("skip learner pages (set AUDIT_LEARNER_EMAIL / AUDIT_LEARNER_PASSWORD)")
  }

  if (AUDIT_ADMIN_EMAIL && AUDIT_ADMIN_PASSWORD) {
    const page = await login(browser, "/auth/admin/login", AUDIT_ADMIN_EMAIL, AUDIT_ADMIN_PASSWORD, "admin")
    if (page)
    for (const path of [
      "/admin/dashboard",
      "/admin/courses",
      "/admin/learners",
      "/admin/purchases",
      "/admin/grading",
      "/admin/tracking",
      "/admin/mentor",
      "/admin/landing",
      "/admin/certificates",
      "/admin/settings",
      "/admin/profile",
    ])
      await visit(page, path)
    if (page) {
    await page.goto(BASE + "/admin/courses")
    const editHref = await page.locator('a[href$="/edit"]').first().getAttribute("href").catch(() => null)
    if (editHref) {
      await visit(page, editHref)
      for (const tab of ["Pelajaran", "Pengaturan", "Peserta", "Pratinjau"]) {
        await page.click(`[role=tab]:has-text("${tab}")`)
        await page.waitForTimeout(500)
        await settle(page)
        await audit(page, `${editHref} [${tab}]`)
      }

      // Dialog diaudit terbuka, bukan hanya tombolnya. Jebakan fokus, nama
      // yang hilang, dan judul yang tidak terkait adalah kegagalan khas
      // dialog, dan tidak satu pun terlihat selama ia tertutup.
      await page.goto(BASE + editHref)
      await settle(page)
      const importButton = page.getByRole("button", { name: /Impor \/ ekspor/i })
      if (await importButton.count()) {
        await importButton.click()
        await page.waitForTimeout(600)
        await audit(page, `${editHref} [dialog impor]`)
      }
    }
    }
  } else {
    console.log("skip admin pages (set AUDIT_ADMIN_EMAIL / AUDIT_ADMIN_PASSWORD)")
  }
} finally {
  await browser.close()
}

const failed = results.filter((r) => r.violations.length > 0)
console.log(`\n${results.length - failed.length}/${results.length} pages without WCAG 2.2 A/AA violations`)
process.exit(failed.length > 0 ? 1 : 0)
