import { getAdminCourseList, type AdminCourseFilters } from "@/lib/courses-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { CourseManagementClient } from "@/components/admin/courses/CourseManagementClient"
import { CreateCourseButton } from "@/components/admin/courses/CreateCourseButton"

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold">Manajemen Kursus</h1>
          <p className="text-sm text-muted-foreground">
            Buat, ubah, dan kelola semua kursus di platform belajar Anda
          </p>
        </div>
        <CreateCourseButton />
      </div>

      <CourseManagementClient page={page} />
    </div>
  )
}
