import Link from 'next/link'
import { Shell } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Shell className="h-3.5 w-3.5" />
          </span>
          <span className="font-beach-display text-base">SANbox</span>
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Voice-first learning companion for K-5 families with parent session visibility. MIT License.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            SANbox Dashboard
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
