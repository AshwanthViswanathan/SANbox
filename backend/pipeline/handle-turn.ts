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
import { loadRecentSessionTurns, logTurn } from '@/backend/storage/mock-sessions'
import {
  composeAssistantLogText,
  composeAssistantSpeechText,
  parseAssistantResponse,
} from '@/backend/utils/assistant-response'
import { replaceLatexWithPlainText } from '@/lib/math/latex'
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

function hasMeaningfulTranscript(transcript: string) {
  const normalized = transcript.trim()
  if (!normalized) {
    return false
  }

  const alphanumericCount = (normalized.match(/[a-z0-9]/gi) ?? []).length
  return alphanumericCount >= 2
}

function buildNoInputTurn(params: {
  turnId: string
  sessionId: string
  deviceId: string
  mode: TeachBoxMode
  activeLessonContext: Awaited<ReturnType<typeof getLessonVoiceTurnContext>>
  timingsMs: Record<string, number>
}): SessionTurnResponse {
  const isLessonPause = params.activeLessonContext?.step.type === 'pause'
  const transcript = isLessonPause
    ? "I didn't hear a question. Ask about this part when you are ready."
    : "I didn't hear anything. Try again."
  const followupsRemaining =
    isLessonPause && params.activeLessonContext?.step.type === 'pause'
      ? Math.max(
          0,
          Math.min(2, params.activeLessonContext.step.allowed_followups) -
            params.activeLessonContext.state.pause_followups_used
        )
      : null

  return {
    turn_id: params.turnId,
    session_id: params.sessionId,
    device_id: params.deviceId,
    mode: params.mode,
    cosmo_state: 'idle',
    transcript,
    input_safeguard: null,
    assistant: {
      text: '',
      blocked: false,
      example: null,
    },
    output_safeguard: null,
    audio: null,
    lesson: params.activeLessonContext
      ? {
          lesson_id: params.activeLessonContext.lesson.meta.lesson_id,
          step_id: params.activeLessonContext.step.step_id,
          title: params.activeLessonContext.lesson.meta.title,
        }
      : null,
    lesson_runtime: isLessonPause
      ? {
          step_type: 'pause',
          input_mode: 'voice',
          prompt_text: transcript,
          choices: null,
          followups_remaining: followupsRemaining,
          attempts_remaining: null,
          should_auto_continue: false,
          is_complete: false,
        }
      : null,
    debug: {
      timings_ms: params.timingsMs,
    },
  }
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

  if (!hasMeaningfulTranscript(transcript)) {
    return buildNoInputTurn({
      turnId,
      sessionId: input.sessionId,
      deviceId: input.deviceId,
      mode: input.mode,
      activeLessonContext,
      timingsMs,
    })
  }

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
        text: replaceLatexWithPlainText(blockedFallback),
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
        example: null,
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
          text: replaceLatexWithPlainText(unavailableText),
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
          example: null,
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
    const rawLessonAnswer =
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

    const parsedLessonAnswer = parseAssistantResponse(rawLessonAnswer)
    const lessonAnswerText = parsedLessonAnswer.explanation
    const lessonAnswerForSafety = composeAssistantSpeechText(parsedLessonAnswer)

    const outputSafeguardStartedAt = performance.now()
    const outputSafeguard = await classifySafetyDetailed(lessonAnswerForSafety)
    timingsMs.output_safeguard = Math.round(performance.now() - outputSafeguardStartedAt)

    const safeAssistant =
      outputSafeguard.label === 'BLOCK'
        ? {
            example: null,
            explanation: getBlockedFallback(),
          }
        : {
            example: parsedLessonAnswer.example,
            explanation: lessonAnswerText,
          }

    const safeAssistantSpeech = safeAssistant.explanation.trim()

    const followupState = await recordPauseFollowup(input.deviceId, input.sessionId)

    const ttsStartedAt = performance.now()
    let audio: SessionTurnResponse['audio'] = null
    let ttsError: string | null = null

    try {
      audio = await synthesizeSpeech({
        turnId,
        text: replaceLatexWithPlainText(safeAssistantSpeech),
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
        text: safeAssistant.explanation,
        blocked: outputSafeguard.label === 'BLOCK',
        example: safeAssistant.example,
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
        prompt_text: safeAssistant.explanation,
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
  let recentTurns: Awaited<ReturnType<typeof loadRecentSessionTurns>> = []

  if (input.mode === 'free_chat') {
    try {
      recentTurns = await loadRecentSessionTurns(input.sessionId, input.deviceId)
    } catch {
      recentTurns = []
    }
  }

  const llmStartedAt = performance.now()
  const rawAssistantText = await generateTeachingReply({
    transcript,
    mode: input.mode,
    lessonTitle: lesson?.meta.title ?? null,
    recentTurns,
    inputSafety: {
      label: inputSafeguard.label,
      reason: inputSafeguard.reason,
      category: inputSafeguard.category,
    },
  })
  timingsMs.llm = Math.round(performance.now() - llmStartedAt)

  const parsedAssistant = parseAssistantResponse(rawAssistantText)
  const assistantForSafety = composeAssistantSpeechText(parsedAssistant)

  const outputSafeguardStartedAt = performance.now()
  const outputSafeguard = await classifySafetyDetailed(assistantForSafety)
  timingsMs.output_safeguard = Math.round(performance.now() - outputSafeguardStartedAt)
  const safeAssistant =
    outputSafeguard.label === 'BLOCK'
      ? {
          example: null,
          explanation: getBlockedFallback(),
        }
      : {
          example: parsedAssistant.example,
          explanation: parsedAssistant.explanation,
        }
  const safeAssistantSpeech = safeAssistant.explanation.trim()
  const ttsStartedAt = performance.now()
  let audio: SessionTurnResponse['audio'] = null
  let ttsError: string | null = null

  try {
    audio = await synthesizeSpeech({
      turnId,
      text: replaceLatexWithPlainText(safeAssistantSpeech),
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
      text: safeAssistant.explanation,
      blocked: outputSafeguard.label === 'BLOCK',
      example: safeAssistant.example,
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
