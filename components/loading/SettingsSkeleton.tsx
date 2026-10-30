import { Skeleton } from "@/components/ui/skeleton"

/**
 * Dipakai halaman Pengaturan peserta maupun admin -- keduanya persis dua kolom:
 * kartu Notifikasi dan Keamanan di kiri, kartu Hapus Akun di kanan.
 */
export function SettingsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-7">
            <Skeleton className="mb-5 h-6 w-32" />
            <div className="flex items-center justify-between gap-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3.5 w-64" />
              </div>
              <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <Skeleton className="mb-5 h-6 w-28" />
            <Skeleton className="mb-2.5 h-4 w-36" />
            <div className="flex gap-3">
              <Skeleton className="h-11 flex-1" />
              <Skeleton className="h-11 w-24" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7">
          <Skeleton className="mb-5 h-6 w-32" />
          <div className="rounded-xl border border-border p-5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-2 mb-3.5 h-3.5 w-48" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
