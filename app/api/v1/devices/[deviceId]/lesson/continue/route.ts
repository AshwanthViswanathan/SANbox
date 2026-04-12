import { NextResponse } from 'next/server'

import { continueActiveLesson } from '@/backend/storage/mock-device-lessons'
import {
  continueLessonRequestSchema,
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

  const parsed = continueLessonRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lesson continue payload' }, { status: 422 })
  }

  const { deviceId } = await context.params

  try {
    const response = await continueActiveLesson(deviceId, parsed.data.session_id)
    return NextResponse.json(lessonInteractionResponseSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to continue lesson.'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
