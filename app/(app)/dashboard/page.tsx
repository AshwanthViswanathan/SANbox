import { OVERVIEW_STATS, MOCK_EVENTS, MOCK_RUNS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Bot, Play, ScrollText, Cpu, AlertTriangle } from 'lucide-react'

const statCards = [
  {
    label: 'Agents',
    value: String(OVERVIEW_STATS.totalAgents),
    sub: `${OVERVIEW_STATS.runningAgents} running`,
    icon: <Bot className="w-4 h-4" />,
    href: '/dashboard/agents',
  },
  {
    label: 'Runs today',
    value: String(OVERVIEW_STATS.runsToday),
    sub: `${OVERVIEW_STATS.failedRuns} failed`,
    icon: <Play className="w-4 h-4" />,
    href: '/dashboard/runs',
  },
  {
    label: 'Events',
    value: String(OVERVIEW_STATS.totalEvents),
    sub: 'last 24 hours',
    icon: <ScrollText className="w-4 h-4" />,
    href: '/dashboard/logs',
  },
  {
    label: 'Devices',
    value: `${OVERVIEW_STATS.onlineDevices}/${OVERVIEW_STATS.totalDevices}`,
    sub: 'online',
    icon: <Cpu className="w-4 h-4" />,
    href: '/dashboard/devices',
  },
]

export default function DashboardOverview() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="System health and recent activity"
        badge="LIVE"
        action={
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/agents">Manage agents</Link>
          </Button>
        }
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
            <div className="text-2xl font-bold font-mono tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent runs */}
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Recent Runs</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/dashboard/runs" className="flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {MOCK_RUNS.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={run.status} />
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{run.id}</span>
                  <span className="text-foreground truncate">{run.agentName}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0 ml-2">
                  {run.duration != null ? `${run.duration}s` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live event log */}
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Event Stream</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/dashboard/logs" className="flex items-center gap-1">
                Full log <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
          <div className="bg-foreground/[0.02] px-4 py-3 space-y-1.5 font-mono text-[12px] min-h-[240px]">
            {MOCK_EVENTS.slice(0, 8).map((evt) => (
              <div key={evt.id} className="flex gap-3">
                <span className="text-muted-foreground/50 shrink-0 w-14">{evt.timestamp}</span>
                <span
                  className={
                    evt.level === 'error'
                      ? 'text-destructive'
                      : evt.level === 'warn'
                      ? 'text-yellow-600'
                      : evt.level === 'debug'
                      ? 'text-muted-foreground/50'
                      : 'text-accent'
                  }
                >
                  {evt.source}
                </span>
                <span className="text-foreground/70 truncate">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert banner for failed runs */}
      {OVERVIEW_STATS.failedRuns > 0 && (
        <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {OVERVIEW_STATS.failedRuns} run{OVERVIEW_STATS.failedRuns > 1 ? 's' : ''} failed in the last 24 hours.{' '}
            <Link href="/dashboard/runs" className="underline underline-offset-2 hover:opacity-80">
              Review runs
            </Link>
          </span>
        </div>
      )}
    </div>
  )
}
