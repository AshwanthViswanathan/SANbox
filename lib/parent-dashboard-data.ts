import 'server-only'

import { cache } from 'react'

import { loadLessons } from '@/backend/lessons/load-lessons'
import { buildSessionDetail, buildSessionSummary } from '@/backend/storage/mock-sessions'
import { MOCK_DEVICES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import {
  lessonsResponseSchema,
  parentSessionDetailResponseSchema,
  parentSessionsResponseSchema,
} from '@/shared/api'
import type { SafeguardLabel } from '@/shared/types'

type DeviceStatus = (typeof MOCK_DEVICES)[number]['status']

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
  const sessions = await getParentSessions()

  const flaggedTurns = await collectFlaggedTurns(sessions)
  const lessonSessions = sessions.filter((session) => session.mode === 'lesson')
  const activeDevices = MOCK_DEVICES.filter((device) => device.status === 'online').length

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

  return MOCK_DEVICES.map((device) => {
    const deviceSessions = sessions.filter((session) => session.device_id === device.id)
    const health = DEVICE_HEALTH[device.id] ?? {
      battery: 50,
      microphone: 'ready',
      speaker: 'ready',
    }

    return {
      id: device.id,
      name: device.name,
      status: device.status,
      lastSeen: device.lastSeen,
      battery: health.battery,
      microphone: health.microphone,
      speaker: health.speaker,
      recentSessions: deviceSessions.length,
      flaggedTurns: deviceSessions.reduce((sum, session) => sum + session.flagged_count, 0),
      lastMode: deviceSessions[0]?.mode ?? null,
    }
  })
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
