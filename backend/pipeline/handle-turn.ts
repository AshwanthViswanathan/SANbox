import { loadLessonById } from '@/backend/lessons/load-lessons'
import { generateTeachingReply } from '@/backend/providers/llm'
import { classifySafety } from '@/backend/providers/safeguard'
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
  lessonId?: string | null
  transcriptOverride?: string | null
}

export async function handleTurn(input: HandleTurnInput): Promise<SessionTurnResponse> {
  const turnId = makeId('turn')
  const transcript = await transcribeAudio(input.audio, input.transcriptOverride ?? undefined)
  const inputSafeguard = await classifySafety(transcript)

  if (inputSafeguard.label === 'BLOCK') {
    const blockedTurn: SessionTurnResponse = {
      turn_id: turnId,
      session_id: input.sessionId,
      device_id: input.deviceId,
      mode: input.mode,
      cosmo_state: 'blocked',
      transcript,
      input_safeguard: inputSafeguard,
      assistant: {
        text: getBlockedFallback(),
        blocked: true,
      },
      output_safeguard: null,
      audio: await synthesizeSpeech({ turnId }),
      lesson: null,
      debug: {
        timings_ms: {
          stt: 200,
          input_safeguard: 50,
          tts: 120,
        },
      },
    }

    logTurn(blockedTurn)
    return blockedTurn
  }

  const lesson = input.lessonId ? await loadLessonById(input.lessonId) : null
  const assistantText = await generateTeachingReply({
    transcript,
    mode: input.mode,
    lessonTitle: lesson?.meta.title ?? null,
  })
  const outputSafeguard = await classifySafety(assistantText)
  const safeAssistantText =
    outputSafeguard.label === 'BLOCK' ? getBlockedFallback() : assistantText

  const turn: SessionTurnResponse = {
    turn_id: turnId,
    session_id: input.sessionId,
    device_id: input.deviceId,
    mode: input.mode,
    cosmo_state: outputSafeguard.label === 'BLOCK' ? 'blocked' : 'speaking',
    transcript,
    input_safeguard: inputSafeguard,
    assistant: {
      text: safeAssistantText,
      blocked: outputSafeguard.label === 'BLOCK',
    },
    output_safeguard: outputSafeguard,
    audio: await synthesizeSpeech({ turnId }),
    lesson:
      input.mode === 'lesson' && lesson
        ? {
            lesson_id: input.lessonId ?? lesson.meta.lesson_id,
            step_id: 'checkpoint-1',
            title: lesson.meta.title,
          }
        : null,
    debug: {
      timings_ms: {
        stt: 200,
        input_safeguard: 50,
        llm: 180,
        output_safeguard: 45,
        tts: 120,
      },
    },
  }

  logTurn(turn)
  return turn
}
