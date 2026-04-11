import { MOCK_SESSION_DETAILS, MOCK_LESSONS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { notFound } from 'next/navigation'
import { ShieldAlert, CheckCircle2, PlayCircle, Bot, User } from 'lucide-react'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = MOCK_SESSION_DETAILS[id]

  if (!data) {
    notFound()
  }

  const lesson = data.session.lesson_id 
    ? MOCK_LESSONS.find(l => l.lesson_id === data.session.lesson_id) 
    : null

  return (
    <div>
      <PageHeader
        title={`Session: ${id}`}
        description={`Device: ${data.session.device_id} • Mode: ${data.session.mode}`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            {data.turns.map((turn) => {
              const timeString = new Date(turn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const isBlocked = turn.blocked

              return (
                <div key={turn.turn_id} className="space-y-3">
                  {/* Child Input Bubble */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">Child</span>
                        <span className="text-xs text-muted-foreground">{timeString}</span>
                        <SafeguardBadge label={turn.input_label} />
                      </div>
                      <div className="panel p-3 bg-surface-raised rounded-tl-none inline-block max-w-[85%] text-sm">
                        {turn.transcript}
                      </div>
                    </div>
                  </div>

                  {/* Assistant Output Bubble */}
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isBlocked ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">TeachBox</span>
                        {turn.output_label && <SafeguardBadge label={turn.output_label} />}
                        {isBlocked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-destructive text-destructive-foreground">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className={`panel p-3 rounded-tl-none inline-block max-w-[85%] text-sm ${isBlocked ? 'border-destructive/50 bg-destructive/5' : 'bg-surface-raised'}`}>
                        {turn.assistant_text}
                      </div>
                      {!isBlocked && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Play audio</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Context Panel */}
        <div className="space-y-4">
          <div className="panel p-4 space-y-4 sticky top-6">
            <h3 className="font-semibold text-sm">Session Context</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Mode</span>
                <span className="font-medium">{data.session.mode === 'lesson' ? 'Lesson Mode' : 'Free Chat'}</span>
              </div>
              
              {lesson && (
                <div>
                  <span className="text-muted-foreground text-xs block mb-1">Active Lesson</span>
                  <div className="bg-surface p-3 rounded-lg border border-border">
                    <div className="font-medium text-primary mb-1">{lesson.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono">
                        {lesson.grade_band}
                      </span>
                      <span>{lesson.topic}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SafeguardBadge({ label }: { label: string }) {
  if (label === 'SAFE') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold tracking-wider">
        <CheckCircle2 className="w-3 h-3" /> SAFE
      </span>
    )
  }
  if (label === 'BORDERLINE') {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
        BORDERLINE
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
      <ShieldAlert className="w-3 h-3" /> BLOCK
    </span>
  )
}
