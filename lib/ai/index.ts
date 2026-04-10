/**
 * lib/ai/index.ts
 * LLM provider abstraction layer.
 *
 * TODO: Install and configure your preferred provider:
 *
 *   Option A — Vercel AI SDK (recommended):
 *     pnpm add ai @ai-sdk/openai
 *     import { openai } from '@ai-sdk/openai'
 *     import { generateText, streamText } from 'ai'
 *
 *     export async function runAgent(prompt: string) {
 *       const { text } = await generateText({
 *         model: openai('gpt-4o-mini'),
 *         prompt,
 *       })
 *       return text
 *     }
 *
 *   Option B — Direct OpenAI SDK:
 *     pnpm add openai
 *     import OpenAI from 'openai'
 *     const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
 *
 * Required env vars (depending on provider):
 *   OPENAI_API_KEY=sk-...
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

export type AgentRunInput = {
  agentId: string
  prompt: string
  context?: Record<string, unknown>
}

export type AgentRunOutput = {
  text: string
  usage?: { promptTokens: number; completionTokens: number }
}

/**
 * Placeholder agent runner — replace with real LLM call.
 * TODO: Implement with AI SDK or OpenAI SDK (see above).
 */
export async function runAgent(input: AgentRunInput): Promise<AgentRunOutput> {
  // Stub: returns a placeholder response
  return {
    text: `[TODO] Agent ${input.agentId} received: "${input.prompt}"`,
    usage: { promptTokens: 0, completionTokens: 0 },
  }
}
