import { NextResponse } from 'next/server'

import { submitLessonCheckpointChoice } from '@/backend/storage/mock-device-lessons'
import {
  checkpointLessonRequestSchema,
  lessonInteractionResponseSchema,
} from '@/shared/api'

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = checkpointLessonRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lesson checkpoint payload' }, { status: 422 })
  }

  const { deviceId } = await context.params

  try {
    const response = await submitLessonCheckpointChoice(
      deviceId,
      parsed.data.session_id,
      parsed.data.choice
    )
    return NextResponse.json(lessonInteractionResponseSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit checkpoint answer.'
    const status = message.includes('SUPABASE_SERVICE_ROLE_KEY') ? 503 : 409
    return NextResponse.json({ error: message }, { status })
  }
}
