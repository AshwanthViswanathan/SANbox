'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Anchor,
  BookOpen,
  Cpu,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessions', href: '/dashboard/sessions', icon: UserRoundSearch },
  { label: 'Lessons', href: '/dashboard/lessons', icon: BookOpen },
  { label: 'Devices', href: '/dashboard/devices', icon: Cpu },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type DashboardSidebarProps = {
  email: string
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="stitch-panel fixed left-0 top-0 z-40 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col p-6 text-sidebar-foreground md:flex">
      <div className="mb-8 px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full coastal-gradient text-white shadow-lg shadow-primary/20">
            <Anchor className="h-5 w-5" />
          </span>
          <div>
            <div className="stitch-heading text-xl text-primary">SANbox Explorer</div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">San Dashboard</div>
          </div>
        </div>
      </div>

      <div className="mb-6 px-3">
        <div className="rounded-[1.5rem] bg-sky-50/80 px-4 py-4">
          <div className="stitch-label">Active family</div>
          <div className="mt-2 truncate text-sm font-semibold text-foreground">{email}</div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-container/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3 w-3" />
            Beachcomber level 5
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              item.href === '/dashboard'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-all',
                    active
                      ? 'bg-sky-100 text-sky-800 shadow-sm'
                      : 'text-sidebar-foreground/65 hover:bg-sky-50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-6 border-t border-[color:rgba(178,173,154,0.16)] px-3 pt-6">
        <div className="rounded-[1.5rem] bg-surface-container-low px-4 py-4 text-xs text-sidebar-foreground/70">
          Beach theme live
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-sidebar-foreground/40">
            San dashboard preview
          </div>
        </div>
      </div>
    </aside>
  )
}
