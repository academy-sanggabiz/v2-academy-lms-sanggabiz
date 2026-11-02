import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { LearnerDifficulty as Row } from "@/lib/insight-server"

/**
 * Pertanyaannya saja, sebagai teks biasa.
 *
 * Mengambil paragraf pertama, bukan seluruh isi soal: daftar ringkas seperti
 * ini dipakai untuk mengenali soal mana yang dimaksud, dan soal lengkapnya
 * ada satu klik di pelajarannya. Satu kalimat per baris juga membuat daftar
 * yang panjang tetap bisa dipindai.
 *
 * Kebetulan ini ikut menutupi satu cacat data: pengurai impor .md pernah
 * menyelipkan potongan penjelasan ke dalam teks soal sebagai `<blockquote>`.
 * Cacat itu tetap harus diperbaiki di sumbernya -- menyembunyikannya di satu
 * layar bukan perbaikan.
 */
function pertanyaan(html: string): string {
  const paragrafPertama = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const sumber = paragrafPertama ? paragrafPertama[1] : html
  return sumber.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Di mana satu peserta tersangkut, dan apa yang bisa dilakukan untuknya.
 *
 * Tiga keputusan yang membuat layar ini berguna, bukan sekadar berisi angka:
 *
 * 1. **Tiap baris menautkan ke pelajaran yang mengajarkan soal itu.** Angka
 *    kesulitan tanpa jalan kembali ke materinya hanya memberi tahu pengajar
 *    bahwa ada masalah, bukan apa yang harus dilakukan.
 * 2. **Yang belum dikuasai didahulukan.** Soal yang sempat salah lalu akhirnya
 *    benar tetap ditampilkan -- ia menunjukkan bagian yang berat -- tetapi
 *    tidak lagi menuntut tindakan, jadi ia turun ke bawah dan ditandai.
 * 3. **Angka ditulis sebagai "salah 6 dari 7", bukan "86%".** Persentase dari
 *    tujuh percobaan terbaca semeyakinkan persentase dari tujuh ratus;
 *    pecahannya menunjukkan sendiri kapan angkanya belum berarti.
 */
export function LearnerDifficulty({ rows, courseId }: { rows: Row[]; courseId: string }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Titik kesulitan</h2>
        <p className="text-sm text-muted-foreground">
          Belum ada soal yang dijawab salah. Titik kesulitan muncul di sini setelah peserta
          mengerjakan kuis.
        </p>
      </section>
    )
  }

  const belumDikuasai = rows.filter((r) => !r.akhirnyaBenar)

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold">Titik kesulitan</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {belumDikuasai.length > 0 ? (
          <>
            <strong>{belumDikuasai.length} soal</strong> masih belum dikuasai. Tiap baris menautkan
            ke pelajaran yang mengajarkannya.
          </>
        ) : (
          <>Semua soal yang sempat salah akhirnya dijawab benar.</>
        )}
      </p>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.questionId}
            className={cn(
              "rounded-xl border p-3",
              r.akhirnyaBenar ? "border-border bg-muted/20" : "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className="flex items-start gap-2.5">
              {r.akhirnyaBenar ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm">{pertanyaan(r.prompt)}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className={cn("font-semibold", !r.akhirnyaBenar && "text-destructive")}>
                    Salah {r.salah} dari {r.dijawab} kali
                  </span>
                  {r.akhirnyaBenar && " · akhirnya dijawab benar"}
                  {" · "}
                  {r.sectionTitle}
                </p>
                {/*
                  Tautan ke pelajarannya, bukan ke soalnya: yang perlu dibuka
                  ulang peserta adalah materi yang mengajarkannya.
                */}
                <Link
                  href={`/admin/courses/preview/${courseId}?lesson=${r.lessonId}`}
                  className="mt-1.5 inline-block text-xs font-semibold text-ring underline-offset-2 hover:underline"
                >
                  Buka pelajaran: {r.lessonTitle}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
