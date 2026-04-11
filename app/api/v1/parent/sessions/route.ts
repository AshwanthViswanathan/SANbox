import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { buildSessionSummary } from '@/backend/storage/mock-sessions'
import { parentSessionsResponseSchema } from '@/shared/api'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await buildSessionSummary(supabase, user.id)
  return NextResponse.json(parentSessionsResponseSchema.parse(payload))
}
