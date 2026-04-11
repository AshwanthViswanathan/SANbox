import { NextResponse } from 'next/server'

import { buildSessionDetail } from '@/backend/storage/mock-sessions'
import { parentSessionDetailResponseSchema } from '@/shared/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params

  return NextResponse.json(parentSessionDetailResponseSchema.parse(buildSessionDetail(sessionId)))
}
