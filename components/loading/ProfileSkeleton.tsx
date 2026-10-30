import { Skeleton } from "@/components/ui/skeleton"

/**
 * Kartu identitas dengan foto bulat, dipakai halaman Profil peserta dan admin.
 * Profil peserta menambah tab Kursus Terdaftar / Sertifikat di bawahnya; profil
 * admin berhenti di kartu identitas, jadi tabnya dibuat opsional.
 */
export function ProfileSkeleton({ tabs = false }: { tabs?: boolean }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-6 rounded-2xl border border-border bg-card p-8">
        <Skeleton className="size-[100px] flex-none rounded-full" />
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {tabs && (
        <>
          <div className="mb-6 flex gap-1.5 rounded-lg bg-muted p-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-md" />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <Skeleton className="mb-4 h-6 w-52" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 rounded-xl border border-border p-3">
                  <Skeleton className="h-[52px] w-[72px] flex-none rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
