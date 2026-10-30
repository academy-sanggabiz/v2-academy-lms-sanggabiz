import { Skeleton } from "@/components/ui/skeleton"

const STAT_GRID: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

/**
 * Bentuk baku halaman daftar: judul, deretan kartu angka, lalu satu kartu berisi
 * barisnya. Jumlah kartu angka dibuat bisa diatur karena halaman daftar di LMS
 * ini punya dua sampai empat -- skeleton yang jumlahnya keliru membuat isinya
 * melompat begitu data datang.
 */
export function ListPageSkeleton({ stats = 4 }: { stats?: 0 | 2 | 3 | 4 }) {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {stats > 0 && (
        <div className={`mb-6 grid grid-cols-1 gap-4 ${STAT_GRID[stats]}`}>
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-14" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
