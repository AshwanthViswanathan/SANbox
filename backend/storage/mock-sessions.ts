import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { DetailedSafeguardResult } from '@/backend/providers/safeguard'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
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
}

type SessionTurnRow = {
  id: string
  created_at: string
  transcript: string
  assistant_text: string
  input_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
  output_safeguard_label: 'SAFE' | 'BORDERLINE' | 'BLOCK' | null
  assistant_blocked: boolean
}

type DbTurnIndexRow = {
  turn_index: number
}

type StorageReader = Pick<SupabaseClient, 'from'>
type TurnLogMetadata = {
  inputSafeguard: DetailedSafeguardResult | null
  outputSafeguard: DetailedSafeguardResult | null
}

export async function buildSessionSummary(
  supabase: StorageReader,
  ownerUserId: string
): Promise<ParentSessionsResponse> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, device_id, started_at, last_turn_at, mode, turn_count, flagged_count')
    .eq('owner_user_id', ownerUserId)
    .order('last_turn_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load session summaries: ${error.message}`)
  }

  return {
    sessions: ((data ?? []) as SessionSummaryRow[]).map((session) => ({
      session_id: session.id,
      device_id: session.device_id,
      started_at: session.started_at,
      last_turn_at: session.last_turn_at,
      mode: session.mode,
      turn_count: session.turn_count,
      flagged_count: session.flagged_count,
    })),
  }
}

export async function buildSessionDetail(
  supabase: StorageReader,
  ownerUserId: string,
  sessionId: string
): Promise<ParentSessionDetailResponse> {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, device_id, mode, lesson_id')
    .eq('owner_user_id', ownerUserId)
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

  const { data: turns, error: turnsError } = await supabase
    .from('turns')
    .select(
      'id, created_at, transcript, assistant_text, input_safeguard_label, output_safeguard_label, assistant_blocked'
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
      input_label: turn.input_safeguard_label,
      output_label: turn.output_safeguard_label,
      blocked: turn.assistant_blocked,
    })),
  }
}

export function toParentMode(mode: TeachBoxMode) {
  return mode
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

  if (!existingDevice) {
    const { error: insertDeviceError } = await admin.from('devices').insert({
      id: turn.device_id,
      owner_user_id: ownerUserId ?? null,
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
      owner_user_id: ownerUserId ?? null,
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

    if (!existingSession.owner_user_id && ownerUserId) {
      updatePayload.owner_user_id = ownerUserId
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
    assistant_text: turn.assistant.text,
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
