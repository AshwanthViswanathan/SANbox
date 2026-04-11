import { MOCK_DEVICES } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { Cpu, Wifi, WifiOff } from 'lucide-react'

export default function DevicesPage() {
  return (
    <div>
      <PageHeader
        title="Devices"
        description="Manage your TeachBox devices and check their connection status."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_DEVICES.map((device) => {
          const isOnline = device.status === 'online'
          
          return (
            <div key={device.id} className="panel p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{device.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono text-xs">{device.id}</span>
                    <span>•</span>
                    <span>Last seen {device.lastSeen}</span>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <Wifi className="w-3.5 h-3.5" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <WifiOff className="w-3.5 h-3.5" />
                    Offline
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
