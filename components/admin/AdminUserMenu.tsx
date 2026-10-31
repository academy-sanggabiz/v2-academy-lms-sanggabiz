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
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted">
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-white">{initial}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold">{name}</span>
        <Badge variant="secondary">{roleLabel}</Badge>
        <ChevronDown className="size-3.5 text-muted-foreground" />
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
