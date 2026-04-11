import { NextResponse } from 'next/server'

import { handleTurn } from '@/backend/pipeline/handle-turn'
import {
  sessionTurnResponseSchema,
  teachBoxModeSchema,
} from '@/shared/api'
import { TEACHBOX_DEVICE_TOKEN_ENV } from '@/shared/constants'

export const runtime = 'nodejs'

function getBearerToken(headerValue: string | null) {
  if (!headerValue?.startsWith('Bearer ')) return null
  return headerValue.slice(7)
}

export async function POST(request: Request) {
  const expectedToken = process.env[TEACHBOX_DEVICE_TOKEN_ENV] ?? 'dev-token-change-me'
  const providedToken = getBearerToken(request.headers.get('authorization'))

  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const audio = formData.get('audio')
  const deviceId = String(formData.get('device_id') ?? '')
  const sessionId = String(formData.get('session_id') ?? '')
  const modeRaw = String(formData.get('mode') ?? 'free_chat')
  const lessonId = String(formData.get('lesson_id') ?? '') || null
  const transcriptOverride = String(formData.get('transcript_override') ?? '') || null

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
  }

  if (!deviceId || !sessionId) {
    return NextResponse.json({ error: 'Missing device_id or session_id' }, { status: 422 })
  }

  const modeResult = teachBoxModeSchema.safeParse(modeRaw)
  if (!modeResult.success) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 422 })
  }

  const result = await handleTurn({
    audio,
    deviceId,
    sessionId,
    mode: modeResult.data,
    lessonId,
    transcriptOverride,
  })

  return NextResponse.json(sessionTurnResponseSchema.parse(result))
}
