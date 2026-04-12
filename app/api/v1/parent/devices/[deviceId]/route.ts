import { NextResponse } from 'next/server'

import { clearDeviceControl } from '@/backend/storage/mock-device-controls'
import { clearDeviceLessonState } from '@/backend/storage/mock-device-lessons'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
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
    const admin = createAdminClient()
    const { data: device, error: lookupError } = await admin
      .from('devices')
      .select('id, owner_user_id')
      .eq('id', deviceId)
      .maybeSingle()

    if (lookupError) {
      throw new Error(`Failed to look up device: ${lookupError.message}`)
    }

    if (!device) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 })
    }

    if (device.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await admin.from('devices').delete().eq('id', deviceId)
    if (deleteError) {
      throw new Error(`Failed to delete device: ${deleteError.message}`)
    }

    clearDeviceControl(deviceId)
    clearDeviceLessonState(deviceId)

    return NextResponse.json({ ok: true, device_id: deviceId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete device.'
    const status = message.includes('Missing Supabase admin environment variables.') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

