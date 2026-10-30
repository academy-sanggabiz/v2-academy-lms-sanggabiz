"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

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
export function AdminBusyProvider({ children }: { children: React.ReactNode }) {
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

  return <AdminBusyContext.Provider value={value}>{children}</AdminBusyContext.Provider>
}

export function useAdminBusy() {
  return useContext(AdminBusyContext)
}
