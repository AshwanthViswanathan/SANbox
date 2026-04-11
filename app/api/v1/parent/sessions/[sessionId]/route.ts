import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { buildSessionDetail } from '@/backend/storage/mock-sessions'
import { parentSessionDetailResponseSchema } from '@/shared/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await context.params

  const payload = await buildSessionDetail(supabase, user.id, sessionId)
  return NextResponse.json(parentSessionDetailResponseSchema.parse(payload))
}
