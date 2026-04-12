import { NextResponse } from 'next/server'

import { assignLessonToDevice } from '@/backend/storage/mock-device-lessons'
import { createClient } from '@/lib/supabase/server'
import {
  assignLessonRequestSchema,
  assignLessonResponseSchema,
} from '@/shared/api'

export async function PUT(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = assignLessonRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lesson assignment payload' }, { status: 422 })
  }

  const { deviceId } = await context.params

  try {
    const response = await assignLessonToDevice(deviceId, parsed.data.lesson_id, user.id)
    return NextResponse.json(assignLessonResponseSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to assign lesson.'
    const status =
      message.startsWith('Unknown lesson_id:')
        ? 404
        : message.startsWith('Forbidden device assignment for device:')
          ? 403
          : message.includes('SUPABASE_SERVICE_ROLE_KEY')
            ? 503
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
