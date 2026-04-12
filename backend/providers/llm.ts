import { runGroqChatCompletion } from '@/backend/providers/groq'
import type { TeachBoxMode } from '@/shared/types'

const DEFAULT_LLM_MODEL = process.env.TEACHBOX_LLM_MODEL ?? 'openai/gpt-oss-120b'

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
  inputSafety?: {
    label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
    reason?: string | null
    category?: string | null
  }
}) {
  const { transcript, mode, lessonTitle, inputSafety } = params

  const lessonContext =
    mode === 'lesson' && lessonTitle
      ? `The child is currently in lesson mode for "${lessonTitle}". Tie the answer back to that lesson when useful.`
      : 'The child is in open question mode.'

  const safetyContext =
    inputSafety?.label === 'BORDERLINE'
      ? `The child's message was classified as BORDERLINE for reason "${inputSafety.reason ?? 'unspecified'}"${inputSafety.category ? ` and category "${inputSafety.category}"` : ''}. Do not answer the request normally. Briefly explain why the language or request is not okay, model a better or safer way to ask, and then redirect into a respectful learning direction. Keep the tone firm but teacher-like, not chatty.`
      : 'The child message was classified SAFE. Answer normally.'

  try {
    return await runGroqChatCompletion({
      model: DEFAULT_LLM_MODEL,
      temperature: 0.4,
      maxTokens: 220,
      purpose: 'main LLM response',
      messages: [
        {
          role: 'system',
          content:
            'You are TeachBox, a voice-first AI learning companion for K-5 students. Respond with short, warm, concrete explanations. Use plain language, avoid markdown, avoid lists unless needed, and keep answers easy to read aloud. If the child uses rude, sexual, threatening, or age-inappropriate language, respond like a calm teacher: explain briefly why it is not okay, encourage safer and more respectful wording, and redirect to a safe topic.',
        },
        {
          role: 'system',
          content: lessonContext,
        },
        {
          role: 'system',
          content: safetyContext,
        },
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
      inputSafety?.label,
      inputSafety?.reason
    )
  }
}
