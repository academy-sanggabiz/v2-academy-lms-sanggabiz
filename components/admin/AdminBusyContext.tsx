"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

type AdminBusyValue = {
  /** Ada aksi yang sedang menguasai seluruh layar admin. */
  busy: boolean
  label: string | null
  setBusy: (busy: boolean, label?: string | null) => void
}

const AdminBusyContext = createContext<AdminBusyValue>({
  busy: false,
  label: null,
  setBusy: () => {},
})

/**
 * Untuk aksi yang **berakhir dengan perpindahan halaman**: selama aksi berjalan
 * seluruh kerangka admin dikunci dan isinya diganti kerangka halaman tujuan.
 *
 * Alasannya bukan sekadar estetika. "Buat Kursus" menulis baris lebih dulu lalu
 * berpindah; kalau admin mengklik menu lain di tengahnya, perpindahannya batal
 * sementara barisnya sudah ada, sehingga terlihat gagal dan draf kosong
 * menumpuk setiap kali dicoba lagi (STANDAR-UMPAN-BALIK-UI.md R21).
 */
/** Pelepas paksa bila aksinya tidak pernah selesai (jaringan menggantung). */
const MAX_BUSY_MS = 20000

export function AdminBusyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [state, setState] = useState<{ busy: boolean; label: string | null }>({
    busy: false,
    label: null,
  })
  const [lastPathname, setLastPathname] = useState(pathname)

  /*
   * Layout admin dipakai bersama seluruh rute /admin, jadi berpindah halaman
   * TIDAK me-mount ulang provider ini. Tanpa pelepasan eksplisit di sini,
   * overlay yang dinyalakan sebelum navigasi akan menutupi halaman tujuan
   * selamanya -- halamannya termuat, tetapi tertutup dan `inert`.
   *
   * Disetel saat render (bukan di useEffect) supaya tidak ada satu frame pun
   * halaman tujuan tampil masih tertutup, dan agar lolos lint React Compiler.
   */
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    if (state.busy) setState({ busy: false, label: null })
  }

  const setBusy = useCallback((busy: boolean, label: string | null = null) => {
    setState({ busy, label })
  }, [])

  /*
   * Jaring pengaman terakhir: layar yang terkunci penuh adalah kegagalan yang
   * paling terasa seperti "aplikasi mati", jadi ia tidak boleh bisa menggantung
   * tanpa batas kalau aksinya tidak pernah selesai.
   */
  useEffect(() => {
    if (!state.busy) return
    const timer = setTimeout(() => setState({ busy: false, label: null }), MAX_BUSY_MS)
    return () => clearTimeout(timer)
  }, [state.busy])

  const value = useMemo(
    () => ({ busy: state.busy, label: state.label, setBusy }),
    [state.busy, state.label, setBusy]
  )

  return <AdminBusyContext.Provider value={value}>{children}</AdminBusyContext.Provider>
}

export function useAdminBusy() {
  return useContext(AdminBusyContext)
}
