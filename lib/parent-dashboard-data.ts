import 'server-only'

import { cache } from 'react'

import { loadLessons } from '@/backend/lessons/load-lessons'
import { getDeviceControl } from '@/backend/storage/mock-device-controls'
import { getDeviceLessonState } from '@/backend/storage/mock-device-lessons'
import { buildSessionDetail, buildSessionSummary } from '@/backend/storage/mock-sessions'
import { MOCK_DEVICES } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  lessonsResponseSchema,
  parentDeviceControlResponseSchema,
  parentSessionDetailResponseSchema,
  parentSessionsResponseSchema,
} from '@/shared/api'
import type { DeviceLessonState, ParentDeviceControlState, SafeguardLabel } from '@/shared/api'

type DeviceStatus = 'online' | 'offline'
type ParentDeviceRow = {
  id: string
  name: string
  last_seen_at: string | null
}
type ParentDeviceListItem = {
  id: string
  name: string
  lastSeen: string
  last_seen_at: string | null
}

export type ParentDeviceSnapshot = {
  id: string
  name: string
  status: DeviceStatus
  lastSeen: string
  battery: number
  microphone: 'ready' | 'check'
  speaker: 'ready' | 'check'
  recentSessions: number
  flaggedTurns: number
  lastMode: 'lesson' | 'free_chat' | null
  controls: ParentDeviceControlState
  controlsUpdatedAt: string
  lessonState: DeviceLessonState
  recentTurns: {
    sessionId: string
    turnId: string
    createdAt: string
    transcript: string
    assistantText: string
    mode: 'lesson' | 'free_chat'
  }[]
}

const DEVICE_HEALTH: Record<
  string,
  Pick<ParentDeviceSnapshot, 'battery' | 'microphone' | 'speaker'>
> = {
  pi_living_room: {
    battery: 92,
    microphone: 'ready',
    speaker: 'ready',
  },
  pi_bedroom: {
    battery: 18,
    microphone: 'check',
    speaker: 'ready',
  },
}

const getAuthenticatedUserId = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
})

export const getParentSessions = cache(async () => {
  const userId = await getAuthenticatedUserId()
  if (!userId) return []

  const supabase = await createClient()
  const payload = await buildSessionSummary(supabase, userId)
  const parsed = parentSessionsResponseSchema.parse(payload)

  return [...parsed.sessions].sort(
    (a, b) => new Date(b.last_turn_at).getTime() - new Date(a.last_turn_at).getTime()
  )
})

export const getParentSessionDetail = cache(async (sessionId: string) => {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return parentSessionDetailResponseSchema.parse({
      session: {
        session_id: sessionId,
        device_id: 'unknown_device',
        mode: 'free_chat',
        lesson_id: null,
      },
      turns: [],
    })
  }

  const supabase = await createClient()
  const payload = await buildSessionDetail(supabase, userId, sessionId)
  return parentSessionDetailResponseSchema.parse(payload)
})

export const getLessons = cache(async () => {
  const payload = { lessons: await loadLessons() }
  const parsed = lessonsResponseSchema.parse(payload)
  return [...parsed.lessons].sort((a, b) => a.title.localeCompare(b.title))
})

export async function getDashboardOverview() {
  const [sessions, devices] = await Promise.all([getParentSessions(), getDeviceSnapshots()])

  const flaggedTurns = await collectFlaggedTurns(sessions)
  const lessonSessions = sessions.filter((session) => session.mode === 'lesson')
  const activeDevices = devices.filter((device) => device.status === 'online').length

  return {
    sessions,
    flaggedTurns,
    stats: {
      totalSessions: sessions.length,
      totalTurns: sessions.reduce((sum, session) => sum + session.turn_count, 0),
      flaggedTurns: flaggedTurns.length,
      lessonSessions: lessonSessions.length,
      activeDevices,
    },
  }
}

export async function getLessonUsage() {
  const [lessons, sessions] = await Promise.all([getLessons(), getParentSessions()])

  const detailEntries = await Promise.all(
    sessions
      .filter((session) => session.mode === 'lesson')
      .map(async (session) => ({
        session,
        detail: await getParentSessionDetail(session.session_id),
      }))
  )

  return lessons.map((lesson) => {
    const matchingSessions = detailEntries.filter(
      ({ detail }) => detail.session.lesson_id === lesson.lesson_id
    )

    return {
      ...lesson,
      usageCount: matchingSessions.length,
      latestSessionAt:
        matchingSessions
          .map(({ session }) => session.last_turn_at)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null,
    }
  })
}

export async function getDeviceSnapshots(): Promise<ParentDeviceSnapshot[]> {
  const sessions = await getParentSessions()
  const parentDevices = await getParentDevices()

  const snapshots = await Promise.all(parentDevices.map(async (device) => {
    const deviceSessions = sessions.filter((session) => session.device_id === device.id)
    const health = DEVICE_HEALTH[device.id] ?? {
      battery: 50,
      microphone: 'ready',
      speaker: 'ready',
    }
    const controlState = parentDeviceControlResponseSchema.parse(getDeviceControl(device.id))
    const lessonState = await getDeviceLessonState(device.id)
    const detailEntries = await Promise.all(
      deviceSessions.slice(0, 2).map(async (session) => ({
        session,
        detail: await getParentSessionDetail(session.session_id),
      }))
    )
    const recentTurns = detailEntries
      .flatMap(({ session, detail }) =>
        detail.turns.map((turn) => ({
          sessionId: session.session_id,
          turnId: turn.turn_id,
          createdAt: turn.created_at,
          transcript: turn.transcript,
          assistantText: turn.assistant_text,
          mode: session.mode,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)

    return {
      id: device.id,
      name: device.name,
      status: getDeviceStatus(device.last_seen_at),
      lastSeen: device.lastSeen,
      battery: health.battery,
      microphone: health.microphone,
      speaker: health.speaker,
      recentSessions: deviceSessions.length,
      flaggedTurns: deviceSessions.reduce((sum, session) => sum + session.flagged_count, 0),
      lastMode: deviceSessions[0]?.mode ?? null,
      controls: controlState.controls,
      controlsUpdatedAt: controlState.updated_at,
      lessonState,
      recentTurns,
    }
  }))

  return snapshots.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSessionSummaryById(sessionId: string) {
  const sessions = await getParentSessions()
  return sessions.find((session) => session.session_id === sessionId) ?? null
}

async function collectFlaggedTurns(sessions: Awaited<ReturnType<typeof getParentSessions>>) {
  const entries = await Promise.all(
    sessions
      .filter((session) => session.flagged_count > 0)
      .map(async (session) => {
        const detail = await getParentSessionDetail(session.session_id)

        return detail.turns
          .filter((turn) => isFlagged(turn.input_label, turn.output_label))
          .map((turn) => ({
            sessionId: session.session_id,
            deviceId: session.device_id,
            mode: session.mode,
            turn,
          }))
      })
  )

  return entries
    .flat()
    .sort(
      (a, b) => new Date(b.turn.created_at).getTime() - new Date(a.turn.created_at).getTime()
    )
}

function isFlagged(inputLabel: SafeguardLabel, outputLabel: SafeguardLabel | null) {
  return inputLabel !== 'SAFE' || (outputLabel !== null && outputLabel !== 'SAFE')
}

async function getParentDevices(): Promise<ParentDeviceListItem[]> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return MOCK_DEVICES.map((device) => ({
      ...device,
      last_seen_at: null,
    }))
  }

  const rows = await loadPersistedDevices(userId)
  if (rows.length > 0) {
    return rows.map((device) => ({
      id: device.id,
      name: device.name,
      lastSeen: formatLastSeen(device.last_seen_at),
      last_seen_at: device.last_seen_at,
    }))
  }

  return MOCK_DEVICES.map((device) => ({
    ...device,
    last_seen_at: null,
  }))
}

async function loadPersistedDevices(ownerUserId: string): Promise<ParentDeviceRow[]> {
  const selectColumns = 'id, name, last_seen_at'

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('devices')
      .select(selectColumns)
      .eq('owner_user_id', ownerUserId)
      .order('name', { ascending: true })

    if (!error) {
      return (data ?? []) as ParentDeviceRow[]
    }
  } catch {
    // Fall through to the authenticated client.
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('devices')
    .select(selectColumns)
    .eq('owner_user_id', ownerUserId)
    .order('name', { ascending: true })

  if (error) {
    return []
  }

  return (data ?? []) as ParentDeviceRow[]
}

function getDeviceStatus(lastSeenAt: string | null): DeviceStatus {
  if (!lastSeenAt) {
    return 'offline'
  }

  return Date.now() - new Date(lastSeenAt).getTime() <= 30 * 60 * 1000 ? 'online' : 'offline'
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) {
    return 'Unknown'
  }

  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(lastSeenAt).getTime()) / (60 * 1000))
  )

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
