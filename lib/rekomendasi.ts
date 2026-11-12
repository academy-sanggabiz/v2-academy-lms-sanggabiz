/**
 * Rekomendasi kursus berdasarkan apa yang sudah DIKERJAKAN peserta.
 *
 * Melengkapi, bukan menggantikan, rekomendasi berdasarkan jabatan di
 * `lib/org.ts`. Keduanya menjawab pertanyaan berbeda: yang itu "apa yang
 * diwajibkan untuk posisi saya", yang ini "apa yang masuk akal saya pelajari
 * berikutnya, melihat yang sudah saya selesaikan".
 *
 * == Tiap rekomendasi membawa alasannya ==
 *
 * `docs/STANDAR-DIGITAL-LEARNING.md` menyebut rekomendasi tanpa alasan
 * sebagai anti-pattern, dan kartu jabatan sudah mengikuti aturan itu. Alasan
 * dirakit di server, bukan di komponen -- alasan yang dirakit di dua tempat
 * cepat berbeda bunyinya.
 *
 * == Kenapa penilaiannya sesederhana ini ==
 *
 * Tiga sinyal, bobot bulat, dan bisa dijelaskan dalam satu kalimat kepada
 * peserta. Model yang lebih pintar tidak bisa menjelaskan dirinya, dan
 * rekomendasi yang tidak bisa dijelaskan tidak bisa diperbaiki ketika ia
 * meleset -- sementara katalog sebesar ini belum butuh apa pun yang lebih.
 */

export type AlasanRekomendasi = "kategori" | "tingkat" | "populer"

export type KursusKandidat = {
  id: string
  title: string
  thumbnailUrl: string | null
  categoryId: string | null
  categoryName: string | null
  level: string | null
  lessonCount: number
  learnerCount: number
}

export type Rekomendasi = KursusKandidat & {
  skor: number
  alasan: AlasanRekomendasi
  /** Judul kursus yang memicu alasannya, untuk kalimat "karena Anda menyelesaikan X". */
  pemicu: string | null
}

const BOBOT_KATEGORI = 3
const BOBOT_TINGKAT = 2
const BOBOT_POPULER = 1

const URUTAN_TINGKAT = ["beginner", "intermediate", "advanced"] as const

/** Tingkat berikutnya setelah yang tertinggi sudah diselesaikan. */
export function tingkatBerikutnya(tertinggi: string | null): string | null {
  if (!tertinggi) return null
  const i = URUTAN_TINGKAT.indexOf(tertinggi as (typeof URUTAN_TINGKAT)[number])
  if (i < 0 || i >= URUTAN_TINGKAT.length - 1) return null
  return URUTAN_TINGKAT[i + 1]
}

export type RiwayatPeserta = {
  /** Kursus yang sudah dituntaskan, beserta kategori dan tingkatnya. */
  selesai: { id: string; title: string; categoryId: string | null; level: string | null }[]
  /** Kursus yang sedang atau pernah diikuti -- tidak pernah direkomendasikan lagi. */
  sudahDiikuti: Set<string>
}

/**
 * Memberi skor dan alasan kepada tiap kandidat, lalu mengambil yang teratas.
 *
 * Fungsi murni supaya bagian yang menentukan apa yang dilihat peserta bisa
 * diuji tanpa basis data.
 */
export function hitungRekomendasi(
  kandidat: KursusKandidat[],
  riwayat: RiwayatPeserta,
  maks = 3
): Rekomendasi[] {
  if (riwayat.selesai.length === 0) return []

  const kategoriSelesai = new Map<string, string>()
  for (const s of riwayat.selesai) {
    if (s.categoryId && !kategoriSelesai.has(s.categoryId)) kategoriSelesai.set(s.categoryId, s.title)
  }

  const tingkatTertinggi = riwayat.selesai.reduce<string | null>((tinggi, s) => {
    const i = URUTAN_TINGKAT.indexOf(s.level as (typeof URUTAN_TINGKAT)[number])
    const j = URUTAN_TINGKAT.indexOf(tinggi as (typeof URUTAN_TINGKAT)[number])
    return i > j ? s.level : tinggi
  }, null)
  const incar = tingkatBerikutnya(tingkatTertinggi)

  const hasil: Rekomendasi[] = []

  for (const k of kandidat) {
    if (riwayat.sudahDiikuti.has(k.id)) continue

    let skor = 0
    let alasan: AlasanRekomendasi = "populer"
    let pemicu: string | null = null

    const pemicuKategori = k.categoryId ? kategoriSelesai.get(k.categoryId) : undefined
    if (pemicuKategori) {
      skor += BOBOT_KATEGORI
      alasan = "kategori"
      pemicu = pemicuKategori
    }

    if (incar && k.level === incar) {
      skor += BOBOT_TINGKAT
      // Kategori menang sebagai ALASAN yang ditampilkan meski skornya
      // digabung: "karena Anda menyelesaikan X" lebih berarti bagi orangnya
      // daripada "tingkat berikutnya", dan satu kartu hanya boleh membawa
      // satu kalimat.
      if (alasan !== "kategori") alasan = "tingkat"
    }

    // Populer hanya pemecah seri, bukan alasan tersendiri kalau sudah ada
    // yang lebih baik. Nol peserta tidak menambah apa pun.
    if (k.learnerCount > 0) skor += BOBOT_POPULER

    if (skor <= BOBOT_POPULER) continue

    hasil.push({ ...k, skor, alasan, pemicu })
  }

  return hasil
    .sort((a, b) => b.skor - a.skor || b.learnerCount - a.learnerCount || a.title.localeCompare(b.title))
    .slice(0, maks)
}
