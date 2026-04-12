import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LifeBuoy, Mic, ShieldAlert, Waves } from 'lucide-react'
import shorelineImage from '@/docs/360_F_603755850_EmEXsTLLSljHRiazimrAya1HukruzkjO.jpg'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden px-0 pb-20 pt-28">
      <div className="absolute inset-0 beach-shell" />
      <div className="wave-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,244,214,0.7))]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative isolate pb-4">
            <div className="pointer-events-none absolute inset-x-[-2rem] inset-y-[-1.5rem] -z-10 overflow-hidden rounded-[2rem] opacity-80">
              <Image
                src={shorelineImage}
                alt=""
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,243,0.96),rgba(255,250,243,0.9),rgba(255,250,243,0.58))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_30%)]" />
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-primary shadow-sm">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              Beach-themed voice companion for curious kids
            </div>

            <p className="font-beach-accent text-lg font-semibold tracking-[0.08em] text-primary">Meet San</p>
            <h1 className="font-beach-display mt-3 max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-balance text-foreground sm:text-6xl md:text-7xl">
              SANbox turns every question into a calm shoreline lesson.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              San guides kids through safe voice conversations, short lesson dives, and playful beach-side
              explanations while parents keep a clear view of each session.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  Open SANbox Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pi">See Shore Demo</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { icon: <Mic className="h-4 w-4" />, label: 'Button-to-talk learning chats' },
                { icon: <ShieldAlert className="h-4 w-4" />, label: 'Safe replies with parent review' },
                { icon: <LifeBuoy className="h-4 w-4" />, label: 'San keeps the lesson on course' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="beach-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/70 bg-white/60 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">SANbox family dashboard</p>
                  <p className="text-xs text-muted-foreground">Dive into recent sessions, lessons, and device health.</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-secondary-foreground">
                  <Waves className="h-3 w-3" />
                  Live tide
                </div>
              </div>
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="grid min-h-[420px] grid-cols-[200px_1fr] gap-4 bg-[linear-gradient(180deg,rgba(241,252,250,0.92),rgba(255,248,238,0.94))] p-4 text-sidebar-foreground">
      <div className="flex flex-col gap-1">
        <div className="mb-1 px-2 py-1.5 text-[11px] font-mono uppercase tracking-widest text-sidebar-foreground/40">
          Family cove
        </div>
        {['Beach overview', 'Sessions', 'Lessons', 'Devices', 'Safeguards', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
              i === 0
                ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
            {item}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">Shoreline overview</div>
            <div className="font-mono text-xs text-sidebar-foreground/50">family / sanbox-home</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-xs text-primary">1 live learning wave</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'SANboxes', value: '2' },
            { label: 'Lesson dives', value: '14' },
            { label: 'Safe turns', value: '98%' },
            { label: 'Tide checks', value: '1' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/55 p-3">
              <div className="text-xs text-sidebar-foreground/50">{stat.label}</div>
              <div className="font-mono text-lg font-bold text-sidebar-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-0.5 rounded-2xl bg-[rgba(17,24,39,0.78)] p-3 font-mono text-[11px] leading-relaxed">
          {[
            { t: '10:42:01', msg: 'device/pi-001        -> listening for a shoreline question', c: 'text-sky-300' },
            { t: '10:42:03', msg: 'cloud/safeguard      <- input marked SAFE', c: 'text-slate-300' },
            { t: '10:42:04', msg: 'agent/san            -> explaining moon-driven tides', c: 'text-amber-300' },
            { t: '10:42:06', msg: 'cloud/tts            <- sending answer back to device', c: 'text-emerald-300' },
            { t: '10:42:07', msg: 'parent/summary       -> session note updated', c: 'text-slate-300' },
          ].map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-sidebar-foreground/30">{line.t}</span>
              <span className={line.c}>{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
