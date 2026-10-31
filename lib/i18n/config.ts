/**
 * Dwibahasa Indonesia–Inggris.
 *
 * **Kenapa bahasa tidak ada di alamat URL.** Panduan Next.js menganjurkan
 * `/[lang]/...`, dan untuk situs publik itu memang pilihan yang benar: alamatnya
 * bisa dibagikan dalam bahasa tertentu dan mesin pencari bisa mengindeks
 * keduanya. LMS ini berbeda -- hampir seluruh halamannya ada di balik login,
 * jadi yang didapat dari alamat berbahasa hanya halaman depan dan halaman
 * masuk, sementara ongkosnya adalah menyarangkan seluruh `app/` di bawah satu
 * segmen baru dan membuat setiap penjaga peran di `proxy.ts` -- yang semuanya
 * mencocokkan awalan jalur seperti `/learner` dan `/admin` -- harus sadar
 * bahasa. Penjaga-penjaga itu baru saja ketahuan mati berbulan-bulan tanpa
 * galat apa pun; menambah satu segmen di depan setiap pencocokan adalah cara
 * paling mudah mengulanginya.
 *
 * Jadi bahasa disimpan sebagai preferensi orangnya: cookie supaya langsung
 * berlaku termasuk sebelum masuk, dan `profiles.locale` supaya pilihan itu
 * ikut berpindah perangkat. Konsekuensinya disadari: halaman depan tidak bisa
 * dibagikan dalam bahasa tertentu lewat tautan. Kalau nanti itu diperlukan,
 * alamat berbahasa bisa ditambahkan untuk halaman publik saja tanpa menyentuh
 * area yang ada di balik login.
 */

export const LOCALES = ["id", "en"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "id"

/** Nama bahasa dalam bahasanya sendiri -- jangan diterjemahkan. */
export const LOCALE_LABELS: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
}

export const LOCALE_COOKIE = "bahasa"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

/**
 * Memilih bahasa dari header Accept-Language. Dipakai hanya saat pengunjung
 * belum pernah memilih apa pun; begitu ia memilih, pilihannya yang menang.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";")
      const q = params.find((p) => p.trim().startsWith("q="))
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split("-")[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
