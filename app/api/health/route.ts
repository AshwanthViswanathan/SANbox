import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * System health check — useful for uptime monitoring and device connectivity checks.
 *
 * TODO: Add real checks:
 *   - Supabase connectivity: await supabase.from('_health').select('1')
 *   - LLM provider reachability
 *   - Queue depth / backpressure signal
 */
export async function GET() {
  const checks = {
    api: 'ok',
    // TODO: Replace with real Supabase ping
    database: 'unchecked',
    // TODO: Replace with LLM provider probe
    llm: 'unchecked',
  }

  const allHealthy = Object.values(checks).every((v) => v === 'ok' || v === 'unchecked')

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
