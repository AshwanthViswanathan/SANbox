'use client'

import { useState, useEffect } from 'react'
import { CosmoFace } from '@/components/pi/cosmo-face'
import type { CosmoState } from '@/shared/types'
import { Mic, Activity, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock transcript for demo purposes
const MOCK_TRANSCRIPTS: Record<CosmoState, string> = {
  idle: 'Tap the button to talk to TeachBox.',
  listening: 'Listening...',
  thinking: 'Thinking about that...',
  speaking: 'It looks that way because the moon is very far away...',
  blocked: 'Let\'s talk about something safe and fun instead!',
  error: 'Something went wrong. Try again.',
}

export default function PiDisplayPage() {
  const [state, setState] = useState<CosmoState>('idle')
  const [transcript, setTranscript] = useState(MOCK_TRANSCRIPTS['idle'])

  // Update transcript when state changes for demo
  useEffect(() => {
    setTranscript(MOCK_TRANSCRIPTS[state])
  }, [state])

  // Get background and text colors based on state
  const getContainerStyle = () => {
    switch (state) {
      case 'idle':
        return 'bg-surface text-foreground'
      case 'listening':
        return 'bg-accent/10 text-accent-foreground'
      case 'thinking':
        return 'bg-secondary text-secondary-foreground'
      case 'speaking':
        return 'bg-surface text-foreground'
      case 'blocked':
      case 'error':
        return 'bg-destructive/10 text-destructive'
      default:
        return 'bg-surface text-foreground'
    }
  }

  const getStateIcon = () => {
    switch (state) {
      case 'idle':
        return <Mic className="w-5 h-5" />
      case 'listening':
        return <Activity className="w-5 h-5 animate-pulse" />
      case 'thinking':
        return <RefreshCw className="w-5 h-5 animate-spin" />
      case 'speaking':
        return <Mic className="w-5 h-5 opacity-50" />
      case 'blocked':
      case 'error':
        return <AlertCircle className="w-5 h-5" />
    }
  }

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 transition-colors duration-500", getContainerStyle())}>
      {/* Header / Status Bar */}
      <div className="w-full flex justify-between items-center opacity-80">
        <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider">
          {getStateIcon()}
          <span>{state}</span>
        </div>
        <div className="flex items-center gap-2">
          {state === 'speaking' && (
            <span className="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold tracking-wider">
              LESSON MODE
            </span>
          )}
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Main Face Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-12">
        <CosmoFace state={state} />

        {/* Transcript / Subtitle */}
        <div className="text-center space-y-2 max-w-md w-full">
          <p className={cn(
            "text-2xl sm:text-3xl font-semibold leading-tight transition-all duration-300",
            state === 'speaking' ? "text-primary" : "opacity-80"
          )}>
            {transcript}
          </p>
        </div>
      </div>

      {/* Demo Controls (Hidden on actual Pi, visible for hackathon dev) */}
      <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur p-4 rounded-xl border border-border shadow-lg flex flex-col gap-2">
        <div className="text-xs font-mono font-bold text-muted-foreground mb-1 uppercase tracking-wider">
          Demo State Controls
        </div>
        <div className="flex flex-wrap gap-2 max-w-[300px]">
          {(['idle', 'listening', 'thinking', 'speaking', 'blocked', 'error'] as CosmoState[]).map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                state === s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
