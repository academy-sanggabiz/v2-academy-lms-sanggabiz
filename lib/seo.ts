/**
 * Bentuk pengaturan SEO situs. Bebas dari modul server, supaya komponen
 * penyunting di peramban bisa memakai tipenya tanpa menarik klien basis data
 * ke jalur render publik -- alasan yang sama dengan `lib/landing.ts`.
 */

/** Satu bahasa. Kosong berarti "pakai bawaan", bukan "judulnya kosong". */
export type SeoText = {
  title: string
  description: string
}

export type SiteSeo = {
  id: SeoText
  en: SeoText
  /**
   * Gambar yang muncul saat tautan situs dibagikan ke WhatsApp, LinkedIn,
   * atau X. Satu untuk kedua bahasa: yang dilihat orang gambarnya, dan
   * menyiapkan dua berkas untuk satu gambar yang sama jarang sepadan.
   */
  ogImageUrl: string
}

/**
 * Bawaan yang dipakai saat pemilik belum mengisi apa pun. Sama persis dengan
 * yang dulu tertulis di app/layout.tsx -- memindahkannya ke basis data tidak
 * boleh mengubah apa yang sudah terbaca mesin pencari hari ini.
 */
export const DEFAULT_SEO: SiteSeo = {
  id: {
    title: "Sanggabiz Academy",
    description: "Belajar dan mengajar jadi mudah.",
  },
  en: {
    title: "Sanggabiz Academy",
    description: "Learning and teaching, made simple.",
  },
  ogImageUrl: "",
}

/**
 * Panjang yang dianjurkan, dipakai penyunting untuk memberi peringatan --
 * bukan untuk menolak.
 *
 * Google memotong judul sekitar 60 aksara dan keterangan sekitar 160 pada
 * hasil pencarian desktop. Angkanya tidak pernah pasti (yang dipotong lebarnya
 * dalam piksel, bukan jumlah hurufnya), jadi melewatinya bukan kesalahan --
 * hanya risiko bahwa ekornya tidak terbaca. Menolak simpan karena itu akan
 * mengarang aturan yang Google sendiri tidak punya.
 */
export const SEO_BATAS = { title: 60, description: 160 } as const

/** Membaca jsonb apa adanya; apa pun yang tidak sah jatuh ke bawaan. */
export function parseSeo(raw: unknown): SiteSeo {
  if (typeof raw !== "object" || raw === null) return DEFAULT_SEO
  const value = raw as Record<string, unknown>

  const bahasa = (kunci: "id" | "en"): SeoText => {
    const v = value[kunci]
    if (typeof v !== "object" || v === null) return DEFAULT_SEO[kunci]
    const t = v as Record<string, unknown>
    return {
      title: typeof t.title === "string" ? t.title : DEFAULT_SEO[kunci].title,
      description:
        typeof t.description === "string" ? t.description : DEFAULT_SEO[kunci].description,
    }
  }

  return {
    id: bahasa("id"),
    en: bahasa("en"),
    ogImageUrl: typeof value.ogImageUrl === "string" ? value.ogImageUrl : "",
  }
}

/**
 * Judul dan keterangan yang benar-benar dipakai, setelah yang kosong diganti
 * bawaan.
 *
 * Kolom kosong di penyunting berarti "pakai bawaan", bukan "terbitkan halaman
 * tanpa judul" -- dan perbedaan itu harus diputuskan di satu tempat, bukan di
 * tiap pemanggil.
 */
export function seoTerpakai(seo: SiteSeo, locale: "id" | "en"): SeoText {
  const dipilih = seo[locale]
  return {
    title: dipilih.title.trim() || DEFAULT_SEO[locale].title,
    description: dipilih.description.trim() || DEFAULT_SEO[locale].description,
  }
}
