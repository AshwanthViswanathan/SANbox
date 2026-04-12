import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-transparent bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(247,241,217,0.86))] px-6 py-12 shadow-[0_24px_60px_-28px_rgba(0,95,153,0.35)] sm:px-10 lg:px-14">
          <div className="wave-grid pointer-events-none absolute inset-0 opacity-25" />
          <div className="pointer-events-none absolute left-8 top-6 h-36 w-36 rounded-full bg-accent/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-8 h-44 w-44 rounded-full bg-primary/16 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-mono uppercase tracking-[0.22em] text-primary">Open the product</p>
              <h2 className="font-beach-display max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Review what happened, what was said, and what needs attention.
              </h2>
              <p className="mt-4 max-w-xl text-pretty leading-7 text-muted-foreground">
                The public site stays simple. The working surface is the dashboard: sessions, safeguards, lessons, and devices in one continuous monitoring flow.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:flex-col">
              <Button size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  Open SANbox Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pi">View Shore Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
