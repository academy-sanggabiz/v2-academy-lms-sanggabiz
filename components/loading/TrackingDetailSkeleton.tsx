import { Skeleton } from "@/components/ui/skeleton"

/** Remah roti, kartu ringkasan peserta, lalu kartu modul dan kartu tugas. */
export function TrackingDetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-72" />

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
          <div className="mt-4 flex gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-14" />
              </div>
            ))}
          </div>
        </div>

        {Array.from({ length: 2 }).map((_, card) => (
          <div key={card} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="mb-4 h-4 w-28" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, group) => (
                <div key={group}>
                  <Skeleton className="mb-2 h-3 w-32" />
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: 3 }).map((_, row) => (
                      <div key={row} className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-2/5" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
