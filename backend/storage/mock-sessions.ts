import { MOCK_SESSION_DETAILS, MOCK_SESSIONS } from '@/lib/mock-data'
import type {
  ParentSessionDetailResponse,
  ParentSessionsResponse,
  SessionTurnResponse,
  TeachBoxMode,
} from '@/shared/types'

export function buildSessionSummary(): ParentSessionsResponse {
  return {
    sessions: [...MOCK_SESSIONS],
  }
}

export function buildSessionDetail(sessionId: string): ParentSessionDetailResponse {
  return MOCK_SESSION_DETAILS[sessionId] ?? {
    session: {
      session_id: sessionId,
      device_id: 'unknown_device',
      mode: 'free_chat',
      lesson_id: null,
    },
    turns: [],
  }
}

export function toParentMode(mode: TeachBoxMode) {
  return mode
}

export function logTurn(_turn: SessionTurnResponse) {
  return
}
