"use client"

import { createContext, useContext, useMemo, useState } from "react"

const DEFAULT_BLOCK_MESSAGE = "Ada perubahan yang belum disimpan. Tinggalkan tanpa menyimpan?"

type NavigationBlockerValue = {
  isBlocked: boolean
  setIsBlocked: (blocked: boolean) => void
  /** Pesan konfirmasi yang dipakai saat pengguna mencoba pergi. */
  blockMessage: string
  /**
   * Mengganti pesan baku. Dipakai ketika alasannya bukan "belum disimpan" --
   * misalnya penyimpanan justru sedang berjalan, sehingga pesan baku berbohong
   * kepada pengguna (STANDAR-UMPAN-BALIK-UI.md R16).
   */
  setBlockMessage: (message: string | null) => void
}

const NavigationBlockerContext = createContext<NavigationBlockerValue | null>(null)

export function NavigationBlockerProvider({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const value = useMemo(
    () => ({
      isBlocked,
      setIsBlocked,
      blockMessage: message ?? DEFAULT_BLOCK_MESSAGE,
      setBlockMessage: setMessage,
    }),
    [isBlocked, message]
  )

  return (
    <NavigationBlockerContext.Provider value={value}>{children}</NavigationBlockerContext.Provider>
  )
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext)
  if (!context) {
    throw new Error("useNavigationBlocker must be used within a NavigationBlockerProvider")
  }
  return context
}
