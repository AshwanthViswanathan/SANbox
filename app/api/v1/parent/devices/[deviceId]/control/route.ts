import { NextResponse } from 'next/server'

import {
  getDeviceControl,
  setDeviceControl,
} from '@/backend/storage/mock-device-controls'
import {
  parentDeviceControlRequestSchema,
  parentDeviceControlResponseSchema,
} from '@/shared/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params

  return NextResponse.json(parentDeviceControlResponseSchema.parse(getDeviceControl(deviceId)))
}

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parentDeviceControlRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid control payload' }, { status: 422 })
  }

  const response = setDeviceControl(deviceId, parsed.data)
  return NextResponse.json(parentDeviceControlResponseSchema.parse(response))
}
