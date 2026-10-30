"use client"

import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useDebouncedParam } from "@/hooks/use-list-params"

/** Debounced search box (URL-bound via useDebouncedParam) plus a slot for per-surface filter <Select>s. */
export function ListToolbar({
  placeholder,
  prefix,
  children,
}: {
  placeholder: string
  prefix?: string
  children?: ReactNode
}) {
  const { value, setValue, isPending } = useDebouncedParam("q", prefix)

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-[240px]">
        {/*
         * Pencarian menavigasi ulang ke server. Tanpa penanda di kotak ini,
         * mengetik terasa seperti tidak terjadi apa-apa sampai baris berganti
         * (STANDAR-UMPAN-BALIK-UI.md R1).
         */}
        {isPending ? (
          <Spinner className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-busy={isPending || undefined}
          className="h-9 bg-card pl-8"
        />
        <span role="status" aria-live="polite" className="sr-only">
          {isPending ? "Memuat hasil pencarian…" : ""}
        </span>
      </div>
      {children}
    </div>
  )
}
