"use client"

import { createContext, useContext, useMemo } from "react"

type BusyGuardValue = {
  /** Ada proses tulis yang sedang berjalan di permukaan ini. */
  busy: boolean
  /** Apa yang sedang dikerjakan, untuk ditampilkan pada kontrol yang ikut terkunci. */
  reason: string | null
}

const BusyGuardContext = createContext<BusyGuardValue>({ busy: false, reason: null })

/**
 * Menandai bahwa satu permukaan (form, dialog, baris) sedang menulis ke server,
 * sehingga **kontrol lain** di permukaan yang sama ikut menolak klik.
 *
 * Ini pelengkap `pending` pada `<Button>`: `pending` menjaga tombol itu sendiri
 * dari klik ganda, sedangkan guard ini menjaga tombol *tetangganya* -- menekan
 * "Terbitkan" saat "Simpan Draf" masih berjalan mengirim dua tulisan untuk data
 * yang sama (STANDAR-UMPAN-BALIK-UI.md R14).
 *
 * Berbeda dari `<BusyRegion>`, guard ini tidak memakai `inert`: kontrolnya tetap
 * bisa difokus dan tetap terbaca screen reader, hanya kliknya yang ditolak (R11).
 */
function BusyGuardProvider({
  busy,
  reason = null,
  children,
}: {
  busy: boolean
  reason?: string | null
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ busy, reason }), [busy, reason])
  return <BusyGuardContext.Provider value={value}>{children}</BusyGuardContext.Provider>
}

/**
 * Dibaca oleh kontrol yang ingin ikut terkunci selama proses berjalan.
 * `ownPending` adalah proses milik kontrol itu sendiri; bila kontrol lain yang
 * sedang bekerja, kontrol ini hanya dikunci tanpa ikut menampilkan spinner.
 */
function useBusyGuard(ownPending = false) {
  const { busy, reason } = useContext(BusyGuardContext)
  return {
    /** Terkunci karena kontrol lain sedang bekerja. */
    lockedByOther: busy && !ownPending,
    busy,
    reason,
  }
}

export { BusyGuardProvider, useBusyGuard }
