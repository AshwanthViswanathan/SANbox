import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="panel p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(to right, oklch(0.12 0.01 240) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.12 0.01 240) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/20 blur-3xl rounded-full" />

          <div className="relative">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-4">Get started now</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4">
              Your idea. Five days.
              <br />
              Ship it.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-pretty leading-relaxed">
              Fork this starter, connect your Supabase project, pick your LLM provider, and start shipping the agentic product you&apos;ve been imagining.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign up free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
