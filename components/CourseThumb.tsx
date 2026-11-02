import { cn } from "@/lib/utils"

/*
 * Satu tempat untuk menggambar sampul kursus. Sebelumnya tujuh layar
 * mengulang blok yang sama -- `relative flex h-[...] items-center ...` plus
 * kelas penanda gambar kosong -- sehingga tinggi, sudut, dan tampilan sampul
 * kosong berbeda-beda di tiap layar.
 *
 * Kursus yang belum punya gambar tidak lagi memperlihatkan kotak bergaris
 * bertuliskan "gambar kursus". Ia memperlihatkan inisial judulnya di atas
 * bidang warna dari keluarga warna Sanggabiz. Ragam warnanya ditentukan dari
 * `seed` (id kursus), jadi satu kursus selalu kebagian warna yang sama --
 * bukan acak tiap render, yang akan berkedip saat halaman dimuat ulang.
 */

const VARIANT_COUNT = 5

function variantOf(seed: string) {
  let sum = 0
  for (let i = 0; i < seed.length; i += 1) sum = (sum + seed.charCodeAt(i)) % 9973
  return (sum % VARIANT_COUNT) + 1
}

/** Dua huruf pertama dari dua kata pertama judul; satu huruf kalau judulnya satu kata. */
function initialsOf(title: string) {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}|\p{N}/u.test(w))
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function CourseThumb({
  src,
  title,
  seed,
  className,
  initialsClassName,
  children,
}: {
  src: string | null | undefined
  title: string
  /** Biasanya id kursus. Menentukan ragam warna sampul kosong. */
  seed: string
  /** Tinggi dan sudut sampul ditentukan pemanggil, mis. "h-[180px] rounded-md". */
  className?: string
  /** Ukuran inisial; kecilkan untuk sampul pendek. Bawaan `text-5xl`. */
  initialsClassName?: string
  /** Lencana harga/status yang diletakkan di atas sampul. */
  children?: React.ReactNode
}) {
  const hasImage = Boolean(src)

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        !hasImage && `course-thumb-fallback course-thumb-${variantOf(seed)}`,
        className
      )}
    >
      {hasImage ? (
        /* Sampul selalu didampingi judul kursus di layar yang sama, jadi
           gambarnya hiasan: alt kosong supaya pembaca layar tidak membaca
           judul dua kali (WCAG 2.2 SC 1.1.1). */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span
          aria-hidden
          className={cn(
            "font-bold tracking-tight text-primary select-none",
            initialsClassName ?? "text-5xl"
          )}
        >
          {initialsOf(title)}
        </span>
      )}
      {children}
    </div>
  )
}
