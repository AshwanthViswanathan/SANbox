import { Bot, Radio, ListChecks, Layers, ShieldCheck, Plug } from 'lucide-react'

const features = [
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'Agent Registry',
    description:
      'Define, deploy, and monitor AI agents. Each agent has its own config, run history, and log stream. Swap models without changing your app logic.',
  },
  {
    icon: <ListChecks className="w-5 h-5" />,
    title: 'Task & Run Queue',
    description:
      'Trigger runs manually or on a schedule. Track status, retries, duration, and outputs in a structured run log built for fast inspection.',
  },
  {
    icon: <Radio className="w-5 h-5" />,
    title: 'Device Ingest API',
    description:
      'POST structured events from a Raspberry Pi, embedded sensor, or any HTTP client. Built-in webhook endpoint with auth-token validation.',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: 'Event Log',
    description:
      'A unified, real-time event stream across all agents and devices. Filter by source, severity, or time range. Ready to wire to Supabase Realtime.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Supabase Auth',
    description:
      'Sign-in / sign-up UI with clear TODO markers for Supabase Auth wiring. Row-level security scaffolding included so you ship secure from day one.',
  },
  {
    icon: <Plug className="w-5 h-5" />,
    title: 'Integration Slots',
    description:
      'Pre-wired slots for external services: Slack notifications, webhook subscribers, API key management. Extend in minutes, not hours.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Platform features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-snug">
            Everything you need.
            <br />
            <span className="text-muted-foreground font-normal">Nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-6 flex flex-col gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent border border-accent/20 shrink-0">
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
