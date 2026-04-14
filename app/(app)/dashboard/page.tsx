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

import { FlagDeleteButton } from '@/components/app/flag-delete-button'
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
  const statCardSurfaces = [
    'bg-[linear-gradient(180deg,rgba(255,251,245,0.96),rgba(255,245,235,0.92))]',
    'bg-[linear-gradient(180deg,rgba(241,250,248,0.96),rgba(228,244,240,0.92))]',
    'bg-[linear-gradient(180deg,rgba(241,247,255,0.96),rgba(228,239,250,0.92))]',
    'bg-[linear-gradient(180deg,rgba(255,248,238,0.96),rgba(247,237,222,0.92))]',
  ]
  const listCardSurfaces = [
    'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,247,240,0.94))]',
    'bg-[linear-gradient(180deg,rgba(244,251,249,0.98),rgba(236,246,242,0.94))]',
    'bg-[linear-gradient(180deg,rgba(245,249,255,0.98),rgba(236,243,250,0.94))]',
  ]

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden px-5 py-6 md:px-6 md:py-7">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] overflow-hidden">
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

        <div className="max-w-3xl px-5 py-5 sm:px-6">
          <h2 className="font-beach-vibe max-w-2xl text-4xl font-semibold tracking-[0.05em] text-slate-900 drop-shadow-sm md:text-5xl">
            SANbox Dashboard
          </h2>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild className="rounded-full shadow-sm">
              <Link href="/dashboard/sessions">Open sessions</Link>
            </Button>
            <Button variant="outline" className="rounded-full shadow-sm bg-white/60 backdrop-blur-md border-white/50" asChild>
              <Link href="/dashboard/sessions?filter=flagged">Needs review</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const surfaceClassName = statCardSurfaces[index % statCardSurfaces.length]

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`group rounded-[1.5rem] p-5 ring-1 ring-slate-900/5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${surfaceClassName}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                  <p className={`mt-2 font-sans text-3xl font-extrabold ${stat.valueClassName ?? 'text-slate-900'}`}>{stat.value}</p>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 transition-transform group-hover:scale-110 ${stat.iconClassName ?? 'text-slate-600'}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 leading-snug">{stat.sub}</p>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="py-2">
          <div className="flex items-center justify-between px-3 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100/40">
                <Clock3 className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.35)]">Session History</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full shadow-sm font-semibold" asChild>
              <Link href="/dashboard/sessions" className="gap-1">
                All sessions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4 px-2 pb-4">
            {sessions.slice(0, 5).map((session, index) => (
              <Link
                key={session.session_id}
                href={`/dashboard/sessions/${session.session_id}`}
                className={`group block rounded-[1.5rem] px-5 py-5 ring-1 ring-slate-900/5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${listCardSurfaces[index % listCardSurfaces.length]}`}
              >
                <div className="grid gap-4 md:grid-cols-[1.1fr_0.8fr_auto]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{session.session_id}</p>
                      <ModeBadge mode={session.mode} />
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {session.device_id} - started {formatDateTime(session.started_at)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Turns" value={String(session.turn_count)} />
                    <Metric label="Flagged" value={String(session.flagged_count)} />
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Last reply</p>
                    <p className="mt-1 font-bold text-slate-900">{formatTime(session.last_turn_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="py-1">
          <div className="flex items-center justify-between px-3 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100/50">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.35)]">Safety Review</p>
              </div>
            </div>
          </div>

          {flaggedTurns.length === 0 ? (
            <div className="px-2 py-4">
              <div className="rounded-[1.5rem] bg-white ring-1 ring-slate-900/5 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No flagged turns</h3>
                <p className="mt-2 text-sm font-medium text-slate-500 max-w-[250px] leading-relaxed">
                  Everything in the current demo sessions passed through cleanly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-2 py-4">
              {flaggedTurns.slice(0, 4).map(({ sessionId, deviceId, mode, turn }, index) => {
                return (
                  <div
                    key={turn.turn_id}
                    className={`group relative rounded-[1.5rem] px-5 py-5 ring-1 ring-slate-900/5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${listCardSurfaces[(index + 1) % listCardSurfaces.length]}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <SafeguardBadge label={turn.input_label} />
                        <ModeBadge mode={mode} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-slate-500">{formatTime(turn.created_at)}</p>
                        <FlagDeleteButton
                          sessionId={sessionId}
                          turnId={turn.turn_id}
                        />
                      </div>
                    </div>
                    <Link href={`/dashboard/sessions/${sessionId}`} className="block">
                      <p className="mt-4 text-sm font-bold text-slate-900">{turn.transcript}</p>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-600">{turn.assistant_text}</p>
                      <p className="mt-4 text-[11px] font-mono font-medium text-slate-400">
                        {sessionId} - {deviceId}
                      </p>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1 py-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-extrabold text-slate-900">{value}</p>
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
