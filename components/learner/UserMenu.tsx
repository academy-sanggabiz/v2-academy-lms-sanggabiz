"use client"

import Link from "next/link"
import { useTransition } from "react"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

export function UserMenu({ name, email }: { name: string; email: string }) {
  const initial = name.charAt(0).toUpperCase()
  const [isLoggingOut, startLoggingOut] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted">
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-white">{initial}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold">{name}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="text-sm font-semibold text-foreground">{name}</div>
            <div className="truncate text-xs text-muted-foreground">{email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/learner/profile" />}>
          <User />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/learner/settings" />}>
          <Settings />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          // Menu yang menutup seketika akan membawa serta indikator "sedang
          // keluar"; biarkan terbuka sampai server mengalihkan halaman.
          closeOnClick={false}
          aria-busy={isLoggingOut || undefined}
          onClick={() => {
            if (isLoggingOut) return
            startLoggingOut(async () => {
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
