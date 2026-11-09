"use client"

import { Send } from "lucide-react"
import { useRef, useState, useTransition } from "react"

import { tanyaAsisten } from "@/app/learn/[courseId]/assistant-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { useI18n } from "@/components/i18n/LocaleProvider"

type Pesan = { role: "user" | "assistant"; content: string }

/**
 * Panel asisten di sidebar pemutar (F4).
 *
 * **Tab ini pernah ada di v2 lalu dihapus** karena hanya tampilan tanpa isi,
 * dan standar v2 memperlakukan kontrol yang tidak melakukan apa-apa sebagai
 * cacat. Sekarang kembali dengan backend sungguhan -- dan hanya dirender bila
 * AI benar-benar aktif, sehingga keadaan "tampil lalu gagal" tidak bisa
 * terjadi lagi.
 *
 * **Jawaban diumumkan lewat aria-live.** Jawaban yang muncul di panel samping
 * tanpa pengumuman tidak terdengar sama sekali oleh pengguna pembaca layar --
 * ia menekan "Tanya", lalu tidak ada apa pun yang memberi tahu bahwa
 * jawabannya sudah datang.
 */
export function LessonAssistant({
  courseId,
  lessonId,
  adaTranskrip,
  pratinjau,
}: {
  courseId: string
  lessonId: string
  /** Pelajaran video/slide tanpa transkrip: asisten mengatakan batasnya di depan. */
  adaTranskrip: boolean
  pratinjau?: boolean
}) {
  const { t } = useI18n()
  const [pesan, setPesan] = useState<Pesan[]>([])
  const [teks, setTeks] = useState("")
  const [galat, setGalat] = useState("")
  const [sisa, setSisa] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const akhir = useRef<HTMLDivElement>(null)

  function kirim(pertanyaan: string) {
    const isi = pertanyaan.trim()
    if (!isi || pending) return

    setGalat("")
    setTeks("")
    const riwayat = pesan
    setPesan([...riwayat, { role: "user", content: isi }])

    startTransition(async () => {
      const hasil = await tanyaAsisten(courseId, lessonId, isi, riwayat)
      if (!hasil.ok) {
        setGalat(hasil.error)
        // Pertanyaannya dikembalikan ke kolom, bukan hilang: mengetik ulang
        // setelah gagal adalah hukuman untuk kesalahan yang bukan miliknya.
        setTeks(isi)
        setPesan(riwayat)
        return
      }
      setPesan([...riwayat, { role: "user", content: isi }, { role: "assistant", content: hasil.jawaban }])
      setSisa(hasil.sisaHariIni)
      requestAnimationFrame(() => akhir.current?.scrollIntoView({ block: "end" }))
    })
  }

  const saran = [t.player.assistantSuggest1, t.player.assistantSuggest2, t.player.assistantSuggest3]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {pratinjau && (
          <p className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
            {t.player.assistantPreview}
          </p>
        )}

        {pesan.length === 0 && (
          <>
            <p className="text-sm text-muted-foreground">{t.player.assistantIntro}</p>
            {!adaTranskrip && (
              <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {t.player.assistantNoTranscript}
              </p>
            )}
            <ul className="mt-3 space-y-1.5">
              {saran.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => kirim(s)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/*
          Wilayah pengumuman selalu terpasang, bukan muncul bersama isinya:
          wilayah aria-live yang baru ada saat ada isinya sering tidak
          diumumkan (STANDAR-UMPAN-BALIK-UI R1).
        */}
        <div aria-live="polite" className="space-y-3">
          {pesan.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "rounded-xl bg-secondary px-3 py-2 text-sm"
                  : "rounded-xl border border-border px-3 py-2 text-sm"
              }
            >
              <p className="mb-1 text-xs font-semibold text-muted-foreground">
                {m.role === "user" ? t.player.assistantYou : t.player.assistantName}
              </p>
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          ))}
          {pending && (
            <p className="text-sm text-muted-foreground">{t.player.assistantWorking}</p>
          )}
        </div>

        <div ref={akhir} />
      </div>

      <div className="border-t border-muted px-5 py-3">
        <Label htmlFor="tanya-asisten" className="sr-only">
          {t.player.assistantLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            id="tanya-asisten"
            value={teks}
            disabled={pending}
            placeholder={t.player.assistantPlaceholder}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                kirim(teks)
              }
            }}
          />
          <Button
            disabled={pending || !teks.trim()}
            pending={pending}
            pendingLabel={t.player.assistantWorking}
            onClick={() => kirim(teks)}
            aria-label={t.player.assistantAsk}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>

        <StatusMessage className="mt-2">{galat}</StatusMessage>

        <p className="mt-2 text-xs text-muted-foreground">{t.player.assistantAiNote}</p>
        {sisa !== null && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t.player.assistantQuota.replace("{n}", String(sisa))}
          </p>
        )}
      </div>
    </div>
  )
}
