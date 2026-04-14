import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock3, ShieldAlert } from 'lucide-react'
import sereneBeachImage from '@/docs/serene-beach-landscape-calm-waters-gentle-waves-free-vector.jpg'

import { ClearSessionsButton } from '@/components/app/clear-sessions-button'
import { EmptyState } from '@/components/app/empty-state'
import { SessionDeleteButton } from '@/components/app/session-delete-button'
import { ModeBadge } from '@/components/app/teachbox-badges'
import { Button } from '@/components/ui/button'
import { getParentSessions } from '@/lib/parent-dashboard-data'

type SessionFilter = 'all' | 'flagged' | 'lesson' | 'free_chat'

const FILTER_BADGES: Record<Exclude<SessionFilter, 'all'>, string> = {
  flagged: 'FLAGGED',
  lesson: 'LESSON',
  free_chat: 'FREE CHAT',
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sessions = await getParentSessions()
  const { filter } = await searchParams
  const activeFilter = normalizeFilter(filter)

  const filteredSessions = sessions.filter((session) => {
    if (activeFilter === 'flagged') return session.flagged_count > 0
    if (activeFilter === 'lesson') return session.mode === 'lesson'
    if (activeFilter === 'free_chat') return session.mode === 'free_chat'
    return true
  })

  const filters: { key: SessionFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All sessions', count: sessions.length },
    { key: 'flagged', label: 'Needs review', count: sessions.filter((session) => session.flagged_count > 0).length },
    { key: 'lesson', label: 'Lesson mode', count: sessions.filter((session) => session.mode === 'lesson').length },
    { key: 'free_chat', label: 'Free chat', count: sessions.filter((session) => session.mode === 'free_chat').length },
  ]

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] px-5 py-6 md:px-6 md:py-7">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src={sereneBeachImage}
            alt=""
            fill
            priority
            className="object-cover object-[center_62%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(252,247,225,0.94),rgba(252,247,225,0.88),rgba(252,247,225,0.68))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_34%)]" />
        </div>

        <div className="flex flex-col justify-center max-w-3xl space-y-4 px-1 py-5 sm:px-2">
          <h2 className="stitch-heading text-4xl md:text-5xl text-slate-900 drop-shadow-sm">
            Sessions
          </h2>
        </div>
      </section>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-3">
        {filters.map((item) => {
          const isActive = item.key === activeFilter
          const href = item.key === 'all' ? '/dashboard/sessions' : `/dashboard/sessions?filter=${item.key}`

          return (
            <Button
              key={item.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              asChild
              className="min-w-fit"
            >
              <Link href={href}>
                {item.label}
                <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono dark:bg-white/10">
                  {item.count}
                </span>
              </Link>
            </Button>
          )
        })}
        </div>
        <div className="w-full sm:w-auto sm:min-w-[22rem]">
          <ClearSessionsButton sessionCount={sessions.length} />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="stitch-panel">
          <EmptyState
            icon={<Clock3 className="h-5 w-5" />}
            title="No sessions in this view"
            description="The current filter does not match any of the available demo sessions."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <article key={session.session_id} className="stitch-card overflow-hidden px-5 py-5">
              <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:px-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {session.session_id}
                    </p>
                    <ModeBadge mode={session.mode} />
                    {session.flagged_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-destructive">
                        <ShieldAlert className="h-3 w-3" />
                        {session.flagged_count} FLAGGED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Device {session.device_id} - started {formatDateTime(session.started_at)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SessionMetric label="Turns" value={String(session.turn_count)} />
                  <SessionMetric label="Last turn" value={formatTime(session.last_turn_at)} />
                  <SessionMetric label="Visibility" value={session.flagged_count > 0 ? 'Review' : 'Clear'} />
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <Button asChild>
                    <Link href={`/dashboard/sessions/${session.session_id}`}>
                      Open session
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <SessionDeleteButton
                    sessionId={session.session_id}
                    sessionLabel={`session ${session.session_id}`}
                    buttonClassName="lg:w-auto"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function normalizeFilter(value?: string): SessionFilter {
  if (value === 'flagged' || value === 'lesson' || value === 'free_chat') {
    return value
  }

  return 'all'
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
