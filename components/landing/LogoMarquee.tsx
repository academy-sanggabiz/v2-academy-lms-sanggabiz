/**
 * Dinding logo berjalan.
 *
 * Bentuknya meniru pita alumni RevoU (docs/STANDAR-HALAMAN-DEPAN.md §1): angka
 * di atas, nama atau logo di bawah, bergerak mendatar tanpa henti. Yang
 * dipinjam prinsipnya -- *bukti berupa angka, bukan kata sifat* -- bukan
 * warnanya; palet dan hurufnya tetap milik kita.
 *
 * Tiga hal yang membuatnya tidak sekadar animasi:
 *
 * 1. **Daftarnya digandakan, bukan diukur.** Jalur memuat butir yang sama dua
 *    kali dan bergeser -50%. Mengukur lebar dengan JavaScript akan salah pada
 *    muatan pertama dan setiap kali fontnya selesai dimuat.
 * 2. **Bisa dihentikan.** Berhenti saat disentuh tetikus atau saat salah satu
 *    isinya mendapat fokus papan ketik, dan berhenti sama sekali kalau sistem
 *    meminta gerakan dikurangi (WCAG 2.2.2). Aturannya di app/globals.css.
 * 3. **Satu salinan saja yang dibacakan.** Salinan kedua murni hiasan, jadi
 *    `aria-hidden`: tanpa itu pembaca layar membacakan seluruh daftar dua kali.
 */
import { cn } from "@/lib/utils"
import type { LogoItem } from "@/lib/landing-blocks"

/** Satu kolom: angka opsional di atas, logo atau nama di bawah. */
function Butir({ item, hidden }: { item: LogoItem; hidden?: boolean }) {
  return (
    <li
      aria-hidden={hidden}
      className="flex w-[116px] shrink-0 flex-col items-center justify-end gap-2 sm:w-[140px]"
    >
      {typeof item.count === "number" && item.count > 0 && (
        <span className="text-xl font-bold text-ring tabular-nums sm:text-2xl">{item.count}</span>
      )}
      {item.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.logoUrl}
          alt={hidden ? "" : item.name}
          className="h-8 w-auto max-w-full object-contain sm:h-9"
        />
      ) : (
        /*
          Tanpa berkas logo, namanya sendiri yang jadi logo. Itu bukan
          kekurangan sementara: nama berhuruf tebal lebih terbaca daripada
          lambang yang diperkecil, dan pemilik bisa mengganti satu per satu
          tanpa barisnya terlihat setengah jadi.
        */
        <span className="text-center text-sm font-bold tracking-tight text-foreground sm:text-base">
          {item.name}
        </span>
      )}
    </li>
  )
}

export function LogoMarquee({
  items,
  className,
  secondsPerItem = 3,
}: {
  items: LogoItem[]
  className?: string
  /** Kecepatannya per butir, bukan per putaran: menambah logo tidak membuat barisnya ngebut. */
  secondsPerItem?: number
}) {
  if (items.length === 0) return null

  const durasi = Math.max(18, items.length * secondsPerItem)

  return (
    <div
      className={cn(
        "marquee relative overflow-hidden",
        /*
          Tepi yang memudar, supaya logo tidak terpotong mendadak di batas
          layar. `mask-image` tidak menyentuh keterbacaan isinya -- yang
          memudar hanya yang sudah setengah keluar.
        */
        "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className
      )}
    >
      <ul
        className="marquee-track flex w-max items-end gap-9 sm:gap-14"
        style={{ ["--marquee-duration" as string]: `${durasi}s` }}
      >
        {items.map((item, i) => (
          <Butir key={`a-${i}`} item={item} />
        ))}
        {items.map((item, i) => (
          <Butir key={`b-${i}`} item={item} hidden />
        ))}
      </ul>
    </div>
  )
}
