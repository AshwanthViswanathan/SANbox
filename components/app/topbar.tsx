'use client'

import { useState } from 'react'
import { Bell, Menu, X } from 'lucide-react'
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
          <div className="hidden md:flex flex-col">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-tertiary">Monitoring hub</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">dashboard</Link>
              {title !== 'Overview' && (
                <>
                  <span>/</span>
                  <span className="text-foreground">{title.toLowerCase()}</span>
                </>
              )}
            </div>
          </div>
          <p className="md:hidden text-sm font-semibold">{title}</p>
        </div>

        <div className="stitch-panel flex items-center gap-2 px-3 py-2">
          <div className="hidden lg:block text-right mr-2">
            <p className="text-sm font-semibold">{email}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">SANbox family account</p>
          </div>
          <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-sky-100 hover:text-foreground" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </button>
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
