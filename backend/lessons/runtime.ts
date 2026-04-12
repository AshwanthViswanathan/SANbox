import type {
  LessonChoiceMap,
  LessonInteractionResponse,
  LessonRuntime,
} from '@/shared/types'

import type { TeachBoxParsedLesson, TeachBoxLessonStep } from '@/backend/lessons/load-lessons'

export type LessonSessionState = {
  lesson_id: string
  current_step_index: number
  current_chunk_index: number
  pause_followups_used: number
  checkpoint_attempts: number
  resume_pending: boolean
  status: 'active' | 'completed'
}

export function createInitialLessonSessionState(
  lesson: TeachBoxParsedLesson
): LessonSessionState {
  return {
    lesson_id: lesson.meta.lesson_id,
    current_step_index: 0,
    current_chunk_index: 0,
    pause_followups_used: 0,
    checkpoint_attempts: 0,
    resume_pending: false,
    status: 'active',
  }
}

export function getCurrentLessonStep(
  lesson: TeachBoxParsedLesson,
  state: LessonSessionState
): TeachBoxLessonStep {
  return lesson.steps[state.current_step_index] ?? lesson.steps[lesson.steps.length - 1]
}

export function getLessonPointer(lesson: TeachBoxParsedLesson, state: LessonSessionState) {
  const step = getCurrentLessonStep(lesson, state)

  return {
    lesson_id: lesson.meta.lesson_id,
    step_id: step.step_id,
    title: lesson.meta.title,
  }
}

export function serializeLessonState(state: LessonSessionState) {
  return {
    lesson_id: state.lesson_id,
    current_step_index: state.current_step_index,
    current_chunk_index: state.current_chunk_index,
    pause_followups_used: state.pause_followups_used,
    checkpoint_attempts: state.checkpoint_attempts,
    resume_pending: state.resume_pending,
    status: state.status,
  }
}

export function parseLessonState(raw: unknown): LessonSessionState | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<LessonSessionState>
  if (
    typeof candidate.lesson_id !== 'string' ||
    typeof candidate.current_step_index !== 'number' ||
    typeof candidate.current_chunk_index !== 'number' ||
    typeof candidate.pause_followups_used !== 'number' ||
    typeof candidate.checkpoint_attempts !== 'number' ||
    typeof candidate.resume_pending !== 'boolean' ||
    (candidate.status !== 'active' && candidate.status !== 'completed')
  ) {
    return null
  }

  return {
    lesson_id: candidate.lesson_id,
    current_step_index: candidate.current_step_index,
    current_chunk_index: candidate.current_chunk_index,
    pause_followups_used: candidate.pause_followups_used,
    checkpoint_attempts: candidate.checkpoint_attempts,
    resume_pending: candidate.resume_pending,
    status: candidate.status,
  }
}

function renderCheckpointPrompt(question: string, choices: LessonChoiceMap) {
  return `${question} A. ${choices.a} B. ${choices.b} C. ${choices.c} D. ${choices.d}`
}

export function buildLessonRuntime(
  lesson: TeachBoxParsedLesson,
  state: LessonSessionState,
  overrides?: Partial<LessonRuntime>
): LessonRuntime {
  const step = getCurrentLessonStep(lesson, state)

  switch (step.type) {
    case 'narration':
      return {
        step_type: 'narration',
        input_mode: 'none',
        prompt_text: step.script_chunks[state.current_chunk_index] ?? step.script_chunks[0],
        chunk_index: state.current_chunk_index + 1,
        chunk_total: step.script_chunks.length,
        choices: null,
        followups_remaining: null,
        attempts_remaining: null,
        should_auto_continue: true,
        is_complete: false,
        ...overrides,
      }
    case 'pause':
      {
        const maxPauseFollowups = Math.min(2, step.allowed_followups)
        return {
          step_type: 'pause',
          input_mode: state.resume_pending ? 'none' : 'voice',
          prompt_text: state.resume_pending ? step.resume_line : step.child_prompt,
          choices: null,
          followups_remaining: Math.max(0, maxPauseFollowups - state.pause_followups_used),
          attempts_remaining: null,
          should_auto_continue: state.resume_pending,
          is_complete: false,
          ...overrides,
        }
      }
    case 'checkpoint_mcq':
      return {
        step_type: 'checkpoint_mcq',
        input_mode: 'choice',
        prompt_text: renderCheckpointPrompt(step.question, step.choices),
        choices: step.choices,
        followups_remaining: null,
        attempts_remaining: Math.max(0, step.retry_limit - state.checkpoint_attempts),
        should_auto_continue: false,
        is_complete: false,
        ...overrides,
      }
    case 'completion':
      return {
        step_type: 'completion',
        input_mode: 'none',
        prompt_text: `${step.closing_message}${step.celebration_line ? ` ${step.celebration_line}` : ''}`,
        choices: null,
        followups_remaining: null,
        attempts_remaining: null,
        should_auto_continue: false,
        is_complete: true,
        ...overrides,
      }
  }
}

export function advanceToNextLessonStep(
  lesson: TeachBoxParsedLesson,
  state: LessonSessionState
): LessonSessionState {
  const nextStepIndex = Math.min(state.current_step_index + 1, lesson.steps.length - 1)
  const nextStep = lesson.steps[nextStepIndex]

  return {
    ...state,
    current_step_index: nextStepIndex,
    current_chunk_index: 0,
    pause_followups_used: 0,
    checkpoint_attempts: 0,
    resume_pending: false,
    status: nextStep.type === 'completion' ? 'completed' : state.status,
  }
}

export function coerceLessonStepIndex(
  lesson: TeachBoxParsedLesson,
  stepId: string | null | undefined
) {
  if (!stepId) {
    return 0
  }

  const stepIndex = lesson.steps.findIndex((step) => step.step_id === stepId)
  return stepIndex >= 0 ? stepIndex : 0
}

export function createLessonInteractionResponse(params: {
  deviceId: string
  sessionId: string
  lesson: TeachBoxParsedLesson
  state: LessonSessionState
  status: 'active' | 'completed'
  audio: LessonInteractionResponse['audio']
  runtime?: LessonRuntime
}): LessonInteractionResponse {
  return {
    device_id: params.deviceId,
    session_id: params.sessionId,
    mode: 'lesson',
    lesson: getLessonPointer(params.lesson, params.state),
    status: params.status,
    audio: params.audio,
    runtime: params.runtime ?? buildLessonRuntime(params.lesson, params.state),
  }
}
