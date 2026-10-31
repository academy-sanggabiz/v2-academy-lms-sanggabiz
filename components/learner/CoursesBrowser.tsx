"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, ChevronDown, Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CourseGridCard } from "@/components/learner/CourseGridCard"
import type { Course } from "@/lib/courses"
import { useI18n } from "@/components/i18n/LocaleProvider"

type SortKey = "newest" | "title" | "price"

type SortLabelKey = "newest" | "title" | "priceLowest"

const sortOptions: { key: SortKey; labelKey: SortLabelKey }[] = [
  // Label diambil dari kamus lewat kunci: daftar ini di luar komponen.
  { key: "newest", labelKey: "newest" },
  { key: "title", labelKey: "title" },
  { key: "price", labelKey: "priceLowest" },
]

export function CoursesBrowser({
  courses,
  enrolledCourses,
  enrolledIds,
  completedIds,
  startedIds,
}: {
  /** Catalog: published + public only. Drives the All tab. */
  courses: Course[]
  /** Everything the learner is enrolled in, private courses included. */
  enrolledCourses: Course[]
  enrolledIds: string[]
  completedIds: string[]
  startedIds: string[]
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")

  const sortCourses = (list: Course[]) => {
    const sorted = [...list]
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title))
    if (sort === "price") sorted.sort((a, b) => a.price - b.price)
    if (sort === "newest")
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sorted
  }

  const visibleCourses = useMemo(() => {
    const filtered = courses.filter((c) =>
      c.title.toLowerCase().includes(query.trim().toLowerCase())
    )
    return sortCourses(filtered)
  }, [courses, query, sort])

  // Derived from enrolledCourses, NOT from the catalog: filtering `courses` by
  // enrolled ids drops private courses entirely, since they're absent from the
  // catalog by design.
  const enrolledList = useMemo(() => sortCourses(enrolledCourses), [enrolledCourses, sort])

  const completedList = useMemo(
    () => sortCourses(enrolledCourses.filter((c) => completedIds.includes(c.id))),
    [enrolledCourses, completedIds, sort]
  )

  const sortLabel = t.courses[sortOptions.find((o) => o.key === sort)?.labelKey ?? "newest"]

  return (
    <div className="space-y-5">
      <div className="flex gap-3.5">
        <Input
          placeholder={t.courses.searchPlaceholder}
          aria-label={t.courses.searchLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 flex-1 rounded-[10px] bg-card px-4"
        />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-11 items-center gap-2.5 rounded-[10px] border border-input bg-card px-4.5 text-sm font-medium hover:border-ring">
            <ArrowUpDown className="size-[15px]" />
            {sortLabel}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {sortOptions.map((o) => (
              <DropdownMenuItem key={o.key} onClick={() => setSort(o.key)}>
                <span className="flex size-4 items-center justify-center">
                  {sort === o.key && <Check className="size-3.5 text-ring" />}
                </span>
                {t.courses[o.labelKey]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mx-auto h-auto w-fit gap-1.5 rounded-[10px] bg-secondary p-1.5">
          <TabsTrigger value="all" className="h-9 rounded-lg px-4 data-active:bg-card">
            {t.courses.all}
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="h-9 rounded-lg px-4 data-active:bg-card">
            {t.courses.enrolled}
          </TabsTrigger>
          <TabsTrigger value="completed" className="h-9 rounded-lg px-4 data-active:bg-card">
            {t.courses.completed}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {visibleCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <CourseGridCard
                  key={course.id}
                  course={course}
                  enrolled={enrolledIds.includes(course.id)}
                  started={startedIds.includes(course.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={t.courses.noMatches} />
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="mt-6">
          {enrolledList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {enrolledList.map((course) => (
                <CourseGridCard key={course.id} course={course} enrolled started={startedIds.includes(course.id)} />
              ))}
            </div>
          ) : (
            <EmptyState message={t.courses.noneEnrolled} />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {completedList.map((course) => (
                <CourseGridCard key={course.id} course={course} enrolled started />
              ))}
            </div>
          ) : (
            <EmptyState message={t.courses.noneCompleted} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}
