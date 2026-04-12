'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, Shell, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '/dashboard' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Shell className="h-4 w-4" />
          </span>
          <span>SANbox</span>
          <span className="ml-1 hidden items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary sm:inline-flex">
            SHORE GUIDE
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          className="rounded p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn('border-t border-border bg-background md:hidden', open ? 'block' : 'hidden')}>
        <nav className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-1 flex gap-2 border-t border-border pt-3">
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
