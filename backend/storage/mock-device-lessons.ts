import 'server-only'

import { loadLessonById } from '@/backend/lessons/load-lessons'
import { MOCK_DEVICES } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AssignLessonResponse,
  DeviceLessonAssignment,
  DeviceLessonState,
  LessonAssignmentStatus,
  StartLessonResponse,
} from '@/shared/api'

type DeviceLessonRow = {
  id: string
  owner_user_id: string | null
  name: string
  platform: string
  updated_at: string
  assigned_lesson_id: string | null
  assigned_by_user_id: string | null
  lesson_assignment_status: LessonAssignmentStatus | null
  lesson_assigned_at: string | null
  lesson_started_at: string | null
  lesson_completed_at: string | null
  active_session_id: string | null
  current_step_id: string | null
}

const deviceLessonStore = new Map<string, DeviceLessonState>()

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

async function fetchDeviceLessonRow(deviceId: string) {
  const admin = tryCreateAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('devices')
    .select(
      'id, owner_user_id, name, platform, updated_at, assigned_lesson_id, assigned_by_user_id, lesson_assignment_status, lesson_assigned_at, lesson_started_at, lesson_completed_at, active_session_id, current_step_id'
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
  if (!mockDevice) {
    return existing
  }

  const { error } = await existing.admin.from('devices').insert({
    id: mockDevice.id,
    owner_user_id: ownerUserId,
    name: mockDevice.name,
    platform: 'web_pi',
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
    grade_band: lesson.meta.grade_band ?? 'K-5',
    topic: lesson.meta.topic ?? 'general',
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

export async function getDeviceLessonState(deviceId: string): Promise<DeviceLessonState> {
  const persisted = await fetchDeviceLessonRow(deviceId)
  if (persisted?.row) {
    return stateFromRow(persisted.row)
  }

  return getMemoryState(deviceId)
}

export async function assignLessonToDevice(
  deviceId: string,
  lessonId: string | null,
  assignedByUserId: string | null
): Promise<AssignLessonResponse> {
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
        return {
          device_id: deviceId,
          status: 'none',
          assigned_lesson: null,
          updated_at: updatedAt,
        }
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
          grade_band: lesson.meta.grade_band ?? 'K-5',
          topic: lesson.meta.topic ?? 'general',
          assigned_at: updatedAt,
          assigned_by_user_id: assignedByUserId,
        }

        return {
          device_id: deviceId,
          status: 'assigned',
          assigned_lesson: assignedLesson,
          updated_at: updatedAt,
        }
      }
    }
  }

  if (lessonId === null) {
    const clearedState = makeEmptyState(deviceId, updatedAt)
    deviceLessonStore.set(deviceId, clearedState)
    return toAssignResponse(clearedState)
  }

  const lesson = await loadLessonById(lessonId)
  if (!lesson) {
    throw new Error(`Unknown lesson_id: ${lessonId}`)
  }

  const assignedLesson: DeviceLessonAssignment = {
    lesson_id: lesson.meta.lesson_id,
    title: lesson.meta.title,
    grade_band: lesson.meta.grade_band ?? 'K-5',
    topic: lesson.meta.topic ?? 'general',
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
  return toAssignResponse(nextState)
}

export async function startAssignedLesson(
  deviceId: string,
  sessionId: string
): Promise<StartLessonResponse> {
  const persisted = await fetchDeviceLessonRow(deviceId)
  const startedAt = new Date().toISOString()
  const stepId = 'intro'

  if (persisted?.row) {
    if (!persisted.row.assigned_lesson_id) {
      throw new Error(`No assigned lesson for device: ${deviceId}`)
    }

    const lesson = await loadLessonById(persisted.row.assigned_lesson_id)
    if (!lesson) {
      throw new Error(`Unknown lesson_id: ${persisted.row.assigned_lesson_id}`)
    }

    const { error } = await persisted.admin
      .from('devices')
      .update({
        lesson_assignment_status: 'active',
        active_session_id: sessionId,
        current_step_id: stepId,
        lesson_started_at: startedAt,
        lesson_completed_at: null,
      })
      .eq('id', deviceId)

    if (!error) {
      return {
        device_id: deviceId,
        session_id: sessionId,
        mode: 'lesson',
        lesson: {
          lesson_id: lesson.meta.lesson_id,
          step_id: stepId,
          title: lesson.meta.title,
        },
        prompt_text: `Today we are learning ${lesson.meta.title}. Ready to start?`,
        status: 'active',
        started_at: startedAt,
      }
    }
  }

  const existing = getMemoryState(deviceId)
  if (!existing.assigned_lesson) {
    throw new Error(`No assigned lesson for device: ${deviceId}`)
  }

  const nextState: DeviceLessonState = {
    ...existing,
    status: 'active',
    active_session_id: sessionId,
    active_lesson_id: existing.assigned_lesson.lesson_id,
    current_step_id: stepId,
    started_at: startedAt,
    completed_at: null,
    updated_at: startedAt,
  }

  deviceLessonStore.set(deviceId, nextState)

  return {
    device_id: deviceId,
    session_id: sessionId,
    mode: 'lesson',
    lesson: {
      lesson_id: existing.assigned_lesson.lesson_id,
      step_id: stepId,
      title: existing.assigned_lesson.title,
    },
    prompt_text: `Today we are learning ${existing.assigned_lesson.title}. Ready to start?`,
    status: nextState.status,
    started_at: startedAt,
  }
}
