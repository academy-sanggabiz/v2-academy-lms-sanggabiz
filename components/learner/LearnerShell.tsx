"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Toaster } from "sonner"

import { useMobileNav } from "@/hooks/use-mobile-nav"

import { NotificationBell } from "@/components/learner/NotificationBell"
import { Sidebar } from "@/components/learner/Sidebar"
import { UserMenu } from "@/components/learner/UserMenu"
import type { Notification } from "@/lib/notifications-server"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"

export function LearnerShell({
  name,
  email,
  notifications,
  unreadCount,
  children,
}: {
  name: string
  email: string
  notifications: Notification[]
  unreadCount: number
  children: React.ReactNode
}) {
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const mobileNav = useMobileNav()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileNav.open}
        onToggle={() => setSidebarOpen((v) => !v)}
        onCloseMobile={() => mobileNav.setOpen(false)}
      />
      {mobileNav.open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => mobileNav.setOpen(false)}
          aria-hidden
        />
      )}

      {/*
       * Saat drawer terbuka, sisa halaman dibuat inert supaya Tab tidak bisa
       * keluar dari drawer ke konten di belakangnya -- jebakan fokus tanpa
       * menulis pengelola fokus sendiri (WCAG 2.4.3). Pemindahan dan
       * pengembalian fokusnya ditangani useMobileNav.
       */}
      <div className="flex min-w-0 flex-1 flex-col" inert={mobileNav.open}>
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-card px-4">
          <button
            type="button"
            onClick={() => mobileNav.setOpen(true)}
            aria-label={t.shell.openMenu}
            aria-controls="app-sidebar"
            aria-expanded={mobileNav.open}
            className="mr-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.shell.openSidebar}
              className="mr-2 hidden size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
            >
              <img src="/logo.png" alt="" className="size-7 object-contain" />
            </button>
          )}
          <div className="flex-1" />
          {/* Pemilih bahasa di header, bukan terkubur di Pengaturan: orang yang
              salah bahasa justru kesulitan menemukan halaman Pengaturan. */}
          <LanguageSwitcher className="mr-1 hidden sm:inline-flex" />
          <NotificationBell items={notifications} unreadCount={unreadCount} />
          <UserMenu name={name} email={email} />
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl p-4 outline-none sm:p-6 lg:p-8">{children}</main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}
