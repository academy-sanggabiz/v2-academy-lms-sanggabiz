import { Skeleton } from "@/components/ui/skeleton"

/**
 * Halaman yang isinya satu formulir panjang: judul dengan tombol simpan di
 * kanannya, lalu beberapa kartu berisi pasangan label dan isian.
 */
export function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-11 w-28" />
      </div>

      {Array.from({ length: 2 }).map((_, card) => (
        <div key={card} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, field) => (
            <div key={field} className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
