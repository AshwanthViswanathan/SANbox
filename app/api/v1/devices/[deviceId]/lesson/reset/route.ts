import { NextResponse } from 'next/server'

import { resetActiveLesson } from '@/backend/storage/mock-device-lessons'
import { deviceLessonStateSchema } from '@/shared/api'

export async function POST(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params

  try {
    const response = await resetActiveLesson(deviceId)
    return NextResponse.json(deviceLessonStateSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset lesson.'
    const status = message.includes('SUPABASE_SERVICE_ROLE_KEY') ? 503 : 409
    return NextResponse.json({ error: message }, { status })
  }
}

