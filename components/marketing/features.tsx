import { BookOpen, LifeBuoy, Mic, Radio, ShieldAlert, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const features = [
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: 'SANbox Dashboard',
    description:
      'Review recent sessions, scan flagged moments, and follow clear summaries of what a child asked, heard, and learned.',
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Guided lesson dives',
    description:
      'Markdown-backed lesson modules let San guide subject-specific practice in reading, math, science, and other K-5 topics.',
  },
  {
    icon: <Radio className="h-5 w-5" />,
    title: 'Fast voice replies',
    description:
      'Speech-to-text, tutoring responses, and text-to-speech work together so children can ask questions and hear answers naturally.',
  },
  {
    icon: <Mic className="h-5 w-5" />,
    title: 'Simple voice-first flow',
    description:
      'Button-to-talk audio capture keeps the interaction simple for young students while preserving clear turn-by-turn transcripts for review.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Built-in safeguards',
    description:
      'Each child input and assistant response can be labeled, flagged, and surfaced to parents when something needs a closer look.',
  },
  {
    icon: <LifeBuoy className="h-5 w-5" />,
    title: 'A beach guide with guardrails',
    description:
      'San stays warm and playful for kids while the existing backend keeps moderation, lesson routing, and parent visibility stable.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <div className="stitch-readable-surface space-y-4 px-5 py-5 sm:px-6">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">How the frontend works</p>
              <h2 className="font-beach-display max-w-md text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
                A quieter surface for the same stable learning stack.
              </h2>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                The redesign keeps the app sessions-first. Children still talk to San, parents still review the same data, and the UI simply presents it with clearer hierarchy.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] border border-transparent bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(247,241,217,0.86))] px-6 pt-8 pb-5 shadow-[0_24px_60px_-28px_rgba(0,95,153,0.35)] sm:px-10 sm:pt-9 sm:pb-6">
              <div className="wave-grid pointer-events-none absolute inset-0 opacity-25" />
              <div className="pointer-events-none absolute left-8 top-6 h-36 w-36 rounded-full bg-accent/18 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-8 h-44 w-44 rounded-full bg-primary/16 blur-3xl" />

              <div className="relative space-y-6">
                <div className="max-w-2xl">
                  <p className="mb-4 text-xs font-mono uppercase tracking-[0.22em] text-primary">Open the product</p>
                  <h2 className="font-beach-display max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    Review what happened, what was said, and what needs attention.
                  </h2>
                  <p className="mt-4 max-w-xl text-pretty leading-7 text-muted-foreground">
                    The public site stays simple. The working surface is the dashboard: sessions, safeguards, lessons, and devices in one continuous monitoring flow.
                  </p>
                </div>
                <div className="flex min-h-[11rem] w-full flex-col items-center justify-center gap-4">
                  <Button size="lg" className="min-h-14 w-full text-base sm:text-lg" asChild>
                    <Link href="/dashboard" className="flex w-full items-center justify-center gap-2">
                      Open SANbox Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="min-h-14 w-full text-base sm:text-lg" asChild>
                    <Link href="/pi" className="flex w-full items-center justify-center">Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[2rem] bg-transparent">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="grid gap-4 rounded-[1.75rem] border border-transparent bg-white/66 px-5 py-6 shadow-[0_18px_40px_-28px_rgba(0,95,153,0.22)] backdrop-blur-sm sm:grid-cols-[auto_1fr] sm:px-7"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
