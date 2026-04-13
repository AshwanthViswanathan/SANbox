import { z } from 'zod'

import {
  runGroqChatCompletion,
  type GroqChatMessage,
} from '@/backend/providers/groq'
import { ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS } from '@/backend/utils/assistant-prompt'
import type { TeachBoxMode } from '@/shared/types'

const DEFAULT_LLM_MODEL = process.env.TEACHBOX_LLM_MODEL ?? 'openai/gpt-oss-120b'

type RecentConversationTurn = {
  transcript: string
  assistantText: string
}

type ExampleToolName = 'generate_worked_math_example' | 'generate_concept_example'

type ExampleToolArgs = {
  transcript: string
  explanation: string
  lessonTitle?: string | null
}

export type TeachingReplyPayload = {
  explanation: string
  example: string | null
}

const assistantExampleToolSchema = z.object({
  name: z.enum(['generate_worked_math_example', 'generate_concept_example']),
})

const assistantPayloadSchema = z.object({
  explanation: z.string().trim().min(1),
  exampleTool: assistantExampleToolSchema.nullable().optional(),
})

const exampleToolArgsSchema = z.object({
  transcript: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  lessonTitle: z.string().trim().min(1).nullable().optional(),
})

function isLikelyMathQuestion(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  return (
    /[=+\-*/^]/.test(normalized) ||
    /\b(x|y|slope|equation|function|factor|simplify|solve|quadratic|polynomial|inequality|graph|log|algebra|root|square root|fraction)\b/.test(
      normalized
    )
  )
}

function shouldStronglyPreferExample(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return [
    'example',
    'worked example',
    'worked-out example',
    'walk me through',
    'explain',
    'how does',
    'how do',
    'why does',
    'why do',
    'what is',
    'what does',
    'show me',
    'give me an example',
    'for example',
    'solve',
    'equation',
    'function',
    'graph',
    'factor',
    'simplify',
    'quadratic',
    'slope',
    'polynomial',
    'log',
    'inequality',
    'triangle',
  ].some((phrase) => normalized.includes(phrase))
}

function explicitlyRequestsExample(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  return [
    'example',
    'worked example',
    'worked-out example',
    'give me an example',
    'show me an example',
    'walk me through',
  ].some((phrase) => normalized.includes(phrase))
}

function extractJsonObject(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const withoutFences = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const firstBrace = withoutFences.indexOf('{')
  const lastBrace = withoutFences.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return withoutFences
  }

  return withoutFences.slice(firstBrace, lastBrace + 1)
}

function parseAssistantPayload(
  content: string,
  fallbackExplanation: string
): { explanation: string; exampleToolName: ExampleToolName | null } {
  const normalizedContent = content.trim()

  try {
    const parsed = assistantPayloadSchema.parse(JSON.parse(extractJsonObject(content)))

    return {
      explanation: parsed.explanation,
      exampleToolName: parsed.exampleTool?.name ?? null,
    }
  } catch {
    const explanationMatch = normalizedContent.match(/"explanation"\s*:\s*"([^"]*)$/)
    if (explanationMatch?.[1]?.trim()) {
      return {
        explanation: explanationMatch[1].trim(),
        exampleToolName: null,
      }
    }

    if (normalizedContent.startsWith('{') || normalizedContent.includes('"explanation"')) {
      return {
        explanation: fallbackExplanation,
        exampleToolName: null,
      }
    }

    return {
      explanation: normalizedContent || fallbackExplanation,
      exampleToolName: null,
    }
  }
}

function buildExampleToolArgs(params: {
  transcript: string
  explanation: string
  lessonTitle?: string | null
}): ExampleToolArgs {
  const parsed = exampleToolArgsSchema.safeParse({
    transcript: params.transcript,
    explanation: params.explanation,
    lessonTitle: params.lessonTitle ?? null,
  })

  if (parsed.success) {
    return {
      transcript: parsed.data.transcript,
      explanation: parsed.data.explanation,
      lessonTitle: parsed.data.lessonTitle ?? null,
    }
  }

  return {
    transcript: params.transcript,
    explanation: params.explanation.trim(),
    lessonTitle: params.lessonTitle ?? null,
  }
}

async function generateWorkedMathExample(args: ExampleToolArgs) {
  return runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0.2,
    maxTokens: 900,
    purpose: 'worked math example',
    messages: [
      {
        role: 'system',
        content:
          'You write one fully worked-out, mathematically valid example problem that helps clarify an explanation. Use the actual math topic from the question. Do not use fantasy stories, gardens, magic, characters, or unrelated analogies. If there is an expression or equation, work directly with expressions or numbers. Show all steps clearly, one step per line without extra blank lines. Use standard LaTeX with $...$ for inline math or $$...$$ for full equations. Do not use \\(...\\). Keep the layout clean and compact on screen. Return only the example text with no labels or surrounding commentary.',
      },
      {
        role: 'system',
        content: args.lessonTitle
          ? `The child is currently in the lesson "${args.lessonTitle}". Keep the example aligned with that lesson.`
          : 'The child is in open question mode.',
      },
      {
        role: 'user',
        content: `Question: ${args.transcript}\nExplanation: ${args.explanation}\nWrite one fully worked-out example problem using the actual math in the question. Show all steps. Put each step on its own line without extra blank lines between them. Wrap math in $...$ or $$...$$.`,
      },
    ],
  })
}

async function generateConceptExample(args: ExampleToolArgs) {
  return runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0.3,
    maxTokens: 360,
    purpose: 'concept example',
    messages: [
      {
        role: 'system',
        content:
          'You write one short child-friendly example that helps clarify an explanation. Keep it concrete, directly relevant, and short. Do not use random fantasy analogies unless the child asked for one. Return only the example text with no labels, no markdown, and no surrounding commentary.',
      },
      {
        role: 'system',
        content: args.lessonTitle
          ? `The child is currently in the lesson "${args.lessonTitle}". Keep the example aligned with that lesson.`
          : 'The child is in open question mode.',
      },
      {
        role: 'user',
        content: `Question: ${args.transcript}\nExplanation: ${args.explanation}\nWrite one short example that would help a K-5 student understand this.`,
      },
    ],
  })
}

async function dispatchExampleTool(name: ExampleToolName, args: ExampleToolArgs) {
  if (name === 'generate_worked_math_example') {
    return generateWorkedMathExample(args)
  }

  return generateConceptExample(args)
}

function getTeachingFallback(
  transcript: string,
  mode: TeachBoxMode,
  lessonTitle?: string | null,
  safetyLabel?: 'SAFE' | 'BORDERLINE' | 'BLOCK'
): TeachingReplyPayload {
  const normalizedTranscript = transcript.trim()

  if (safetyLabel === 'BORDERLINE') {
    return {
      explanation:
        'That is not a kind or appropriate way to talk. We should use respectful and safe words. If you want, I can help you ask that in a better way or we can learn about something else together.',
      example: null,
    }
  }

  if (mode === 'lesson' && lessonTitle) {
    return {
      explanation: `We are working on ${lessonTitle}. Let's think about your question together: ${normalizedTranscript}`,
      example: null,
    }
  }

  return {
    explanation:
      `I heard your question: ${normalizedTranscript}. Here is a simple answer: sometimes things work the way they do because of patterns in nature, and we can figure them out step by step.`,
    example: null,
  }
}

async function resolveAssistantWithOptionalTool(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
  messages: GroqChatMessage[]
  temperature: number
  maxTokens: number
  purpose: string
  fallbackExplanation: string
  forcedToolName?: ExampleToolName | null
}) {
  const response = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    purpose: params.purpose,
    messages: params.messages,
  })

  const payload = parseAssistantPayload(response, params.fallbackExplanation)
  const selectedToolName = params.forcedToolName ?? payload.exampleToolName

  if (selectedToolName) {
    const toolArgs = buildExampleToolArgs({
      transcript: params.transcript,
      explanation: payload.explanation,
      lessonTitle: params.lessonTitle ?? null,
    })

    try {
      const example = await dispatchExampleTool(selectedToolName, toolArgs)

      return {
        explanation: payload.explanation,
        example: example.trim() || null,
      }
    } catch {
      return {
        explanation: payload.explanation,
        example: null,
      }
    }
  }

  return payload
}

export async function generateTeachingReply(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
  recentTurns?: RecentConversationTurn[]
  inputSafety?: {
    label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
    reason?: string | null
    category?: string | null
  }
}): Promise<TeachingReplyPayload> {
  const { transcript, mode, lessonTitle, recentTurns = [], inputSafety } = params
  const explicitExampleRequest = explicitlyRequestsExample(transcript)

  const lessonContext =
    mode === 'lesson' && lessonTitle
      ? `The child is currently in lesson mode for "${lessonTitle}". Tie the answer back to that lesson when useful.`
      : 'The child is in open question mode.'

  const safetyContext =
    inputSafety?.label === 'BORDERLINE'
      ? `The child's message was classified as BORDERLINE for reason "${inputSafety.reason ?? 'unspecified'}"${inputSafety.category ? ` and category "${inputSafety.category}"` : ''}. Do not answer the request normally. Briefly explain why the language or request is not okay, model a better or safer way to ask, and then redirect into a respectful learning direction. Keep the tone firm but teacher-like, not chatty.`
      : 'The child message was classified SAFE. Answer normally.'

  const conversationContext =
    recentTurns.length > 0
      ? 'Use the recent conversation to resolve follow-up questions like "that," "it," or "the cycle." Prefer the most recent turns when the topic is ambiguous.'
      : 'No recent conversation history is available. Treat this as a standalone question.'

  const conversationMessages: GroqChatMessage[] = recentTurns.flatMap((turn) => [
    {
      role: 'user' as const,
      content: turn.transcript,
    },
    {
      role: 'assistant' as const,
      content: turn.assistantText,
    },
  ])

  const forcedToolName = explicitExampleRequest
    ? isLikelyMathQuestion(transcript)
      ? 'generate_worked_math_example'
      : 'generate_concept_example'
    : null

  try {
    return await resolveAssistantWithOptionalTool({
      transcript,
      mode,
      lessonTitle,
      temperature: 0.4,
      maxTokens: 700,
      purpose: 'main LLM response',
      fallbackExplanation: getTeachingFallback(
        transcript,
        mode,
        lessonTitle,
        inputSafety?.label
      ).explanation,
      forcedToolName,
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. Respond with short, warm, concrete explanations. Use plain language, avoid markdown, avoid lists unless needed, and keep answers easy to read aloud. For math, you may use lightweight LaTeX in $...$ or $$...$$ when it helps. Supported math includes fractions, exponents, subscripts, square roots and n-th roots, multiplication and division symbols, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable: no matrices, no long derivations, no obscure commands. If the child uses rude, sexual, threatening, or age-inappropriate language, respond like a calm teacher: explain briefly why it is not okay, encourage safer and more respectful wording, and redirect to a safe topic. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
        },
        ...(shouldStronglyPreferExample(transcript)
          ? [
              {
                role: 'system' as const,
                content:
                  'When a worked example or concrete illustration would materially improve understanding, set "exampleTool" in the JSON response instead of writing the example inline.',
              },
            ]
          : []),
        {
          role: 'system',
          content: lessonContext,
        },
        {
          role: 'system',
          content: safetyContext,
        },
        {
          role: 'system',
          content: conversationContext,
        },
        ...conversationMessages,
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    return getTeachingFallback(
      transcript,
      mode,
      lessonTitle,
      inputSafety?.label
    )
  }
}

export async function generateLessonPauseReply(params: {
  transcript: string
  lessonTitle: string
  stepTitle: string
  stepPrompt: string
  teacherNote?: string | null
}): Promise<TeachingReplyPayload> {
  const { transcript, lessonTitle, stepTitle, stepPrompt, teacherNote } = params
  const explicitExampleRequest = explicitlyRequestsExample(transcript)
  const forcedToolName = explicitExampleRequest
    ? isLikelyMathQuestion(transcript)
      ? 'generate_worked_math_example'
      : 'generate_concept_example'
    : null

  try {
    return await resolveAssistantWithOptionalTool({
      transcript,
      mode: 'lesson',
      lessonTitle,
      temperature: 0.3,
      maxTokens: 420,
      purpose: 'lesson pause reply',
      fallbackExplanation: `That is a good question. The main idea here is ${stepPrompt.toLowerCase()}`,
      forcedToolName,
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. You are inside a scripted lesson. Answer the child's follow-up question briefly, clearly, and only about the current lesson concept. Do not open a new topic. Do not ask multiple follow-up questions. Do not change the lesson plan. Keep the reply short enough to read aloud comfortably. For math, you may use lightweight LaTeX in $...$ when it helps, including fractions, exponents, subscripts, roots, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
        },
        {
          role: 'system',
          content: `Current lesson: "${lessonTitle}". Current pause point: "${stepTitle}". Pause prompt: "${stepPrompt}".`,
        },
        ...(teacherNote
          ? [
              {
                role: 'system' as const,
                content: `Teacher note: ${teacherNote}`,
              },
            ]
          : []),
        ...(shouldStronglyPreferExample(transcript)
          ? [
              {
                role: 'system' as const,
                content:
                  'When a worked example or concrete illustration would materially improve understanding, set "exampleTool" in the JSON response instead of writing the example inline.',
              },
            ]
          : []),
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    return {
      explanation: `That is a good question. The main idea here is ${stepPrompt.toLowerCase()}`,
      example: null,
    }
  }
}
