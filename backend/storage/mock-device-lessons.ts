import 'server-only'

import { loadLessonById } from '@/backend/lessons/load-lessons'
import {
  advanceToNextLessonStep,
  buildLessonRuntime,
  coerceLessonStepIndex,
  createInitialLessonSessionState,
  createLessonInteractionResponse,
  getCurrentLessonStep,
  getLessonPointer,
  parseLessonState,
  serializeLessonState,
  type LessonSessionState,
} from '@/backend/lessons/runtime'
import { synthesizeSpeech } from '@/backend/providers/tts'
import { MOCK_DEVICES } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AssignLessonResponse,
  DeviceLessonAssignment,
  DeviceLessonState,
  LessonInteractionResponse,
  LessonRuntime,
  LessonAssignmentStatus,
  StartLessonResponse,
} from '@/shared/api'

type DeviceLessonRow = {
  id: string
  owner_user_id: string | null
  name: string
  platform: string
  updated_at: string
  last_seen_at?: string | null
  assigned_lesson_id: string | null
  assigned_by_user_id: string | null
  lesson_assignment_status: LessonAssignmentStatus | null
  lesson_assigned_at: string | null
  lesson_started_at: string | null
  lesson_completed_at: string | null
  active_session_id: string | null
  current_step_id: string | null
}

type SessionLessonRow = {
  id: string
  device_id: string
  owner_user_id: string | null
  mode: 'lesson' | 'free_chat'
  status: 'active' | 'idle' | 'completed' | 'errored'
  lesson_id: string | null
  lesson_step_id: string | null
  lesson_state: Record<string, unknown> | null
}

type StoredLessonRun = {
  deviceId: string
  sessionId: string
  lessonId: string
  ownerUserId: string | null
  state: LessonSessionState
  startedAt: string | null
}

const deviceLessonStore = new Map<string, DeviceLessonState>()
const lessonRunStore = new Map<string, StoredLessonRun>()

function makeEmptyState(deviceId: string, updatedAt = new Date().toISOString()): DeviceLessonState {
  return {
    device_id: deviceId,
    status: 'none',
    assigned_lesson: null,
    active_session_id: null,
    active_lesson_id: null,
    current_step_id: null,
    started_at: null,
    completed_at: null,
    updated_at: updatedAt,
  }
}

function getMemoryState(deviceId: string): DeviceLessonState {
  const existing = deviceLessonStore.get(deviceId)
  if (existing) {
    return existing
  }

  const emptyState = makeEmptyState(deviceId)
  deviceLessonStore.set(deviceId, emptyState)
  return emptyState
}

function tryCreateAdminClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

function allowEphemeralLessonStorage() {
  return process.env.NODE_ENV !== 'production'
}

function ensurePersistentLessonStorageConfigured(operation: string) {
  if (tryCreateAdminClient() || allowEphemeralLessonStorage()) {
    return
  }

  throw new Error(
    `${operation} requires SUPABASE_SERVICE_ROLE_KEY in deployed environments.`
  )
}

async function synthesizeLessonPrompt(promptText: string, turnId: string) {
  try {
    return await synthesizeSpeech({
      turnId,
      text: promptText,
    })
  } catch {
    return null
  }
}

async function fetchDeviceLessonRow(deviceId: string) {
  const admin = tryCreateAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('devices')
    .select(
      'id, owner_user_id, name, platform, updated_at, last_seen_at, assigned_lesson_id, assigned_by_user_id, lesson_assignment_status, lesson_assigned_at, lesson_started_at, lesson_completed_at, active_session_id, current_step_id'
    )
    .eq('id', deviceId)
    .maybeSingle()

  if (error) {
    return null
  }

  return {
    admin,
    row: (data as DeviceLessonRow | null) ?? null,
  }
}

async function fetchSessionLessonRow(sessionId: string) {
  const admin = tryCreateAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('sessions')
    .select('id, device_id, owner_user_id, mode, status, lesson_id, lesson_step_id, lesson_state')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) {
    return null
  }

  return {
    admin,
    row: (data as SessionLessonRow | null) ?? null,
  }
}

async function ensureDeviceRow(
  deviceId: string,
  ownerUserId: string | null
): Promise<{ admin: ReturnType<typeof createAdminClient>; row: DeviceLessonRow | null } | null> {
  const existing = await fetchDeviceLessonRow(deviceId)
  if (!existing?.admin) {
    return null
  }

  if (existing.row) {
    return existing
  }

  const mockDevice = MOCK_DEVICES.find((device) => device.id === deviceId)
  const fallbackName = mockDevice ? mockDevice.name : formatFallbackDeviceName(deviceId)

  const { error } = await existing.admin.from('devices').insert({
    id: deviceId,
    owner_user_id: ownerUserId,
    name: fallbackName,
    platform: deviceId.startsWith('web') ? 'web_pi' : 'rpi',
    last_seen_at: new Date().toISOString(),
    assigned_lesson_id: null,
    assigned_by_user_id: null,
    lesson_assignment_status: 'none',
    lesson_assigned_at: null,
    lesson_started_at: null,
    lesson_completed_at: null,
    active_session_id: null,
    current_step_id: null,
  })

  if (error) {
    return null
  }

  return fetchDeviceLessonRow(deviceId)
}

function formatFallbackDeviceName(deviceId: string) {
  if (deviceId.startsWith('webdemo_') || deviceId.startsWith('web-')) {
    const suffix = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'DEVICE'
    return `Browser Demo ${suffix}`
  }

  return (
    deviceId
      .replace(/^web-/, '')
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ') || deviceId
  )
}

async function touchAndClaimDeviceRow(deviceId: string, ownerUserId: string | null) {
  const persisted = await ensureDeviceRow(deviceId, ownerUserId)
  if (!persisted?.row) {
    return null
  }

  const updatePayload: Record<string, string> = {
    last_seen_at: new Date().toISOString(),
  }

  if (!persisted.row.owner_user_id && ownerUserId) {
    updatePayload.owner_user_id = ownerUserId
  }

  const { error } = await persisted.admin
    .from('devices')
    .update(updatePayload)
    .eq('id', deviceId)

  if (error) {
    return persisted
  }

  return fetchDeviceLessonRow(deviceId)
}

async function toAssignedLesson(row: Pick<
  DeviceLessonRow,
  'assigned_lesson_id' | 'assigned_by_user_id' | 'lesson_assigned_at'
>): Promise<DeviceLessonAssignment | null> {
  if (!row.assigned_lesson_id) {
    return null
  }

  const lesson = await loadLessonById(row.assigned_lesson_id)
  if (!lesson) {
    return null
  }

  return {
    lesson_id: lesson.meta.lesson_id,
    title: lesson.meta.title,
    grade_band: lesson.meta.grade_band,
    topic: lesson.meta.topic,
    assigned_at: row.lesson_assigned_at ?? new Date().toISOString(),
    assigned_by_user_id: row.assigned_by_user_id,
  }
}

async function stateFromRow(row: DeviceLessonRow): Promise<DeviceLessonState> {
  const assignedLesson = await toAssignedLesson(row)
  const status = row.lesson_assignment_status ?? (assignedLesson ? 'assigned' : 'none')

  return {
    device_id: row.id,
    status,
    assigned_lesson: assignedLesson,
    active_session_id: row.active_session_id,
    active_lesson_id:
      status === 'active' || status === 'completed' ? row.assigned_lesson_id : null,
    current_step_id: row.current_step_id,
    started_at: row.lesson_started_at,
    completed_at: row.lesson_completed_at,
    updated_at: row.updated_at,
  }
}

function toAssignResponse(state: DeviceLessonState): AssignLessonResponse {
  return {
    device_id: state.device_id,
    status: state.status,
    assigned_lesson: state.assigned_lesson,
    updated_at: state.updated_at,
  }
}

async function persistDeviceLessonProgress(params: {
  deviceId: string
  sessionId: string | null
  lessonId: string
  stepId: string
  status: LessonAssignmentStatus
  ownerUserId: string | null
  startedAt?: string | null
  completedAt?: string | null
}) {
  const persisted = await ensureDeviceRow(params.deviceId, params.ownerUserId)
  if (!persisted?.row) {
    const memoryState: DeviceLessonState = {
      device_id: params.deviceId,
      status: params.status,
      assigned_lesson:
        getMemoryState(params.deviceId).assigned_lesson,
      active_session_id: params.sessionId,
      active_lesson_id: params.lessonId,
      current_step_id: params.stepId,
      started_at: params.startedAt ?? getMemoryState(params.deviceId).started_at,
      completed_at: params.completedAt ?? null,
      updated_at: new Date().toISOString(),
    }

    deviceLessonStore.set(params.deviceId, memoryState)
    return
  }

  await persisted.admin
    .from('devices')
    .update({
      owner_user_id: persisted.row.owner_user_id ?? params.ownerUserId,
      assigned_lesson_id: params.lessonId,
      lesson_assignment_status: params.status,
      active_session_id: params.sessionId,
      current_step_id: params.stepId,
      lesson_started_at: params.startedAt ?? persisted.row.lesson_started_at,
      lesson_completed_at: params.completedAt ?? null,
    })
    .eq('id', params.deviceId)
}

async function persistLessonRun(params: {
  deviceId: string
  sessionId: string
  ownerUserId: string | null
  lessonId: string
  stepId: string
  state: LessonSessionState
  startedAt: string
  completedAt?: string | null
}) {
  const admin = tryCreateAdminClient()
  if (!admin) {
    lessonRunStore.set(params.deviceId, {
      deviceId: params.deviceId,
      sessionId: params.sessionId,
      lessonId: params.lessonId,
      ownerUserId: params.ownerUserId,
      state: params.state,
      startedAt: params.startedAt,
    })
    return
  }

  const { data: existingSession } = await admin
    .from('sessions')
    .select('id')
    .eq('id', params.sessionId)
    .maybeSingle()

  const payload = {
    id: params.sessionId,
    device_id: params.deviceId,
    owner_user_id: params.ownerUserId,
    mode: 'lesson' as const,
    status: (params.state.status === 'completed' ? 'completed' : 'active') as 'active' | 'completed',
    lesson_id: params.lessonId,
    lesson_step_id: params.stepId,
    lesson_state: serializeLessonState(params.state),
    last_turn_at: new Date().toISOString(),
  }

  if (existingSession) {
    const { error } = await admin.from('sessions').update(payload).eq('id', params.sessionId)
    if (error) {
      console.error('Failed to update session:', error)
      lessonRunStore.set(params.deviceId, {
        deviceId: params.deviceId,
        sessionId: params.sessionId,
        lessonId: params.lessonId,
        ownerUserId: params.ownerUserId,
        state: params.state,
        startedAt: params.startedAt,
      })
    }
  } else {
    const { error } = await admin.from('sessions').insert(payload)
    if (error) {
      console.error('Failed to insert session:', error)
      lessonRunStore.set(params.deviceId, {
        deviceId: params.deviceId,
        sessionId: params.sessionId,
        lessonId: params.lessonId,
        ownerUserId: params.ownerUserId,
        state: params.state,
        startedAt: params.startedAt,
      })
    }
  }
}

async function loadStoredLessonRun(deviceId: string, sessionId: string): Promise<StoredLessonRun | null> {
  const inMemory = lessonRunStore.get(deviceId)
  if (inMemory) {
    if (inMemory.sessionId === sessionId) {
      return inMemory
    }
    console.warn(`Session ID mismatch for device ${deviceId}: expected ${sessionId}, found ${inMemory.sessionId}`)
  }

  const device = await fetchDeviceLessonRow(deviceId)
  const session = await fetchSessionLessonRow(sessionId)

  if (!session?.row) {
    console.warn(`No session found in database for sessionId: ${sessionId}`)
    return null
  }

  if (!session.row.lesson_id) {
    console.warn(`Session ${sessionId} exists but has no lesson_id`)
    return null
  }

  const lesson = await loadLessonById(session.row.lesson_id)
  if (!lesson) {
    console.warn(`Lesson ${session.row.lesson_id} not found for session ${sessionId}`)
    return null
  }

  const parsedState =
    parseLessonState(session.row.lesson_state) ??
    {
      lesson_id: session.row.lesson_id,
      current_step_index: coerceLessonStepIndex(lesson, session.row.lesson_step_id),
      current_chunk_index: 0,
      pause_followups_used: 0,
      checkpoint_attempts: 0,
      resume_pending: false,
      status: session.row.status === 'completed' ? 'completed' : 'active',
    }

  const storedRun = {
    deviceId,
    sessionId,
    lessonId: session.row.lesson_id,
    ownerUserId: session.row.owner_user_id,
    state: parsedState,
    startedAt: device?.row?.lesson_started_at ?? null,
  }

  lessonRunStore.set(deviceId, storedRun)

  return storedRun
}

export async function getLessonVoiceTurnContext(deviceId: string, sessionId: string) {
  const storedRun = await loadStoredLessonRun(deviceId, sessionId)
  if (!storedRun) {
    return null
  }

  const lesson = await loadLessonById(storedRun.lessonId)
  if (!lesson) {
    return null
  }

  const step = getCurrentLessonStep(lesson, storedRun.state)
  return {
    lesson,
    state: storedRun.state,
    step,
    ownerUserId: storedRun.ownerUserId,
  }
}

export async function recordPauseFollowup(deviceId: string, sessionId: string) {
  const storedRun = await loadStoredLessonRun(deviceId, sessionId)
  if (!storedRun) {
    throw new Error(`No active lesson session for device: ${deviceId}`)
  }

  const lesson = await loadLessonById(storedRun.lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${storedRun.lessonId}`)
  }

  const step = getCurrentLessonStep(lesson, storedRun.state)
  if (step.type !== 'pause') {
    throw new Error(`Lesson is not awaiting a pause question for device: ${deviceId}`)
  }

  const maxPauseFollowups = Math.min(2, step.allowed_followups)
  const used = storedRun.state.pause_followups_used + 1
  const exhausted = used >= maxPauseFollowups
  const nextState: LessonSessionState = {
    ...storedRun.state,
    pause_followups_used: used,
    resume_pending: exhausted,
  }

  await persistLessonRun({
    deviceId,
    sessionId,
    ownerUserId: storedRun.ownerUserId,
    lessonId: lesson.meta.lesson_id,
    stepId: step.step_id,
    state: nextState,
    startedAt: storedRun.startedAt ?? new Date().toISOString(),
  })

  lessonRunStore.set(deviceId, {
    ...storedRun,
    state: nextState,
  })

  return {
    lesson,
    state: nextState,
    step,
    shouldAutoContinue: exhausted,
    followupsRemaining: Math.max(0, maxPauseFollowups - used),
  }
}

async function buildInteractionResponse(params: {
  deviceId: string
  sessionId: string
  ownerUserId: string | null
  lessonId: string
  state: LessonSessionState
  startedAt: string
  startedAtForResponse?: string | null
  runtimeOverride?: LessonRuntime
}): Promise<LessonInteractionResponse> {
  const lesson = await loadLessonById(params.lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${params.lessonId}`)
  }

  const runtime = params.runtimeOverride ?? buildLessonRuntime(lesson, params.state)
  const audio = await synthesizeLessonPrompt(
    runtime.prompt_text,
    `lesson_${params.sessionId}_${lesson.steps[params.state.current_step_index]?.step_id ?? 'step'}`
  )

  await persistLessonRun({
    deviceId: params.deviceId,
    sessionId: params.sessionId,
    ownerUserId: params.ownerUserId,
    lessonId: params.lessonId,
    stepId: getLessonPointer(lesson, params.state).step_id,
    state: params.state,
    startedAt: params.startedAt,
  })

  await persistDeviceLessonProgress({
    deviceId: params.deviceId,
    sessionId: params.sessionId,
    lessonId: params.lessonId,
    stepId: getLessonPointer(lesson, params.state).step_id,
    status: params.state.status === 'completed' ? 'completed' : 'active',
    ownerUserId: params.ownerUserId,
    startedAt: params.startedAt,
    completedAt: params.state.status === 'completed' ? new Date().toISOString() : null,
  })

  lessonRunStore.set(params.deviceId, {
    deviceId: params.deviceId,
    sessionId: params.sessionId,
    lessonId: params.lessonId,
    ownerUserId: params.ownerUserId,
    state: params.state,
    startedAt: params.startedAt,
  })

  return createLessonInteractionResponse({
    deviceId: params.deviceId,
    sessionId: params.sessionId,
    lesson,
    state: params.state,
    status: params.state.status === 'completed' ? 'completed' : 'active',
    audio,
    runtime,
  })
}

export async function getDeviceLessonState(
  deviceId: string,
  ownerUserId: string | null = null
): Promise<DeviceLessonState> {
  const persisted = await touchAndClaimDeviceRow(deviceId, ownerUserId)
  if (persisted?.row) {
    return stateFromRow(persisted.row)
  }

  return getMemoryState(deviceId)
}

export async function claimDeviceForOwner(
  deviceId: string,
  ownerUserId: string
): Promise<DeviceLessonState> {
  ensurePersistentLessonStorageConfigured('Device claim')

  const persisted = await ensureDeviceRow(deviceId, ownerUserId)
  if (!persisted?.row) {
    throw new Error(`Unable to claim device: ${deviceId}`)
  }

  if (persisted.row.owner_user_id && persisted.row.owner_user_id !== ownerUserId) {
    throw new Error(`Forbidden device claim for device: ${deviceId}`)
  }

  const updatedAt = new Date().toISOString()
  const { error } = await persisted.admin
    .from('devices')
    .update({
      owner_user_id: ownerUserId,
      last_seen_at: updatedAt,
    })
    .eq('id', deviceId)

  if (error) {
    throw new Error(`Unable to claim device: ${deviceId}`)
  }

  const refreshed = await fetchDeviceLessonRow(deviceId)
  if (refreshed?.row) {
    return stateFromRow(refreshed.row)
  }

  return makeEmptyState(deviceId, updatedAt)
}

export async function assignLessonToDevice(
  deviceId: string,
  lessonId: string | null,
  assignedByUserId: string | null
): Promise<AssignLessonResponse> {
  ensurePersistentLessonStorageConfigured('Lesson assignment')

  const persisted = await ensureDeviceRow(deviceId, assignedByUserId)
  const updatedAt = new Date().toISOString()

  if (persisted?.row) {
    if (persisted.row.owner_user_id && persisted.row.owner_user_id !== assignedByUserId) {
      throw new Error(`Forbidden device assignment for device: ${deviceId}`)
    }

    if (lessonId === null) {
      const { error } = await persisted.admin
        .from('devices')
        .update({
          owner_user_id: persisted.row.owner_user_id ?? assignedByUserId,
          assigned_lesson_id: null,
          assigned_by_user_id: null,
          lesson_assignment_status: 'none',
          lesson_assigned_at: null,
          lesson_started_at: null,
          lesson_completed_at: null,
          active_session_id: null,
          current_step_id: null,
        })
        .eq('id', deviceId)

      if (!error) {
        lessonRunStore.delete(deviceId)
        const cleared = makeEmptyState(deviceId, updatedAt)
        deviceLessonStore.set(deviceId, cleared)
        return toAssignResponse(cleared)
      }
    } else {
      const lesson = await loadLessonById(lessonId)
      if (!lesson) {
        throw new Error(`Unknown lesson_id: ${lessonId}`)
      }

      const { error } = await persisted.admin
        .from('devices')
        .update({
          owner_user_id: persisted.row.owner_user_id ?? assignedByUserId,
          assigned_lesson_id: lesson.meta.lesson_id,
          assigned_by_user_id: assignedByUserId,
          lesson_assignment_status: 'assigned',
          lesson_assigned_at: updatedAt,
          lesson_started_at: null,
          lesson_completed_at: null,
          active_session_id: null,
          current_step_id: null,
        })
        .eq('id', deviceId)

      if (!error) {
        const assignedLesson: DeviceLessonAssignment = {
          lesson_id: lesson.meta.lesson_id,
          title: lesson.meta.title,
          grade_band: lesson.meta.grade_band,
          topic: lesson.meta.topic,
          assigned_at: updatedAt,
          assigned_by_user_id: assignedByUserId,
        }

        const assignedState: DeviceLessonState = {
          device_id: deviceId,
          status: 'assigned',
          assigned_lesson: assignedLesson,
          active_session_id: null,
          active_lesson_id: null,
          current_step_id: null,
          started_at: null,
          completed_at: null,
          updated_at: updatedAt,
        }

        deviceLessonStore.set(deviceId, assignedState)
        lessonRunStore.delete(deviceId)

        return toAssignResponse(assignedState)
      }
    }
  }

  if (lessonId === null) {
    const clearedState = makeEmptyState(deviceId, updatedAt)
    deviceLessonStore.set(deviceId, clearedState)
    lessonRunStore.delete(deviceId)
    return toAssignResponse(clearedState)
  }

  const lesson = await loadLessonById(lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${lessonId}`)
  }

  const assignedLesson: DeviceLessonAssignment = {
    lesson_id: lesson.meta.lesson_id,
    title: lesson.meta.title,
    grade_band: lesson.meta.grade_band,
    topic: lesson.meta.topic,
    assigned_at: updatedAt,
    assigned_by_user_id: assignedByUserId,
  }

  const nextState: DeviceLessonState = {
    device_id: deviceId,
    status: 'assigned',
    assigned_lesson: assignedLesson,
    active_session_id: null,
    active_lesson_id: null,
    current_step_id: null,
    started_at: null,
    completed_at: null,
    updated_at: updatedAt,
  }

  deviceLessonStore.set(deviceId, nextState)
  lessonRunStore.delete(deviceId)
  return toAssignResponse(nextState)
}

export async function startAssignedLesson(
  deviceId: string,
  sessionId: string,
  lessonIdOverride: string | null = null
): Promise<StartLessonResponse> {
  ensurePersistentLessonStorageConfigured('Lesson start')

  const persisted = await fetchDeviceLessonRow(deviceId)
  const startedAt = new Date().toISOString()

  const assignedLessonId =
    lessonIdOverride ??
    persisted?.row?.assigned_lesson_id ??
    getMemoryState(deviceId).assigned_lesson?.lesson_id ??
    null

  if (!assignedLessonId) {
    throw new Error(`No assigned lesson for device: ${deviceId}`)
  }

  const lesson = await loadLessonById(assignedLessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${assignedLessonId}`)
  }

  const initialState = createInitialLessonSessionState(lesson)
  const response = await buildInteractionResponse({
    deviceId,
    sessionId,
    ownerUserId: persisted?.row?.owner_user_id ?? null,
    lessonId: lesson.meta.lesson_id,
    state: initialState,
    startedAt,
  })

  return {
    ...response,
    started_at: startedAt,
  }
}

export async function resetActiveLesson(deviceId: string) {
  ensurePersistentLessonStorageConfigured('Lesson reset')

  const persisted = await fetchDeviceLessonRow(deviceId)
  const assignedLesson =
    persisted?.row ? await toAssignedLesson(persisted.row) : getMemoryState(deviceId).assigned_lesson
  const nextStatus: LessonAssignmentStatus = assignedLesson ? 'assigned' : 'none'
  const updatedAt = new Date().toISOString()

  lessonRunStore.delete(deviceId)

  if (persisted?.row) {
    const { error } = await persisted.admin
      .from('devices')
      .update({
        lesson_assignment_status: nextStatus,
        active_session_id: null,
        current_step_id: null,
        lesson_started_at: null,
        lesson_completed_at: null,
      })
      .eq('id', deviceId)

    if (error) {
      throw new Error(`Unable to reset lesson for device: ${deviceId}`)
    }

    const refreshed = await fetchDeviceLessonRow(deviceId)
    if (refreshed?.row) {
      return stateFromRow(refreshed.row)
    }
  }

  const nextState: DeviceLessonState = {
    device_id: deviceId,
    status: nextStatus,
    assigned_lesson: assignedLesson ?? null,
    active_session_id: null,
    active_lesson_id: null,
    current_step_id: null,
    started_at: null,
    completed_at: null,
    updated_at: updatedAt,
  }

  deviceLessonStore.set(deviceId, nextState)
  return nextState
}

export function clearDeviceLessonState(deviceId: string) {
  deviceLessonStore.delete(deviceId)
  lessonRunStore.delete(deviceId)
}

export async function continueActiveLesson(
  deviceId: string,
  sessionId: string
): Promise<LessonInteractionResponse> {
  ensurePersistentLessonStorageConfigured('Lesson continuation')

  let storedRun = await loadStoredLessonRun(deviceId, sessionId)
  if (!storedRun) {
    console.warn(`No stored lesson run found for device ${deviceId}, session ${sessionId}. Attempting recovery...`)
    const persisted = await fetchDeviceLessonRow(deviceId)
    const assignedLessonId =
      persisted?.row?.assigned_lesson_id ?? getMemoryState(deviceId).assigned_lesson?.lesson_id ?? null

    if (assignedLessonId) {
      console.log(`Found assigned lesson ${assignedLessonId}, starting new lesson session`)
      await startAssignedLesson(deviceId, sessionId, assignedLessonId)
      storedRun = await loadStoredLessonRun(deviceId, sessionId)
    }
  }

  if (!storedRun) {
    const inMemory = lessonRunStore.get(deviceId)
    const debugInfo = inMemory 
      ? `In-memory session: ${inMemory.sessionId}, requested: ${sessionId}`
      : 'No in-memory session found'
    throw new Error(`No active lesson session for device: ${deviceId}. ${debugInfo}`)
  }

  const lesson = await loadLessonById(storedRun.lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${storedRun.lessonId}`)
  }

  const step = getCurrentLessonStep(lesson, storedRun.state)

  if (step.type === 'narration') {
    const nextState =
      storedRun.state.current_chunk_index + 1 < step.script_chunks.length
        ? {
            ...storedRun.state,
            current_chunk_index: storedRun.state.current_chunk_index + 1,
          }
        : advanceToNextLessonStep(lesson, storedRun.state)

    return buildInteractionResponse({
      deviceId,
      sessionId,
      ownerUserId: storedRun.ownerUserId,
      lessonId: storedRun.lessonId,
      state: nextState,
      startedAt: storedRun.startedAt ?? new Date().toISOString(),
    })
  }

  if (step.type === 'pause') {
    const maxPauseFollowups = Math.min(2, step.allowed_followups)
    if (
      storedRun.state.resume_pending ||
      storedRun.state.pause_followups_used >= maxPauseFollowups
    ) {
      const nextState = advanceToNextLessonStep(lesson, storedRun.state)
      const nextRuntime = buildLessonRuntime(lesson, nextState)

      return buildInteractionResponse({
        deviceId,
        sessionId,
        ownerUserId: storedRun.ownerUserId,
        lessonId: storedRun.lessonId,
        state: nextState,
        startedAt: storedRun.startedAt ?? new Date().toISOString(),
        runtimeOverride: nextRuntime,
      })
    }

    throw new Error(`Lesson is still waiting for a child question on device: ${deviceId}`)
  }

  if (step.type === 'checkpoint_mcq') {
    throw new Error(`Lesson is waiting for a checkpoint answer on device: ${deviceId}`)
  }

  throw new Error(`Lesson is already complete for device: ${deviceId}`)
}

export async function submitLessonCheckpointChoice(
  deviceId: string,
  sessionId: string,
  choice: 'a' | 'b' | 'c' | 'd'
): Promise<LessonInteractionResponse> {
  ensurePersistentLessonStorageConfigured('Lesson checkpoint submission')

  const storedRun = await loadStoredLessonRun(deviceId, sessionId)
  if (!storedRun) {
    throw new Error(`No active lesson session for device: ${deviceId}`)
  }

  const lesson = await loadLessonById(storedRun.lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${storedRun.lessonId}`)
  }

  const step = getCurrentLessonStep(lesson, storedRun.state)
  if (step.type !== 'checkpoint_mcq') {
    throw new Error(`Lesson is not waiting for a checkpoint answer on device: ${deviceId}`)
  }

  if (choice === step.correct_choice) {
    const nextState = advanceToNextLessonStep(lesson, storedRun.state)
    const nextRuntime = buildLessonRuntime(lesson, nextState)

    return buildInteractionResponse({
      deviceId,
      sessionId,
      ownerUserId: storedRun.ownerUserId,
      lessonId: storedRun.lessonId,
      state: nextState,
      startedAt: storedRun.startedAt ?? new Date().toISOString(),
      runtimeOverride: {
        ...nextRuntime,
        prompt_text: `${step.correct_response} ${nextRuntime.prompt_text}`.trim(),
      },
    })
  }

  const nextAttemptCount = storedRun.state.checkpoint_attempts + 1
  if (nextAttemptCount < step.retry_limit) {
    const nextState = {
      ...storedRun.state,
      checkpoint_attempts: nextAttemptCount,
    }

    const retryPrompt = [
      step.incorrect_response,
      step.hint ?? '',
      buildLessonRuntime(lesson, nextState).prompt_text,
    ]
      .filter(Boolean)
      .join(' ')

    return buildInteractionResponse({
      deviceId,
      sessionId,
      ownerUserId: storedRun.ownerUserId,
      lessonId: storedRun.lessonId,
      state: nextState,
      startedAt: storedRun.startedAt ?? new Date().toISOString(),
      runtimeOverride: buildLessonRuntime(lesson, nextState, {
        prompt_text: retryPrompt,
        attempts_remaining: Math.max(0, step.retry_limit - nextAttemptCount),
      }),
    })
  }

  const nextState = advanceToNextLessonStep(lesson, storedRun.state)
  const nextRuntime = buildLessonRuntime(lesson, nextState)

  return buildInteractionResponse({
    deviceId,
    sessionId,
    ownerUserId: storedRun.ownerUserId,
    lessonId: storedRun.lessonId,
    state: nextState,
    startedAt: storedRun.startedAt ?? new Date().toISOString(),
    runtimeOverride: {
      ...nextRuntime,
      prompt_text: `${step.incorrect_response} The correct answer was ${step.correct_choice.toUpperCase()}. ${nextRuntime.prompt_text}`.trim(),
    },
  })
}
