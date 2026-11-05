import { cn } from "@/lib/utils"

/**
 * Tombol WhatsApp yang mengambang di pojok kanan bawah.
 *
 * Bentuknya meniru tombol "Contact Us" RevoU: satu sasaran tetap yang ikut
 * tergulir, supaya pengunjung yang ragu di tengah halaman tidak perlu mencari
 * jalan bertanya sampai ke kaki halaman.
 *
 * Nomornya dibersihkan di sini, bukan dipercaya apa adanya: pemilik mengetik
 * "0812-3456-7890" atau "+62 812 3456 7890" sama wajarnya, sementara wa.me
 * hanya menerima angka berformat internasional tanpa tanda baca. Awalan 0
 * diubah ke 62 -- nyaris semua nomor yang akan diketik di sini nomor Indonesia,
 * dan nomor berawalan 0 yang dikirim apa adanya menghasilkan tautan rusak yang
 * baru ketahuan setelah ada pengunjung yang menekannya.
 */
export function waHref(nomor: string, pesan?: string): string | null {
  const angka = nomor.replace(/[^\d+]/g, "").replace(/^\+/, "")
  if (!angka) return null
  const internasional = angka.startsWith("0") ? `62${angka.slice(1)}` : angka
  // Nomor Indonesia terpendek pun 10 angka dengan kode negara; di bawah itu
  // hampir pasti salah ketik, dan tautan rusak lebih buruk daripada tidak ada.
  if (internasional.length < 10) return null
  const teks = pesan?.trim() ? `?text=${encodeURIComponent(pesan.trim())}` : ""
  return `https://wa.me/${internasional}${teks}`
}

export function FloatingWhatsApp({
  number,
  message,
  label,
  className,
}: {
  number: string
  message?: string
  label: string
  className?: string
}) {
  const href = waHref(number, message)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed right-4 bottom-4 z-30 flex items-center gap-2.5 rounded-full py-3 pr-5 pl-3.5 shadow-float sm:right-6 sm:bottom-6",
        /*
          Hijau WhatsApp, bukan warna merek kita: tombol ini menjanjikan satu
          aplikasi tertentu, dan warnanya bagian dari janji itu.
          #075e54 -- yang paling gelap dari palet resminya. Teks putih di
          atasnya 7,7:1; di atas #128c7e hanya 4,1:1 dan di atas #25d366 yang
          terang 1,8:1. Tulisan "Hubungi Kami" berukuran 14px, jadi ambangnya
          4,5:1 dan dua warna pertama itu gagal (axe: color-contrast).
        */
        "bg-[#075e54] text-sm font-bold text-white hover:brightness-125",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      {/* Lambang WhatsApp digambar langsung: ikon mereka tidak ada di lucide,
          dan memuat berkas dari luar hanya untuk satu bentuk tidak sepadan. */}
      <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0 fill-current">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.825 9.825 0 016.993 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.889 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      {/* Tulisannya hilang di layar sempit, lambangnya tidak: di 320px baris
          ini sendirian memakan sepertiga lebar layar. */}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </a>
  )
}
