import { NextResponse } from 'next/server'

import { handleTurn } from '@/backend/pipeline/handle-turn'
import { sessionTurnResponseSchema, teachBoxModeSchema } from '@/shared/api'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const formData = await request.formData()
    const audio = formData.get('audio')
    const deviceId = String(formData.get('device_id') ?? '')
    const sessionId = String(formData.get('session_id') ?? '')
    const modeRaw = String(formData.get('mode') ?? 'free_chat')
    const lessonId = String(formData.get('lesson_id') ?? '') || null
    const transcriptOverride = String(formData.get('transcript_override') ?? '') || null

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
    }

    if (!deviceId || !sessionId) {
      return NextResponse.json({ error: 'Missing device_id or session_id' }, { status: 422 })
    }

    const modeResult = teachBoxModeSchema.safeParse(modeRaw)
    if (!modeResult.success) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 422 })
    }

    const result = await handleTurn({
      audio,
      deviceId,
      sessionId,
      mode: modeResult.data,
      ownerUserId: user?.id ?? null,
      lessonId,
      transcriptOverride,
    })

    return NextResponse.json(sessionTurnResponseSchema.parse(result))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SANbox demo turn failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
