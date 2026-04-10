'use client'

import { useState } from 'react'
import { Search, Bell, Menu, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './sidebar'
import { SignOutButton } from '@/components/auth/sign-out-button'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/agents': 'Agents',
  '/dashboard/runs': 'Runs',
  '/dashboard/logs': 'Logs',
  '/dashboard/devices': 'Devices',
  '/dashboard/settings': 'Settings',
}

type DashboardTopbarProps = {
  email: string
}

export function DashboardTopbar({ email }: DashboardTopbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = breadcrumbMap[pathname] ?? 'Dashboard'

  return (
    <>
      <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-border bg-background shrink-0">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">dashboard</Link>
            {title !== 'Overview' && (
              <>
                <span>/</span>
                <span className="text-foreground">{title.toLowerCase()}</span>
              </>
            )}
          </div>
          <p className="md:hidden text-sm font-semibold">{title}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block text-right mr-1">
            <p className="text-xs font-medium">{email}</p>
            <p className="text-[10px] text-muted-foreground">Supabase session</p>
          </div>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
          <button className="relative p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
          </button>
          <SignOutButton />
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-64">
            <DashboardSidebar email={email} />
            <button
              className="absolute top-3 right-3 p-1.5 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
