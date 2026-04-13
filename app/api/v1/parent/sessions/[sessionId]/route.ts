import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { buildSessionDetail, deleteSessionForOwner } from '@/backend/storage/mock-sessions'
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

export async function DELETE(
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

  try {
    const result = await deleteSessionForOwner(user.id, sessionId)

    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    if (result.status === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      ok: true,
      session_id: result.session_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete session.'
    const status = message.includes('Missing Supabase admin environment variables.') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
