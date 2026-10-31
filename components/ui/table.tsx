import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Pembungkusnya bisa digulir mendatar, dan di lebar ponsel hampir semua tabel
 * di aplikasi ini memang melebihi layar. Wadah yang bisa digulir tapi tidak
 * bisa difokus berarti pengguna papan ketik tidak punya cara apa pun melihat
 * kolom di sebelah kanan -- isinya teks biasa, jadi tidak ada tautan di dalam
 * yang bisa membawanya ke sana (WCAG 2.1.1, axe scrollable-region-focusable).
 *
 * Diperbaiki di sini, bukan di tiap pemanggil, karena seluruh tabel memakai
 * komponen ini: dua halaman riwayat pembelian baru ketahuan gagal setelah
 * tabelnya berisi data, dan tabel mana pun berikutnya akan mengulang hal sama.
 *
 * `scrollLabel` memberi nama saat fokus mendarat di wadahnya; isi dengan
 * sesuatu yang menjelaskan tabelnya kalau halaman punya lebih dari satu.
 */
function Table({
  className,
  scrollLabel = "Tabel, dapat digulir mendatar",
  ...props
}: React.ComponentProps<"table"> & { scrollLabel?: string }) {
  return (
    <div
      data-slot="table-container"
      tabIndex={0}
      role="group"
      aria-label={scrollLabel}
      className="relative w-full overflow-x-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle font-semibold text-[13px] text-muted-foreground whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
