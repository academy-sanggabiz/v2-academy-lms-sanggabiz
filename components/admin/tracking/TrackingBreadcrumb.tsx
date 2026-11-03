import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getTranslations } from "@/lib/i18n/server"

export async function TrackingBreadcrumb({
  learnerName,
  courseTitle,
}: {
  learnerName: string
  courseTitle: string
}) {
  const { t } = await getTranslations()
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Link
        href="/admin/tracking"
        className="flex items-center gap-1 font-medium text-foreground hover:underline"
      >
        <ChevronLeft className="size-4" />
        {t.insight.back}
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href="/admin/tracking" className="hover:text-foreground hover:underline">
          {t.admin.tracking}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="font-medium text-foreground">
          {learnerName} · {courseTitle}
        </span>
      </div>
    </div>
  )
}
