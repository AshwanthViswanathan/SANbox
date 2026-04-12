import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="border-t border-border/70 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="beach-card relative overflow-hidden p-10 text-center sm:p-14">
          <div className="wave-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative">
            <p className="mb-4 text-xs font-mono uppercase tracking-widest text-primary">See the full experience</p>
            <h2 className="font-beach-display mb-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              From a curious question to
              <br />
              parent visibility on one coast.
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-pretty leading-relaxed text-muted-foreground">
              Open the SANbox dashboard to review sessions, then jump into the device demo to hear how
              San responds in real time.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
