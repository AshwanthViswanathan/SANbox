import { NextResponse } from 'next/server'

import { getDeviceLessonState } from '@/backend/storage/mock-device-lessons'
import { deviceLessonStateSchema } from '@/shared/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params
  const response = await getDeviceLessonState(deviceId)
  return NextResponse.json(deviceLessonStateSchema.parse(response))
}
