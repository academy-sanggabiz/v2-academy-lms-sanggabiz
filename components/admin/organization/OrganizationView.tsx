"use client"

import { Plus, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  assignJobTitleAction,
  createDepartmentAction,
  createJobTitleAction,
  deleteDepartmentAction,
  deleteJobTitleAction,
  removeJobCourseAction,
  setJobCourseAction,
} from "@/app/admin/organization/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { Department, JobCourse, JobTitle, Requirement } from "@/lib/org"
import type { PesertaJabatan } from "@/lib/org-server"

type Kursus = { id: string; title: string }

/**
 * Layar struktur organisasi: departemen, jabatan, jalur kursus, dan siapa
 * memegang jabatan apa.
 *
 * **Satu layar, bukan empat.** Keempat hal ini hanya berguna bersama-sama:
 * jabatan tanpa kursus tidak mengubah apa pun, dan kursus wajib tanpa orang
 * yang memegang jabatannya juga tidak. Memisahkannya memaksa penyusun bolak-
 * balik untuk satu pekerjaan yang sebenarnya satu.
 *
 * **Kalimat tujuan ditampilkan di tempat jabatan terlihat** (STANDAR-PROFIL-
 * PESERTA P4): mengumpulkan jabatan orang tanpa menyebutkan untuk apa adalah
 * pengumpulan data yang tidak dijelaskan.
 */
export function OrganizationView({
  departments,
  jobTitles,
  jobCourses,
  learners,
  courses,
}: {
  departments: Department[]
  jobTitles: JobTitle[]
  jobCourses: Record<string, JobCourse[]>
  learners: PesertaJabatan[]
  courses: Kursus[]
}) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [deptBaru, setDeptBaru] = useState("")
  const [jabatanBaru, setJabatanBaru] = useState("")
  const [jabatanDept, setJabatanDept] = useState("")
  const [terpilih, setTerpilih] = useState<string | null>(jobTitles[0]?.id ?? null)

  const judulKursus = new Map(courses.map((c) => [c.id, c.title]))
  const jalur = terpilih ? (jobCourses[terpilih] ?? []) : []

  function jalankan(fn: () => Promise<{ ok: boolean; error?: string }>, pesan?: string) {
    startTransition(async () => {
      const hasil = await fn()
      if (!hasil.ok) return void toast.error(hasil.error ?? "Gagal")
      toast.success(pesan ?? t.admin.orgSaved)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.orgTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.admin.orgSubtitle}</p>
      </div>

      <p className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
        {t.admin.orgPurpose}
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Departemen */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold">{t.admin.orgDepartments}</h2>
          <ul className="mb-4 space-y-1.5">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-lg border border-border py-1 pr-1 pl-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                {/*
                  Jumlahnya di samping namanya, bukan hanya di dialog
                  konfirmasi: akibat yang baru terbaca setelah menekan tombol
                  bukan pilihan yang pernah benar-benar ditawarkan.
                */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t.admin.orgJobTitleCount.replace("{n}", String(d.jobTitleCount))}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={t.admin.orgDeleteDepartment.replace("{nama}", d.name)}
                  onClick={() => {
                    if (
                      !window.confirm(
                        t.admin.orgConfirmDeleteDepartment
                          .replace("{nama}", d.name)
                          .replace("{n}", String(d.jobTitleCount))
                      )
                    )
                      return
                    jalankan(() => deleteDepartmentAction(d.id), t.admin.orgDeleted)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
            {departments.length === 0 && (
              <li className="text-sm text-muted-foreground">—</li>
            )}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1 space-y-1.5">
              <Label htmlFor="dept-baru">{t.admin.orgDepartmentName}</Label>
              <Input
                id="dept-baru"
                value={deptBaru}
                disabled={pending}
                onChange={(e) => setDeptBaru(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={pending || !deptBaru.trim()}
              pending={pending}
              pendingLabel={t.common.saving}
              onClick={() =>
                jalankan(async () => {
                  const r = await createDepartmentAction(deptBaru)
                  if (r.ok) setDeptBaru("")
                  return r
                })
              }
            >
              <Plus className="size-4" aria-hidden />
              {t.admin.orgAddDepartment}
            </Button>
          </div>
        </section>

        {/* Jabatan */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold">{t.admin.orgJobTitles}</h2>
          <ul className="mb-4 space-y-1.5">
            {jobTitles.map((j) => (
              <li key={j.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTerpilih(j.id)}
                  aria-pressed={terpilih === j.id}
                  className={
                    terpilih === j.id
                      ? "flex min-h-9 flex-1 items-center justify-between gap-2 rounded-lg border border-ring bg-secondary px-3 text-sm font-semibold text-primary"
                      : "flex min-h-9 flex-1 items-center justify-between gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted"
                  }
                >
                  <span className="min-w-0 truncate">{j.name}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {t.admin.orgPeopleCount.replace("{n}", String(j.peopleCount))} ·{" "}
                    {(jobCourses[j.id] ?? []).length}
                  </span>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={t.admin.orgDeleteJobTitle.replace("{nama}", j.name)}
                  onClick={() => {
                    if (
                      !window.confirm(
                        t.admin.orgConfirmDeleteJobTitle
                          .replace("{nama}", j.name)
                          .replace("{n}", String(j.peopleCount))
                      )
                    )
                      return
                    // Pilihan dilepas lebih dulu: panel ruas di bawah menunjuk
                    // jabatan yang sebentar lagi tidak ada.
                    if (terpilih === j.id) setTerpilih(null)
                    jalankan(() => deleteJobTitleAction(j.id), t.admin.orgDeleted)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
            {jobTitles.length === 0 && (
              <li className="text-sm text-muted-foreground">{t.admin.orgEmpty}</li>
            )}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[160px] flex-1 space-y-1.5">
              <Label htmlFor="jabatan-baru">{t.admin.orgJobTitleName}</Label>
              <Input
                id="jabatan-baru"
                value={jabatanBaru}
                disabled={pending}
                onChange={(e) => setJabatanBaru(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jabatan-dept">{t.admin.orgDepartments}</Label>
              <select
                id="jabatan-dept"
                value={jabatanDept}
                disabled={pending}
                onChange={(e) => setJabatanDept(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
              >
                <option value="">{t.admin.orgNoDepartment}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              disabled={pending || !jabatanBaru.trim()}
              pending={pending}
              pendingLabel={t.common.saving}
              onClick={() =>
                jalankan(async () => {
                  const r = await createJobTitleAction(jabatanBaru, jabatanDept || null)
                  if (r.ok) setJabatanBaru("")
                  return r
                })
              }
            >
              <Plus className="size-4" aria-hidden />
              {t.admin.orgAddJobTitle}
            </Button>
          </div>
        </section>
      </div>

      {/* Jalur kursus untuk jabatan terpilih */}
      {terpilih && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold">
            {t.admin.orgCourses} — {jobTitles.find((j) => j.id === terpilih)?.name}
          </h2>

          <ul className="mb-4 space-y-2">
            {jalur.map((jc) => (
              <li
                key={jc.courseId}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {judulKursus.get(jc.courseId) ?? jc.courseId}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold">
                  {jc.requirement === "wajib"
                    ? t.dashboard.jobRequired
                    : t.dashboard.jobSuggested}
                </span>
                {jc.dueDays !== null && (
                  <span className="text-xs text-muted-foreground">{jc.dueDays} hari</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={t.editor.deleteNamed.replace(
                    "{nama}",
                    judulKursus.get(jc.courseId) ?? ""
                  )}
                  onClick={() =>
                    jalankan(() => removeJobCourseAction(terpilih, jc.courseId))
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
            {jalur.length === 0 && (
              <li className="text-sm text-muted-foreground">{t.admin.orgNoCourses}</li>
            )}
          </ul>

          <TambahKursus
            jobTitleId={terpilih}
            courses={courses.filter((c) => !jalur.some((j) => j.courseId === c.id))}
            pending={pending}
            onSubmit={(courseId, req, due) =>
              jalankan(() => setJobCourseAction(terpilih, courseId, req, due))
            }
          />
        </section>
      )}

      {/* Siapa memegang jabatan apa */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-bold">{t.admin.orgPeople}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{t.admin.orgPeople}</th>
                <th className="py-2 pr-3 font-medium">{t.admin.orgJobTitles}</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((l) => (
                <tr key={l.id} className="border-b border-muted">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.email}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <label className="sr-only" htmlFor={`jabatan-${l.id}`}>
                      {t.admin.orgAssignFor.replace("{nama}", l.name)}
                    </label>
                    <select
                      id={`jabatan-${l.id}`}
                      defaultValue={l.jobTitleId ?? ""}
                      disabled={pending}
                      onChange={(e) => {
                        const jid = e.target.value || null
                        const dept =
                          jobTitles.find((j) => j.id === jid)?.departmentId ?? null
                        jalankan(() => assignJobTitleAction(l.id, jid, dept))
                      }}
                      className="flex h-9 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      <option value="">{t.admin.orgSelectJobTitle}</option>
                      {jobTitles.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/** Satu baris tambah: kursus, status wajib/disarankan, dan tenggat opsional. */
function TambahKursus({
  jobTitleId,
  courses,
  pending,
  onSubmit,
}: {
  jobTitleId: string
  courses: Kursus[]
  pending: boolean
  onSubmit: (courseId: string, requirement: Requirement, dueDays: number | null) => void
}) {
  const { t } = useI18n()
  const [courseId, setCourseId] = useState("")
  const [req, setReq] = useState<Requirement>("wajib")
  const [due, setDue] = useState("")

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <Label htmlFor={`kursus-${jobTitleId}`}>{t.admin.orgSelectCourse}</Label>
        <select
          id={`kursus-${jobTitleId}`}
          value={courseId}
          disabled={pending}
          onChange={(e) => setCourseId(e.target.value)}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
        >
          <option value="">{t.admin.orgSelectCourse}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`req-${jobTitleId}`}>{t.admin.orgRequirement}</Label>
        <select
          id={`req-${jobTitleId}`}
          value={req}
          disabled={pending}
          onChange={(e) => setReq(e.target.value as Requirement)}
          className="flex h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
        >
          <option value="wajib">{t.dashboard.jobRequired}</option>
          <option value="disarankan">{t.dashboard.jobSuggested}</option>
        </select>
      </div>
      <div className="w-[120px] space-y-1.5">
        <Label htmlFor={`due-${jobTitleId}`}>{t.admin.orgDueDays}</Label>
        <Input
          id={`due-${jobTitleId}`}
          value={due}
          disabled={pending}
          onChange={(e) => setDue(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button
        variant="outline"
        disabled={pending || !courseId}
        pending={pending}
        pendingLabel={t.common.saving}
        onClick={() => {
          onSubmit(courseId, req, due ? Number(due) : null)
          setCourseId("")
          setDue("")
        }}
      >
        <Plus className="size-4" aria-hidden />
        {t.admin.orgAddCourse}
      </Button>
    </div>
  )
}
