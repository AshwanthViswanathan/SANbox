import { useEffect, useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { CosmoState } from '@/shared/types'

interface CosmoFaceProps {
  state: CosmoState
  className?: string
}

function getFaceAsset(state: CosmoState) {
  switch (state) {
    case 'idle':
      return {
        src: '/sans-faces/San-Idle.svg',
        alt: 'L idle expression',
      }
    case 'listening':
    case 'thinking':
      return {
        src: '/sans-faces/San-Normal-Thinking-Listening.svg',
        alt: 'L listening expression',
      }
    case 'speaking':
      return {
        src: '/sans-faces/San-Talking.svg',
        alt: 'L speaking expression',
      }
    case 'blocked':
    case 'error':
      return {
        src: '/sans-faces/San-Negative.svg',
        alt: 'L negative expression',
      }
    default:
      return {
        src: '/sans-faces/San-Idle.svg',
        alt: 'L idle expression',
      }
  }
}

export function CosmoFace({ state, className }: CosmoFaceProps) {
  const [isTalkingFrame, setIsTalkingFrame] = useState(false)

  useEffect(() => {
    if (state !== 'speaking') {
      setIsTalkingFrame(false)
      return
    }

    const intervalId = window.setInterval(() => {
      setIsTalkingFrame((current) => !current)
    }, 100)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [state])

  const face =
    state === 'speaking'
      ? isTalkingFrame
        ? {
            src: '/sans-faces/San-Talking.svg',
            alt: 'L speaking expression',
          }
        : {
            src: '/sans-faces/San-Idle.svg',
            alt: 'L speaking idle frame',
          }
      : getFaceAsset(state)

  return (
    <div
      className={cn(
        'relative h-36 w-36 sm:h-44 sm:w-44 lg:h-[min(34vh,17rem)] lg:w-[min(34vh,17rem)]',
        className
      )}
    >
      <Image
        src={face.src}
        alt={face.alt}
        fill
        priority
        sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 272px"
        className="object-contain select-none"
      />
    </div>
  )
}
