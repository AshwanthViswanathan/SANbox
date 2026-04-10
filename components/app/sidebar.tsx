'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Bot,
  Play,
  ScrollText,
  Cpu,
  Settings,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Agents', href: '/dashboard/agents', icon: Bot },
  { label: 'Runs', href: '/dashboard/runs', icon: Play },
  { label: 'Logs', href: '/dashboard/logs', icon: ScrollText },
  { label: 'Devices', href: '/dashboard/devices', icon: Cpu },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type DashboardSidebarProps = {
  email: string
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-52 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border shrink-0">
        <span className="flex items-center justify-center w-6 h-6 rounded bg-sidebar-primary text-sidebar-primary-foreground">
          <Zap className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-sm tracking-tight">Agentic</span>
      </div>

      {/* Workspace selector */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-sidebar-accent transition-colors text-left">
          <div>
            <div className="text-xs font-medium text-sidebar-foreground">Default Workspace</div>
            <div className="text-[10px] text-sidebar-foreground/50 font-mono">workspace / default</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="px-2 mb-1 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/30">
          Platform
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User area */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-semibold shrink-0">
            {email.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-sidebar-foreground truncate">{email}</div>
            <div className="text-[10px] text-sidebar-foreground/40 font-mono">google oauth</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
