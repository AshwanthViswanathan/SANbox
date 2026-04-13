// TODO: Load real user/workspace settings from Supabase:
//   const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Key, Bell, Plug } from 'lucide-react'

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="px-6 py-5 space-y-6">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="sm:w-48 shrink-0">
        <div className="text-sm text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your SANbox family workspace and integrations." />

      <div className="max-w-3xl space-y-5">
        {/* Profile */}
        <Section
          title="Workspace"
          description="General workspace settings"
        >
          <Field label="Name" hint="Displayed in the sidebar">
            {/* TODO: Save to Supabase profiles table on submit */}
            <Input defaultValue="Default Workspace" className="max-w-xs text-sm h-8" />
          </Field>
          <Field label="Owner email">
            <Input defaultValue="hacker@lab.io" disabled className="max-w-xs text-sm h-8" />
          </Field>
          <Button size="sm">Save changes</Button>
        </Section>

        {/* API Keys */}
        <Section
          title="API Keys"
          description="Keys used by agents to call external services"
        >
          <Field label="LLM Provider" hint="OpenAI / Anthropic / etc.">
            {/* TODO: Encrypt and store in Supabase vault or environment variables */}
            <Input type="password" placeholder="sk-…" className="max-w-xs text-sm h-8 font-mono" />
          </Field>
          <Field label="Device Ingest Token" hint="Used by hardware devices">
            <div className="flex items-center gap-2 max-w-xs">
              <Input type="password" placeholder="agt_…" className="text-sm h-8 font-mono flex-1" />
              <Button size="sm" variant="outline" className="shrink-0">
                <Key className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Field>
          <Button size="sm">Save keys</Button>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Alert destinations for agent failures and device events"
        >
          <Field label="Slack webhook" hint="Notifier agent uses this">
            {/* TODO: Validate and store webhook URL */}
            <Input placeholder="https://hooks.slack.com/…" className="max-w-xs text-sm h-8" />
          </Field>
          <Field label="Alert on failure">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="alert-failure" defaultChecked className="rounded" />
              <label htmlFor="alert-failure" className="text-sm text-foreground">
                Send Slack message when a run fails
              </label>
            </div>
          </Field>
          <Button size="sm">Save notifications</Button>
        </Section>

        {/* Integrations */}
        <Section
          title="Integrations"
          description="Connected external services"
        >
          <div className="space-y-3">
            {[
              { name: 'Supabase', desc: 'Database and auth', connected: false },
              { name: 'OpenAI', desc: 'Language model provider', connected: false },
              { name: 'Slack', desc: 'Notifications', connected: false },
            ].map((int) => (
              <div key={int.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded border border-border bg-muted">
                    <Plug className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{int.name}</div>
                    <div className="text-xs text-muted-foreground">{int.desc}</div>
                  </div>
                </div>
                <Button size="sm" variant={int.connected ? 'outline' : 'default'} className="text-xs h-7">
                  {/* TODO: Wire to OAuth or API key flow */}
                  {int.connected ? 'Connected' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
