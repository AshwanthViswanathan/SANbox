import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LifeBuoy, Mic, ShieldAlert, Waves } from 'lucide-react'
import shorelineImage from '@/docs/360_F_603755850_EmEXsTLLSljHRiazimrAya1HukruzkjO.jpg'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden px-0 pt-24">
      <div className="wave-grid absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-28 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/16 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-6rem)] max-w-7xl items-center px-4 pb-16 sm:px-6">
        <div className="grid w-full items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative isolate py-8 lg:py-14">
            <div className="pointer-events-none absolute inset-x-[-2rem] inset-y-[-1rem] -z-10 overflow-hidden rounded-[2.5rem] opacity-90">
              <Image
                src={shorelineImage}
                alt=""
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(252,247,225,0.98),rgba(252,247,225,0.92),rgba(252,247,225,0.58))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_30%)]" />
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-primary shadow-sm">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              Voice-first learning for curious kids
            </div>

            <p className="font-beach-accent text-lg font-semibold tracking-[0.08em] text-primary">Meet San</p>
            <h1 className="font-beach-display mt-3 max-w-3xl text-5xl font-bold leading-[0.92] tracking-tight text-balance text-foreground drop-shadow-[0_8px_24px_rgba(252,247,225,0.45)] sm:text-6xl md:text-7xl">
              SANbox gives kids a calm voice guide and parents a clear session trail.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-foreground/80 sm:text-lg">
              Ask a question, hear a grounded answer, and keep every lesson turn reviewable. The experience stays playful for children and legible for adults.
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

            <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { icon: <Mic className="h-4 w-4" />, label: 'Button-to-talk learning chats' },
                { icon: <ShieldAlert className="h-4 w-4" />, label: 'Safe replies with parent review' },
                { icon: <LifeBuoy className="h-4 w-4" />, label: 'A guided voice companion named San' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/55 bg-white/52 px-4 py-4 text-sm text-muted-foreground backdrop-blur-sm">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </span>
                  <p className="leading-6">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative self-start lg:pl-6">
            <div className="stitch-panel overflow-hidden p-2">
              <div className="flex items-center justify-between rounded-[1.5rem] bg-white/72 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">SANbox family dashboard</p>
                  <p className="text-xs text-muted-foreground">A stitched view of sessions, safeguards, and device health.</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-secondary-foreground">
                  <Waves className="h-3 w-3" />
                  Live session
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
    <div className="grid min-h-[440px] grid-cols-[200px_1fr] gap-4 bg-[linear-gradient(180deg,rgba(247,241,217,0.54),rgba(241,252,250,0.82))] p-4 text-sidebar-foreground">
      <div className="stitch-card flex flex-col gap-1 px-3 py-4">
        <div className="mb-2 px-2 py-1.5 text-[11px] font-mono uppercase tracking-widest text-sidebar-foreground/40">
          Family cove
        </div>
        {['Beach overview', 'Sessions', 'Lessons', 'Devices', 'Safeguards', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
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
        <div className="stitch-card flex items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">Session history</div>
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
            <div key={stat.label} className="stitch-card rounded-[1.3rem] p-3">
              <div className="text-xs text-sidebar-foreground/50">{stat.label}</div>
              <div className="font-mono text-lg font-bold text-sidebar-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-0.5 rounded-[1.75rem] bg-[rgba(17,24,39,0.78)] p-4 font-mono text-[11px] leading-relaxed">
          {[
            { t: '10:42:01', msg: 'Sanbox is ready and waiting for your child to ask a question.', c: 'text-sky-300' },
            { t: '10:42:03', msg: "The question is checked to make sure the conversation stays child-safe.", c: 'text-slate-300' },
            { t: '10:42:04', msg: 'San gives a clear answer about how ocean tides work.', c: 'text-amber-300' },
            { t: '10:42:06', msg: 'The answer is spoken back out loud through the device.', c: 'text-emerald-300' },
            { t: '10:42:07', msg: 'A simple summary is saved so parents can review it later.', c: 'text-slate-300' },
          ].map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-sidebar-foreground/70">{line.t}</span>
              <span className={line.c}>{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
