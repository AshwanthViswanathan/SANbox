import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ingest
 * Device / hardware event ingest endpoint.
 *
 * Expected payload:
 * {
 *   "device_id": "rpi-001",
 *   "event_type": "telemetry" | "heartbeat" | "alert",
 *   "payload": { ...arbitrary device data }
 * }
 *
 * Auth: Bearer token via Authorization header.
 *   Authorization: Bearer <DEVICE_INGEST_TOKEN>
 *
 * Example cURL from Raspberry Pi:
 *   curl -X POST https://your-app.vercel.app/api/ingest \
 *     -H "Authorization: Bearer YOUR_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"device_id":"rpi-001","event_type":"telemetry","payload":{"temp":41}}'
 *
 * TODO: Replace token validation with a real lookup from Supabase:
 *   const { data: device } = await supabase
 *     .from('devices')
 *     .select('id, name')
 *     .eq('ingest_token', token)
 *     .single()
 *
 * TODO: Insert the event into Supabase:
 *   await supabase.from('events').insert({
 *     device_id: body.device_id,
 *     event_type: body.event_type,
 *     payload: body.payload,
 *     received_at: new Date().toISOString(),
 *   })
 *
 * TODO: Trigger downstream agent logic if event_type === 'alert'
 */
export async function POST(req: NextRequest) {
  const expectedToken = process.env.DEVICE_INGEST_TOKEN?.trim()
  if (!expectedToken) {
    return NextResponse.json(
      { error: 'DEVICE_INGEST_TOKEN is not configured.' },
      { status: 503 }
    )
  }

  // --- Auth ---
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // --- Parse body ---
  let body: { device_id?: string; event_type?: string; payload?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { device_id, event_type, payload } = body

  if (!device_id || !event_type) {
    return NextResponse.json(
      { error: 'Missing required fields: device_id, event_type' },
      { status: 422 }
    )
  }

  // TODO: Persist event to Supabase (see above)
  console.log('[ingest]', { device_id, event_type, payload, ts: new Date().toISOString() })

  return NextResponse.json(
    {
      status: 'received',
      device_id,
      event_type,
      ts: new Date().toISOString(),
    },
    { status: 202 }
  )
}
