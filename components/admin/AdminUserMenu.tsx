"use client"

import { useTransition } from "react"
import Link from "next/link"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/auth/login/actions"

export function AdminUserMenu({ name, role }: { name: string; role: "mentor" | "superadmin" }) {
  const initial = name.charAt(0).toUpperCase()
  const roleLabel = role === "superadmin" ? "Superadmin" : "Mentor"
  const [isLoggingOut, startLogout] = useTransition()

  return (
    <DropdownMenu>
      {/*
        Nama dan lencana peran disembunyikan di layar sempit, bukan dikecilkan:
        keduanya memakan 210px dan membuat seluruh layar pengelola melebihi
        320px, sehingga gagal WCAG 1.4.10 Reflow. Keduanya tetap muncul di
        dalam menu saat dibuka, jadi tidak ada informasi yang hilang.

        `aria-label` menanggung namanya saat teksnya tidak terlihat -- tanpa itu
        tombol ini hanya terbaca sebagai satu huruf inisial oleh pembaca layar.
      */}
      <DropdownMenuTrigger
        aria-label={`${name} · ${roleLabel}`}
        className="flex max-w-full items-center gap-2.5 rounded-xl py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted"
      >
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-white">{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden truncate text-sm font-semibold sm:inline">{name}</span>
        <span className="hidden sm:inline">
          <Badge variant="secondary">{roleLabel}</Badge>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="text-sm font-semibold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{roleLabel}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/admin/profile" />}>
          <User />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/admin/settings" />}>
          <Settings />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          // The menu must stay open while the sign-out runs, otherwise the
          // pending state unmounts the instant it is clicked.
          closeOnClick={false}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut || undefined}
          onClick={() => {
            startLogout(async () => {
              try {
                await logout()
              } catch {
                toast.error("Gagal keluar. Periksa koneksi Anda, lalu coba lagi.")
              }
            })
          }}
        >
          {isLoggingOut ? <Spinner /> : <LogOut />}
          {isLoggingOut ? "Keluar…" : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
