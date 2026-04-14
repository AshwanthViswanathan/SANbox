import { NextResponse } from 'next/server'

import { handleFreeChatCheckpointAnswer } from '@/backend/pipeline/handle-turn'
import {
  checkpointSessionRequestSchema,
  sessionTurnResponseSchema,
} from '@/shared/api'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const payload = checkpointSessionRequestSchema.parse(await request.json())

    const result = await handleFreeChatCheckpointAnswer({
      sessionId: payload.session_id,
      deviceId: payload.device_id,
      checkpointId: payload.checkpoint_id,
      choice: payload.choice,
      ownerUserId: user?.id ?? null,
    })

    return NextResponse.json(sessionTurnResponseSchema.parse(result))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'SANbox checkpoint submission failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
