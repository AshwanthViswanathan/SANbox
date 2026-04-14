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

const featureSurfaceClasses = [
  'bg-[linear-gradient(180deg,rgba(255,249,241,0.9),rgba(247,238,225,0.78))]',
  'bg-[linear-gradient(180deg,rgba(236,249,246,0.9),rgba(225,240,233,0.78))]',
  'bg-[linear-gradient(180deg,rgba(237,246,255,0.9),rgba(224,236,247,0.78))]',
  'bg-[linear-gradient(180deg,rgba(250,244,233,0.9),rgba(238,230,214,0.78))]',
]

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <div className="stitch-readable-surface space-y-4 bg-[linear-gradient(180deg,rgba(255,249,241,0.82),rgba(244,237,224,0.72))] px-5 py-5 sm:px-6">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-sky-800">How the frontend works</p>
              <h2 className="font-beach-display max-w-md text-4xl font-bold leading-tight tracking-tight text-balance text-slate-950 drop-shadow-[0_6px_18px_rgba(255,251,245,0.35)] sm:text-5xl">
                A quieter surface for the same stable learning stack.
              </h2>
              <p className="max-w-md text-base leading-7 text-slate-800">
                The redesign keeps the app sessions-first. Children still talk to San, parents still review the same data, and the UI simply presents it with clearer hierarchy.
              </p>
            </div>

            <div className="stitch-readable-surface space-y-6 bg-[linear-gradient(180deg,rgba(236,249,246,0.82),rgba(223,241,235,0.72))] px-6 py-6 sm:px-8">
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-mono font-bold uppercase tracking-[0.22em] text-sky-800">Open the product</p>
                <h2 className="font-beach-display max-w-2xl text-3xl font-bold tracking-tight text-balance text-slate-950 drop-shadow-[0_6px_18px_rgba(255,251,245,0.35)] sm:text-4xl">
                  Review what happened, what was said, and what needs attention.
                </h2>
                <p className="mt-4 max-w-xl text-pretty leading-7 text-slate-800">
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
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[2rem] bg-transparent">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`stitch-readable-surface grid gap-4 px-5 py-5 sm:grid-cols-[auto_1fr] sm:px-6 ${featureSurfaceClasses[index % featureSurfaceClasses.length]}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="max-w-2xl text-sm leading-7 text-slate-800">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
