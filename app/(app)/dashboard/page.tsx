import Image from 'next/image'
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
import shorelineImage from '@/docs/at-sunset-flamingo-on-lake-scene-vector-21803974.avif'

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
      label: 'Weekly activity',
      value: String(stats.totalTurns),
      sub: 'Total captured turns across all sessions.',
      icon: MessageSquareText,
      href: '/dashboard/sessions',
      valueClassName: 'text-primary',
      iconClassName: 'text-primary',
    },
    {
      label: 'Safety flags',
      value: String(stats.flaggedTurns),
      sub: 'Moments that currently need parent review.',
      icon: ShieldAlert,
      href: '/dashboard/sessions?filter=flagged',
      valueClassName: 'text-tertiary',
      iconClassName: 'text-tertiary',
    },
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
    <div className="space-y-8">
      <PageHeader
        title="SANbox Dashboard"
        description="Dive into your child's learning sessions, review flagged turns, and keep an eye on lesson use."
        badge="DEMO"
      />

      <section className="relative isolate overflow-hidden rounded-[1.75rem] px-5 py-6 md:px-6 md:py-7">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src={shorelineImage}
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(252,247,225,0.92),rgba(252,247,225,0.86),rgba(252,247,225,0.68))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_32%)]" />
        </div>

        <div className="space-y-4">
          <div className="stitch-pill bg-tertiary-container/20 text-tertiary">
            Monitoring hub
          </div>
          <div className="space-y-2">
            <h2 className="stitch-heading max-w-2xl text-4xl md:text-5xl">
              Explore the shoreline of your child's latest sessions.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              The dashboard stays sessions-first: recent activity, safety review, device health, and
              lesson progress are all visible in one calm monitoring surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/sessions">Open sessions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/sessions?filter=flagged">Needs review</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="stitch-card group px-5 py-5 transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="stitch-label">{stat.label}</p>
                  <p className={`stitch-heading mt-3 text-3xl ${stat.valueClassName ?? ''}`}>{stat.value}</p>
                </div>
                <span
                  className={`rounded-full bg-primary-container/20 p-3 transition-transform group-hover:-translate-y-0.5 ${stat.iconClassName ?? 'text-primary'}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{stat.sub}</p>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="stitch-panel overflow-hidden p-2">
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <p className="stitch-label">Session history</p>
              <p className="stitch-heading mt-2 text-2xl">Recent sessions</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sessions" className="gap-1">
                All sessions
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3 px-4 pb-4">
            {sessions.slice(0, 5).map((session) => (
              <Link
                key={session.session_id}
                href={`/dashboard/sessions/${session.session_id}`}
                className="stitch-card grid gap-4 px-5 py-5 transition-all hover:-translate-y-0.5 md:grid-cols-[1.1fr_0.8fr_auto]"
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

        <div className="stitch-panel overflow-hidden p-2">
          <div className="flex items-center justify-between rounded-[1.5rem] bg-tertiary-container/18 px-5 py-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <div>
                <p className="stitch-label text-tertiary">Safety review</p>
                <p className="stitch-heading mt-1 text-2xl">Flagged queue</p>
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
            <div className="space-y-3 px-4 py-4">
              {flaggedTurns.slice(0, 4).map(({ sessionId, deviceId, mode, turn }) => (
                <Link
                  key={turn.turn_id}
                  href={`/dashboard/sessions/${sessionId}`}
                  className="stitch-card block px-5 py-5 transition-all hover:-translate-y-0.5"
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
