/**
 * Warna halaman depan.
 *
 * **Kenapa tidak bebas memilih warna apa saja.** Seluruh palet LMS ini
 * dirancang melewati rasio kontras 4,5:1 (WCAG 2.2 SC 1.4.3), dan gerbang
 * `npm run audit:a11y` menjaganya tetap begitu. Satu bidang warna bebas di
 * panel admin bisa meruntuhkan itu dalam satu klik, tanpa siapa pun sadar --
 * yang memilih warnanya melihat layar bagus, sementara orang dengan penglihatan
 * rendah tidak bisa membaca apa pun.
 *
 * Jadi warnanya tetap bebas dipilih, tetapi **diperiksa sebelum disimpan**.
 * Kombinasi yang gagal ditolak dengan menyebutkan angkanya, bukan diterima
 * diam-diam.
 *
 * Lingkupnya sengaja hanya halaman depan. Mengganti warna seluruh aplikasi
 * berarti mengganti warna layar belajar dan layar pengelola juga, dan keduanya
 * bukan tempat bereksperimen dengan merek.
 */

export type LandingTheme = {
  /** Warna tombol utama dan sorotan. Teks di atasnya selalu putih. */
  primary: string
  /** Latar lembut untuk bidang berselang-seling. */
  surface: string
  /** Warna teks utama di atas latar terang. */
  foreground: string
}

export const DEFAULT_LANDING_THEME: LandingTheme = {
  primary: "#13707f",
  surface: "#f2f8f9",
  foreground: "#14252a",
}

/** Pilihan siap pakai, masing-masing sudah lolos pemeriksaan di bawah. */
export const THEME_PRESETS: { name: string; theme: LandingTheme }[] = [
  { name: "Teal (bawaan)", theme: DEFAULT_LANDING_THEME },
  { name: "Biru laut", theme: { primary: "#1a5f9e", surface: "#f1f6fb", foreground: "#101f2e" } },
  { name: "Hijau hutan", theme: { primary: "#1f6b43", surface: "#f1f8f3", foreground: "#15241b" } },
  { name: "Ungu terong", theme: { primary: "#6b3fa0", surface: "#f7f3fb", foreground: "#201a2b" } },
  { name: "Merah bata", theme: { primary: "#a33a28", surface: "#fbf3f1", foreground: "#2b1a16" } },
]

function luminance(hex: string): number | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = match[1]
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

/** Rasio kontras WCAG antara dua warna hex; null bila salah satunya tidak sah. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === null || lb === null) return null
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

export type ThemeCheck = { ok: true } | { ok: false; problems: string[] }

/**
 * Memeriksa tema terhadap ambang WCAG yang berlaku untuk tiap pasangan.
 *
 * Teks biasa butuh 4,5:1 (SC 1.4.3). Teks putih di atas tombol berwarna juga
 * teks biasa, jadi ambangnya sama -- ini yang paling sering gagal, karena warna
 * merek yang cerah terlihat bagus tetapi tidak cukup gelap untuk menopang teks
 * putih.
 */
export function checkTheme(theme: LandingTheme): ThemeCheck {
  const problems: string[] = []

  const pairs: { label: string; a: string; b: string; min: number }[] = [
    { label: "teks utama di atas latar", a: theme.foreground, b: theme.surface, min: 4.5 },
    { label: "teks utama di atas putih", a: theme.foreground, b: "#ffffff", min: 4.5 },
    { label: "teks putih di atas warna utama", a: "#ffffff", b: theme.primary, min: 4.5 },
    { label: "warna utama di atas putih", a: theme.primary, b: "#ffffff", min: 4.5 },
  ]

  for (const { label, a, b, min } of pairs) {
    const ratio = contrastRatio(a, b)
    if (ratio === null) {
      problems.push(`Warna tidak sah (harus format #rrggbb): ${a} atau ${b}`)
      continue
    }
    if (ratio < min) {
      problems.push(`Kontras ${label} hanya ${ratio.toFixed(2)}:1, minimal ${min}:1`)
    }
  }

  return problems.length === 0 ? { ok: true } : { ok: false, problems }
}

/** Membaca tema dari jsonb; apa pun yang tidak sah jatuh ke bawaan. */
export function parseTheme(raw: unknown): LandingTheme {
  if (typeof raw !== "object" || raw === null) return DEFAULT_LANDING_THEME
  const value = raw as Record<string, unknown>
  const theme: LandingTheme = {
    primary: typeof value.primary === "string" ? value.primary : DEFAULT_LANDING_THEME.primary,
    surface: typeof value.surface === "string" ? value.surface : DEFAULT_LANDING_THEME.surface,
    foreground:
      typeof value.foreground === "string" ? value.foreground : DEFAULT_LANDING_THEME.foreground,
  }
  // Tema tersimpan yang ternyata gagal -- misalnya disimpan sebelum
  // pemeriksaan ini ada -- tidak dipakai. Halaman depan lebih baik tampil
  // dengan warna bawaan daripada tidak terbaca.
  return checkTheme(theme).ok ? theme : DEFAULT_LANDING_THEME
}

/** Variabel CSS untuk dipasang pada pembungkus halaman depan. */
export function themeStyle(theme: LandingTheme): React.CSSProperties {
  return {
    ["--primary" as string]: theme.primary,
    ["--ring" as string]: theme.primary,
    ["--background" as string]: theme.surface,
    ["--foreground" as string]: theme.foreground,
  }
}
