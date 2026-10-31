import { BookOpen, ClipboardCheck, Star, Users } from "lucide-react"

import { StatCard } from "@/components/admin/StatCard"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { completionPct, type MentorOverviewRow } from "@/lib/mentors-server"

/**
 * Angka-angka di sini sengaja berpasangan dengan jumlah data yang
 * mendasarinya: "100% dari 1 pendaftaran" dan "100% dari 200" adalah dua
 * kenyataan yang sangat berbeda, dan satu persen telanjang menyamarkan itu
 * (docs/STANDAR-PERAN.md §4).
 *
 * Tabel ini juga tidak diurutkan menurut skor apa pun dan tidak memberi
 * peringkat: mentor dengan satu kursus sulit untuk tiga peserta tidak
 * sebanding dengan mentor berisi lima kursus pengantar untuk dua ratus orang.
 */
export function MentorOverview({ mentors }: { mentors: MentorOverviewRow[] }) {
  const totalPublished = mentors.reduce((n, m) => n + m.coursesPublished, 0)
  const totalLearners = mentors.reduce((n, m) => n + m.learners, 0)
  const totalPending = mentors.reduce((n, m) => n + m.pendingReviews, 0)

  const rated = mentors.filter((m) => m.avgRating !== null && m.ratingCount > 0)
  const ratingWeight = rated.reduce((n, m) => n + m.ratingCount, 0)
  const avgRating =
    ratingWeight > 0
      ? rated.reduce((n, m) => n + (m.avgRating ?? 0) * m.ratingCount, 0) / ratingWeight
      : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] font-bold">Mentor</h1>
        <p className="text-sm text-muted-foreground">
          Kinerja tiap mentor berdampingan. Angka ini untuk membantu mereka, bukan memeringkat.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Mentor" value={mentors.length} />
        <StatCard icon={BookOpen} label="Kursus Terbit" value={totalPublished} />
        <StatCard icon={Users} label="Peserta Dijangkau" value={totalLearners} />
        <StatCard
          icon={ClipboardCheck}
          label="Esai Menunggu Dinilai"
          value={totalPending}
          hint={totalPending === 0 ? "Tidak ada tunggakan" : "Peserta sedang menunggu"}
        />
      </div>

      {mentors.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold">Belum ada mentor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seseorang menjadi mentor ketika perannya diubah menjadi mentor. Setelah itu ia
            dapat menyusun dan mengelola kursusnya sendiri.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel="Kinerja mentor, dapat digulir mendatar">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Mentor</TableHead>
                <TableHead>Kursus</TableHead>
                <TableHead>Peserta</TableHead>
                <TableHead>Penyelesaian</TableHead>
                <TableHead>Ulasan</TableHead>
                <TableHead>Menunggu dinilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map((m) => {
                const pct = completionPct(m)
                return (
                  <TableRow key={m.mentorId} className="text-[14px]">
                    <TableCell>
                      <div className="font-semibold">{m.fullName}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.coursesPublished} terbit
                      <span className="block text-xs">dari {m.coursesTotal} kursus</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.learners}
                      <span className="block text-xs">{m.enrollments} pendaftaran</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* Tanda pisah, bukan 0%: belum ada pendaftaran bukan berarti gagal. */}
                      {pct === null ? "—" : `${pct}%`}
                      <span className="block text-xs">
                        {pct === null
                          ? "belum ada pendaftaran"
                          : `${m.completed} dari ${m.enrollments}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.avgRating === null ? (
                        "—"
                      ) : (
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5 fill-current text-amber-500" aria-hidden />
                          {m.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span className="block text-xs">
                        {m.ratingCount === 0
                          ? "belum ada ulasan"
                          : `${m.ratingCount} ulasan`}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.pendingReviews}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {avgRating !== null && (
        <p className="mt-4 text-xs text-muted-foreground">
          Rata-rata ulasan seluruh mentor: {avgRating.toFixed(1)} dari {ratingWeight} ulasan.
        </p>
      )}
    </div>
  )
}
