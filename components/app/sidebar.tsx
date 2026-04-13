'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Anchor,
  BookOpen,
  Cpu,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import Image from 'next/image'

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
          <span className="flex h-16 w-16 items-center justify-center">
            <Image src="/sans-faces/San-Normal-Thinking-Listening.svg" alt="SANbox Logo" width={52} height={52} className="object-contain" />
          </span>
          <div>
            <div className="stitch-heading text-xl text-primary">SANbox</div>
            <div className="text-xs font-semibold tracking-[0.04em] text-muted-foreground">Voice learning companion</div>
          </div>
        </div>
      </div>

      <div className="mb-6 px-3">
        <div className="rounded-[1.5rem] bg-sky-50/80 px-4 py-4">
          <div className="stitch-label">Active family</div>
          <div className="mt-2 truncate text-sm font-semibold text-foreground">{email}</div>
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
    </aside>
  )
}
