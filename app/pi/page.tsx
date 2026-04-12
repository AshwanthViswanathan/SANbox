'use client'

import { useEffect, useRef, useState } from 'react'
import { CosmoFace } from '@/components/pi/cosmo-face'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type {
  CosmoState,
  DeviceLessonState,
  LessonInteractionResponse,
  SessionTurnResponse,
} from '@/shared/types'
import { Mic, Activity, AlertCircle, Copy, Link2, RefreshCw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  deviceLessonStateSchema,
  lessonInteractionResponseSchema,
  sessionTurnResponseSchema,
  startLessonResponseSchema,
} from '@/shared/api'

const IDLE_TEXT = 'Click the button and ask San a question!'
const THINKING_TEXT = 'Thinking about that...'
const MAX_INITIAL_SILENCE_MS = 5000
const MAX_POST_SPEECH_SILENCE_MS = 1200
const MAX_RECORDING_MS = 12000
const SPEECH_RMS_THRESHOLD = 0.015

type RecorderState = {
  stream: MediaStream
  audioContext: AudioContext
  source: MediaStreamAudioSourceNode
  processor: ScriptProcessorNode
  silenceGain: GainNode
  chunks: Float32Array[]
  sampleRate: number
  startedAt: number
  speechDetected: boolean
  lastVoiceAt: number | null
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

function getOrCreateDemoDeviceId() {
  const queryDeviceId = new URLSearchParams(window.location.search).get('device_id')?.trim()
  if (queryDeviceId) {
    window.localStorage.setItem('teachbox_demo_device_id', queryDeviceId)
    return queryDeviceId
  }

  const configured = process.env.NEXT_PUBLIC_PI_DEVICE_ID?.trim()
  if (configured) {
    window.localStorage.setItem('teachbox_demo_device_id', configured)
    return configured
  }

  const existing = window.localStorage.getItem('teachbox_demo_device_id')
  if (existing && !isLegacySharedDemoDeviceId(existing)) {
    return existing
  }

  const created = makeBrowserId('webdemo')
  window.localStorage.setItem('teachbox_demo_device_id', created)
  return created
}

function isLegacySharedDemoDeviceId(value: string) {
  return value === 'pi_living_room' || value === 'pi_bedroom' || /^web-[a-z0-9-]+(?:-\d+)?$/i.test(value)
}

function dataUrlToPlayableSrc(dataUrl: string) {
  return dataUrl
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/)

  if (!match) {
    throw new Error('Audio payload was not a valid data URL.')
  }

  const mimeType = match[1] || 'application/octet-stream'
  const isBase64 = Boolean(match[2])
  const payload = match[3] || ''
  const binary = isBase64 ? atob(payload) : decodeURIComponent(payload)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

async function playAudioElement(
  audioUrl: string,
  activeAudioRef: React.MutableRefObject<HTMLAudioElement | null>
) {
  const blob = dataUrlToBlob(audioUrl)
  const objectUrl = URL.createObjectURL(blob)
  const audio = new Audio(dataUrlToPlayableSrc(objectUrl))
  audio.preload = 'auto'
  audio.playsInline = true
  activeAudioRef.current = audio

  try {
    audio.load()
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('Generated audio failed to play.'))
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function playAudioWithWebAudio(audioUrl: string) {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    throw new Error('Web Audio playback is unavailable.')
  }

  const audioContext = new window.AudioContext()

  try {
    await audioContext.resume()
    const blob = dataUrlToBlob(audioUrl)
    const audioBuffer = await blob.arrayBuffer()
    const decoded = await audioContext.decodeAudioData(audioBuffer.slice(0))
    const source = audioContext.createBufferSource()
    source.buffer = decoded
    source.connect(audioContext.destination)

    await new Promise<void>((resolve, reject) => {
      source.onended = () => resolve()
      source.start(0)

      window.setTimeout(() => {
        if (audioContext.state === 'closed') return
        reject(new Error('Web Audio playback timed out.'))
      }, Math.max(5000, decoded.duration * 1500))
    })
  } finally {
    await audioContext.close().catch(() => undefined)
  }
}

async function waitForSpeechVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return []
  }

  const existing = window.speechSynthesis.getVoices()
  if (existing.length > 0) {
    return existing
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }, 1200)

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeoutId)
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }
  })
}

async function playBrowserSpeech(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
    throw new Error('Browser speech synthesis is unavailable.')
  }

  const voices = await waitForSpeechVoices()

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.lang = 'en-US'

    const preferredVoice =
      voices.find((voice) => /en[-_]?us/i.test(voice.lang) && voice.localService) ??
      voices.find((voice) => /en/i.test(voice.lang)) ??
      null

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Browser speech synthesis failed.'))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

async function playAssistantAudio(
  audioUrl: string | null,
  text: string,
  activeAudioRef: React.MutableRefObject<HTMLAudioElement | null>
) {
  const errors: string[] = []

  if (audioUrl) {
    try {
      await playAudioElement(audioUrl, activeAudioRef)
      return
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'HTML audio playback failed.')
      activeAudioRef.current?.pause()
      activeAudioRef.current = null
    }

    try {
      await playAudioWithWebAudio(audioUrl)
      return
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Web Audio playback failed.')
    }
  }

  try {
    await playBrowserSpeech(text)
    return
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Browser speech synthesis failed.')
  }

  throw new Error(
    `Audio playback failed on this browser. ${errors.join(' ')}`
  )
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function createTestToneDataUrl(durationMs = 700, sampleRate = 24000) {
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000)
  const samples = new Float32Array(sampleCount)

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    const envelope = Math.min(1, index / 1200) * Math.min(1, (sampleCount - index) / 1800)
    samples[index] =
      Math.sin(2 * Math.PI * 523.25 * time) * 0.18 * envelope +
      Math.sin(2 * Math.PI * 659.25 * time) * 0.1 * envelope
  }

  const toneBlob = encodeWav(samples, sampleRate)

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Failed to generate speaker test audio.'))
    }
    reader.onerror = () => reject(new Error('Failed to generate speaker test audio.'))
    reader.readAsDataURL(toneBlob)
  })
}

export default function PiDisplayPage() {
  const [state, setState] = useState<CosmoState>('idle')
  const [transcript, setTranscript] = useState(IDLE_TEXT)
  const [assistantText, setAssistantText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [autoListenEnabled, setAutoListenEnabled] = useState(true)
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false)
  const [isLessonLoading, setIsLessonLoading] = useState(false)
  const [lessonState, setLessonState] = useState<DeviceLessonState | null>(null)
  const [lessonInteraction, setLessonInteraction] = useState<LessonInteractionResponse | null>(null)
  const [debugTimings, setDebugTimings] = useState<Record<string, number> | null>(null)
  const [copiedState, setCopiedState] = useState<'device_id' | 'device_link' | null>(null)
  const [linkedAccountEmail, setLinkedAccountEmail] = useState<string | null>(null)
  const recorderStateRef = useRef<RecorderState | null>(null)
  const deviceIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const isStoppingRef = useRef(false)
  const autoRestartTimeoutRef = useRef<number | null>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

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

    deviceIdRef.current = getOrCreateDemoDeviceId()
    sessionIdRef.current = getOrCreateStorageId('teachbox_demo_session_id', 'session')

    void refreshLinkedAccount()
    void fetchLessonState(deviceIdRef.current)

    const syncLessonState = () => {
      void refreshLinkedAccount()

      if (!deviceIdRef.current || lessonState?.status === 'active') {
        return
      }

      void fetchLessonState(deviceIdRef.current)
    }

    const intervalId = window.setInterval(syncLessonState, 3000)
    window.addEventListener('focus', syncLessonState)

    return () => {
      const recorderState = recorderStateRef.current
      recorderState?.processor.disconnect()
      recorderState?.source.disconnect()
      recorderState?.silenceGain.disconnect()
      recorderState?.stream.getTracks().forEach((track) => track.stop())
      void recorderState?.audioContext.close()
      if (autoRestartTimeoutRef.current !== null) {
        window.clearTimeout(autoRestartTimeoutRef.current)
      }
      window.clearInterval(intervalId)
      window.removeEventListener('focus', syncLessonState)
    }
  }, [lessonState?.status])

  async function refreshLinkedAccount() {
    try {
      const supabase = createSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setLinkedAccountEmail(user?.email ?? null)
    } catch {
      setLinkedAccountEmail(null)
    }
  }

  useEffect(() => {
    if (lessonInteraction?.runtime.input_mode !== 'choice') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'a' || key === 'b' || key === 'c' || key === 'd') {
        event.preventDefault()
        void submitCheckpointChoice(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lessonInteraction?.runtime.input_mode])

  useEffect(() => {
    if (
      lessonInteraction?.runtime.input_mode !== 'voice' ||
      lessonState?.status !== 'active' ||
      isRecording ||
      isLessonLoading ||
      isStoppingRef.current
    ) {
      return
    }

    cancelAutoRestart()
    autoRestartTimeoutRef.current = window.setTimeout(() => {
      autoRestartTimeoutRef.current = null
      void startRecording()
    }, 350)

    return () => {
      cancelAutoRestart()
    }
  }, [isLessonLoading, isRecording, lessonInteraction?.runtime.input_mode, lessonState?.status])

  const cancelAutoRestart = () => {
    if (autoRestartTimeoutRef.current !== null) {
      window.clearTimeout(autoRestartTimeoutRef.current)
      autoRestartTimeoutRef.current = null
    }
  }

  const copyDeviceReference = async (kind: 'device_id' | 'device_link') => {
    const deviceId = deviceIdRef.current
    if (!deviceId || typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }

    const value =
      kind === 'device_link'
        ? `${window.location.origin}/pi?device_id=${encodeURIComponent(deviceId)}`
        : deviceId

    try {
      await navigator.clipboard.writeText(value)
      setCopiedState(kind)
      window.setTimeout(() => {
        setCopiedState((current) => (current === kind ? null : current))
      }, 1800)
    } catch {
      // Ignore clipboard failures on locked-down browsers.
    }
  }

  const fetchLessonState = async (deviceId: string, applyState = true) => {
    try {
      const response = await fetch(`/api/v1/devices/${deviceId}/lesson`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        return null
      }

      const payload = deviceLessonStateSchema.parse(await response.json())
      if (applyState) {
        setLessonState(payload)
      }

      if (payload.active_session_id) {
        sessionIdRef.current = payload.active_session_id
      }

      return payload
    } catch {
      // Ignore non-critical lesson state bootstrap failures in the Pi demo.
      return null
    }
  }

  const resetLessonState = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/v1/devices/${deviceId}/lesson/reset`, {
        method: 'POST',
      })

      if (!response.ok) {
        return null
      }

      const payload = deviceLessonStateSchema.parse(await response.json())
      setLessonState(payload)
      return payload
    } catch {
      return null
    }
  }

  const scheduleAutoRestart = () => {
    if (!autoListenEnabled) return
    if (lessonState?.status === 'active' && !lessonAllowsVoiceInput) return

    cancelAutoRestart()
    autoRestartTimeoutRef.current = window.setTimeout(() => {
      autoRestartTimeoutRef.current = null
      void startRecording()
    }, 350)
  }

  const cleanupRecorder = () => {
    const recorderState = recorderStateRef.current

    recorderState?.processor.disconnect()
    recorderState?.source.disconnect()
    recorderState?.silenceGain.disconnect()
    recorderState?.stream.getTracks().forEach((track) => track.stop())
    void recorderState?.audioContext.close()
    recorderStateRef.current = null
  }

  const stopConversation = () => {
    cancelAutoRestart()
    isStoppingRef.current = true
    activeAudioRef.current?.pause()
    activeAudioRef.current = null
    cleanupRecorder()
    setIsRecording(false)
    setAssistantText('')
    setDebugTimings(null)
    setState('idle')
    setTranscript(IDLE_TEXT)
    isStoppingRef.current = false
  }

  const lessonAllowsVoiceInput = lessonInteraction?.runtime.input_mode === 'voice'

  const handleLessonInteraction = async (result: LessonInteractionResponse) => {
    setLessonInteraction(result)
    setLessonState((current) => ({
      device_id: result.device_id,
      status: result.status,
      assigned_lesson: current?.assigned_lesson ?? null,
      active_session_id: result.session_id,
      active_lesson_id: result.lesson.lesson_id,
      current_step_id: result.lesson.step_id,
      started_at: current?.started_at ?? new Date().toISOString(),
      completed_at: result.status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }))

    setAssistantText('')
    setTranscript(result.runtime.prompt_text)
    setState(
      result.runtime.input_mode === 'none'
        ? 'speaking'
        : result.runtime.is_complete
          ? 'idle'
          : 'idle'
    )

    try {
      if (result.audio?.url || result.runtime.prompt_text.trim()) {
        await playAssistantAudio(result.audio?.url ?? null, result.runtime.prompt_text, activeAudioRef)
      }
    } finally {
      activeAudioRef.current = null
    }

    if (result.runtime.is_complete) {
      setState('idle')
      setTranscript('Lesson complete.')
      setAssistantText(result.runtime.prompt_text)
      await fetchLessonState(result.device_id)
      return
    }

    if (result.runtime.should_auto_continue) {
      await continueLesson(result.session_id)
      return
    }

    setState('idle')
    setTranscript(result.runtime.prompt_text)
    setAssistantText(
      result.runtime.input_mode === 'choice'
        ? 'Answer with A, B, C, or D.'
        : result.runtime.input_mode === 'voice'
          ? 'Ask your question when you are ready.'
          : ''
    )

  }

  const startLesson = async () => {
    if (!deviceIdRef.current || !sessionIdRef.current || isLessonLoading) return

    const deviceId = deviceIdRef.current
    const sessionId = sessionIdRef.current
    setIsLessonLoading(true)
    cancelAutoRestart()

    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(`/api/v1/devices/${deviceId}/lesson/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            lesson_id: lessonState?.assigned_lesson?.lesson_id ?? null,
          }),
        })

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | LessonInteractionResponse
          | null

        if (response.ok) {
          const parsed = startLessonResponseSchema.parse(payload)
          setIsLessonLoading(false)
          await handleLessonInteraction(parsed)
          return
        }

        const message =
          payload && 'error' in payload ? payload.error ?? 'Unable to start lesson.' : 'Unable to start lesson.'

        const shouldRetry =
          attempt < 2 &&
          message.startsWith('No assigned lesson for device:') &&
          Boolean(deviceId)

        if (shouldRetry) {
          const refreshed = await fetchLessonState(deviceId, false)
          if (refreshed?.status === 'assigned') {
            await sleep(200)
            continue
          }
        }

        throw new Error(message)
      }
    } catch (error) {
      setState('error')
      setTranscript(error instanceof Error ? error.message : 'Unable to start lesson.')
    } finally {
      setIsLessonLoading(false)
    }
  }

  const continueLesson = async (sessionId = sessionIdRef.current) => {
    if (!deviceIdRef.current || !sessionId || isLessonLoading) return

    setIsLessonLoading(true)

    try {
      const response = await fetch(`/api/v1/devices/${deviceIdRef.current}/lesson/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | LessonInteractionResponse
        | null

      if (!response.ok) {
        throw new Error(payload && 'error' in payload ? payload.error : 'Unable to continue lesson.')
      }

      const parsed = lessonInteractionResponseSchema.parse(payload)
      setIsLessonLoading(false)
      await handleLessonInteraction(parsed)
    } catch (error) {
      setState('error')
      setTranscript(error instanceof Error ? error.message : 'Unable to continue lesson.')
    } finally {
      setIsLessonLoading(false)
    }
  }

  const submitCheckpointChoice = async (choice: 'a' | 'b' | 'c' | 'd') => {
    if (!deviceIdRef.current || !sessionIdRef.current || isLessonLoading) return

    setIsLessonLoading(true)

    try {
      const response = await fetch(`/api/v1/devices/${deviceIdRef.current}/lesson/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          choice,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | LessonInteractionResponse
        | null

      if (!response.ok) {
        throw new Error(
          payload && 'error' in payload ? payload.error : 'Unable to submit checkpoint answer.'
        )
      }

      const parsed = lessonInteractionResponseSchema.parse(payload)
      setIsLessonLoading(false)
      await handleLessonInteraction(parsed)
    } catch (error) {
      setState('error')
      setTranscript(
        error instanceof Error ? error.message : 'Unable to submit checkpoint answer.'
      )
    } finally {
      setIsLessonLoading(false)
    }
  }

  const testSpeaker = async () => {
    if (isTestingSpeaker || isRecording || isStoppingRef.current) return

    setIsTestingSpeaker(true)
    cancelAutoRestart()
    setAssistantText('This is a speaker test.')
    setState('speaking')
    setTranscript('Playing speaker test...')

    try {
      const testAudioUrl = await createTestToneDataUrl()
      await playAssistantAudio(testAudioUrl, 'This is a speaker test.', activeAudioRef)
      setState('idle')
      setTranscript(IDLE_TEXT)
    } catch (error) {
      setState('error')
      setTranscript(
        error instanceof Error ? error.message : 'Speaker test failed on this browser.'
      )
    } finally {
      activeAudioRef.current = null
      setIsTestingSpeaker(false)
    }
  }

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

  const stopRecorderAndSend = async (reason: 'manual' | 'auto' = 'manual') => {
    const recorderState = recorderStateRef.current
    if (!recorderState || isStoppingRef.current) return

    cancelAutoRestart()
    isStoppingRef.current = true
    setIsRecording(false)
    setState('thinking')
    setTranscript(THINKING_TEXT)

    try {
      cleanupRecorder()

      const samples = mergeFloat32Chunks(recorderState.chunks)
      const elapsedMs = Date.now() - recorderState.startedAt

      if (
        reason === 'auto' &&
        lessonState?.status === 'active' &&
        lessonAllowsVoiceInput &&
        !recorderState.speechDetected
      ) {
        setState('idle')
        setTranscript('Ask a question when you are ready.')
        setAssistantText('')
        scheduleAutoRestart()
        return
      }

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
      formData.set(
        'mode',
        lessonState?.status === 'active' && lessonAllowsVoiceInput ? 'lesson' : 'free_chat'
      )
      if (lessonInteraction?.lesson.lesson_id) {
        formData.set('lesson_id', lessonInteraction.lesson.lesson_id)
      }

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
      const serverTtsError = result.debug?.tts_error ?? null
      if (result.lesson_runtime) {
        setLessonInteraction((current) =>
          current
            ? {
                ...current,
                lesson: result.lesson ?? current.lesson,
                runtime: result.lesson_runtime,
              }
            : current
        )
      }

      try {
        await playAssistantAudio(
          result.audio?.url ?? null,
          result.assistant.text,
          activeAudioRef
        )
        setState('idle')
        if (result.lesson_runtime?.should_auto_continue && sessionIdRef.current) {
          await continueLesson(sessionIdRef.current)
          return
        }

        if (result.lesson_runtime?.input_mode === 'voice') {
          setTranscript(
            result.lesson_runtime.followups_remaining === 1
              ? 'Ask one more question about this part if you want.'
              : 'Ask a question about this part.'
          )
          setAssistantText('')
          return
        }

        setTranscript(IDLE_TEXT)
        if (
          (reason === 'auto' || autoListenEnabled) &&
          (!lessonState || lessonState.status !== 'active')
        ) {
          scheduleAutoRestart()
        }
        return
      } catch (playbackError) {
        setState('error')
        setTranscript(
          serverTtsError
            ? `Server TTS failed: ${serverTtsError}`
            : playbackError instanceof Error
              ? playbackError.message
              : 'Audio playback failed on this browser.'
        )
        return
      } finally {
        activeAudioRef.current = null
      }
    } catch (error) {
      setState('error')
      setTranscript(error instanceof Error ? error.message : 'Voice request failed.')
    } finally {
      isStoppingRef.current = false
    }
  }

  const startRecording = async () => {
    if (
      !isSupported ||
      isRecording ||
      isStoppingRef.current ||
      lessonState?.status === 'assigned' ||
      (lessonState?.status === 'active' && !lessonAllowsVoiceInput)
    ) {
      return
    }

    try {
      cancelAutoRestart()
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

        let sumSquares = 0
        for (let index = 0; index < input.length; index += 1) {
          sumSquares += input[index] * input[index]
        }

        const rms = Math.sqrt(sumSquares / input.length)
        const currentRecorderState = recorderStateRef.current
        if (!currentRecorderState) return

        const now = Date.now()
        if (rms >= SPEECH_RMS_THRESHOLD) {
          currentRecorderState.speechDetected = true
          currentRecorderState.lastVoiceAt = now
          return
        }

        const elapsedMs = now - currentRecorderState.startedAt
        const silenceMs = currentRecorderState.lastVoiceAt
          ? now - currentRecorderState.lastVoiceAt
          : now - currentRecorderState.startedAt

        if (
          (!currentRecorderState.speechDetected && elapsedMs >= MAX_INITIAL_SILENCE_MS) ||
          (currentRecorderState.speechDetected && silenceMs >= MAX_POST_SPEECH_SILENCE_MS) ||
          elapsedMs >= MAX_RECORDING_MS
        ) {
          void stopRecorderAndSend('auto')
        }
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
        speechDetected: false,
        lastVoiceAt: null,
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
      await stopRecorderAndSend('manual')
      return
    }

    await startRecording()
  }

  const piLoginPath = deviceIdRef.current
    ? `/pi?device_id=${encodeURIComponent(deviceIdRef.current)}`
    : '/pi'

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 transition-colors duration-500',
        getContainerStyle()
      )}
    >
      <div className="w-full max-w-4xl flex-1 flex items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-white/10 px-6 py-6 sm:px-10 sm:py-8">
          <div className="w-full flex justify-between items-center opacity-80">
            <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider">
              {getStateIcon()}
              <span>{state}</span>
            </div>
            <div className="flex items-center gap-2">
              {lessonState?.status && lessonState.status !== 'none' && (
                <span className="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold tracking-wider">
                  {lessonState.status === 'assigned' ? 'LESSON READY' : 'LESSON MODE'}
                </span>
              )}
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full gap-12 pt-8">
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
              {lessonInteraction ? (
                <p className="text-xs font-mono text-muted-foreground">
                  {lessonInteraction.lesson.title} • {lessonInteraction.runtime.step_type}
                </p>
              ) : lessonState?.assigned_lesson ? (
                <p className="text-xs font-mono text-muted-foreground">
                  Assigned lesson: {lessonState.assigned_lesson.title}
                </p>
              ) : null}
              {deviceIdRef.current ? (
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    SANbox Device
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-foreground">
                    {deviceIdRef.current}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Ask the parent dashboard to assign lessons to this exact device ID.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {linkedAccountEmail
                      ? `Linked account: ${linkedAccountEmail}`
                      : 'Not linked to a signed-in SANbox account yet.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyDeviceReference('device_id')}
                      className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedState === 'device_id' ? 'Copied ID' : 'Copy ID'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyDeviceReference('device_link')}
                      className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {copiedState === 'device_link' ? 'Copied Link' : 'Copy Reopen Link'}
                    </button>
                  </div>
                  {!linkedAccountEmail ? (
                    <div className="mt-4">
                      <GoogleAuthButton
                        mode="login"
                        nextPath={piLoginPath}
                        className="w-full gap-2"
                      />
                    </div>
                  ) : null}
                </div>
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
                disabled={
                  !isSupported ||
                  isStoppingRef.current ||
                  isTestingSpeaker ||
                  (lessonState?.status === 'active' && !lessonAllowsVoiceInput) ||
                  isLessonLoading
                }
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
                {isRecording
                  ? 'Tap to stop'
                  : lessonState?.status === 'assigned'
                    ? 'Tap to talk or start lesson'
                    : lessonInteraction?.runtime.input_mode === 'choice'
                      ? 'Use A, B, C, or D'
                      : lessonState?.status === 'active' && !lessonAllowsVoiceInput
                        ? 'Lesson is guiding the next step'
                        : autoListenEnabled
                          ? 'Tap to start loop'
                          : 'Tap to talk'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {lessonState?.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() => void startLesson()}
                    disabled={isLessonLoading || isRecording || isTestingSpeaker}
                    className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLessonLoading ? 'Starting Lesson...' : 'Start Lesson'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopConversation}
                  disabled={isTestingSpeaker || isLessonLoading}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Conversation
                </button>
                <button
                  type="button"
                  onClick={() => void testSpeaker()}
                  disabled={
                    !isSupported ||
                    isRecording ||
                    isStoppingRef.current ||
                    isTestingSpeaker ||
                    isLessonLoading
                  }
                  className="px-4 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTestingSpeaker ? 'Testing Speaker...' : 'Test Speaker'}
                </button>
                <button
                  type="button"
                  onMouseDown={() => void startRecording()}
                  onMouseUp={() => void stopRecorderAndSend('manual')}
                  onMouseLeave={() => void stopRecorderAndSend('manual')}
                    onTouchStart={() => void startRecording()}
                    onTouchEnd={() => void stopRecorderAndSend('manual')}
                  disabled={
                    isTestingSpeaker ||
                    isLessonLoading ||
                    (lessonState?.status === 'active' && !lessonAllowsVoiceInput)
                  }
                  className={cn(
                    'px-4 py-2 text-xs font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  Hold To Talk
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    cancelAutoRestart()
                    cleanupRecorder()
                    activeAudioRef.current?.pause()
                    activeAudioRef.current = null
                    sessionIdRef.current = makeBrowserId('session')
                    window.localStorage.setItem('teachbox_demo_session_id', sessionIdRef.current)
                    setAssistantText('')
                    setDebugTimings(null)
                    setLessonInteraction(null)
                    setIsRecording(false)
                    if (deviceIdRef.current && lessonState?.status === 'active') {
                      await resetLessonState(deviceIdRef.current)
                    } else if (deviceIdRef.current) {
                      await fetchLessonState(deviceIdRef.current)
                    }
                    setState('idle')
                    setTranscript(IDLE_TEXT)
                  }}
                  disabled={isTestingSpeaker || isLessonLoading}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  New Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !autoListenEnabled
                    setAutoListenEnabled(nextValue)
                    if (!nextValue) {
                      cancelAutoRestart()
                    }
                  }}
                  disabled={isTestingSpeaker || isLessonLoading || lessonState?.status === 'active'}
                  className={cn(
                    'px-4 py-2 text-xs font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    autoListenEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {autoListenEnabled ? 'Auto Listen On' : 'Auto Listen Off'}
                </button>
              </div>
              {lessonInteraction?.runtime.input_mode === 'choice' && lessonInteraction.runtime.choices ? (
                <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {(['a', 'b', 'c', 'd'] as const).map((choiceKey) => (
                    <button
                      key={choiceKey}
                      type="button"
                      onClick={() => void submitCheckpointChoice(choiceKey)}
                      disabled={isLessonLoading}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm text-foreground hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="mr-2 font-mono uppercase">{choiceKey}.</span>
                      {lessonInteraction.runtime.choices?.[choiceKey]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center text-xs text-muted-foreground text-center">
        Browser demo mic capture requires `https` or `localhost`. Each browser keeps its own SANbox device ID.
      </div>
    </div>
  )
}
