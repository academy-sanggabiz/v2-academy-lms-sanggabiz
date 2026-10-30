import { notFound } from "next/navigation"

import { getCourseDetailForAdmin, listCoursesForPrerequisitePicker, listInstructors } from "@/lib/courses-admin"
import { getCourseRoster } from "@/lib/learners-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { CourseFormShell } from "@/components/admin/courses/CourseFormShell"

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<RawSearchParams & { new?: string }>
}) {
  const [{ id }, raw] = await Promise.all([params, searchParams])
  const rosterParams = parseListParams<Record<string, never>>(raw, {
    prefix: "roster",
    sortable: ["enrolled_at"],
    defaultSort: "enrolled_at",
    defaultDir: "desc",
  })
  // Keempatnya tetap berjalan bersamaan, tetapi hanya `course` yang ditunggu:
  // ia satu-satunya yang dibutuhkan untuk menampilkan editor. Instruktur,
  // prasyarat, dan daftar peserta hanya dipakai tab Pengaturan dan Peserta,
  // jadi promise-nya dioper apa adanya dan diselesaikan di balik <Suspense> --
  // editor tidak lagi menunggu query paling lambat sebelum muncul.
  const instructorsPromise = listInstructors()
  const prerequisitesPromise = listCoursesForPrerequisitePicker(id)
  const rosterPromise = getCourseRoster(id, rosterParams)

  const course = await getCourseDetailForAdmin(id)
  if (!course) notFound()

  return (
    <CourseFormShell
      course={course}
      instructorsPromise={instructorsPromise}
      prerequisitesPromise={prerequisitesPromise}
      rosterPromise={rosterPromise}
      isNew={raw.new === "1"}
    />
  )
}
