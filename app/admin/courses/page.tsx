import { getAdminCourseList, type AdminCourseFilters } from "@/lib/courses-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { CourseManagementClient } from "@/components/admin/courses/CourseManagementClient"
import { CreateCourseButton } from "@/components/admin/courses/CreateCourseButton"
import { getTranslations } from "@/lib/i18n/server"

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const { t } = await getTranslations()
  const raw = await searchParams
  const params = parseListParams<AdminCourseFilters>(raw, {
    sortable: ["created_at", "title", "price"],
    defaultSort: "created_at",
    defaultDir: "desc",
    defaultPageSize: 12,
    filters: {
      status: ["all", "published", "draft"],
      price: ["all", "free", "paid"],
    },
  })
  const page = await getAdminCourseList(params)

  return (
    <div>
      {/*
        Membungkus di layar sempit: judul, keterangan, dan tombol "Buat Kursus"
        berdampingan memakan 360px, melebihi 320px yang disyaratkan WCAG
        1.4.10 Reflow.
      */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.admin.courses}</h1>
          <p className="text-sm text-muted-foreground">
            {t.admin.coursesSubtitle}
          </p>
        </div>
        <CreateCourseButton />
      </div>

      <CourseManagementClient page={page} />
    </div>
  )
}
