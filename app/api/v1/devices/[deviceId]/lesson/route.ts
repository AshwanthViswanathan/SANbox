import { NextResponse } from 'next/server'

import { getDeviceLessonState } from '@/backend/storage/mock-device-lessons'
import { createClient } from '@/lib/supabase/server'
import { deviceLessonStateSchema } from '@/shared/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { deviceId } = await context.params
  const response = await getDeviceLessonState(deviceId, user?.id ?? null)
  return NextResponse.json(deviceLessonStateSchema.parse(response))
}
