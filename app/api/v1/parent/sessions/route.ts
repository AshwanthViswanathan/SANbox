import { NextResponse } from 'next/server'

import { buildSessionSummary } from '@/backend/storage/mock-sessions'
import { parentSessionsResponseSchema } from '@/shared/api'

export async function GET() {
  return NextResponse.json(parentSessionsResponseSchema.parse(buildSessionSummary()))
}
