import { runGroqChatCompletion } from '@/backend/providers/groq'
import { parseAssistantResponse } from '@/backend/utils/assistant-response'
import { ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS } from '@/backend/utils/assistant-prompt'
import type { TeachBoxMode } from '@/shared/types'

const DEFAULT_LLM_MODEL = process.env.TEACHBOX_LLM_MODEL ?? 'openai/gpt-oss-120b'
type RecentConversationTurn = {
  transcript: string
  assistantText: string
}

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

async function maybeGenerateMissingExample(params: {
  transcript: string
  explanation: string
  lessonTitle?: string | null
  mode: TeachBoxMode
}) {
  if (!shouldStronglyPreferExample(params.transcript)) {
    return null
  }

  try {
    const isMath = isLikelyMathQuestion(params.transcript)
    const example = await runGroqChatCompletion({
      model: DEFAULT_LLM_MODEL,
      temperature: 0.3,
      maxTokens: isMath ? 800 : 300,
      purpose: 'teaching example',
      messages: [
        {
          role: 'system',
          content:
            isMath
              ? 'You write one fully worked-out, mathematically valid example problem that helps clarify an explanation. Use the actual math topic from the question. Do not use fantasy stories, gardens, magic, characters, or unrelated analogies. If there is an expression or equation, work directly with expressions or numbers. Show all steps clearly, one step per line without extra blank lines. Use standard LaTeX with $...$ for inline math or $$...$$ for full equations. Do not use \\(...\\). Keep the layout clean and compact on screen. Return only the example text with no labels (like "EXAMPLE:") or surrounding commentary.'
              : 'You write one short child-friendly example that helps clarify an explanation. Keep it concrete, directly relevant, and short. Do not use random fantasy analogies unless the child asked for one. Return only the example text with no labels, no markdown, and no surrounding commentary.',
        },
        {
          role: 'system',
          content:
            params.mode === 'lesson' && params.lessonTitle
              ? `The child is currently in the lesson "${params.lessonTitle}". Keep the example aligned with that lesson.`
              : 'The child is in open question mode.',
        },
        {
          role: 'user',
          content: isMath
            ? `Question: ${params.transcript}\nExplanation: ${params.explanation}\nWrite one fully worked-out example problem using the actual math in the question. Show all steps. Put each step on its own line without extra blank lines between them. Wrap math in $...$ or $$...$$.`
            : `Question: ${params.transcript}\nExplanation: ${params.explanation}\nWrite one short example that would help a K-5 student understand this.`,
        },
      ],
    })

    return example.trim() || null
  } catch {
    return null
  }
}

function getTeachingFallback(
  transcript: string,
  mode: TeachBoxMode,
  lessonTitle?: string | null,
  safetyLabel?: 'SAFE' | 'BORDERLINE' | 'BLOCK',
  safetyReason?: string | null
) {
  const normalizedTranscript = transcript.trim()

  if (safetyLabel === 'BORDERLINE') {
    return `That is not a kind or appropriate way to talk. We should use respectful and safe words. If you want, I can help you ask that in a better way or we can learn about something else together.`
  }

  if (mode === 'lesson' && lessonTitle) {
    return `We are working on ${lessonTitle}. Let's think about your question together: ${normalizedTranscript}`
  }

  return `I heard your question: ${normalizedTranscript}. Here is a simple answer: sometimes things work the way they do because of patterns in nature, and we can figure them out step by step.`
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
}) {
  const { transcript, mode, lessonTitle, recentTurns = [], inputSafety } = params
  const forceExample = explicitlyRequestsExample(transcript)

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

  const conversationMessages = recentTurns.flatMap((turn) => [
    {
      role: 'user' as const,
      content: turn.transcript,
    },
    {
      role: 'assistant' as const,
      content: turn.assistantText,
    },
  ])

  try {
    const rawReply = await runGroqChatCompletion({
      model: DEFAULT_LLM_MODEL,
      temperature: 0.4,
      maxTokens: 420,
      purpose: 'main LLM response',
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. Respond with short, warm, concrete explanations. Use plain language, avoid markdown, avoid lists unless needed, and keep answers easy to read aloud. For math, you may use lightweight LaTeX in $...$ or $$...$$ when it helps. Supported math includes fractions, exponents, subscripts, square roots and n-th roots, multiplication and division symbols, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable: no matrices, no long derivations, no obscure commands. If the child uses rude, sexual, threatening, or age-inappropriate language, respond like a calm teacher: explain briefly why it is not okay, encourage safer and more respectful wording, and redirect to a safe topic. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
        },
        ...(forceExample
          ? [
              {
                role: 'system' as const,
                content:
                  'The child explicitly asked for an example. You must include a non-empty [example]...[/example] section.',
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

    const parsedReply = parseAssistantResponse(rawReply)

    if (forceExample || !parsedReply.example) {
      const generatedExample = await maybeGenerateMissingExample({
        transcript,
        explanation: parsedReply.explanation,
        lessonTitle,
        mode,
      })

      if (generatedExample) {
        return `[explanation]${parsedReply.explanation}[/explanation]\n[example]${generatedExample}[/example]`
      }
    }

    return rawReply
  } catch {
    return getTeachingFallback(
      transcript,
      mode,
      lessonTitle,
      inputSafety?.label,
      inputSafety?.reason
    )
  }
}

export async function generateLessonPauseReply(params: {
  transcript: string
  lessonTitle: string
  stepTitle: string
  stepPrompt: string
  teacherNote?: string | null
}) {
  const { transcript, lessonTitle, stepTitle, stepPrompt, teacherNote } = params

  try {
    return await runGroqChatCompletion({
      model: DEFAULT_LLM_MODEL,
      temperature: 0.3,
      maxTokens: 260,
      purpose: 'lesson pause reply',
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. You are inside a scripted lesson. Answer the child’s follow-up question briefly, clearly, and only about the current lesson concept. Do not open a new topic. Do not ask multiple follow-up questions. Do not change the lesson plan. Keep the reply short enough to read aloud comfortably. For math, you may use lightweight LaTeX in $...$ when it helps, including fractions, exponents, subscripts, roots, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
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
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    return `That is a good question. The main idea here is ${stepPrompt.toLowerCase()}`
  }
}
