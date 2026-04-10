// TODO: Replace MOCK_RUNS with a real Supabase query:
//   const { data: runs } = await supabase.from('runs').select('*, agents(name)').order('started_at', { ascending: false }).limit(50)

import { MOCK_RUNS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Play, RefreshCw } from 'lucide-react'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function RunsPage() {
  const runningCount = MOCK_RUNS.filter((r) => r.status === 'running').length

  return (
    <div>
      <PageHeader
        title="Runs"
        description="Task execution history and status"
        badge={runningCount > 0 ? `${runningCount} live` : undefined}
        action={
          <Button size="sm" variant="outline" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        }
      />

      {MOCK_RUNS.length === 0 ? (
        <EmptyState
          icon={<Play className="w-5 h-5" />}
          title="No runs yet"
          description="Trigger an agent run from the Agents page to see activity here."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground font-mono">Run ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Started</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_RUNS.map((run) => (
                  <tr key={run.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{run.id}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-medium">{run.agentName}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                      {formatTime(run.startedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                      {run.duration != null ? `${run.duration}s` : run.status === 'running' ? '...' : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">
                      {run.output ?? (run.status === 'running' ? <span className="text-accent">Processing…</span> : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
