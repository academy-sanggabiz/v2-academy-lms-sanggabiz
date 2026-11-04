import { Skeleton } from "@/components/ui/skeleton"

/**
 * Bentuk sementara saat katalog dimuat. `loading.tsx` menurun ke segmen anak,
 * jadi halaman detail kelas ikut memakainya selagi belum punya bentuknya
 * sendiri -- lebih baik daripada layar kosong selama pengambilan data.
 */
export default function MemuatKatalog() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-8 sm:py-14">
      <p role="status" aria-live="polite" className="sr-only">
        Memuat kelas…
      </p>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <Skeleton className="mt-8 h-10 w-full" />
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[330px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
