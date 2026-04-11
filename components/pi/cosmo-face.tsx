import { cn } from '@/lib/utils'
import type { CosmoState } from '@/shared/types'

interface CosmoFaceProps {
  state: CosmoState
  className?: string
}

export function CosmoFace({ state, className }: CosmoFaceProps) {
  // Determine outer glow/ring based on state
  const ringClass = cn(
    "absolute inset-0 rounded-full transition-all duration-500",
    {
      'bg-accent/5 scale-100 opacity-0': state === 'idle',
      'bg-accent/20 scale-110 opacity-100 animate-pulse': state === 'listening',
      'bg-accent/10 scale-105 opacity-100 animate-pulse': state === 'thinking',
      'bg-accent/5 scale-100 opacity-100': state === 'speaking',
      'bg-destructive/20 scale-105 opacity-100': state === 'blocked' || state === 'error',
    }
  )

  return (
    <div className={cn("relative w-64 h-64 flex items-center justify-center", className)}>
      {/* Background Effect Ring */}
      <div className={ringClass} />

      {/* Main Face Container */}
      <div className={cn(
        "relative w-48 h-48 rounded-[3rem] bg-white border-[6px] shadow-xl flex flex-col items-center justify-center transition-colors duration-300",
        (state === 'blocked' || state === 'error') ? "border-destructive/50" : "border-primary"
      )}>
        
        {/* Eyes (Static) */}
        <div className="flex gap-8 mb-6">
          <div className="w-6 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {state === 'blocked' || state === 'error' ? (
               <div className="w-full h-1 bg-background rotate-45" />
            ) : (
               <div className="w-2 h-2 bg-white rounded-full translate-x-1 -translate-y-1 opacity-80" />
            )}
          </div>
          <div className="w-6 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
             {state === 'blocked' || state === 'error' ? (
               <div className="w-full h-1 bg-background -rotate-45" />
            ) : (
               <div className="w-2 h-2 bg-white rounded-full translate-x-1 -translate-y-1 opacity-80" />
            )}
          </div>
        </div>

        {/* Mouth (Animated via state) */}
        <div className="h-12 flex items-center justify-center">
          <Mouth state={state} />
        </div>
      </div>
    </div>
  )
}

function Mouth({ state }: { state: CosmoState }) {
  if (state === 'idle' || state === 'listening') {
    // Gentle smile
    return (
      <div className="w-16 h-8 border-b-4 border-primary rounded-b-full transition-all duration-300" />
    )
  }
  
  if (state === 'thinking') {
    // Straight line or slightly squiggly
    return (
      <div className="w-12 h-1.5 bg-primary rounded-full transition-all duration-300" />
    )
  }

  if (state === 'speaking') {
    // Open animated mouth
    return (
      <div className="w-16 h-12 bg-primary rounded-full transition-all duration-150 animate-bounce" style={{ animationDuration: '0.4s' }} />
    )
  }

  if (state === 'blocked' || state === 'error') {
    // Sad/concerned mouth
    return (
      <div className="w-12 h-6 border-t-4 border-destructive rounded-t-full transition-all duration-300 mt-4" />
    )
  }

  return null
}
