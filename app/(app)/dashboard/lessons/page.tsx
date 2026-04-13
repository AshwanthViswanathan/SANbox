import { PageHeader } from '@/components/app/page-header'
import { LessonAssignmentPanel } from '@/components/app/lesson-assignment-panel'
import { getDeviceSnapshots, getLessonUsage } from '@/lib/parent-dashboard-data'

export default async function LessonsPage() {
  const [lessons, devices] = await Promise.all([getLessonUsage(), getDeviceSnapshots()])
  const activeLessons = lessons.filter((lesson) => lesson.usageCount > 0).length
  const assignedLessons = devices.filter((device) => device.lessonState.assigned_lesson).length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lessons"
        badge={`${activeLessons}/${lessons.length} ACTIVE`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <LessonStat label="Lesson library" value={String(lessons.length)} />
        <LessonStat label="Used in sessions" value={String(activeLessons)} />
        <LessonStat
          label="Assigned devices"
          value={`${assignedLessons}/${devices.length}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {lessons.map((lesson) => {
          const isActive = lesson.usageCount > 0

          return (
            <article key={lesson.lesson_id} className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">{lesson.title}</h2>
                  </div>
                  <span className="rounded-full bg-slate-200/50 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-slate-600">
                    {lesson.grade_band}
                  </span>
                </div>
              </div>

              <div className="space-y-6 px-6 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                    {lesson.topic}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                        : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
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

                <p className="text-sm leading-6 text-slate-500">
                  Parents can confirm that the lesson exists, see which grade band it targets, and verify that the session
                  really ran as a guided lesson dive instead of free chat.
                </p>

                <LessonAssignmentPanel
                  lesson={lesson}
                  devices={devices.map((device) => ({
                    id: device.id,
                    name: device.name,
                    status: device.status,
                    lessonState: device.lessonState,
                  }))}
                />
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
    <div className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm px-6 py-6 transition-all hover:-translate-y-1 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function LessonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 px-5 py-4 ring-1 ring-slate-900/5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
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
