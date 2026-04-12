import { BookOpen } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { getLessonUsage } from '@/lib/parent-dashboard-data'

export default async function LessonsPage() {
  const lessons = await getLessonUsage()
  const activeLessons = lessons.filter((lesson) => lesson.usageCount > 0).length
  const latestLessonTurn = lessons.find((lesson) => lesson.latestSessionAt)?.latestSessionAt ?? null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lessons"
        description="Markdown-backed lesson modules available to the SANbox parent dashboard."
        badge={`${activeLessons}/${lessons.length} ACTIVE`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <LessonStat label="Lesson library" value={String(lessons.length)} />
        <LessonStat label="Used in sessions" value={String(activeLessons)} />
        <LessonStat
          label="Most recent lesson turn"
          value={latestLessonTurn ? formatDate(latestLessonTurn) : 'No usage yet'}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {lessons.map((lesson) => {
          const isActive = lesson.usageCount > 0

          return (
            <article key={lesson.lesson_id} className="stitch-card overflow-hidden">
              <div className="bg-[linear-gradient(135deg,rgba(94,177,252,0.14),rgba(255,255,255,0.92))] px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="stitch-pill bg-white/80 text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {lesson.lesson_id}
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{lesson.title}</h2>
                  </div>
                  <span className="rounded-full bg-accent/12 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-accent">
                    {lesson.grade_band}
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {lesson.topic}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isActive ? 'Seen in demo sessions' : 'Not used yet'}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LessonMetric label="Session count" value={String(lesson.usageCount)} />
                  <LessonMetric
                    label="Last seen"
                    value={lesson.latestSessionAt ? formatDate(lesson.latestSessionAt) : 'Waiting for first run'}
                  />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  Parents can confirm that the lesson exists, see which grade band it targets, and verify that the session
                  really ran as a guided lesson dive instead of free chat.
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function LessonStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stitch-card px-5 py-5">
      <p className="stitch-label">{label}</p>
      <p className="stitch-heading mt-2 text-2xl">{value}</p>
    </div>
  )
}

function LessonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-4">
      <p className="stitch-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
