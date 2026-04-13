import { notFound } from 'next/navigation'
import { Bot, Headphones, ShieldAlert, UserRound } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { ModeBadge, SafeguardBadge } from '@/components/app/teachbox-badges'
import { LatexText } from '@/components/pi/latex-text'
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
    <div className="space-y-8">
      <PageHeader
        title={`Session ${id}`}
        description={`Review the turn-by-turn timeline, safeguard labels, and lesson context for this conversation.`}
        badge={summary.flagged_count > 0 ? 'REVIEW' : 'CLEAR'}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SessionMetaCard label="Device" value={summary.device_id} />
            <SessionMetaCard label="Started" value={formatDateTime(summary.started_at)} />
            <SessionMetaCard label="Last turn" value={formatDateTime(summary.last_turn_at)} />
          </div>

          <div className="stitch-panel overflow-hidden p-2">
            <div className="rounded-[1.5rem] bg-white/70 px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="stitch-label text-primary">Conversation log</p>
                  <p className="stitch-heading mt-2 text-2xl">Child and San</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ModeBadge mode={summary.mode} />
                  {flaggedTurns > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-destructive">
                      <ShieldAlert className="h-3 w-3" />
                      {flaggedTurns} FLAGGED TURN{flaggedTurns > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Child transcript and the SANbox reply are paired in order of playback.
              </p>
            </div>

            <div className="space-y-6 bg-surface-container-low/40 px-6 py-6 md:px-8">
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
                          <div className="mt-2 rounded-l-[2rem] rounded-br-[2rem] border border-[color:rgba(178,173,154,0.18)] bg-white px-5 py-4 text-sm leading-7 text-foreground shadow-sm">
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
                            <p className="text-sm font-semibold text-foreground">SANbox reply</p>
                            {turn.output_label && <SafeguardBadge label={turn.output_label} />}
                            {blocked && (
                              <span className="inline-flex items-center rounded-full bg-destructive px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-destructive-foreground">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div
                            className={`mt-2 rounded-r-[2rem] rounded-bl-[2rem] border px-5 py-4 text-sm leading-7 shadow-sm ${
                              blocked
                                ? 'border-destructive/25 bg-destructive/5 text-foreground'
                                : 'border-primary-container/25 bg-primary-container/50 text-on-primary-container'
                            }`}
                          >
                            <LatexText
                                text={turn.assistant_text || ''}
                                className="[&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
                            />
                          </div>
                          {turn.assistant_example && (
                            <div className="mt-3 rounded-[1.5rem] border border-accent/20 bg-white/80 px-5 py-4 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                                  Example
                                </span>
                              </div>
                              <LatexText
                                text={normalizeAssistantExample(turn.assistant_example)}
                                className="mt-3 text-sm leading-7 text-foreground [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
                              />
                            </div>
                          )}
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
          <div className="stitch-card p-5">
            <p className="stitch-label">Session context</p>
            <div className="mt-4 space-y-3">
              <ContextRow label="Mode" value={summary.mode === 'lesson' ? 'Lesson mode' : 'Free chat'} />
              <ContextRow label="Turns" value={String(summary.turn_count)} />
              <ContextRow label="Flagged" value={String(summary.flagged_count)} />
              <ContextRow label="Session visibility" value={summary.flagged_count > 0 ? 'Needs review' : 'All clear'} />
            </div>
          </div>

          <div className="stitch-card p-5">
            <p className="stitch-label">Lesson status</p>
            {lesson ? (
              <div className="mt-4 rounded-[1.5rem] bg-surface-container-low px-4 py-4">
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

          <div className="stitch-card p-5">
            <p className="stitch-label">Review notes</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
                Parent review is centered on child transcript, assistant reply, and safeguard labels.
              </li>
              <li className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
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
    <div className="stitch-card px-4 py-4">
      <p className="stitch-label">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[1.25rem] bg-surface-container-low px-4 py-4">
      <p className="stitch-label">{label}</p>
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

function normalizeAssistantExample(value: string) {
  return value.replace(/^Example:\s*/i, '').trim()
}
