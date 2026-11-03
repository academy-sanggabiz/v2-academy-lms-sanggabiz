"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Plus } from "lucide-react"
import { useI18n } from "@/components/i18n/LocaleProvider"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Course } from "@/lib/courses"
import type { Paginated } from "@/lib/pagination"
import type { AdminLearner } from "@/lib/learners-admin"
import { ListFilterSelect } from "@/components/admin/ListFilterSelect"
import { ListPagination } from "@/components/admin/ListPagination"
import { ListToolbar } from "@/components/admin/ListToolbar"

import { EnrollModal } from "./EnrollModal"

export function LearnerManagementClient({
  page,
  courses,
}: {
  page: Paginated<AdminLearner>
  courses: Course[]
}) {
  const { t } = useI18n()
  const [enrollTarget, setEnrollTarget] = useState<AdminLearner | null>(null)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t.admin.allLearners}</h2>
        <ListToolbar placeholder={t.admin.searchNameEmail}>
          <ListFilterSelect
            paramKey="filter"
            defaultValue="all"
            placeholder="Filter"
            options={[
              { value: "all", label: t.admin.allLearners },
              { value: "enrolled", label: t.admin.filterEnrolled },
              { value: "completed", label: t.admin.filterCompleted },
            ]}
          />
        </ListToolbar>
      </div>

      {page.rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t.admin.noLearnerMatches}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t.admin.colLearner}</TableHead>
                <TableHead>{t.admin.colEmail}</TableHead>
                <TableHead>{t.admin.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-ring text-sm font-semibold text-primary-foreground uppercase">
                        {l.initial}
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap">{l.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="size-[15px] shrink-0" />
                      <span className="truncate">{l.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/admin/learners/${l.id}`} />}
                        nativeButton={false}
                      >
                        Lihat Detail
                      </Button>
                      <Button size="sm" onClick={() => setEnrollTarget(l)}>
                        <Plus className="size-3.5" />
                        Daftarkan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ListPagination meta={page} />

      <EnrollModal
        learner={enrollTarget}
        courses={courses}
        onClose={() => setEnrollTarget(null)}
      />
    </div>
  )
}
