import { NextResponse } from 'next/server'

import { deleteTurnForOwner } from '@/backend/storage/mock-sessions'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sessionId: string; turnId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId, turnId } = await context.params

  try {
    const result = await deleteTurnForOwner(user.id, sessionId, turnId)

    if (result.status === 'session_not_found') {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    if (result.status === 'turn_not_found') {
      return NextResponse.json({ error: 'Turn not found.' }, { status: 404 })
    }

    if (result.status === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      ok: true,
      session_id: result.session_id,
      turn_id: result.turn_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete flagged turn.'
    const status = message.includes('Missing Supabase admin environment variables.') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
