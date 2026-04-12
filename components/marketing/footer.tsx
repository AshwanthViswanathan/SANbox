import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="py-10">
      <div className="stitch-readable-surface mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Image src="/sans-faces/San-Normal-Thinking-Listening.svg" alt="SANbox Logo" width={28} height={28} className="object-contain" />
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
