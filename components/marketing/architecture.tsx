import { ArrowRight } from 'lucide-react'

const layers = [
  {
    label: 'Frontend',
    items: ['Next.js App Router', 'React Server Components', 'Tailwind + shadcn/ui'],
    color: 'bg-accent/10 border-accent/30 text-accent',
  },
  {
    label: 'Auth & Database',
    items: ['Supabase Auth (JWT)', 'Postgres + RLS', 'Realtime subscriptions'],
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  },
  {
    label: 'Agent Runtime',
    items: ['API routes / edge fns', 'LLM provider abstraction', 'Tool call scaffolding'],
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  },
  {
    label: 'Hardware / IoT',
    items: ['Ingest webhook endpoint', 'Device heartbeat API', 'Token-based auth'],
    color: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  },
]

const folders = [
  'app/(marketing)/ — public landing',
  'app/(app)/       — auth-guarded shell',
  'app/api/         — REST + webhook routes',
  'components/      — shared UI',
  'lib/supabase/    — client + server helpers',
  'lib/ai/          — model abstraction',
]

export function Architecture() {
  return (
    <section id="architecture" className="py-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: stack layers */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Stack architecture</p>
            <h2 className="text-3xl font-bold tracking-tight mb-6 text-balance">
              Layered for flexibility.
            </h2>
            <div className="flex flex-col gap-3">
              {layers.map((layer, i) => (
                <div key={layer.label} className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-mono font-bold border ${layer.color} shrink-0 mt-0.5`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 panel p-3">
                    <div className={`text-xs font-mono font-semibold mb-1 ${layer.color.split(' ')[2]}`}>
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

          {/* Right: folder structure */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Project structure</p>
            <h2 className="text-3xl font-bold tracking-tight mb-6 text-balance">
              Ready to fork &amp; extend.
            </h2>
            <div className="panel-sunken p-4 font-mono text-sm space-y-1.5">
              {folders.map((f) => (
                <div key={f} className="flex items-center gap-2 text-foreground/80">
                  <ArrowRight className="w-3 h-3 text-accent shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 panel p-4 text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Hardware-ready.</strong> The ingest API accepts POST requests
              from any device. Drop in your Raspberry Pi script, Arduino, or mobile app and start streaming
              events to the dashboard within minutes.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
