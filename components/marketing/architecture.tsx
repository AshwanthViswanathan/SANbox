import { ArrowRight } from 'lucide-react'

const layers = [
  {
    label: 'Child Device',
    items: ['Voice-first child device', 'Button-to-talk audio capture', 'Speaker playback + status heartbeat'],
    color: 'bg-accent/10 border-accent/30 text-accent',
  },
  {
    label: 'Voice Pipeline',
    items: ['Fast Whisper speech-to-text', 'Input safeguard checks', 'Gemini text-to-speech streaming'],
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  },
  {
    label: 'Tutor Orchestration',
    items: ['Lesson-aware prompt routing', 'Low-latency LLM responses', 'Turn history + session summaries'],
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  },
  {
    label: 'Parent Dashboard',
    items: ['Real-time session review', 'Flagged turn visibility', 'Device controls + lesson tracking'],
    color: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  },
]

const folders = [
  'app/(marketing)/ - product landing page',
  'app/(app)/ - parent dashboard shell',
  'app/api/v1/ - device, lesson, and parent APIs',
  'components/marketing/ - K-5 product messaging',
  'components/app/ - family dashboard UI',
  'lessons/ - markdown lesson content',
]

export function Architecture() {
  return (
    <section id="architecture" className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-accent">Learning system flow</p>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-balance">
              Hardware, cloud, and parent review in one loop.
            </h2>
            <div className="flex flex-col gap-3">
              {layers.map((layer, i) => (
                <div key={layer.label} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-mono font-bold ${layer.color}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,250,244,0.88),rgba(238,245,247,0.74))] p-3 shadow-sm">
                    <div className={`mb-1 text-xs font-mono font-semibold ${layer.color.split(' ')[2]}`}>
                      {layer.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {layer.items.map((item) => (
                        <span key={item} className="text-xs text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-accent">Project structure</p>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-balance">
              Organized around the product experience.
            </h2>
            <div className="space-y-1.5 rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(236,249,246,0.88),rgba(224,239,234,0.78))] p-4 font-mono text-sm shadow-sm">
              {folders.map((folder) => (
                <div key={folder} className="flex items-center gap-2 text-foreground/80">
                  <ArrowRight className="h-3 w-3 shrink-0 text-accent" />
                  <span>{folder}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/60 bg-[linear-gradient(180deg,rgba(237,246,255,0.9),rgba(223,234,245,0.8))] p-4 text-sm leading-relaxed text-muted-foreground shadow-sm">
              <strong className="text-foreground">Cloud-backed tutoring.</strong> The child speaks to a local
              voice device while SANbox handles transcription, moderation, tutoring responses, and
              parent-facing summaries in the Next.js app.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
