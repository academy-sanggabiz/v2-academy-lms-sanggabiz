"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingCart,
  PanelLeftClose,
  X,
  Layout,
  ClipboardCheck,
  Activity,
  UserCog,
  Search,} from "lucide-react"

import { cn } from "@/lib/utils"
import { sidebarClasses } from "@/hooks/use-mobile-nav"
import { useNavigationBlocker } from "@/components/admin/NavigationBlockerContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

const navItems = [
  // Kunci kamus, bukan label jadi: daftar ini di luar komponen dan tidak bisa
  // memanggil hook.
  { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", key: "courses", icon: BookOpen },
  { href: "/admin/grading", key: "grading", icon: ClipboardCheck },
  { href: "/admin/tracking", key: "tracking", icon: Activity },
  { href: "/admin/learners", key: "learners", icon: Users },
  { href: "/admin/purchases", key: "purchases", icon: ShoppingCart },
] as const

export function AdminSidebar({
  open,
  mobileOpen,
  onToggle,
  onCloseMobile,
  role,
}: {
  open: boolean
  mobileOpen: boolean
  onToggle: () => void
  onCloseMobile: () => void
  role: "mentor" | "superadmin"
}) {
  const { t } = useI18n()

  return (
    <aside id="app-sidebar" aria-label={t.shell.mainNavigation} className={sidebarClasses(open, mobileOpen)}>
      <div className="flex items-center gap-2 px-4 py-4 whitespace-nowrap">
        <img src="/logo.png" alt="" className="size-8 object-contain" />
        <span className="text-xl font-bold tracking-tight text-ring">sanggabiz</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t.shell.closeMenu}
          className="flex size-8 flex-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={t.shell.closeSidebar}
          className="hidden size-8 flex-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
        >
          <PanelLeftClose className="size-[18px]" aria-hidden />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2 whitespace-nowrap">
        {navItems.map(({ href, key, icon: Icon }) => (
          <NavLink key={href} href={href} label={t.admin[key]} icon={Icon} />
        ))}
        {/* Layar khusus superadmin: evaluasi mentor menyilangkan data seluruh
            mentor, sedangkan halaman depan dan pengaturan sertifikat adalah
            wajah perusahaan -- mentor mengatur sertifikat kursusnya sendiri,
            bukan milik semua orang. docs/STANDAR-PERAN.md §2. */}
        {role === "superadmin" && (
          <>
            <NavLink href="/admin/mentor" label={t.admin.mentors} icon={UserCog} />
            <NavLink href="/admin/landing" label={t.admin.landing} icon={Layout} />
            <NavLink href="/admin/seo" label={t.admin.seo} icon={Search} />
            <NavLink href="/admin/certificates" label={t.admin.certificates} icon={Award} />
          </>
        )}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-border p-3 text-center whitespace-nowrap">
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sanggabiz</div>
      </div>
    </aside>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: typeof LayoutDashboard
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname?.startsWith(`${href}/`)
  const { isBlocked, blockMessage } = useNavigationBlocker()

  return (
    <Link
      href={href}
      onNavigate={(e) => {
        if (isBlocked && !window.confirm(blockMessage)) {
          e.preventDefault()
        }
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-[18px]" />
      {label}
    </Link>
  )
}
