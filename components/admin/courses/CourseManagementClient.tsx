"use client"

import type { Course } from "@/lib/courses"
import type { Paginated } from "@/lib/pagination"
import { ListPagination } from "@/components/admin/ListPagination"
import { useI18n } from "@/components/i18n/LocaleProvider"

import { CourseListCard } from "./CourseListCard"
import { CourseListToolbar } from "./CourseListToolbar"

export function CourseManagementClient({ page }: { page: Paginated<Course> }) {
  const { t } = useI18n()
  return (
    <div>
      <CourseListToolbar />

      {page.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {page.total === 0 ? t.editor.noCourses : t.editor.noCourseFilterMatches}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.rows.map((course) => (
              <CourseListCard key={course.id} course={course} />
            ))}
          </div>
          <ListPagination meta={page} hidePageSize />
        </>
      )}
    </div>
  )
}
