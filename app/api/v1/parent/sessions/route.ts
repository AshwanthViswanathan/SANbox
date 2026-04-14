import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { buildSessionSummary, deleteAllSessionsForOwner } from '@/backend/storage/mock-sessions'
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

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await deleteAllSessionsForOwner(user.id)

    return NextResponse.json({
      ok: true,
      deleted_count: result.deleted_count,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to clear sessions.'
    const status = message.includes('Missing Supabase admin environment variables.') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
