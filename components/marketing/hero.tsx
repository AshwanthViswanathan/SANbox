import Link from 'next/link'
import { ArrowRight, GitBranch, Terminal, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(0.12 0.01 240) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.12 0.01 240) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Accent glow */}
      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Eyebrow */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
            5-day hackathon starter &mdash; agentic AI
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance leading-tight text-foreground">
          Agents that act.
          <br />
          <span className="text-accent">Infrastructure that scales.</span>
        </h1>

        {/* Sub */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
          A production-ready platform shell for building agentic AI systems. Connects to language models, hardware devices, and external services — adapt it to your hackathon idea in hours, not days.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Get started free</Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4">
          {[
            { icon: <Terminal className="w-4 h-4" />, label: 'Agent runner built-in' },
            { icon: <GitBranch className="w-4 h-4" />, label: 'Supabase-ready auth' },
            { icon: <Cpu className="w-4 h-4" />, label: 'Hardware device API' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-accent">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div className="mt-14 mx-auto max-w-5xl">
          <div className="panel overflow-hidden shadow-xl shadow-foreground/5">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/50">
              <span className="w-3 h-3 rounded-full bg-border" />
              <span className="w-3 h-3 rounded-full bg-border" />
              <span className="w-3 h-3 rounded-full bg-border" />
              <span className="ml-4 text-xs font-mono text-muted-foreground">localhost:3000/dashboard</span>
            </div>
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="bg-sidebar text-sidebar-foreground p-4 grid grid-cols-[200px_1fr] gap-4 min-h-[380px]">
      {/* Sidebar */}
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1.5 text-[11px] font-mono text-sidebar-foreground/40 uppercase tracking-widest mb-1">
          Workspace
        </div>
        {['Overview', 'Agents', 'Runs', 'Logs', 'Devices', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
              i === 0
                ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
            {item}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">Overview</div>
            <div className="text-xs text-sidebar-foreground/50 font-mono">workspace / default</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono text-accent">3 agents running</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Agents', value: '6' },
            { label: 'Runs today', value: '142' },
            { label: 'Events', value: '1.2k' },
            { label: 'Devices', value: '2' },
          ].map((stat) => (
            <div key={stat.label} className="bg-sidebar-accent/50 rounded p-2">
              <div className="text-xs text-sidebar-foreground/50">{stat.label}</div>
              <div className="text-lg font-bold text-sidebar-foreground font-mono">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Log lines */}
        <div className="bg-black/30 rounded p-3 flex-1 font-mono text-[11px] leading-relaxed space-y-0.5">
          {[
            { t: '10:42:01', msg: 'agent/scraper        → started run #142', c: 'text-accent' },
            { t: '10:42:03', msg: 'agent/scraper        ← fetched 48 records', c: 'text-sidebar-foreground/60' },
            { t: '10:42:04', msg: 'agent/classifier     → processing batch', c: 'text-accent' },
            { t: '10:42:06', msg: 'device/rpi-001       ← heartbeat OK', c: 'text-green-400' },
            { t: '10:42:07', msg: 'agent/notifier       → dispatched webhook', c: 'text-sidebar-foreground/60' },
          ].map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-sidebar-foreground/30 shrink-0">{line.t}</span>
              <span className={line.c}>{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
