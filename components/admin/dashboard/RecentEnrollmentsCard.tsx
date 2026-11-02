import type { RecentEnrollment } from "@/lib/dashboard-admin"
import type { Paginated } from "@/lib/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListPagination } from "@/components/admin/ListPagination"
import { getTranslations } from "@/lib/i18n/server"

const PREFIX = "enroll"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export async function RecentEnrollmentsCard({ enrollments }: { enrollments: Paginated<RecentEnrollment> }) {
  // Server Component: getTranslations(), bukan hook useI18n().
  const { t } = await getTranslations()
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">{t.admin.recentEnrollments}</h2>
      {enrollments.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.admin.noEnrollments}</p>
      ) : (
        <div className="max-h-[320px] overflow-y-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-muted/50 hover:bg-muted/50">
                <TableHead>{t.admin.colLearner}</TableHead>
                <TableHead>{t.admin.colCourse}</TableHead>
                <TableHead>{t.admin.colDate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-0 truncate font-medium">{e.learnerName}</TableCell>
                  <TableCell className="max-w-0 truncate text-muted-foreground">{e.courseTitle}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDate(e.enrolledAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ListPagination meta={enrollments} prefix={PREFIX} hidePageSize />
    </div>
  )
}
