import { runGroqChatCompletion } from '@/backend/providers/groq'
import type { TeachBoxMode } from '@/shared/types'

const DEFAULT_LLM_MODEL = process.env.TEACHBOX_LLM_MODEL ?? 'openai/gpt-oss-120b'

function getTeachingFallback(transcript: string, mode: TeachBoxMode, lessonTitle?: string | null) {
  const normalizedTranscript = transcript.trim()

  if (mode === 'lesson' && lessonTitle) {
    return `We are working on ${lessonTitle}. Let's think about your question together: ${normalizedTranscript}`
  }

  return `I heard your question: ${normalizedTranscript}. Here is a simple answer: sometimes things work the way they do because of patterns in nature, and we can figure them out step by step.`
}

export async function generateTeachingReply(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
}) {
  const { transcript, mode, lessonTitle } = params

  const lessonContext =
    mode === 'lesson' && lessonTitle
      ? `The child is currently in lesson mode for "${lessonTitle}". Tie the answer back to that lesson when useful.`
      : 'The child is in open question mode.'

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
            'You are TeachBox, a voice-first AI learning companion for K-5 students. Respond with short, warm, concrete explanations. Use plain language, avoid markdown, avoid lists unless needed, and keep answers easy to read aloud. If the question is unsafe or age-inappropriate, gently redirect to a safe educational alternative.',
        },
        {
          role: 'system',
          content: lessonContext,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    return getTeachingFallback(transcript, mode, lessonTitle)
  }
}
