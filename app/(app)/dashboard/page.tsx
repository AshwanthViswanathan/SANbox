import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cpu,
  MessageSquareText,
  ShieldAlert,
} from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { ModeBadge, SafeguardBadge } from '@/components/app/teachbox-badges'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/app/empty-state'
import { getDashboardOverview, getDeviceSnapshots } from '@/lib/parent-dashboard-data'

export default async function DashboardOverview() {
  const [{ sessions, flaggedTurns, stats }, devices] = await Promise.all([
    getDashboardOverview(),
    getDeviceSnapshots(),
  ])

  const statCards = [
    {
      label: 'Sessions',
      value: String(stats.totalSessions),
      sub: `${stats.totalTurns} turns captured`,
      icon: MessageSquareText,
      href: '/dashboard/sessions',
    },
    {
      label: 'Tide checks',
      value: String(stats.flaggedTurns),
      sub: 'Flagged child-safe moments',
      icon: ShieldAlert,
      href: '/dashboard/sessions?filter=flagged',
    },
    {
      label: 'Lesson dives',
      value: String(stats.lessonSessions),
      sub: 'Structured learning runs',
      icon: BookOpen,
      href: '/dashboard/lessons',
    },
    {
      label: 'Devices online',
      value: `${stats.activeDevices}/${devices.length}`,
      sub: 'Current shoreline pulse',
      icon: Cpu,
      href: '/dashboard/devices',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="SANbox Dashboard"
        description="Dive into your child's learning sessions, review flagged turns, and keep an eye on lesson use."
        badge="DEMO READY"
      />

      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(135deg,rgba(255,251,245,0.95),rgba(233,249,247,0.95),rgba(224,242,254,0.85))]">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.7fr_1fr] md:px-6 md:py-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Shoreline review
            </div>
            <div className="space-y-2">
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                One calm shore to review what your child heard, asked, and learned.
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                Track every learning wave, spot rough-water moments quickly, and keep device health simple
                enough for a live demo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/sessions?filter=flagged">Review tide checks</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/lessons">Browse lesson dives</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/60 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Today at a glance</p>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              {sessions.slice(0, 3).map((session) => (
                <Link
                  key={session.session_id}
                  href={`/dashboard/sessions/${session.session_id}`}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-3 py-3 transition-colors hover:border-accent/40 hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{session.device_id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(session.last_turn_at)} - {session.turn_count} turns
                    </p>
                  </div>
                  <ModeBadge mode={session.mode} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="panel group px-4 py-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                </div>
                <span className="rounded-2xl bg-accent/10 p-2 text-accent transition-transform group-hover:-translate-y-0.5">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stat.sub}</p>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Recent sessions</p>
              <p className="text-xs text-muted-foreground">Latest shoreline activity across lesson mode and free chat.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/sessions" className="gap-1">
                All sessions
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {sessions.slice(0, 5).map((session) => (
              <Link
                key={session.session_id}
                href={`/dashboard/sessions/${session.session_id}`}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/35 md:grid-cols-[1.2fr_0.8fr_auto]"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{session.session_id}</p>
                    <ModeBadge mode={session.mode} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.device_id} - started {formatDateTime(session.started_at)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Turns" value={String(session.turn_count)} />
                  <Metric label="Flagged" value={String(session.flagged_count)} />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Last reply</p>
                  <p className="mt-1 font-medium text-foreground">{formatTime(session.last_turn_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">Flagged queue</p>
                <p className="text-xs text-muted-foreground">Borderline and blocked moments that need extra context.</p>
              </div>
            </div>
          </div>

          {flaggedTurns.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              title="No flagged turns"
              description="Everything in the current demo sessions passed through cleanly."
            />
          ) : (
            <div className="divide-y divide-border">
              {flaggedTurns.slice(0, 4).map(({ sessionId, deviceId, mode, turn }) => (
                <Link
                  key={turn.turn_id}
                  href={`/dashboard/sessions/${sessionId}`}
                  className="block px-4 py-4 transition-colors hover:bg-muted/35"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SafeguardBadge label={turn.input_label} />
                      <ModeBadge mode={mode} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(turn.created_at)}</p>
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{turn.transcript}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{turn.assistant_text}</p>
                  <p className="mt-3 text-xs font-mono text-muted-foreground">
                    {sessionId} - {deviceId}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
