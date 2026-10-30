"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

function filenameFromDisposition(header: string | null, fallback: string): string {
  const match = header?.match(/filename="([^"]+)"/)
  return match?.[1] ?? fallback
}

/**
 * The export route builds the whole grading matrix server-side, which takes
 * seconds. A plain <a href> gives no sign of that and can be re-clicked, so
 * fetch the CSV here and hand it to the browser once it has actually arrived.
 */
export function ExportCourseCsvButton({ courseId }: { courseId: string }) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const response = await fetch(
        `/admin/grading/export?courseId=${encodeURIComponent(courseId)}`
      )
      if (!response.ok) {
        toast.error("Gagal mengekspor CSV. Muat ulang halaman, lalu coba lagi.")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filenameFromDisposition(
        response.headers.get("Content-Disposition"),
        "grading.csv"
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoking in the same tick cancels the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success("CSV diunduh")
    } catch {
      toast.error("Gagal mengekspor CSV. Periksa koneksi Anda, lalu coba lagi.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      pending={isExporting}
      pendingLabel="Mengekspor…"
    >
      Ekspor CSV Kursus
    </Button>
  )
}
