import { OVERVIEW_STATS, MOCK_SESSIONS, MOCK_SESSION_DETAILS, MOCK_DEVICES } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, MessageSquareText, ShieldAlert, BookOpen, Cpu, CheckCircle2 } from 'lucide-react'

const statCards = [
  {
    label: 'Sessions today',
    value: String(OVERVIEW_STATS.totalSessionsToday),
    sub: 'Active learning time',
    icon: <MessageSquareText className="w-4 h-4" />,
    href: '/dashboard/sessions',
  },
  {
    label: 'Flagged turns',
    value: String(OVERVIEW_STATS.flaggedTurnsToday),
    sub: 'Requires review',
    icon: <ShieldAlert className="w-4 h-4" />,
    href: '/dashboard/sessions?filter=flagged',
  },
  {
    label: 'Lessons used',
    value: String(OVERVIEW_STATS.lessonsUsedToday),
    sub: 'Curriculum progress',
    icon: <BookOpen className="w-4 h-4" />,
    href: '/dashboard/lessons',
  },
  {
    label: 'Active devices',
    value: `${OVERVIEW_STATS.activeDevices}/${MOCK_DEVICES.length}`,
    sub: 'Online now',
    icon: <Cpu className="w-4 h-4" />,
    href: '/dashboard/devices',
  },
]

const FLAGGED_TURNS = Object.entries(MOCK_SESSION_DETAILS)
  .flatMap(([sessionId, detail]) =>
    detail.turns
      .filter((turn) => turn.input_label !== 'SAFE' || turn.output_label !== 'SAFE')
      .map((turn) => ({ sessionId, turn }))
  )
  .slice(0, 3)

export default function DashboardOverview() {
  return (
    <div>
      <PageHeader
        title="Family Dashboard"
        description="Review learning sessions and device activity"
        badge="LIVE"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="panel p-4 flex flex-col gap-2 hover:border-accent/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-muted-foreground/50 group-hover:text-accent transition-colors">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent sessions */}
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Recent Sessions</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/dashboard/sessions" className="flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {MOCK_SESSIONS.slice(0, 5).map((session) => {
              const date = new Date(session.started_at)
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
              
              return (
                <div key={session.session_id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${session.mode === 'lesson' ? 'bg-accent' : 'bg-chart-2'}`} />
                    <div>
                      <div className="font-medium text-foreground">{session.mode === 'lesson' ? 'Lesson Mode' : 'Free Chat'}</div>
                      <div className="text-xs text-muted-foreground">{session.turn_count} turns • {timeString}, {dateString}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/dashboard/sessions/${session.session_id}`}>Review</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Flagged Moments */}
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-destructive/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Needs Review</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {FLAGGED_TURNS.map(({ sessionId, turn }) => {
              const labelColor = turn.input_label === 'BLOCK' ? 'bg-destructive text-destructive-foreground' : 'bg-yellow-500 text-white'
              return (
                <div key={turn.turn_id} className="p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${labelColor}`}>
                      {turn.input_label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(turn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-surface-sunken p-2.5 rounded-lg border border-border/50 text-foreground/80">
                    "{turn.transcript}"
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                      <Link href={`/dashboard/sessions/${sessionId}`}>View context</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
            {OVERVIEW_STATS.flaggedTurnsToday === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                <p>All conversations are safe.<br/>No flagged moments to review.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
