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
    <section id="features" className="border-t border-border/70 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12">
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-primary">What SANbox includes</p>
          <h2 className="font-beach-display text-3xl font-bold leading-snug tracking-tight text-balance sm:text-4xl">
            A calm beach theme over the same reliable learning stack,
            <br />
            <span className="font-normal text-muted-foreground">designed for real family use.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="beach-card flex flex-col gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
