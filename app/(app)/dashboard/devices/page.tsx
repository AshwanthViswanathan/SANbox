import { Cpu, Mic, Radio, Volume2, Wifi, WifiOff } from 'lucide-react'

import { DeviceCommandPanel } from '@/components/app/device-command-panel'
import { PageHeader } from '@/components/app/page-header'
import { ModeBadge } from '@/components/app/teachbox-badges'
import { StatusBadge } from '@/components/app/status-badge'
import { getDeviceSnapshots } from '@/lib/parent-dashboard-data'

export default async function DevicesPage() {
  const devices = await getDeviceSnapshots()
  const onlineDevices = devices.filter((device) => device.status === 'online').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Status"
        description="Thin-client Raspberry Pi devices with simple connection, parent controls, and session visibility for the demo."
        badge={`${onlineDevices}/${devices.length} ONLINE`}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <DeviceStat label="Devices" value={String(devices.length)} />
        <DeviceStat label="Online now" value={String(onlineDevices)} />
        <DeviceStat
          label="Flagged turns seen"
          value={String(devices.reduce((sum, device) => sum + device.flaggedTurns, 0))}
        />
      </div>

      <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(228,244,245,0.78))] px-5 py-4">
        <p className="text-sm font-semibold text-foreground">Parent pause and power controls</p>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          This adds a safe demo control in the dashboard without changing the existing parent session
          routes, lessons route, or the child turn endpoint. The control state is local to the parent UI
          until a dedicated device-command API exists.
        </p>
      </div>

      <div className="space-y-4">
        {devices.map((device) => {
          const isOnline = device.status === 'online'

          return (
            <article key={device.id} className="panel overflow-hidden">
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1.15fr]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isOnline
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold tracking-tight text-foreground">{device.name}</p>
                        <p className="mt-1 text-xs font-mono text-muted-foreground">{device.id}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="rounded-[1.25rem] bg-muted/35 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last seen</p>
                      <p className="text-sm font-semibold text-foreground">{device.lastSeen}</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className={`h-full rounded-full ${
                          device.battery > 40
                            ? 'bg-emerald-500'
                            : device.battery > 20
                              ? 'bg-amber-500'
                              : 'bg-destructive'
                        }`}
                        style={{ width: `${device.battery}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Battery reserve {device.battery}%</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DeviceMetric label="Recent sessions" value={String(device.recentSessions)} />
                  <DeviceMetric label="Flagged turns" value={String(device.flaggedTurns)} />
                  <DeviceCommandPanel
                    deviceId={device.id}
                    deviceName={device.name}
                    isOnline={isOnline}
                  />

                  <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Microphone</p>
                    </div>
                    <StatusBadge className="mt-3" status={device.microphone === 'ready' ? 'online' : 'warning'} />
                  </div>

                  <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Speaker</p>
                    </div>
                    <StatusBadge className="mt-3" status={device.speaker === 'ready' ? 'online' : 'warning'} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-muted/25 px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={isOnline ? 'online' : 'offline'} />
                  {device.lastMode && <ModeBadge mode={device.lastMode} />}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Radio className="h-3.5 w-3.5" />
                    Button-to-talk flow only
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function DeviceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

function DeviceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
