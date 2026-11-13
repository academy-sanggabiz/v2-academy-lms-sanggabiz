/**
 * Ambang anonimitas: berapa orang paling sedikit sebelum sebuah angka
 * tentang mereka boleh ditampilkan.
 *
 * Satu definisi, karena angkanya adalah janji -- bukan pilihan gaya. Pada
 * platform sekecil ini "1 peserta mengikuti kursus ini" menyebut satu orang
 * tertentu, dan "penyelesaian 50% di Keuangan" yang berasal dari dua orang
 * adalah cara menyebut nama tanpa menuliskannya.
 *
 * Sebelum berkas ini ada, angka lima tersalin di tiga tempat --
 * `lib/catalog-server.ts`, `lib/laporan-departemen.ts`, dan catatan di
 * `lib/perkembangan.ts` -- masing-masing dengan komentar yang menunjuk
 * salinan lainnya. Salinan yang saling menunjuk adalah salinan yang cepat
 * atau lambat berbeda nilainya, dan yang berbeda diam-diam di sini adalah
 * seberapa kecil kelompok yang boleh diceritakan angkanya.
 *
 * Bebas dari modul server supaya komponen di peramban bisa memakainya.
 */
export const AMBANG_ANONIMITAS = 5

/**
 * Mengembalikan `null` ketika kelompoknya terlalu kecil untuk diceritakan.
 *
 * `null`, bukan nol: nol adalah pernyataan ("tidak ada seorang pun"), dan itu
 * justru pernyataan yang tidak boleh dibuat tentang kelompok yang sedang
 * dilindungi. Layar yang menerimanya harus tidak menampilkan apa pun.
 */
export function angkaAman(jumlah: number | null | undefined): number | null {
  if (typeof jumlah !== "number") return null
  return jumlah >= AMBANG_ANONIMITAS ? jumlah : null
}
