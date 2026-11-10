import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getAllAdminCourses } from "@/lib/courses-admin"
import {
  listAllJobCourses,
  listDepartments,
  listJobTitles,
  listLearnersWithJobTitle,
} from "@/lib/org-server"
import { OrganizationView } from "@/components/admin/organization/OrganizationView"

export default async function AdminOrganizationPage() {
  const result = await resolveSuperAdminProfile()

  // Struktur perusahaan bukan milik satu kursus: satu mentor mengubah jabatan
  // seseorang akan mengubah kursus wajib orang itu di kursus mentor lain.
  if (result.status !== "ok") {
    redirect("/admin/dashboard")
  }

  const [departments, jobTitles, jobCourses, learners, courses] = await Promise.all([
    listDepartments(),
    listJobTitles(),
    listAllJobCourses(),
    listLearnersWithJobTitle(),
    getAllAdminCourses(),
  ])

  return (
    <OrganizationView
      departments={departments}
      jobTitles={jobTitles}
      jobCourses={jobCourses}
      learners={learners}
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
    />
  )
}
