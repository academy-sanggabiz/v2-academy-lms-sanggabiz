"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Bell } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/lib/notifications-server"
import { markNotificationsReadAction } from "@/app/learner/notifications-actions"
import { relativeTime } from "@/lib/notification-format"

export function NotificationBell({
  items,
  unreadCount,
  seeAllHref = "/learner/notifications",
}: {
  items: Notification[]
  unreadCount: number
  seeAllHref?: string | null
}) {
  const router = useRouter()
  const [isMarking, startTransition] = useTransition()
  const [markError, setMarkError] = useState<string | null>(null)

  function handleOpenChange(open: boolean) {
    // Menandai terbaca tetap berjalan sendiri di latar -- peserta tidak
    // menunggunya -- tetapi kegagalannya tidak boleh diam: lencana yang tetap
    // menyala butuh penjelasan (R7).
    if (!open || unreadCount === 0) return
    setMarkError(null)
    startTransition(async () => {
      const result = await markNotificationsReadAction()
      if (result?.error) {
        setMarkError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        aria-label={
          unreadCount > 0 ? `Notifikasi (${unreadCount} belum dibaca)` : "Notifikasi"
        }
        aria-busy={isMarking || undefined}
        className="relative mr-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
            <span className="flex items-center justify-between gap-2">
              Notifikasi
              {isMarking && (
                <span role="status" className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <Spinner className="size-3.5" />
                  Menandai terbaca…
                </span>
              )}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <StatusMessage className="px-2 text-xs">{markError}</StatusMessage>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            Belum ada notifikasi.
          </p>
        ) : (
          items.map((n) => {
            const content = (
              <span className="flex w-full flex-col gap-0.5">
                <span className="flex items-start gap-2">
                  {!n.readAt && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ring" />
                  )}
                  <span className="text-sm font-medium">{n.title}</span>
                </span>
                {n.body && (
                  <span className="truncate text-xs text-muted-foreground">{n.body}</span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {relativeTime(n.createdAt)}
                </span>
              </span>
            )

            return (
              <DropdownMenuItem
                key={n.id}
                className="items-start whitespace-normal"
                {...(n.link ? { render: <Link href={n.link} /> } : {})}
              >
                {content}
              </DropdownMenuItem>
            )
          })
        )}

        {items.length > 0 && seeAllHref && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm font-medium text-ring"
              render={<Link href={seeAllHref} />}
            >
              Lihat semua notifikasi
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
