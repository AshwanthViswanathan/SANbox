import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { DetailedSafeguardResult } from '@/backend/providers/safeguard'
import { composeAssistantLogText } from '@/backend/utils/assistant-response'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CheckpointSubmission,
  InteractiveCheckpoint,
  ParentSessionDetailResponse,
  ParentSessionsResponse,
  SessionTurnResponse,
  TeachBoxMode,
} from '@/shared/types'

type SessionSummaryRow = {
  id: string
  device_id: string
  started_at: string
  last_turn_at: string
  mode: TeachBoxMode
  turn_count: number
  flagged_count: number
}

type SessionDetailRow = {
  id: string
  device_id: string
  mode: TeachBoxMode
  lesson_id: string | null
  owner_user_id: string | null
}

type SessionTurnRow = {
  id: string
  created_at: string
  transcript: string
  assistant_text: string
  raw_response: {
    assistant_example?: string | null
    interactive_checkpoint?: ParentSessionDetailResponse['turns'][number]['interactive_checkpoint']
    checkpoint_submission?: ParentSessionDetailResponse['turns'][number]['checkpoint_submission']
  } | null
  input_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
  output_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK' | null
  assistant_blocked: boolean
}

type SessionFlagTurnRow = {
  session_id: string
  input_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
  output_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK' | null
  assistant_blocked: boolean
}

type DbTurnIndexRow = {
  turn_index: number
}

type CheckpointStateTurnRow = {
  turn_index: number
  mode: TeachBoxMode
  raw_response: {
    interactive_checkpoint?: InteractiveCheckpoint | null
    checkpoint_submission?: CheckpointSubmission | null
  } | null
}

type DeviceOwnerRow = {
  id: string
  owner_user_id: string | null
}

type SessionTurnLookupRow = {
  id: string
  session_id: string
}

type StorageReader = Pick<SupabaseClient, 'from'>
type TurnLogMetadata = {
  inputSafeguard: DetailedSafeguardResult | null
  outputSafeguard: DetailedSafeguardResult | null
}

export type RecentSessionTurn = {
  transcript: string
  assistantText: string
}

export type FreeChatCheckpointState = {
  pendingCheckpoint: InteractiveCheckpoint | null
  freeChatTurnsSinceLastCheckpoint: number
}

export async function buildSessionSummary(
  supabase: StorageReader,
  ownerUserId: string
): Promise<ParentSessionsResponse> {
  const reader = getReadClient(supabase)
  const ownedDeviceIds = await getOwnedDeviceIds(reader, ownerUserId)
  const { data: directSessions, error: directSessionsError } = await reader
    .from('sessions')
    .select('id, device_id, started_at, last_turn_at, mode, turn_count, flagged_count')
    .eq('owner_user_id', ownerUserId)
    .order('last_turn_at', { ascending: false })

  if (directSessionsError) {
    throw new Error(`Failed to load owned session summaries: ${directSessionsError.message}`)
  }

  let deviceSessions: SessionSummaryRow[] = []

  if (ownedDeviceIds.length > 0) {
    const { data, error } = await reader
      .from('sessions')
      .select('id, device_id, started_at, last_turn_at, mode, turn_count, flagged_count')
      .in('device_id', ownedDeviceIds)
      .order('last_turn_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to load device session summaries: ${error.message}`)
    }

    deviceSessions = (data ?? []) as SessionSummaryRow[]
  }

  const sessions = dedupeSessions([
    ...((directSessions ?? []) as SessionSummaryRow[]),
    ...deviceSessions,
  ])
  const flaggedCountsBySession = await loadFlaggedCountsBySession(
    reader,
    sessions.map((session) => session.id)
  )

  return {
    sessions: sessions.map((session) => ({
      session_id: session.id,
      device_id: session.device_id,
      started_at: session.started_at,
      last_turn_at: session.last_turn_at,
      mode: session.mode,
      turn_count: session.turn_count,
      flagged_count: flaggedCountsBySession.get(session.id) ?? session.flagged_count,
    })),
  }
}

export async function loadRecentSessionTurns(
  sessionId: string,
  deviceId: string,
  limit = 6
): Promise<RecentSessionTurn[]> {
  if (limit <= 0) {
    return []
  }

  let reader: StorageReader
  try {
    reader = createAdminClient()
  } catch {
    return []
  }

  const { data: session, error: sessionError } = await reader
    .from('sessions')
    .select('id, device_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    throw new Error(`Failed to load session for recent turns: ${sessionError.message}`)
  }

  if (!session || session.device_id !== deviceId) {
    return []
  }

  const { data: turns, error: turnsError } = await reader
    .from('turns')
    .select('transcript, assistant_text, raw_response')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: false })
    .limit(limit * 2)

  if (turnsError) {
    throw new Error(`Failed to load recent session turns: ${turnsError.message}`)
  }

  return ((
    turns ?? []
  ) as Array<{
    transcript: string
    assistant_text: string
    raw_response?: {
      checkpoint_submission?: CheckpointSubmission | null
    } | null
  }>)
    .filter((turn) => !turn.raw_response?.checkpoint_submission)
    .reverse()
    .slice(-limit)
    .map((turn) => ({
      transcript: turn.transcript,
      assistantText: turn.assistant_text,
    }))
}

export async function loadFreeChatCheckpointState(
  sessionId: string,
  deviceId: string
): Promise<FreeChatCheckpointState> {
  let reader: StorageReader
  try {
    reader = createAdminClient()
  } catch {
    return {
      pendingCheckpoint: null,
      freeChatTurnsSinceLastCheckpoint: Number.POSITIVE_INFINITY,
    }
  }

  const { data: session, error: sessionError } = await reader
    .from('sessions')
    .select('id, device_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    throw new Error(`Failed to load session for checkpoint state: ${sessionError.message}`)
  }

  if (!session || session.device_id !== deviceId) {
    return {
      pendingCheckpoint: null,
      freeChatTurnsSinceLastCheckpoint: Number.POSITIVE_INFINITY,
    }
  }

  const { data: turns, error: turnsError } = await reader
    .from('turns')
    .select('turn_index, mode, raw_response')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })

  if (turnsError) {
    throw new Error(`Failed to load checkpoint state: ${turnsError.message}`)
  }

  let latestCheckpointTurn: CheckpointStateTurnRow | null = null

  for (const turn of (turns ?? []) as CheckpointStateTurnRow[]) {
    if (turn.mode !== 'free_chat') {
      continue
    }

    const checkpoint = turn.raw_response?.interactive_checkpoint
    if (checkpoint?.source === 'free_chat') {
      latestCheckpointTurn = turn
    }
  }

  if (!latestCheckpointTurn?.raw_response?.interactive_checkpoint) {
    return {
      pendingCheckpoint: null,
      freeChatTurnsSinceLastCheckpoint: Number.POSITIVE_INFINITY,
    }
  }

  const checkpoint = latestCheckpointTurn.raw_response.interactive_checkpoint
  let pendingCheckpoint: InteractiveCheckpoint | null = checkpoint
  let freeChatTurnsSinceLastCheckpoint = 0

  for (const turn of (turns ?? []) as CheckpointStateTurnRow[]) {
    if (turn.turn_index <= latestCheckpointTurn.turn_index || turn.mode !== 'free_chat') {
      continue
    }

    const submission = turn.raw_response?.checkpoint_submission
    if (submission?.checkpoint_id === checkpoint.checkpoint_id) {
      pendingCheckpoint = null
      continue
    }

    pendingCheckpoint = null
    freeChatTurnsSinceLastCheckpoint += 1
  }

  return {
    pendingCheckpoint,
    freeChatTurnsSinceLastCheckpoint,
  }
}

export async function buildSessionDetail(
  supabase: StorageReader,
  ownerUserId: string,
  sessionId: string
): Promise<ParentSessionDetailResponse> {
  const reader = getReadClient(supabase)
  const { data: session, error: sessionError } = await reader
    .from('sessions')
    .select('id, device_id, mode, lesson_id, owner_user_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    throw new Error(`Failed to load session detail: ${sessionError.message}`)
  }

  if (!session) {
    return {
      session: {
        session_id: sessionId,
        device_id: 'unknown_device',
        mode: 'free_chat',
        lesson_id: null,
      },
      turns: [],
    }
  }

  if (!(await canAccessSession(reader, ownerUserId, session as SessionDetailRow))) {
    return {
      session: {
        session_id: sessionId,
        device_id: 'unknown_device',
        mode: 'free_chat',
        lesson_id: null,
      },
      turns: [],
    }
  }

  const { data: turns, error: turnsError } = await reader
    .from('turns')
    .select(
      'id, created_at, transcript, assistant_text, raw_response, input_safeguard_label, output_safeguard_label, assistant_blocked'
    )
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })

  if (turnsError) {
    throw new Error(`Failed to load session turns: ${turnsError.message}`)
  }

  return {
    session: {
      session_id: (session as SessionDetailRow).id,
      device_id: (session as SessionDetailRow).device_id,
      mode: (session as SessionDetailRow).mode,
      lesson_id: (session as SessionDetailRow).lesson_id,
    },
    turns: ((turns ?? []) as SessionTurnRow[]).map((turn) => ({
      turn_id: turn.id,
      created_at: turn.created_at,
      transcript: turn.transcript,
      assistant_text: turn.assistant_text,
      assistant_example: turn.raw_response?.assistant_example ?? null,
      interactive_checkpoint: turn.raw_response?.interactive_checkpoint ?? null,
      checkpoint_submission: turn.raw_response?.checkpoint_submission ?? null,
      input_label: turn.input_safeguard_label,
      output_label: turn.output_safeguard_label,
      blocked: turn.assistant_blocked,
    })),
  }
}

export async function deleteSessionForOwner(ownerUserId: string, sessionId: string) {
  const admin = createAdminClient()
  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .select('id, device_id, owner_user_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    throw new Error(`Failed to look up session: ${sessionError.message}`)
  }

  if (!session) {
    return { status: 'not_found' as const }
  }

  if (!(await canAccessSession(admin, ownerUserId, session))) {
    return { status: 'forbidden' as const }
  }

  const { error: deviceResetError } = await admin
    .from('devices')
    .update({
      active_session_id: null,
      current_step_id: null,
    })
    .eq('active_session_id', sessionId)

  if (deviceResetError) {
    throw new Error(`Failed to clear active device session: ${deviceResetError.message}`)
  }

  const { error: turnsDeleteError } = await admin
    .from('turns')
    .delete()
    .eq('session_id', sessionId)

  if (turnsDeleteError) {
    throw new Error(`Failed to delete session turns: ${turnsDeleteError.message}`)
  }

  const { error: sessionDeleteError } = await admin
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (sessionDeleteError) {
    throw new Error(`Failed to delete session: ${sessionDeleteError.message}`)
  }

  return {
    status: 'deleted' as const,
    session_id: sessionId,
  }
}

export async function deleteTurnForOwner(
  ownerUserId: string,
  sessionId: string,
  turnId: string
) {
  const admin = createAdminClient()
  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .select('id, device_id, owner_user_id, started_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    throw new Error(`Failed to look up session for turn deletion: ${sessionError.message}`)
  }

  if (!session) {
    return { status: 'session_not_found' as const }
  }

  if (!(await canAccessSession(admin, ownerUserId, session))) {
    return { status: 'forbidden' as const }
  }

  const { data: turn, error: turnError } = await admin
    .from('turns')
    .select('id, session_id')
    .eq('id', turnId)
    .maybeSingle()

  if (turnError) {
    throw new Error(`Failed to look up turn: ${turnError.message}`)
  }

  if (!turn || (turn as SessionTurnLookupRow).session_id !== sessionId) {
    return { status: 'turn_not_found' as const }
  }

  const { error: deleteError } = await admin
    .from('turns')
    .delete()
    .eq('id', turnId)

  if (deleteError) {
    throw new Error(`Failed to delete turn: ${deleteError.message}`)
  }

  const { data: remainingTurns, error: remainingTurnsError } = await admin
    .from('turns')
    .select('created_at, input_safeguard_label, output_safeguard_label, assistant_blocked')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (remainingTurnsError) {
    throw new Error(`Failed to reload session turns after delete: ${remainingTurnsError.message}`)
  }

  const turnRows = (remainingTurns ?? []) as Array<{
    created_at: string
    input_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
    output_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK' | null
    assistant_blocked: boolean
  }>

  const flaggedCount = turnRows.filter((turnRow) => isFlaggedTurn(turnRow)).length
  const lastTurnAt =
    turnRows[0]?.created_at ??
    (session as { started_at?: string | null }).started_at ??
    new Date().toISOString()

  const { error: sessionUpdateError } = await admin
    .from('sessions')
    .update({
      turn_count: turnRows.length,
      flagged_count: flaggedCount,
      last_turn_at: lastTurnAt,
    })
    .eq('id', sessionId)

  if (sessionUpdateError) {
    throw new Error(
      `Failed to update session counters after turn delete: ${sessionUpdateError.message}`
    )
  }

  return {
    status: 'deleted' as const,
    session_id: sessionId,
    turn_id: turnId,
  }
}

export function toParentMode(mode: TeachBoxMode) {
  return mode
}

function getReadClient(fallback: StorageReader) {
  try {
    return createAdminClient()
  } catch {
    return fallback
  }
}

function dedupeSessions(sessions: SessionSummaryRow[]) {
  return [...new Map(sessions.map((session) => [session.id, session])).values()].sort(
    (a, b) => new Date(b.last_turn_at).getTime() - new Date(a.last_turn_at).getTime()
  )
}

async function getOwnedDeviceIds(reader: StorageReader, ownerUserId: string) {
  const { data, error } = await reader
    .from('devices')
    .select('id')
    .eq('owner_user_id', ownerUserId)

  if (error) {
    throw new Error(`Failed to load owned devices: ${error.message}`)
  }

  return ((data ?? []) as Pick<DeviceOwnerRow, 'id'>[]).map((device) => device.id)
}

async function canAccessSession(
  reader: StorageReader,
  ownerUserId: string,
  session: Pick<SessionDetailRow, 'device_id' | 'owner_user_id'>
) {
  if (session.owner_user_id === ownerUserId) {
    return true
  }

  const { data, error } = await reader
    .from('devices')
    .select('id, owner_user_id')
    .eq('id', session.device_id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to verify session ownership: ${error.message}`)
  }

  const device = data as DeviceOwnerRow | null

  if (device?.owner_user_id === ownerUserId) {
    return true
  }

  return false
}

async function loadFlaggedCountsBySession(
  supabase: StorageReader,
  sessionIds: string[]
) {
  if (sessionIds.length === 0) {
    return new Map<string, number>()
  }

  const { data, error } = await supabase
    .from('turns')
    .select('session_id, input_safeguard_label, output_safeguard_label, assistant_blocked')
    .in('session_id', sessionIds)

  if (error) {
    throw new Error(`Failed to load turn flags: ${error.message}`)
  }

  const counts = new Map<string, number>()

  for (const turn of (data ?? []) as SessionFlagTurnRow[]) {
    if (!isFlaggedTurn(turn)) continue
    counts.set(turn.session_id, (counts.get(turn.session_id) ?? 0) + 1)
  }

  return counts
}

function isFlaggedTurn(
  turn: Pick<
    SessionFlagTurnRow,
    'input_safeguard_label' | 'output_safeguard_label' | 'assistant_blocked'
  >
) {
  return (
    turn.assistant_blocked ||
    turn.input_safeguard_label !== 'SAFE' ||
    (turn.output_safeguard_label !== null && turn.output_safeguard_label !== 'SAFE')
  )
}

export async function logTurn(
  turn: SessionTurnResponse,
  ownerUserId?: string | null,
  metadata?: TurnLogMetadata
) {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: existingDevice, error: deviceLookupError } = await admin
    .from('devices')
    .select('id, owner_user_id')
    .eq('id', turn.device_id)
    .maybeSingle()

  if (deviceLookupError) {
    throw new Error(`Failed to look up device: ${deviceLookupError.message}`)
  }

  let resolvedOwnerUserId = ownerUserId ?? existingDevice?.owner_user_id ?? null

  if (!existingDevice) {
    const { error: insertDeviceError } = await admin.from('devices').insert({
      id: turn.device_id,
      owner_user_id: resolvedOwnerUserId,
      name: turn.device_id,
      platform: turn.device_id.startsWith('web') ? 'web_pi' : 'rpi',
      last_seen_at: nowIso,
    })

    if (insertDeviceError) {
      throw new Error(`Failed to insert device: ${insertDeviceError.message}`)
    }
  } else {
    const updatePayload: Record<string, string | null> = {
      last_seen_at: nowIso,
    }

    if (!existingDevice.owner_user_id && ownerUserId) {
      updatePayload.owner_user_id = ownerUserId
      resolvedOwnerUserId = ownerUserId
    }

    const { error: updateDeviceError } = await admin
      .from('devices')
      .update(updatePayload)
      .eq('id', turn.device_id)

    if (updateDeviceError) {
      throw new Error(`Failed to update device: ${updateDeviceError.message}`)
    }
  }

  const { data: existingSession, error: sessionLookupError } = await admin
    .from('sessions')
    .select('id, owner_user_id')
    .eq('id', turn.session_id)
    .maybeSingle()

  if (sessionLookupError) {
    throw new Error(`Failed to look up session: ${sessionLookupError.message}`)
  }

  const lessonId = turn.lesson?.lesson_id ?? null
  const lessonStepId = turn.lesson?.step_id ?? null

  if (!existingSession) {
    const { error: insertSessionError } = await admin.from('sessions').insert({
      id: turn.session_id,
      device_id: turn.device_id,
      owner_user_id: resolvedOwnerUserId,
      mode: turn.mode,
      status: turn.cosmo_state === 'error' ? 'errored' : 'active',
      lesson_id: lessonId,
      lesson_step_id: lessonStepId,
      last_turn_at: nowIso,
    })

    if (insertSessionError) {
      throw new Error(`Failed to insert session: ${insertSessionError.message}`)
    }
  } else {
    const updatePayload: Record<string, string | null> = {
      mode: turn.mode,
      status: turn.cosmo_state === 'error' ? 'errored' : 'active',
      lesson_id: lessonId,
      lesson_step_id: lessonStepId,
      last_turn_at: nowIso,
    }

    if (!existingSession.owner_user_id && resolvedOwnerUserId) {
      updatePayload.owner_user_id = resolvedOwnerUserId
    }

    const { error: updateSessionError } = await admin
      .from('sessions')
      .update(updatePayload)
      .eq('id', turn.session_id)

    if (updateSessionError) {
      throw new Error(`Failed to update session: ${updateSessionError.message}`)
    }
  }

  const { data: lastTurn, error: lastTurnError } = await admin
    .from('turns')
    .select('turn_index')
    .eq('session_id', turn.session_id)
    .order('turn_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastTurnError) {
    throw new Error(`Failed to compute turn index: ${lastTurnError.message}`)
  }

  const audioUrl =
    turn.audio?.url && !turn.audio.url.startsWith('data:') ? turn.audio.url : null

  const { error: insertTurnError } = await admin.from('turns').insert({
    id: turn.turn_id,
    session_id: turn.session_id,
    device_id: turn.device_id,
    turn_index: ((lastTurn as DbTurnIndexRow | null)?.turn_index ?? 0) + 1,
    mode: turn.mode,
    transcript: turn.transcript,
    input_safeguard_label: turn.input_safeguard?.label ?? 'SAFE',
    input_safeguard_reason: turn.input_safeguard?.reason ?? 'missing_input_safeguard',
    assistant_text: composeAssistantLogText({
      example: turn.assistant.example ?? null,
      explanation: turn.assistant.text,
    }),
    assistant_blocked: turn.assistant.blocked,
    output_safeguard_label: turn.output_safeguard?.label ?? null,
    output_safeguard_reason: turn.output_safeguard?.reason ?? null,
    cosmo_state: turn.cosmo_state,
    audio_content_type: turn.audio?.content_type ?? null,
    audio_url: audioUrl,
    lesson_id: lessonId,
    lesson_step_id: lessonStepId,
    debug_timings_ms: turn.debug?.timings_ms ?? {},
    provider_trace: {
      safeguards: {
        input: metadata?.inputSafeguard ?? null,
        output: metadata?.outputSafeguard ?? null,
      },
    },
    raw_response: {
      turn_id: turn.turn_id,
      mode: turn.mode,
      blocked: turn.assistant.blocked,
      assistant_example: turn.assistant.example ?? null,
      interactive_checkpoint: turn.interactive_checkpoint ?? null,
      checkpoint_submission: turn.checkpoint_submission ?? null,
    },
  })

  if (insertTurnError) {
    throw new Error(`Failed to insert turn: ${insertTurnError.message}`)
  }

  const { data: sessionTurns, error: sessionTurnsError } = await admin
    .from('turns')
    .select('input_safeguard_label, output_safeguard_label')
    .eq('session_id', turn.session_id)

  if (sessionTurnsError) {
    throw new Error(`Failed to recompute session counts: ${sessionTurnsError.message}`)
  }

  const turnCount = (sessionTurns ?? []).length
  const flaggedCount = (sessionTurns ?? []).filter((sessionTurn) => {
    return (
      sessionTurn.input_safeguard_label !== 'SAFE' ||
      (sessionTurn.output_safeguard_label !== null &&
        sessionTurn.output_safeguard_label !== 'SAFE')
    )
  }).length

  const { error: updateSessionCountersError } = await admin
    .from('sessions')
    .update({
      turn_count: turnCount,
      flagged_count: flaggedCount,
      last_turn_at: nowIso,
    })
    .eq('id', turn.session_id)

  if (updateSessionCountersError) {
    throw new Error(`Failed to update session counters: ${updateSessionCountersError.message}`)
  }
}
