"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useListParams } from "@/hooks/use-list-params"

/** A <Select> bound to one URL filter param, for use inside <ListToolbar>. */
export function ListFilterSelect({
  paramKey,
  prefix,
  defaultValue,
  placeholder,
  className,
  options,
}: {
  paramKey: string
  prefix?: string
  defaultValue: string
  placeholder: string
  className?: string
  options: { value: string; label: string }[]
}) {
  const { get, setParams, isPending } = useListParams(prefix)
  const value = get(paramKey) || defaultValue

  return (
    <Select
      value={value}
      onValueChange={(next) => setParams({ [paramKey]: next === defaultValue ? null : next })}
      disabled={isPending}
    >
      <SelectTrigger
        aria-label={placeholder}
        aria-busy={isPending || undefined}
        className={className ?? "h-9 w-[160px] bg-card"}
      >
        {/*
         * Mengganti filter menavigasi ulang. Teksnya ikut berubah, bukan hanya
         * spinner: animasi mati pada prefers-reduced-motion (R4, R5).
         */}
        {isPending ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Spinner className="size-3.5 shrink-0" />
            Memuat…
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
