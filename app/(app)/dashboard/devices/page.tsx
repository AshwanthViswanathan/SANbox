import { Cpu, MessageSquareText, Mic, Radio, Volume2, Wifi, WifiOff } from 'lucide-react'

import { DeviceCommandPanel } from '@/components/app/device-command-panel'
import { DeviceLessonPanel } from '@/components/app/device-lesson-panel'
import { PageHeader } from '@/components/app/page-header'
import { ModeBadge } from '@/components/app/teachbox-badges'
import { StatusBadge } from '@/components/app/status-badge'
import { getDeviceSnapshots, getLessons } from '@/lib/parent-dashboard-data'

export default async function DevicesPage() {
  const [devices, lessons] = await Promise.all([getDeviceSnapshots(), getLessons()])
  const onlineDevices = devices.filter((device) => device.status === 'online').length
  const activeControls = devices.filter((device) => device.controls.device === 'active').length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Status"
        badge={`${onlineDevices}/${devices.length} ONLINE`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DeviceStat label="Devices" value={String(devices.length)} />
        <DeviceStat label="Online now" value={String(onlineDevices)} />
        <DeviceStat
          label="Active controls"
          value={String(activeControls)}
        />
      </div>

      {devices.length === 0 ? (
        <div className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm px-8 py-10 text-center">
          <p className="font-beach-vibe text-2xl font-bold tracking-tight text-slate-900">No SANbox devices registered yet</p>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-6 text-slate-500">
            Open <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">/pi</span> on a teammate device first. As soon as that page loads,
            the demo will register itself here and you can assign a lesson.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {devices.map((device) => {
          const isOnline = device.status === 'online'
          const paused = device.controls.device === 'paused'
          const poweredOff = device.controls.device === 'off'
          const microphoneOff = device.controls.microphone === 'off'
          const speakerOff = device.controls.speaker === 'off'
          const sourceLabel = getSourceLabel(device.platform)

          return (
            <article key={device.id} className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1.15fr]">
                <div className="flex h-full flex-col gap-4">
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
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {sourceLabel}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        poweredOff
                          ? 'bg-destructive/10 text-destructive'
                          : paused
                            ? 'bg-amber-500/12 text-amber-700'
                            : isOnline
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {poweredOff ? (
                        <WifiOff className="h-3.5 w-3.5" />
                      ) : isOnline ? (
                        <Wifi className="h-3.5 w-3.5" />
                      ) : (
                        <WifiOff className="h-3.5 w-3.5" />
                      )}
                      {poweredOff ? 'Powered off' : paused ? 'Paused' : isOnline ? 'Active' : 'Offline'}
                    </span>
                  </div>

                  <div className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      Controls updated {formatDateTime(device.controlsUpdatedAt)}
                    </p>
                  </div>

                  <div className="flex min-h-[18rem] flex-1 flex-col rounded-[1.25rem] border border-border bg-background px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Recent chat</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Latest turns captured for {device.name}.
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-container/20 p-2 text-primary">
                        <MessageSquareText className="h-4 w-4" />
                      </span>
                    </div>

                    {device.recentTurns.length === 0 ? (
                      <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl bg-muted/30 px-4 py-4 text-center text-sm text-muted-foreground">
                        No chat history has been recorded for this device yet.
                      </div>
                    ) : (
                      <div className="mt-4 flex-1 space-y-3">
                        {device.recentTurns.map((turn) => (
                          <div key={turn.turnId} className="rounded-2xl bg-muted/30 px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <ModeBadge mode={turn.mode} />
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(turn.createdAt)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-foreground">{turn.transcript}</p>
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {turn.assistantText}
                            </p>
                            <p className="mt-3 text-[11px] font-mono text-muted-foreground">
                              {turn.sessionId}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DeviceMetric label="Recent sessions" value={String(device.recentSessions)} />
                  <DeviceMetric label="Flagged turns" value={String(device.flaggedTurns)} />
                  <DeviceLessonPanel
                    deviceId={device.id}
                    deviceName={device.name}
                    lessons={lessons}
                    initialLessonState={device.lessonState}
                  />
                  <DeviceCommandPanel
                    deviceId={device.id}
                    deviceName={device.name}
                    isOnline={isOnline}
                  />

                  <div className="rounded-[1.5rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Microphone</p>
                    </div>
                    <StatusBadge
                      className="mt-3"
                      status={microphoneOff ? 'offline' : device.microphone === 'ready' ? 'online' : 'warning'}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {microphoneOff
                        ? 'Device control is off.'
                        : device.microphone === 'ready'
                          ? 'Ready for voice input.'
                          : 'Hardware check recommended.'}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Speaker</p>
                    </div>
                    <StatusBadge
                      className="mt-3"
                      status={speakerOff ? 'offline' : device.speaker === 'ready' ? 'online' : 'warning'}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {speakerOff
                        ? 'Device control is off.'
                        : device.speaker === 'ready'
                          ? 'Ready for spoken replies.'
                          : 'Hardware check recommended.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-muted/25 px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={poweredOff ? 'offline' : paused ? 'warning' : isOnline ? 'online' : 'offline'}
                  />
                  {device.lastMode && <ModeBadge mode={device.lastMode} />}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Mic className="h-3.5 w-3.5" />
                    Mic {microphoneOff ? 'off' : 'on'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="h-3.5 w-3.5" />
                    Speaker {speakerOff ? 'off' : 'on'}
                  </span>
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
    <div className="bg-white rounded-[1.5rem] ring-1 ring-slate-900/5 shadow-sm px-6 py-6 transition-all hover:-translate-y-1 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function DeviceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 px-5 py-4 ring-1 ring-slate-900/5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getSourceLabel(platform: string | null) {
  if (platform === 'web_pi') {
    return 'Demo'
  }

  if (platform === 'rpi') {
    return 'Raspberry Pi'
  }

  return 'Device'
}
