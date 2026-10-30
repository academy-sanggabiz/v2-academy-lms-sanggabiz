import { Skeleton } from "@/components/ui/skeleton"

/** Tautan kembali, kartu identitas peserta, tiga kartu angka, lalu tab isi. */
export function LearnerDetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-4 w-40" />

      <div className="mb-5 flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="mb-3 h-4 w-32" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="mb-5 flex max-w-[640px] flex-wrap gap-1 rounded-xl bg-secondary p-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 rounded-xl border border-border p-3">
              <Skeleton className="h-[52px] w-[72px] shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
