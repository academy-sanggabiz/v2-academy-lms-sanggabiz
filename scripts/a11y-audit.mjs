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
    await audit(page, `${path} [${label}]`)
  }
}

async function login(browser, loginPath, email, password) {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
  await page.goto(BASE + loginPath)
  await page.fill("input[name=email]", email)
  await page.fill("input[name=password]", password)
  await page.click("button[type=submit]")
  await page.waitForURL(/dashboard/, { timeout: 20000 })
  return page
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

  const { AUDIT_LEARNER_EMAIL, AUDIT_LEARNER_PASSWORD, AUDIT_ADMIN_EMAIL, AUDIT_ADMIN_PASSWORD } = process.env

  if (AUDIT_LEARNER_EMAIL && AUDIT_LEARNER_PASSWORD) {
    const page = await login(browser, "/auth/login", AUDIT_LEARNER_EMAIL, AUDIT_LEARNER_PASSWORD)
    for (const path of [
      "/learner/dashboard",
      "/learner/courses",
      "/learner/purchase",
      "/learner/profile",
      "/learner/settings",
      "/learner/notifications",
    ])
      await visit(page, path)
    await page.goto(BASE + "/learner/courses")
    const courseHref = await page.locator('a[href^="/learner/courses/"]').first().getAttribute("href").catch(() => null)
    if (courseHref) {
      await visit(page, courseHref)
      await visit(page, courseHref.replace("/learner/courses/", "/learn/"))
    }
  } else {
    console.log("skip learner pages (set AUDIT_LEARNER_EMAIL / AUDIT_LEARNER_PASSWORD)")
  }

  if (AUDIT_ADMIN_EMAIL && AUDIT_ADMIN_PASSWORD) {
    const page = await login(browser, "/auth/admin/login", AUDIT_ADMIN_EMAIL, AUDIT_ADMIN_PASSWORD)
    for (const path of [
      "/admin/dashboard",
      "/admin/courses",
      "/admin/learners",
      "/admin/purchases",
      "/admin/grading",
      "/admin/tracking",
      "/admin/mentor",
      "/admin/landing",
      "/admin/settings",
      "/admin/profile",
    ])
      await visit(page, path)
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
