import { NextResponse } from 'next/server'

import { claimDeviceForOwner } from '@/backend/storage/mock-device-lessons'
import { createClient } from '@/lib/supabase/server'
import { deviceLessonStateSchema } from '@/shared/api'

export async function POST(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { deviceId } = await context.params

  try {
    const response = await claimDeviceForOwner(deviceId, user.id)
    return NextResponse.json(deviceLessonStateSchema.parse(response))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to claim device.'
    const status =
      message.startsWith('Forbidden device claim for device:') ? 403 : message.includes('SUPABASE_SERVICE_ROLE_KEY')
        ? 503
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
