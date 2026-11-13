/**
 * Akun superadmin sekali pakai untuk menjalankan gerbang a11y dan i18n.
 *
 *   node scripts/akun-audit.mjs buat    # cetak {"email","sandi"} JSON
 *   node scripts/akun-audit.mjs hapus   # hapus semua akun uji yang tertinggal
 *
 * **Kenapa ini ada.** Sejak gerbang a11y dan i18n benar-benar memeriksa layar
 * superadmin (lihat `AUDIT_SUPERADMIN_EMAIL` di keduanya), menjalankannya
 * butuh akun berwenang. `AUDIT_ADMIN_*` di `.env.local` sengaja akun pengelola
 * biasa, dan kata sandi superadmin sungguhan tidak boleh berkeliaran di
 * environment hanya demi audit. Jadi: buat akun sesaat, jalankan gerbangnya,
 * hapus lagi.
 *
 * Akunnya selalu berawalan `c-ukur-super-` dan berdomain `@test.local`, sama
 * seperti akun uji RLS, supaya `hapus` bisa menyapu sisa yang tertinggal
 * karena sebuah jalan terputus di tengah.
 *
 * MENULIS ke auth dan `profiles`. Hanya untuk mesin pengembang -- jangan
 * dijalankan terhadap proyek yang tidak boleh ketambahan akun.
 */
import fs from "node:fs"
import crypto from "node:crypto"

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
)

const U = env.NEXT_PUBLIC_SUPABASE_URL
const K = env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) {
  console.error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local")
  process.exit(1)
}

const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" }
const api = async (p, init) => {
  const r = await fetch(U + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) } })
  const t = await r.text()
  if (!r.ok) throw new Error(`${p} -> ${r.status} ${t}`)
  return t ? JSON.parse(t) : null
}

const AWALAN = "c-ukur-super-"
const perintah = process.argv[2]

if (perintah === "buat") {
  const tag = crypto.randomBytes(4).toString("hex")
  const email = `${AWALAN}${tag}@test.local`
  const sandi = crypto.randomBytes(18).toString("base64url")
  const u = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password: sandi, email_confirm: true }),
  })
  // Peran disetel lewat service role: `profiles` tidak mengizinkan peserta
  // mengubah kolom `role` miliknya sendiri (temuan C-01).
  await api(`/rest/v1/profiles?id=eq.${u.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ role: "superadmin", full_name: "Akun Uji Superadmin" }),
  })
  console.log(JSON.stringify({ email, sandi }))
} else if (perintah === "hapus") {
  const d = await api("/auth/v1/admin/users?per_page=200")
  const uji = (d.users ?? []).filter((x) =>
    new RegExp(`^${AWALAN}.*@test\\.local$`).test(x.email ?? "")
  )
  for (const u of uji) {
    await api(`/auth/v1/admin/users/${u.id}`, { method: "DELETE" })
    console.log("dihapus:", u.email)
  }
  console.log(`${uji.length} akun uji dihapus`)
} else {
  console.error('Pakai: node scripts/akun-audit.mjs buat | hapus')
  process.exit(1)
}
