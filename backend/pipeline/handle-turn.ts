import { loadLessonById } from '@/backend/lessons/load-lessons'
import {
  generateLessonPauseReply,
  generateTeachingReply,
} from '@/backend/providers/llm'
import {
  classifySafetyDetailed,
  type DetailedSafeguardResult,
} from '@/backend/providers/safeguard'
import {
  getLessonVoiceTurnContext,
  recordPauseFollowup,
} from '@/backend/storage/mock-device-lessons'
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
  const activeLessonContext =
    input.mode === 'lesson'
      ? await getLessonVoiceTurnContext(input.deviceId, input.sessionId)
      : null

  const inputSafeguardStartedAt = performance.now()
  const inputSafeguard = await classifySafetyDetailed(transcript)
  timingsMs.input_safeguard = Math.round(performance.now() - inputSafeguardStartedAt)

  if (inputSafeguard.label === 'BLOCK') {
    const blockedFallback = getBlockedFallback()
    const followupState =
      input.mode === 'lesson' && activeLessonContext?.step.type === 'pause'
        ? await recordPauseFollowup(input.deviceId, input.sessionId)
        : null
    const ttsStartedAt = performance.now()
    let audio: SessionTurnResponse['audio'] = null
    let ttsError: string | null = null

    try {
      audio = await synthesizeSpeech({
        turnId,
        text: blockedFallback,
      })
    } catch (error) {
      audio = null
      ttsError = error instanceof Error ? error.message : 'Text-to-speech failed.'
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
      lesson: activeLessonContext
        ? {
            lesson_id: activeLessonContext.lesson.meta.lesson_id,
            step_id: activeLessonContext.step.step_id,
            title: activeLessonContext.lesson.meta.title,
          }
        : null,
      lesson_runtime: followupState
        ? {
            step_type: 'pause',
            input_mode: followupState.shouldAutoContinue ? 'none' : 'voice',
            prompt_text: blockedFallback,
            choices: null,
            followups_remaining: followupState.followupsRemaining,
            attempts_remaining: null,
            should_auto_continue: followupState.shouldAutoContinue,
            is_complete: false,
          }
        : null,
      debug: {
        timings_ms: timingsMs,
        tts_error: ttsError,
      },
    }

    await logTurn(blockedTurn, input.ownerUserId, {
      inputSafeguard,
      outputSafeguard: null,
    })
    return blockedTurn
  }

  if (input.mode === 'lesson' && activeLessonContext) {
    const { lesson: activeLesson, step } = activeLessonContext

    if (step.type !== 'pause') {
      const unavailableText =
        step.type === 'checkpoint_mcq'
          ? 'Use the A through D lesson controls for this checkpoint.'
          : 'The lesson is still speaking. Wait for the next prompt before talking.'

      const ttsStartedAt = performance.now()
      let audio: SessionTurnResponse['audio'] = null
      let ttsError: string | null = null

      try {
        audio = await synthesizeSpeech({
          turnId,
          text: unavailableText,
        })
      } catch (error) {
        ttsError = error instanceof Error ? error.message : 'Text-to-speech failed.'
      }

      timingsMs.tts = Math.round(performance.now() - ttsStartedAt)

      const turn: SessionTurnResponse = {
        turn_id: turnId,
        session_id: input.sessionId,
        device_id: input.deviceId,
        mode: input.mode,
        cosmo_state: audio ? 'speaking' : 'error',
        transcript,
        input_safeguard: {
          label: inputSafeguard.label,
          reason: inputSafeguard.reason,
        },
        assistant: {
          text: unavailableText,
          blocked: false,
        },
        output_safeguard: null,
        audio,
        lesson: {
          lesson_id: activeLesson.meta.lesson_id,
          step_id: step.step_id,
          title: activeLesson.meta.title,
        },
        lesson_runtime: {
          step_type: step.type,
          input_mode: step.type === 'checkpoint_mcq' ? 'choice' : 'none',
          prompt_text: unavailableText,
          choices: step.type === 'checkpoint_mcq' ? step.choices : null,
          should_auto_continue: false,
          is_complete: false,
        },
        debug: {
          timings_ms: timingsMs,
          tts_error: ttsError,
        },
      }

      await logTurn(turn, input.ownerUserId, {
        inputSafeguard,
        outputSafeguard: null,
      })
      return turn
    }

    const llmStartedAt = performance.now()
    const lessonAnswer =
      inputSafeguard.label === 'BORDERLINE'
        ? `That is not an okay way to ask. Please use kind and respectful words. ${step.resume_line}`
        : await generateLessonPauseReply({
            transcript,
            lessonTitle: activeLesson.meta.title,
            stepTitle: step.title,
            stepPrompt: step.child_prompt,
            teacherNote: step.teacher_note ?? null,
          })
    timingsMs.llm = Math.round(performance.now() - llmStartedAt)

    const outputSafeguardStartedAt = performance.now()
    const outputSafeguard = await classifySafetyDetailed(lessonAnswer)
    timingsMs.output_safeguard = Math.round(performance.now() - outputSafeguardStartedAt)

    const safeAssistantText =
      outputSafeguard.label === 'BLOCK' ? getBlockedFallback() : lessonAnswer

    const followupState = await recordPauseFollowup(input.deviceId, input.sessionId)

    const ttsStartedAt = performance.now()
    let audio: SessionTurnResponse['audio'] = null
    let ttsError: string | null = null

    try {
      audio = await synthesizeSpeech({
        turnId,
        text: safeAssistantText,
      })
    } catch (error) {
      ttsError = error instanceof Error ? error.message : 'Text-to-speech failed.'
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
      lesson: {
        lesson_id: activeLesson.meta.lesson_id,
        step_id: step.step_id,
        title: activeLesson.meta.title,
      },
      lesson_runtime: {
        step_type: 'pause',
        input_mode: followupState.shouldAutoContinue ? 'none' : 'voice',
        prompt_text: safeAssistantText,
        choices: null,
        followups_remaining: followupState.followupsRemaining,
        attempts_remaining: null,
        should_auto_continue: followupState.shouldAutoContinue,
        is_complete: false,
      },
      debug: {
        timings_ms: timingsMs,
        tts_error: ttsError,
      },
    }

    await logTurn(turn, input.ownerUserId, {
      inputSafeguard,
      outputSafeguard,
    })
    return turn
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
  let ttsError: string | null = null

  try {
    audio = await synthesizeSpeech({
      turnId,
      text: safeAssistantText,
    })
  } catch (error) {
    audio = null
    ttsError = error instanceof Error ? error.message : 'Text-to-speech failed.'
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
      tts_error: ttsError,
    },
  }

  await logTurn(turn, input.ownerUserId, {
    inputSafeguard,
    outputSafeguard,
  })
  return turn
}
