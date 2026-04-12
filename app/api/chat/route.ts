import { groq } from '@ai-sdk/groq'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
const ALLOWED_MODELS = [
  DEFAULT_MODEL,
  'openai/gpt-oss-safeguard-20b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
] as const

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response('Missing GROQ_API_KEY environment variable.', { status: 500 })
  }

  const {
    messages,
    model,
  }: {
    messages?: UIMessage[]
    model?: string
  } = await req.json()

  if (!messages?.length) {
    return new Response('No messages were provided.', { status: 400 })
  }

  const selectedModel =
    model && ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])
      ? model
      : DEFAULT_MODEL

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: groq(selectedModel),
    system:
      'You are a concise, practical hackathon copilot helping the DM Adventures team prototype agentic AI ideas quickly.',
    messages: modelMessages,
    temperature: 0.3,
  })

  return result.toUIMessageStreamResponse()
}
