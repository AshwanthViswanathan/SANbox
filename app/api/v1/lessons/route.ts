import { NextResponse } from 'next/server'

import { loadLessons } from '@/backend/lessons/load-lessons'
import { lessonsResponseSchema } from '@/shared/api'

export async function GET() {
  const payload = {
    lessons: await loadLessons(),
  }

  return NextResponse.json(lessonsResponseSchema.parse(payload))
}
