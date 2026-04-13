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

export function DashboardSidebar({ email: _email }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-[6.5rem] z-40 hidden w-64 shrink-0 px-4 py-4 text-sidebar-foreground md:flex">
      <div className="space-y-5">
        <div className="px-3">
          <div className="flex items-center">
            <span className="flex w-full items-center justify-start overflow-hidden">
              <Image
                src="/sanbox-dashboard-logo.png"
                alt="SANbox Logo"
                width={220}
                height={96}
                className="h-auto w-[13.5rem] object-contain"
                priority
              />
            </span>
          </div>
        </div>

        <nav className="px-2">
          <ul className="flex flex-col">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const active =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              const isLast = index === navItems.length - 1

              return (
                <li key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-[15px] font-semibold transition-colors',
                      active
                        ? 'text-slate-950'
                        : 'text-slate-900 hover:text-black'
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", active ? "text-slate-950" : "text-slate-700")} />
                    <span>{item.label}</span>
                  </Link>
                  {/* Subtle dividing line, inset on left and right */}
                  {!isLast && (
                    <div className="absolute bottom-0 left-12 right-4 h-[1px] bg-slate-300/80" />
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
