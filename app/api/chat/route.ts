import { groq } from '@ai-sdk/groq'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return new Response('Missing GROQ_API_KEY environment variable.', { status: 500 })
  }

  const { messages }: { messages?: UIMessage[] } = await req.json()

  if (!messages?.length) {
    return new Response('No messages were provided.', { status: 400 })
  }

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: groq(DEFAULT_MODEL),
    system:
      'You are a concise, practical hackathon copilot helping the DM Adventures team prototype agentic AI ideas quickly.',
    messages: modelMessages,
    temperature: 0.3,
  })

  return result.toUIMessageStreamResponse()
}
