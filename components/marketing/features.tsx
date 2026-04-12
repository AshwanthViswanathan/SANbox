import { BookOpen, LifeBuoy, Mic, Radio, ShieldAlert, ShieldCheck } from 'lucide-react'

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
    <section id="features" className="relative overflow-hidden border-t border-border/70 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">How the frontend works</p>
            <h2 className="font-beach-display max-w-md text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              A quieter surface for the same stable learning stack.
            </h2>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              The redesign keeps the app sessions-first. Children still talk to San, parents still review the same data, and the UI simply presents it with clearer hierarchy.
            </p>
          </div>

          <div className="divide-y divide-border/60 overflow-hidden rounded-[2rem] border border-white/70 bg-white/58 shadow-[0_22px_50px_-26px_rgba(0,95,153,0.28)] backdrop-blur-sm">
            {features.map((feature) => (
              <div key={feature.title} className="grid gap-4 px-5 py-6 sm:grid-cols-[auto_1fr] sm:px-7">
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
