'use client'

import { useEffect, useRef, useState } from 'react'
import { CosmoFace } from '@/components/pi/cosmo-face'
import type { CosmoState, SessionTurnResponse } from '@/shared/types'
import { Mic, Activity, AlertCircle, RefreshCw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sessionTurnResponseSchema } from '@/shared/api'

const IDLE_TEXT = 'Hold the button and ask a question.'
const THINKING_TEXT = 'Thinking about that...'

type RecorderState = {
  stream: MediaStream
  audioContext: AudioContext
  source: MediaStreamAudioSourceNode
  processor: ScriptProcessorNode
  silenceGain: GainNode
  chunks: Float32Array[]
  sampleRate: number
  startedAt: number
}

function makeBrowserId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function getOrCreateStorageId(key: string, prefix: string) {
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  const created = makeBrowserId(prefix)
  window.localStorage.setItem(key, created)
  return created
}

function dataUrlToPlayableSrc(dataUrl: string) {
  return dataUrl
}

async function playAssistantAudio(audioUrl: string | null, text: string) {
  if (audioUrl) {
    const audio = new Audio(dataUrlToPlayableSrc(audioUrl))

    try {
      await audio.play()
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('Generated audio failed to play.'))
      })
      return
    } catch {
      audio.pause()
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && text.trim()) {
    await new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1.05
      utterance.onend = () => resolve()
      utterance.onerror = () => reject(new Error('Browser speech synthesis failed.'))
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    })
    return
  }

  throw new Error('No playable audio was available.')
}

function mergeFloat32Chunks(chunks: Float32Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const merged = new Float32Array(length)
  let offset = 0

  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return merged
}

function clampPcmSample(sample: number) {
  return Math.max(-1, Math.min(1, sample))
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let index = 0; index < samples.length; index += 1) {
    const sample = clampPcmSample(samples[index])
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(offset, int16, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export default function PiDisplayPage() {
  const [state, setState] = useState<CosmoState>('idle')
  const [transcript, setTranscript] = useState(IDLE_TEXT)
  const [assistantText, setAssistantText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [debugTimings, setDebugTimings] = useState<Record<string, number> | null>(null)
  const recorderStateRef = useRef<RecorderState | null>(null)
  const deviceIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const isStoppingRef = useRef(false)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.AudioContext !== 'undefined'

    setIsSupported(supported)

    if (!supported) {
      setState('error')
      setTranscript('This browser does not support microphone recording.')
      return
    }

    deviceIdRef.current = getOrCreateStorageId('teachbox_demo_device_id', 'web')
    sessionIdRef.current = getOrCreateStorageId('teachbox_demo_session_id', 'session')

    return () => {
      const recorderState = recorderStateRef.current
      recorderState?.processor.disconnect()
      recorderState?.source.disconnect()
      recorderState?.silenceGain.disconnect()
      recorderState?.stream.getTracks().forEach((track) => track.stop())
      void recorderState?.audioContext.close()
    }
  }, [])

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

  const stopRecorderAndSend = async () => {
    const recorderState = recorderStateRef.current
    if (!recorderState || isStoppingRef.current) return

    isStoppingRef.current = true
    setIsRecording(false)
    setState('thinking')
    setTranscript(THINKING_TEXT)

    try {
      recorderState.processor.disconnect()
      recorderState.source.disconnect()
      recorderState.silenceGain.disconnect()
      recorderState.stream.getTracks().forEach((track) => track.stop())
      await recorderState.audioContext.close()
      recorderStateRef.current = null

      const samples = mergeFloat32Chunks(recorderState.chunks)
      const elapsedMs = Date.now() - recorderState.startedAt

      if (!samples.length) {
        if (elapsedMs < 400) {
          throw new Error('Hold the button a little longer before releasing.')
        }

        throw new Error('No audio was captured. Check browser microphone permissions.')
      }

      const audioBlob = encodeWav(samples, recorderState.sampleRate)
      const audioFile = new File([audioBlob], 'teachbox-recording.wav', { type: 'audio/wav' })
      const formData = new FormData()
      formData.set('audio', audioFile)
      formData.set('device_id', deviceIdRef.current ?? makeBrowserId('web'))
      formData.set('session_id', sessionIdRef.current ?? makeBrowserId('session'))
      formData.set('mode', 'free_chat')

      const response = await fetch('/api/v1/demo/turn', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error ?? `Request failed with status ${response.status}.`)
      }

      const result = sessionTurnResponseSchema.parse(
        (await response.json()) as SessionTurnResponse
      )

      setDebugTimings(result.debug?.timings_ms ?? null)
      setTranscript(result.transcript)
      setAssistantText(result.assistant.text)
      setState(result.assistant.blocked ? 'blocked' : 'speaking')

      await playAssistantAudio(result.audio?.url ?? null, result.assistant.text)

      setState('idle')
      setTranscript(IDLE_TEXT)
    } catch (error) {
      setState('error')
      setAssistantText('')
      setTranscript(error instanceof Error ? error.message : 'Voice request failed.')
    } finally {
      isStoppingRef.current = false
    }
  }

  const startRecording = async () => {
    if (!isSupported || isRecording || isStoppingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      const audioContext = new window.AudioContext()
      await audioContext.resume()
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      const silenceGain = audioContext.createGain()
      silenceGain.gain.value = 0
      const chunks: Float32Array[] = []

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        chunks.push(new Float32Array(input))
      }

      source.connect(processor)
      processor.connect(silenceGain)
      silenceGain.connect(audioContext.destination)
      recorderStateRef.current = {
        stream,
        audioContext,
        source,
        processor,
        silenceGain,
        chunks,
        sampleRate: audioContext.sampleRate,
        startedAt: Date.now(),
      }

      setDebugTimings(null)
      setAssistantText('')
      setTranscript('Listening...')
      setState('listening')
      setIsRecording(true)
    } catch (error) {
      setState('error')
      setTranscript(
        error instanceof Error ? error.message : 'Microphone access was denied.'
      )
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecorderAndSend()
      return
    }

    await startRecording()
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 transition-colors duration-500',
        getContainerStyle()
      )}
    >
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

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-12">
        <CosmoFace state={state} />

        <div className="text-center space-y-2 max-w-md w-full">
          <p
            className={cn(
              'text-2xl sm:text-3xl font-semibold leading-tight transition-all duration-300',
              state === 'speaking' ? 'text-primary' : 'opacity-80'
            )}
          >
            {transcript}
          </p>
          {assistantText ? (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {assistantText}
            </p>
          ) : null}
          {debugTimings ? (
            <p className="text-xs font-mono text-muted-foreground">
              {Object.entries(debugTimings)
                .map(([key, value]) => `${key}:${value}ms`)
                .join(' | ')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={!isSupported || isStoppingRef.current}
            className={cn(
              'h-24 w-24 rounded-full border-4 shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
              isRecording
                ? 'bg-destructive text-destructive-foreground border-destructive'
                : 'bg-primary text-primary-foreground border-primary'
            )}
          >
            {isRecording ? (
              <Square className="mx-auto h-8 w-8 fill-current" />
            ) : (
              <Mic className="mx-auto h-8 w-8" />
            )}
          </button>
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {isRecording ? 'Tap to stop' : 'Tap to talk'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={() => void startRecording()}
              onMouseUp={() => void stopRecorderAndSend()}
              onMouseLeave={() => void stopRecorderAndSend()}
              onTouchStart={() => void startRecording()}
              onTouchEnd={() => void stopRecorderAndSend()}
              className={cn(
                'px-4 py-2 text-xs font-medium rounded-md transition-colors',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              Hold To Talk
            </button>
            <button
              type="button"
              onClick={() => {
                sessionIdRef.current = makeBrowserId('session')
                window.localStorage.setItem('teachbox_demo_session_id', sessionIdRef.current)
                setAssistantText('')
                setDebugTimings(null)
                setState('idle')
                setTranscript(IDLE_TEXT)
              }}
              className="px-4 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              New Session
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center text-xs text-muted-foreground text-center">
        Browser demo mic capture requires `https` or `localhost`.
      </div>
    </div>
  )
}
