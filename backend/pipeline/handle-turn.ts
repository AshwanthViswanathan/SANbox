import { loadLessonById } from '@/backend/lessons/load-lessons'
import { generateTeachingReply } from '@/backend/providers/llm'
import {
  classifySafetyDetailed,
  type DetailedSafeguardResult,
} from '@/backend/providers/safeguard'
import { transcribeAudio } from '@/backend/providers/stt'
import { synthesizeSpeech } from '@/backend/providers/tts'
import { logTurn } from '@/backend/storage/mock-sessions'
import { getBlockedFallback } from '@/backend/utils/fallback-response'
import { makeId } from '@/backend/utils/ids'
import type { SessionTurnResponse, TeachBoxMode } from '@/shared/types'

type HandleTurnInput = {
  audio: File
  deviceId: string
  sessionId: string
  mode: TeachBoxMode
  ownerUserId?: string | null
  lessonId?: string | null
  transcriptOverride?: string | null
}

type TurnLogMetadata = {
  inputSafeguard: DetailedSafeguardResult | null
  outputSafeguard: DetailedSafeguardResult | null
}

export async function handleTurn(input: HandleTurnInput): Promise<SessionTurnResponse> {
  const turnId = makeId('turn')
  const timingsMs: Record<string, number> = {}
  const sttStartedAt = performance.now()
  const transcript = await transcribeAudio(input.audio, input.transcriptOverride ?? undefined)
  timingsMs.stt = Math.round(performance.now() - sttStartedAt)

  const inputSafeguardStartedAt = performance.now()
  const inputSafeguard = await classifySafetyDetailed(transcript)
  timingsMs.input_safeguard = Math.round(performance.now() - inputSafeguardStartedAt)

  if (inputSafeguard.label === 'BLOCK') {
    const blockedFallback = getBlockedFallback()
    const ttsStartedAt = performance.now()
    let audio: SessionTurnResponse['audio'] = null

    try {
      audio = await synthesizeSpeech({
        turnId,
        text: blockedFallback,
      })
    } catch {
      audio = null
    }

    timingsMs.tts = Math.round(performance.now() - ttsStartedAt)

    const blockedTurn: SessionTurnResponse = {
      turn_id: turnId,
      session_id: input.sessionId,
      device_id: input.deviceId,
      mode: input.mode,
      cosmo_state: audio ? 'blocked' : 'error',
      transcript,
      input_safeguard: {
        label: inputSafeguard.label,
        reason: inputSafeguard.reason,
      },
      assistant: {
        text: blockedFallback,
        blocked: true,
      },
      output_safeguard: null,
      audio,
      lesson: null,
      debug: {
        timings_ms: timingsMs,
      },
    }

    await logTurn(blockedTurn, input.ownerUserId, {
      inputSafeguard,
      outputSafeguard: null,
    })
    return blockedTurn
  }

  const lesson = input.lessonId ? await loadLessonById(input.lessonId) : null
  const llmStartedAt = performance.now()
  const assistantText = await generateTeachingReply({
    transcript,
    mode: input.mode,
    lessonTitle: lesson?.meta.title ?? null,
    inputSafety: {
      label: inputSafeguard.label,
      reason: inputSafeguard.reason,
      category: inputSafeguard.category,
    },
  })
  timingsMs.llm = Math.round(performance.now() - llmStartedAt)

  const outputSafeguardStartedAt = performance.now()
  const outputSafeguard = await classifySafetyDetailed(assistantText)
  timingsMs.output_safeguard = Math.round(performance.now() - outputSafeguardStartedAt)
  const safeAssistantText =
    outputSafeguard.label === 'BLOCK' ? getBlockedFallback() : assistantText
  const ttsStartedAt = performance.now()
  let audio: SessionTurnResponse['audio'] = null

  try {
    audio = await synthesizeSpeech({
      turnId,
      text: safeAssistantText,
    })
  } catch {
    audio = null
  }

  timingsMs.tts = Math.round(performance.now() - ttsStartedAt)

  const turn: SessionTurnResponse = {
    turn_id: turnId,
    session_id: input.sessionId,
    device_id: input.deviceId,
    mode: input.mode,
    cosmo_state: outputSafeguard.label === 'BLOCK' ? 'blocked' : audio ? 'speaking' : 'error',
    transcript,
    input_safeguard: {
      label: inputSafeguard.label,
      reason: inputSafeguard.reason,
    },
    assistant: {
      text: safeAssistantText,
      blocked: outputSafeguard.label === 'BLOCK',
    },
    output_safeguard: {
      label: outputSafeguard.label,
      reason: outputSafeguard.reason,
    },
    audio,
    lesson:
      input.mode === 'lesson' && lesson
        ? {
            lesson_id: input.lessonId ?? lesson.meta.lesson_id,
            step_id: 'checkpoint-1',
            title: lesson.meta.title,
          }
        : null,
    debug: {
      timings_ms: timingsMs,
    },
  }

  await logTurn(turn, input.ownerUserId, {
    inputSafeguard,
    outputSafeguard,
  })
  return turn
}
