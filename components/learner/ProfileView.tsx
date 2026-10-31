"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { ArrowLeft, Award, BookOpen, Calendar, CheckCircle2, Clock, Download, Mail, Pencil, Camera} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { updateProfile } from "@/app/learner/profile/actions"
import { uploadAvatar } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import type { EnrolledCourseSummary } from "@/lib/enrollments-server"
import type { LearnerCertificateSummary } from "@/lib/certificates-server"
import { useI18n } from "@/components/i18n/LocaleProvider"

type ProfileViewProps = {
  name: string
  email: string
  joinedYear: number
  enrolledCourses: EnrolledCourseSummary[]
  certificates: LearnerCertificateSummary[]
  initialTab?: "enrolled" | "certificates"
  avatarUrl: string | null
  certificateName: string
  phone: string
  organization: string
}

export function ProfileView({
  name,
  email,
  joinedYear,
  enrolledCourses,
  certificates,
  initialTab = "enrolled",
  avatarUrl,
  certificateName,
  phone,
  organization,
}: ProfileViewProps) {
  const { t } = useI18n()
  const [isEditing, setIsEditing] = useState(false)
  const initial = name.charAt(0).toUpperCase()

  if (isEditing) {
    return (
      <EditProfileForm
        name={name}
        email={email}
        initial={initial}
        avatarUrl={avatarUrl}
        certificateName={certificateName}
        phone={phone}
        organization={organization}
        onDone={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-6 rounded-2xl border border-border bg-gradient-to-br from-[#e3f4f7] to-[#e8f1fc] p-8">
        <div className="relative flex-none">
          {/* Foto profil bersifat dekoratif: namanya sudah tertulis di
              sebelahnya, jadi alt kosong mencegah pembaca layar membacanya
              dua kali. */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-[100px] rounded-full border-4 border-white object-cover shadow-[0_4px_14px_rgba(20,55,64,0.12)]"
            />
          ) : (
            <div className="flex size-[100px] items-center justify-center rounded-full border-4 border-white bg-brand-gradient text-4xl font-semibold text-white uppercase shadow-[0_4px_14px_rgba(20,55,64,0.12)]">
              {initial}
            </div>
          )}
          <button
            onClick={() => setIsEditing(true)}
            title={t.profile.edit}
            aria-label={t.profile.edit}
            className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_2px_8px_rgba(20,55,64,0.15)] hover:bg-muted"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold">{name}</div>
          <div className="mt-2.5 flex flex-col gap-1.5 text-[13.5px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="size-3.5 text-ring" />
              {email}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="size-3.5 text-ring" />
              {t.profile.joinedSince} {joinedYear}
            </span>
          </div>
        </div>
      </div>

      <ProfileTabs enrolledCourses={enrolledCourses} certificates={certificates} initialTab={initialTab} />
    </div>
  )
}

function ProfileTabs({
  enrolledCourses,
  certificates,
  initialTab,
}: {
  enrolledCourses: EnrolledCourseSummary[]
  certificates: LearnerCertificateSummary[]
  initialTab: "enrolled" | "certificates"
}) {
  const { t } = useI18n()
  const [tab, setTab] = useState<"enrolled" | "certificates">(initialTab)

  return (
    <div>
      <div className="mb-6 flex justify-center gap-1.5 rounded-lg bg-muted p-1">
        {(["enrolled", "certificates"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-card text-ring shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "enrolled" ? t.profile.enrolledCourses : t.profile.certificates}
          </button>
        ))}
      </div>

      {tab === "enrolled" ? (
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-4 flex items-center gap-2.5 text-lg font-bold">
            <BookOpen className="size-[18px]" />
            {t.profile.enrolledCourses} ({enrolledCourses.length})
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="flex flex-col gap-3">
              {enrolledCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn/${course.id}`}
                  className="flex items-center gap-3.5 rounded-xl border border-border p-3 hover:border-ring/40 hover:bg-muted/40"
                >
                  <div className="course-thumb-placeholder h-[52px] w-[72px] flex-none rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13.5px] leading-snug font-semibold">
                      {course.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {course.lesson_count} pelajaran · {course.duration_hours} jam
                    </div>
                  </div>
                  {course.status === "completed" && (
                    <span className="flex flex-none items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="size-3.5" />
                      Selesai
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-7 text-center">
              <p className="text-sm text-muted-foreground">{t.courses.noneEnrolled}</p>
              <Button className="bg-brand-gradient text-white hover:brightness-105" render={<Link href="/learner/courses" />} nativeButton={false}>
                Lihat Kursus
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-4 flex items-center gap-2.5 text-lg font-bold">
            <Award className="size-[18px]" />
            {t.profile.certificates} ({certificates.length})
          </div>

          {certificates.length > 0 ? (
            <div className="flex flex-col gap-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-3.5 rounded-xl border border-border p-3.5"
                >
                  <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-brand-gradient text-white">
                    <Award className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13.5px] leading-snug font-semibold">
                      {cert.courseTitle}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Sertifikat No. {cert.serial} · Terbit{" "}
                      {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  {/*
                    Tidak ada lagi gerbang ulasan di sini. Sertifikat yang sudah
                    terbit adalah milik peserta; menahan unduhannya sampai ia
                    menulis ulasan menaruh hadiah di balik permintaan yang tidak
                    ada hubungannya dengan belajar -- dark pattern obstruksi yang
                    dilarang STANDAR-DIGITAL-LEARNING §6 dan §17. Gerbang itu
                    sudah dicabut dari layar penyelesaian pelajaran, tapi
                    tertinggal di sini sehingga peserta tetap terkunci.
                    Ulasan tetap ditawarkan, sebagai pilihan, di layar itu.
                  */}
                  {cert.pdfUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      render={<a href={cert.pdfUrl} download target="_blank" rel="noopener noreferrer" />}
                      nativeButton={false}
                    >
                      <Download className="size-3.5" />
                      {t.profile.download}
                    </Button>
                  ) : (
                    <span className="flex-none text-xs text-muted-foreground">{t.profile.certificateBeingMade}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-7 text-center">
              <Award className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
              {/* Tidak semua kursus menerbitkan sertifikat, jadi "selesaikan
                  kursus" saja keliru bagi peserta yang sudah menyelesaikan
                  satu kursus tanpa sertifikat. */}
              <p className="text-sm text-muted-foreground">
{t.profile.noCertificates}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditProfileForm({
  name,
  email,
  initial,
  avatarUrl,
  certificateName,
  phone,
  organization,
  onDone,
}: {
  name: string
  email: string
  initial: string
  avatarUrl: string | null
  certificateName: string
  phone: string
  organization: string
  onDone: () => void
}) {
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [photo, setPhoto] = useState(avatarUrl ?? "")
  const [photoStatus, setPhotoStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handlePhoto(file: File) {
    setPhotoStatus(null)
    setUploading(true)
    const supabase = createClient()
    const { data } = await supabase.auth.getClaims()
    const result = await uploadAvatar(file, (data?.claims?.sub as string) ?? "")
    setUploading(false)
    if ("error" in result) {
      setPhotoStatus(result.error)
      return
    }
    setPhoto(result.url)
    setPhotoStatus(t.profile.photoReady)
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3.5">
        <button
          onClick={onDone}
          title={t.profile.backToProfile}
          aria-label={t.profile.backToProfile}
          className="flex size-9 flex-none items-center justify-center rounded-lg border border-border bg-card hover:bg-muted"
        >
          <ArrowLeft className="size-[17px]" />
        </button>
        <div className="text-2xl font-bold">{t.profile.editTitle}</div>
      </div>

      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await updateProfile(formData)
            if (result?.error) {
              setError(result.error)
              return
            }
            // Kembali ke tampilan profil tidak cukup terbaca sebagai
            // keberhasilan, jadi satu toast menutup aksi ini (R6).
            toast.success(t.profile.saved)
            onDone()
          })
        }}
        className="max-w-[560px] rounded-2xl border border-border bg-card p-7"
      >
        <input type="hidden" name="avatarUrl" value={photo} />
        <div className="mb-5 flex items-center gap-5">
          {photo ? (
            <img
              src={photo}
              alt=""
              className="size-[72px] flex-none rounded-full border-2 border-[#e3f4f7] object-cover"
            />
          ) : (
            <div className="flex size-[72px] flex-none items-center justify-center rounded-full border-2 border-[#e3f4f7] bg-brand-gradient text-2xl font-semibold text-white uppercase">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            {/* Label membungkus input berkas: <input type="file"> polos sulit
                diberi gaya, tetapi menyembunyikannya di balik tombol yang bukan
                kontrol asli akan menghilangkan fokus papan ketik. Pola ini
                menjaga inputnya tetap nyata dan tetap bisa difokus. */}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Camera className="size-4" aria-hidden />
              {uploading ? t.profile.uploading : photo ? t.profile.changePhoto : t.profile.uploadPhoto}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handlePhoto(file)
                  event.target.value = ""
                }}
              />
            </label>
            {photo && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-2"
                onClick={() => {
                  setPhoto("")
                  setPhotoStatus(t.profile.photoRemoved)
                }}
              >
                {t.profile.removePhoto}
              </Button>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{t.profile.photoHint}</p>
            <p role="status" aria-live="polite" className="mt-1 min-h-4 text-xs text-muted-foreground">
              {photoStatus}
            </p>
          </div>
        </div>

        <Label htmlFor="fullName" className="mb-2 block text-sm font-semibold">
          {t.profile.name}
        </Label>
        <Input id="fullName" name="fullName" defaultValue={name} autoComplete="name" className="w-full" />

        <p className="mt-1.5 mb-4 text-xs text-muted-foreground">
          {t.profile.nameHint}
        </p>

        <Label htmlFor="certificateName" className="mb-2 block text-sm font-semibold">
          {t.profile.certificateName}{" "}
          <span className="font-normal text-muted-foreground">({t.common.optional})</span>
        </Label>
        <Input
          id="certificateName"
          name="certificateName"
          defaultValue={certificateName}
          autoComplete="name"
          placeholder={name}
          className="w-full"
        />
        {/* Dipisahkan dari nama panggilan dengan sengaja: sertifikat yang dipakai
            melamar kerja perlu nama yang cocok dengan identitas resmi, sementara
            antarmuka sebaiknya memanggil orang dengan nama yang ia pakai
            sehari-hari (docs/STANDAR-PROFIL-PESERTA.md §3). */}
        <p className="mt-1.5 mb-4 text-xs text-muted-foreground">
{t.profile.certificateNameHint}
        </p>

        <Label htmlFor="organization" className="mb-2 block text-sm font-semibold">
          {t.profile.organization}{" "}
          <span className="font-normal text-muted-foreground">({t.common.optional})</span>
        </Label>
        <Input
          id="organization"
          name="organization"
          defaultValue={organization}
          autoComplete="organization"
          className="w-full"
        />
        <p className="mt-1.5 mb-4 text-xs text-muted-foreground">
          {t.profile.organizationHint}
        </p>

        <Label htmlFor="phone" className="mb-2 block text-sm font-semibold">
          {t.profile.phone}{" "}
          <span className="font-normal text-muted-foreground">({t.common.optional})</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={phone}
          autoComplete="tel"
          className="w-full"
        />
        <p className="mt-1.5 mb-4 text-xs text-muted-foreground">
{t.profile.phoneHint}
        </p>

        <Label htmlFor="email" className="mb-2 block text-sm font-semibold">
          {t.auth.email}
        </Label>
        <Input id="email" value={email} disabled autoComplete="email" className="w-full bg-muted" />
        <p className="mt-1.5 mb-4 text-xs text-muted-foreground">{t.profile.emailLocked}</p>

        <StatusMessage className="mb-4">{error}</StatusMessage>

        <div className="flex gap-3">
          <Button
            type="submit"
            pending={isPending}
            pendingLabel={t.common.saving}
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            {t.profile.saveChanges}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </div>
  )
}
