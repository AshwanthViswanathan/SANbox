// TODO: Replace MOCK_DEVICES with a real Supabase query:
//   const { data: devices } = await supabase.from('devices').select('*').order('last_seen', { ascending: false })

import { MOCK_DEVICES } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Cpu, Wifi, WifiOff, MoreHorizontal } from 'lucide-react'

export default function DevicesPage() {
  const onlineCount = MOCK_DEVICES.filter((d) => d.status === 'online').length

  return (
    <div>
      <PageHeader
        title="Devices"
        description="Connected hardware and IoT devices"
        badge={`${onlineCount}/${MOCK_DEVICES.length} online`}
        action={
          <Button size="sm">
            {/* TODO: Show device token registration UI */}
            Register Device
          </Button>
        }
      />

      {/* Ingest info banner */}
      <div className="mb-4 panel-sunken p-3 flex items-start gap-3 text-xs rounded-lg">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-accent/15 text-accent border border-accent/25 shrink-0 mt-0.5">
          <Cpu className="w-3.5 h-3.5" />
        </div>
        <div className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Device ingest endpoint:</strong>{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">POST /api/ingest</code>
          {' — '}send telemetry from any device using a bearer token.{' '}
          {/* TODO: Link to device token generation in settings */}
          <button className="text-accent underline underline-offset-2 hover:opacity-80">Generate token →</button>
        </div>
      </div>

      {MOCK_DEVICES.length === 0 ? (
        <EmptyState
          icon={<Cpu className="w-5 h-5" />}
          title="No devices registered"
          description="Register your first device to start receiving telemetry and heartbeat events."
          action={<Button size="sm">Register Device</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {MOCK_DEVICES.map((device) => (
            <div key={device.id} className="panel p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${
                      device.status === 'online'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {device.status === 'online' ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold font-mono">{device.name}</div>
                    <div className="text-xs text-muted-foreground">{device.type}</div>
                  </div>
                </div>
                <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="More options">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-0.5">Status</div>
                  <StatusBadge status={device.status} />
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Last seen</div>
                  <span className="font-mono">{device.lastSeen}</span>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Firmware</div>
                  <span className="font-mono">{device.firmwareVersion}</span>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">IP</div>
                  <span className="font-mono">{device.ip}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* TODO: Wire to real device log stream */}
                <Button variant="outline" size="sm" className="text-xs h-7 flex-1">View Logs</Button>
                <Button variant="outline" size="sm" className="text-xs h-7 flex-1">Send Command</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
