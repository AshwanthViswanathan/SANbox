'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '/dashboard' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/68 px-4 shadow-[0_16px_40px_-24px_rgba(0,95,153,0.4)] backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <Image src="/sans-faces/San-Normal-Thinking-Listening.svg" alt="SANbox Logo" width={36} height={36} className="object-contain" />
          <div className="flex flex-col">
            <span className="font-beach-display text-lg leading-none">SANbox</span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:block">
              Voice learning companion
            </span>
          </div>
          <span className="ml-1 hidden items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-mono font-medium text-primary lg:inline-flex">
            COASTAL DEMO
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard">Open SANbox</Link>
          </Button>
        </div>

        <button
          className="rounded-full p-2 text-muted-foreground hover:bg-sky-50 hover:text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'mx-3 mt-2 rounded-[1.75rem] border border-white/70 bg-white/82 p-3 shadow-[0_16px_40px_-24px_rgba(0,95,153,0.4)] backdrop-blur-xl sm:mx-6 md:hidden',
          open ? 'block' : 'hidden'
        )}
      >
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-sky-50 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border/70 pt-3">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link href="/dashboard">Open SANbox</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
