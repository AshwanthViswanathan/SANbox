import { NextResponse } from 'next/server'

import { startAssignedLesson } from '@/backend/storage/mock-device-lessons'
import {
  startLessonRequestSchema,
  startLessonResponseSchema,
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

  const parsed = startLessonRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lesson start payload' }, { status: 422 })
  }

  const { deviceId } = await context.params

  try {
    const response = await startAssignedLesson(
      deviceId,
      parsed.data.session_id,
      parsed.data.lesson_id ?? null
    )
    return NextResponse.json(startLessonResponseSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start lesson.'
    const status =
      message.startsWith('No assigned lesson for device:')
        ? 409
        : message.startsWith('Unknown lesson_id:')
          ? 404
          : message.includes('SUPABASE_SERVICE_ROLE_KEY')
            ? 503
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
