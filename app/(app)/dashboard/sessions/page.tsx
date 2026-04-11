import { MOCK_SESSIONS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, ShieldAlert } from 'lucide-react'

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const showFlaggedOnly = filter === 'flagged'
  const sessions = showFlaggedOnly
    ? MOCK_SESSIONS.filter((session) => session.flagged_count > 0)
    : MOCK_SESSIONS

  return (
    <div>
      <PageHeader
        title="Sessions"
        description={
          showFlaggedOnly
            ? 'Sessions with flagged turns that need review.'
            : 'All learning sessions and conversations.'
        }
      />

      <div className="panel overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No sessions match this filter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session) => {
            const date = new Date(session.started_at)
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
            
            return (
              <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-foreground">
                      {session.mode === 'lesson' ? 'Lesson Session' : 'Free Chat'}
                    </span>
                    {session.mode === 'lesson' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-accent/15 text-accent border border-accent/25">
                        LESSON
                      </span>
                    )}
                    {session.flagged_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
                        <ShieldAlert className="w-3 h-3" />
                        {session.flagged_count} FLAGGED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {dateString} at {timeString}
                    </span>
                    <span>•</span>
                    <span>{session.turn_count} turns</span>
                    <span>•</span>
                    <span className="font-mono text-xs">{session.device_id}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/sessions/${session.session_id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
