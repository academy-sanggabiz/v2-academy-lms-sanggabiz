"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ListTree, X } from "lucide-react"
import { Toaster } from "sonner"

import { cn } from "@/lib/utils"
import { BusyRegion } from "@/components/ui/busy-region"
import { LearnBusyProvider, useLearnBusy } from "@/components/learn/LearnBusyContext"

/**
 * Layout of the full-screen player: header, lesson pane and the course-content
 * sidebar. On wide screens the sidebar sits beside the lesson; below `lg` it
 * becomes a drawer opened from the header, so the lesson reflows to the full
 * width of a phone instead of being squeezed next to a 360px column
 * (WCAG 1.4.10 reflow, DL standard "mobile is not a smaller desktop").
 */
export function LearnShell(props: { header: ReactNode; pane: ReactNode; sidebar: ReactNode }) {
  return (
    <LearnBusyProvider>
      <LearnShellInner {...props} />
    </LearnBusyProvider>
  )
}

function LearnShellInner({
  header,
  pane,
  sidebar,
}: {
  header: ReactNode
  pane: ReactNode
  sidebar: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { busy, label } = useLearnBusy()

  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/*
       * Pemutar hidup di luar pohon /learner, jadi ia tidak mewarisi Toaster
       * milik LearnerShell. Tanpa baris ini setiap toast di dalam pemutar --
       * termasuk konfirmasi ulasan kursus -- tidak merender apa pun.
       */}
      <Toaster richColors position="top-right" />

      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-5">
        {header}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          disabled={busy}
          aria-controls="course-content"
          aria-expanded={drawerOpen}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-input px-3 text-sm font-semibold hover:bg-muted disabled:opacity-50 lg:hidden"
        >
          <ListTree className="size-4" aria-hidden />
          <span className="hidden sm:inline">Isi kursus</span>
          <span className="sr-only sm:hidden">Isi kursus</span>
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 outline-none">
          {pane}
        </main>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
        )}
        <div
          id="course-content"
          className={cn(
            "z-50 flex flex-col bg-card",
            "fixed inset-y-0 right-0 w-[min(360px,90vw)] shadow-xl transition-transform lg:static lg:w-[360px] lg:translate-x-0 lg:shadow-none",
            // `invisible` keeps the closed drawer out of the tab order on small
            // screens; lg:visible restores the always-open column.
            drawerOpen ? "visible translate-x-0" : "invisible translate-x-full lg:visible"
          )}
        >
          <div className="flex items-center justify-end border-b border-muted p-2 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Tutup isi kursus</span>
            </button>
          </div>
          {/*
           * Dikunci selama pemutar mengerjakan aksi yang hangus bila
           * ditinggalkan: berpindah pelajaran saat kuis sedang dinilai
           * memakai jatah percobaan tanpa peserta pernah melihat hasilnya.
           * Tombol pemicunya ada di pane, bukan di sini, jadi aman memakai
           * `inert` (R18).
           */}
          <BusyRegion
            busy={busy}
            label={label ?? "Memproses…"}
            showOverlay={false}
            className="flex min-h-0 flex-1 flex-col"
            contentClassName="flex min-h-0 flex-1 flex-col"
          >
            {sidebar}
          </BusyRegion>
        </div>
      </div>
    </div>
  )
}
