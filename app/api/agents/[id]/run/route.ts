import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/agents/[id]/run
 * Trigger an agent run programmatically.
 *
 * TODO: Fetch agent config from Supabase:
 *   const { data: agent } = await supabase.from('agents').select('*').eq('id', params.id).single()
 *
 * TODO: Create a run record:
 *   const { data: run } = await supabase.from('runs').insert({ agent_id: params.id, status: 'running' }).select().single()
 *
 * TODO: Invoke agent execution (LLM call, tool calls, etc.) from lib/ai/
 *
 * TODO: Update run status on completion / failure.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Placeholder: simulate run creation
  const runId = `run-${Date.now()}`

  return NextResponse.json(
    {
      status: 'queued',
      run_id: runId,
      agent_id: id,
      started_at: new Date().toISOString(),
    },
    { status: 202 }
  )
}
