// TODO: Replace MOCK_AGENTS with a real Supabase query:
//   const { data: agents } = await supabase.from('agents').select('*').order('created_at', { ascending: false })

import { MOCK_AGENTS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Bot, Play, Pause, MoreHorizontal } from 'lucide-react'

export default function AgentsPage() {
  return (
    <div>
      <PageHeader
        title="Agents"
        description="Define and manage your AI agent fleet"
        badge={String(MOCK_AGENTS.length)}
        action={
          <Button size="sm">
            {/* TODO: Wire to agent creation form / modal */}
            New Agent
          </Button>
        }
      />

      {MOCK_AGENTS.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-5 h-5" />}
          title="No agents yet"
          description="Create your first agent to start automating tasks with AI."
          action={<Button size="sm">New Agent</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {MOCK_AGENTS.map((agent) => (
            <div key={agent.id} className="panel p-4 flex flex-col gap-3 hover:border-border/80 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent border border-accent/20 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold font-mono">{agent.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{agent.id}</div>
                  </div>
                </div>
                <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="More options">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 panel-sunken p-2 rounded-md">
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-foreground">{agent.runsToday}</div>
                  <div className="text-[10px] text-muted-foreground">runs today</div>
                </div>
                <div className="text-center border-x border-border">
                  <div className="text-xs font-mono font-bold text-foreground">{agent.successRate}%</div>
                  <div className="text-[10px] text-muted-foreground">success</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{agent.model}</div>
                  <div className="text-[10px] text-muted-foreground">model</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <StatusBadge status={agent.status} />
                <div className="flex items-center gap-1">
                  {/* TODO: Wire run/pause to agent execution API */}
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                    <Play className="w-3 h-3" /> Run
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                    <Pause className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
