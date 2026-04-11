import { notFound } from 'next/navigation'
import { Bot, Headphones, ShieldAlert, UserRound } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { ModeBadge, SafeguardBadge } from '@/components/app/teachbox-badges'
import { getLessons, getParentSessionDetail, getSessionSummaryById } from '@/lib/parent-dashboard-data'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [detail, summary, lessons] = await Promise.all([
    getParentSessionDetail(id),
    getSessionSummaryById(id),
    getLessons(),
  ])

  if (!summary) {
    notFound()
  }

  const lesson = detail.session.lesson_id
    ? lessons.find((entry) => entry.lesson_id === detail.session.lesson_id) ?? null
    : null

  const flaggedTurns = detail.turns.filter(
    (turn) => turn.input_label !== 'SAFE' || (turn.output_label !== null && turn.output_label !== 'SAFE')
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session ${id}`}
        description={`Review the turn-by-turn timeline, safeguard labels, and lesson context for this conversation.`}
        badge={summary.flagged_count > 0 ? 'REVIEW' : 'CLEAR'}
      />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SessionMetaCard label="Device" value={summary.device_id} />
            <SessionMetaCard label="Started" value={formatDateTime(summary.started_at)} />
            <SessionMetaCard label="Last turn" value={formatDateTime(summary.last_turn_at)} />
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Session timeline</p>
                <ModeBadge mode={summary.mode} />
                {flaggedTurns > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-destructive">
                    <ShieldAlert className="h-3 w-3" />
                    {flaggedTurns} FLAGGED TURN{flaggedTurns > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Child transcript and TeachBox reply are paired in order of playback.
              </p>
            </div>

            <div className="space-y-6 px-4 py-5 md:px-5">
              {detail.turns.map((turn, index) => {
                const blocked = turn.blocked

                return (
                  <div key={turn.turn_id} className="relative">
                    {index < detail.turns.length - 1 && (
                      <div className="absolute left-4 top-10 hidden h-[calc(100%-0.5rem)] w-px bg-border md:block" />
                    )}

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">Child</p>
                            <p className="text-xs text-muted-foreground">{formatTime(turn.created_at)}</p>
                            <SafeguardBadge label={turn.input_label} />
                          </div>
                          <div className="mt-2 rounded-[1.25rem] rounded-tl-sm border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm">
                            {turn.transcript}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            blocked
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-accent text-accent-foreground'
                          }`}
                        >
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">TeachBox reply</p>
                            {turn.output_label && <SafeguardBadge label={turn.output_label} />}
                            {blocked && (
                              <span className="inline-flex items-center rounded-full bg-destructive px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-destructive-foreground">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div
                            className={`mt-2 rounded-[1.25rem] rounded-tl-sm border px-4 py-3 text-sm leading-6 shadow-sm ${
                              blocked
                                ? 'border-destructive/25 bg-destructive/5 text-foreground'
                                : 'border-border bg-[rgba(228,244,245,0.38)] text-foreground'
                            }`}
                          >
                            {turn.assistant_text}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Headphones className="h-3.5 w-3.5" />
                            {blocked ? 'Fallback safety reply was spoken.' : 'Audio was returned to the device.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="text-sm font-semibold text-foreground">Session context</p>
            <div className="mt-4 space-y-3">
              <ContextRow label="Mode" value={summary.mode === 'lesson' ? 'Lesson mode' : 'Free chat'} />
              <ContextRow label="Turns" value={String(summary.turn_count)} />
              <ContextRow label="Flagged" value={String(summary.flagged_count)} />
              <ContextRow label="Session visibility" value={summary.flagged_count > 0 ? 'Needs review' : 'All clear'} />
            </div>
          </div>

          <div className="panel p-4">
            <p className="text-sm font-semibold text-foreground">Lesson status</p>
            {lesson ? (
              <div className="mt-4 rounded-[1.25rem] border border-border bg-muted/35 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                  <span className="rounded-full bg-accent/12 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-accent">
                    {lesson.grade_band}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{lesson.topic}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  This session stayed inside a structured lesson flow with explicit lesson visibility.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                This session ran in free chat mode and was not attached to a lesson.
              </p>
            )}
          </div>

          <div className="panel p-4">
            <p className="text-sm font-semibold text-foreground">Review notes</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="rounded-2xl bg-muted/35 px-3 py-3">
                Parent review is centered on child transcript, assistant reply, and safeguard labels.
              </li>
              <li className="rounded-2xl bg-muted/35 px-3 py-3">
                Blocked turns return a warm fallback and remain visibly marked in the session history.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}

function SessionMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
