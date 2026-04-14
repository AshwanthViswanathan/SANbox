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
    <aside className="fixed left-0 top-[6.5rem] z-40 hidden w-64 shrink-0 px-4 py-4 text-white md:flex">
      <div className="space-y-5">
        <div className="px-3">
          <div className="flex items-center rounded-[1.5rem] border border-black/20 bg-[rgba(229,229,229,0.94)] px-4 py-4 shadow-[0_16px_34px_-22px_rgba(15,23,42,0.45)]">
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

        <nav className="px-3">
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
                      'font-beach-vibe flex items-center gap-3 px-4 py-3 text-[18px] font-semibold tracking-[0.08em] transition-colors',
                      active
                        ? 'text-[#e7d2a2]'
                        : 'text-white/90 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-[#e7d2a2]' : 'text-white/90')} />
                    <span>{item.label}</span>
                  </Link>
                  {!isLast && (
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-white/90" />
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
