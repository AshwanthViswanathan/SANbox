import type {
  ParentSessionDetailResponse,
  ParentSessionsResponse,
  SessionTurnResponse,
  TeachBoxMode,
} from '@/shared/types'

const MOCK_SESSION_ID = 'sess_demo_001'
const now = new Date().toISOString()

export function buildSessionSummary(): ParentSessionsResponse {
  return {
    sessions: [
      {
        session_id: MOCK_SESSION_ID,
        device_id: 'pi_01',
        started_at: now,
        last_turn_at: now,
        mode: 'lesson',
        turn_count: 3,
        flagged_count: 1,
      },
    ],
  }
}

export function buildSessionDetail(sessionId: string): ParentSessionDetailResponse {
  return {
    session: {
      session_id: sessionId,
      device_id: 'pi_01',
      mode: 'lesson',
      lesson_id: 'moon-basics',
    },
    turns: [
      {
        turn_id: 'turn_demo_001',
        created_at: now,
        transcript: 'Why does the moon follow me?',
        assistant_text: 'It looks that way because the moon is very far away.',
        input_label: 'SAFE',
        output_label: 'SAFE',
        blocked: false,
      },
    ],
  }
}

export function toParentMode(mode: TeachBoxMode) {
  return mode
}

export function logTurn(_turn: SessionTurnResponse) {
  return
}
