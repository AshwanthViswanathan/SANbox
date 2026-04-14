import { NextResponse } from 'next/server'

import { handleFreeChatCheckpointAnswer } from '@/backend/pipeline/handle-turn'
import {
  checkpointSessionRequestSchema,
  sessionTurnResponseSchema,
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

  try {
    const payload = checkpointSessionRequestSchema.parse(await request.json())
    const result = await handleFreeChatCheckpointAnswer({
      sessionId: payload.session_id,
      deviceId: payload.device_id,
      checkpointId: payload.checkpoint_id,
      choice: payload.choice,
      ownerUserId: null,
    })

    return NextResponse.json(sessionTurnResponseSchema.parse(result))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Checkpoint submission failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
