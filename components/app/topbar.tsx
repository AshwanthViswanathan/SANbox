'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './sidebar'
import { SignOutButton } from '@/components/auth/sign-out-button'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/sessions': 'Sessions',
  '/dashboard/lessons': 'Lessons',
  '/dashboard/devices': 'Devices',
  '/dashboard/settings': 'Settings',
}

type DashboardTopbarProps = {
  email: string
}

export function DashboardTopbar({ email }: DashboardTopbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Try to find exact match first, then fallback to base path
  const title = breadcrumbMap[pathname] ?? 
    (pathname.startsWith('/dashboard/sessions/') ? 'Session Details' : 'Dashboard')
  const showTopTitle =
    pathname !== '/dashboard/sessions' &&
    pathname !== '/dashboard/devices' &&
    title !== 'Overview'

  return (
    <>
      <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center justify-between bg-transparent px-6 sm:px-10">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {showTopTitle && (
            <div className="hidden px-4 py-3 md:flex md:flex-col">
              <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-slate-700/80">
                <span className="text-slate-950 font-semibold text-lg">{title}</span>
              </div>
            </div>
          )}
          {showTopTitle && (
            <p className="px-4 py-2 text-sm font-bold text-slate-950 md:hidden">{title}</p>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl shadow-sm border border-white/50 rounded-[1.25rem] flex items-center gap-3 px-5 py-2.5">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold text-slate-950">{email}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700/70">SANbox family account</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 p-4">
            <DashboardSidebar email={email} />
            <button
              className="absolute top-7 right-7 rounded-full bg-white/80 p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
