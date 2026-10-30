"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type LearnBusyValue = {
  busy: boolean
  label: string | null
  /** Dipanggil pemutar saat aksi yang tidak boleh ditinggalkan sedang berjalan. */
  setBusy: (busy: boolean, label?: string | null) => void
}

const LearnBusyContext = createContext<LearnBusyValue>({
  busy: false,
  label: null,
  setBusy: () => {},
})

/**
 * Menandai bahwa pemutar sedang mengerjakan sesuatu yang **hangus bila
 * ditinggalkan** -- pengiriman kuis memakai satu jatah percobaan, dan layar
 * hasilnya tidak bisa dibuka ulang. Selama itu, daftar isi kursus dan panah
 * pindah pelajaran dikunci (STANDAR-UMPAN-BALIK-UI.md R16).
 *
 * Statusnya hidup di LearnShell karena pemicunya (pemutar) dan yang dikunci
 * (sidebar) adalah dua cabang berbeda di bawah shell yang sama.
 */
export function LearnBusyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ busy: boolean; label: string | null }>({
    busy: false,
    label: null,
  })

  const setBusy = useCallback((busy: boolean, label: string | null = null) => {
    setState({ busy, label })
  }, [])

  const value = useMemo(
    () => ({ busy: state.busy, label: state.label, setBusy }),
    [state.busy, state.label, setBusy]
  )

  return <LearnBusyContext.Provider value={value}>{children}</LearnBusyContext.Provider>
}

export function useLearnBusy() {
  return useContext(LearnBusyContext)
}
