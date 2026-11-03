"use client"

import { ListFilterSelect } from "@/components/admin/ListFilterSelect"
import { ListToolbar } from "@/components/admin/ListToolbar"
import { useI18n } from "@/components/i18n/LocaleProvider"

export function CourseListToolbar() {
  const { t } = useI18n()
  return (
    <div className="mb-6">
      <ListToolbar placeholder={t.admin.searchCourseTitle}>
        <ListFilterSelect
          paramKey="status"
          defaultValue="all"
          placeholder="Status"
          options={[
            { value: "all", label: t.admin.filterAllStatuses },
            { value: "published", label: t.admin.published },
            { value: "draft", label: t.admin.filterDraft },
          ]}
        />
        <ListFilterSelect
          paramKey="price"
          defaultValue="all"
          placeholder="Harga"
          options={[
            { value: "all", label: t.admin.filterAllPrices },
            { value: "free", label: t.admin.filterPublic },
            { value: "paid", label: t.admin.filterPaid },
          ]}
        />
      </ListToolbar>
    </div>
  )
}
