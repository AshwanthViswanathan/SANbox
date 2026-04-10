import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-foreground text-background">
            <Zap className="w-3.5 h-3.5" />
          </span>
          Agentic
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          Built for hackathons. Extend for production. MIT License.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
