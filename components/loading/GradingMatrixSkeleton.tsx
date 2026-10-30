import { Skeleton } from "@/components/ui/skeleton"

/**
 * Matriks penilaian satu kursus: tabel lebar dengan kolom peserta yang menempel
 * di kiri dan kolom nilai akhir di kanan, bukan daftar baris biasa.
 */
export function GradingMatrixSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-64" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-60" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-3">
            <Skeleton className="h-4 w-44 shrink-0" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24 shrink-0" />
            ))}
            <Skeleton className="ml-auto h-4 w-20 shrink-0" />
          </div>

          {Array.from({ length: 6 }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 border-t border-border px-4 py-3.5 first:border-t-0"
            >
              <div className="w-44 shrink-0 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              {Array.from({ length: 4 }).map((_, col) => (
                <Skeleton key={col} className="h-7 w-24 shrink-0" />
              ))}
              <Skeleton className="ml-auto h-5 w-14 shrink-0" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-4 h-9 w-64" />
      </div>
    </div>
  )
}
