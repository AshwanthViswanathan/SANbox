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
    <aside className="stitch-panel fixed left-0 top-[6.5rem] z-40 hidden w-64 shrink-0 px-4 py-4 text-sidebar-foreground md:flex">
      <div className="space-y-5">
        <div className="px-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-14 w-14 items-center justify-center">
              <Image src="/sans-faces/San-Normal-Thinking-Listening.svg" alt="SANbox Logo" width={46} height={46} className="object-contain" />
            </span>
            <div>
              <div className="stitch-heading text-xl text-primary">SANbox</div>
              <div className="max-w-[8.5rem] text-xs font-semibold leading-5 tracking-[0.04em] text-muted-foreground">
                Voice learning companion
              </div>
            </div>
          </div>
        </div>

        <div className="px-2">
          <div className="rounded-[1.35rem] bg-sky-50/80 px-4 py-3.5">
            <div className="stitch-label">Active family</div>
            <div className="mt-2 truncate text-sm font-semibold text-foreground">{email}</div>
          </div>
        </div>

        <nav className="px-2">
          <ul className="space-y-0.5">
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
                      'flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-bold transition-all',
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
      </div>
    </aside>
  )
}
