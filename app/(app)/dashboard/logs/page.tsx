// TODO: Replace MOCK_EVENTS with a real-time Supabase subscription:
//   const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(200)
//   Use supabase.channel() for live streaming via Supabase Realtime

import { MOCK_EVENTS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { ScrollText } from 'lucide-react'

const levelOrder = ['error', 'warn', 'info', 'debug'] as const

export default function LogsPage() {
  return (
    <div>
      <PageHeader
        title="Event Log"
        description="Unified stream of agent, system, and device events"
        badge={`${MOCK_EVENTS.length} events`}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {levelOrder.map((level) => (
          <button
            key={level}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border text-xs font-mono hover:border-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                level === 'error'
                  ? 'bg-destructive'
                  : level === 'warn'
                  ? 'bg-yellow-500'
                  : level === 'info'
                  ? 'bg-accent'
                  : 'bg-muted-foreground/40'
              }`}
            />
            {level.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {/* TODO: Wire to live Supabase Realtime channel */}
          <span className="w-1.5 h-1.5 rounded-full bg-accent/50 inline-block mr-1.5 animate-pulse" />
          live
        </span>
      </div>

      {MOCK_EVENTS.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-5 h-5" />}
          title="No events yet"
          description="Events from agents, devices, and system operations will appear here."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="bg-foreground/[0.02] font-mono text-[12px] leading-relaxed divide-y divide-border/50">
            {MOCK_EVENTS.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                <span className="text-muted-foreground/50 shrink-0 w-14 pt-px">{evt.timestamp}</span>
                <span className="shrink-0 pt-px w-10">
                  <StatusBadge status={evt.level} showDot={false} />
                </span>
                <span
                  className={`shrink-0 w-36 truncate pt-px ${
                    evt.level === 'error'
                      ? 'text-destructive'
                      : evt.level === 'warn'
                      ? 'text-yellow-600'
                      : evt.level === 'debug'
                      ? 'text-muted-foreground/50'
                      : 'text-accent'
                  }`}
                >
                  {evt.source}
                </span>
                <span className="text-foreground/80 flex-1 break-all">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
