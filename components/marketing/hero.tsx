import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LifeBuoy, Mic, ShieldAlert } from 'lucide-react'
import shorelineImage from '@/docs/360_F_603755850_EmEXsTLLSljHRiazimrAya1HukruzkjO.jpg'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden px-0 pt-24">
      <div className="wave-grid absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-28 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/16 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-6rem)] max-w-7xl items-center px-4 pb-10 sm:px-6">
        <div className="grid w-full items-start gap-10 lg:grid-cols-[1fr_1fr] lg:items-stretch">
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

            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-1 py-2 text-xs font-mono uppercase tracking-[0.2em] text-primary">
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
                <Link
                  href="https://docs.google.com/forms/d/e/1FAIpQLScmsG8Vh71b03CKwSlM6tsFL_4tGIE7QnAVuWFS3GtgVRYJgw/viewform?usp=publish-editor"
                  target="_blank"
                  rel="noreferrer"
                >
                  Early access
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pi">Demo</Link>
              </Button>
            </div>

            <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { icon: <Mic className="h-4 w-4" />, label: 'Button-to-talk learning chats' },
                { icon: <ShieldAlert className="h-4 w-4" />, label: 'Safe replies with parent review' },
                { icon: <LifeBuoy className="h-4 w-4" />, label: 'A guided voice companion named San' },
              ].map((item) => (
                <div key={item.label} className="px-1 py-2 text-sm text-muted-foreground">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </span>
                  <p className="leading-6">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-2">
            <div className="h-full overflow-hidden p-0">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  const previewLinks = [
    { label: 'Beach overview', href: '/dashboard' },
    { label: 'Sessions', href: '/dashboard/sessions' },
    { label: 'Lessons', href: '/dashboard/lessons' },
    { label: 'Devices', href: '/dashboard/devices' },
    { label: 'Safeguards', href: '/dashboard/sessions?filter=flagged' },
    { label: 'Settings', href: '/dashboard/settings' },
  ]
  const previewCardClass =
    'border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(245,250,252,0.42))] shadow-[0_18px_40px_-28px_rgba(0,95,153,0.22)] backdrop-blur-sm'
  const statPanelSurfaces = [
    'bg-[linear-gradient(180deg,rgba(255,248,238,0.92),rgba(248,238,222,0.82))]',
    'bg-[linear-gradient(180deg,rgba(236,249,246,0.92),rgba(220,240,235,0.82))]',
    'bg-[linear-gradient(180deg,rgba(236,245,255,0.92),rgba(222,236,249,0.82))]',
    'bg-[linear-gradient(180deg,rgba(245,240,230,0.92),rgba(233,225,211,0.82))]',
  ]

  return (
    <div className="grid min-h-[620px] grid-cols-[240px_1fr] gap-5 bg-transparent px-6 pb-6 pt-0 text-sidebar-foreground">
      <div className="rounded-[1.75rem] border border-white/45 bg-[linear-gradient(180deg,rgba(244,251,248,0.76),rgba(223,240,232,0.48))] px-5 py-6 shadow-[0_18px_40px_-28px_rgba(0,95,153,0.22)] backdrop-blur-sm">
        <div className="mb-4 px-2 py-2 text-sm font-mono uppercase tracking-widest text-sidebar-foreground/40">
          Family cove
        </div>
        {previewLinks.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-full px-5 py-4 text-lg ${
              i === 0
                ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                : 'text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-40" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className={`${previewCardClass} rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,249,241,0.86),rgba(238,246,248,0.6))] px-6 py-6`}>
          <div>
            <div className="text-lg font-semibold text-sidebar-foreground">Session history</div>
            <div className="font-mono text-base text-sidebar-foreground/50">family / sanbox-home</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-base text-primary">1 live learning wave</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {[
            { label: 'SANboxes', value: '2' },
            { label: 'Lesson dives', value: '14' },
            { label: 'Safe turns', value: '98%' },
            { label: 'Tide checks', value: '1' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`${previewCardClass} ${statPanelSurfaces[index % statPanelSurfaces.length]} min-w-0 rounded-[1.3rem] px-5 py-5`}
            >
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {stat.label}
              </div>
              <div className="mt-4 font-mono text-[2rem] font-bold leading-none text-sidebar-foreground">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-1.5 rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(19,30,46,0.86),rgba(29,43,62,0.82))] p-6 font-mono text-[13px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {[
            { t: '10:42:01', msg: 'Sanbox is ready and waiting for your child to ask a question.', c: 'text-sky-300' },
            { t: '10:42:03', msg: "The question is checked to make sure the conversation stays child-safe.", c: 'text-slate-300' },
            { t: '10:42:04', msg: 'San gives a clear answer about how ocean tides work.', c: 'text-amber-300' },
            { t: '10:42:06', msg: 'The answer is spoken back out loud through the device.', c: 'text-emerald-300' },
            { t: '10:42:07', msg: 'A simple summary is saved so parents can review it later.', c: 'text-slate-300' },
          ].map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-[12px] font-semibold tracking-[0.08em] text-white/95">
                {line.t}
              </span>
              <span className={line.c}>{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
