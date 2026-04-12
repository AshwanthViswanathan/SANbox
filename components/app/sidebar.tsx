'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Cpu,
  LayoutDashboard,
  Shell,
  Settings,
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
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15 text-sidebar-primary">
          <Shell className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-tight">SANbox</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-sidebar-foreground/50">San dashboard</div>
        </div>
      </div>

      <div className="border-b border-sidebar-border px-3 py-3">
        <div className="rounded-lg bg-sidebar-accent px-3 py-2">
          <div className="text-xs font-medium text-sidebar-foreground">Active family</div>
          <div className="truncate text-[11px] text-sidebar-foreground/60">{email}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/30">
          SANbox
        </p>
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
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
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

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="rounded-lg px-2 py-2 text-xs text-sidebar-foreground/60">
          Beach theme live
          <div className="mt-1 text-[10px] font-mono text-sidebar-foreground/40">
            San dashboard preview
          </div>
        </div>
      </div>
    </aside>
  )
}
