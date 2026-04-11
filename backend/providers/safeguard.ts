import { runGroqChatCompletion } from '@/backend/providers/groq'
import type { SafeguardResult } from '@/shared/types'

const DEFAULT_SAFEGUARD_MODEL =
  process.env.TEACHBOX_SAFEGUARD_MODEL ?? 'openai/gpt-oss-safeguard-20b'

export async function classifySafety(text: string): Promise<SafeguardResult> {
  let rawResult = ''

  try {
    rawResult = await runGroqChatCompletion({
      model: DEFAULT_SAFEGUARD_MODEL,
      temperature: 0,
      maxTokens: 40,
      purpose: 'safeguard classification',
      messages: [
        {
          role: 'system',
          content:
            'You are a safety classifier for K-5 educational conversations. Return exactly one line in this format: LABEL<TAB>reason. LABEL must be SAFE, BORDERLINE, or BLOCK. BLOCK covers self-harm, sexual content involving minors, explicit violence, abuse instructions, dangerous illegal activity, or harmful instructions. BORDERLINE covers insults, bullying, age-inappropriate tone, or content that should be reviewed. SAFE covers normal school-safe content. Do not output anything else.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    })
  } catch {
    return { label: 'BORDERLINE', reason: 'classifier_unavailable' }
  }

  const [labelRaw, reasonRaw] = rawResult.trim().split(/\t+/, 2)
  const label = labelRaw?.trim()
  const reason = reasonRaw?.trim() || 'model_classification'

  if (label === 'SAFE' || label === 'BORDERLINE' || label === 'BLOCK') {
    return { label, reason }
  }

  return { label: 'BORDERLINE', reason: 'unparseable_classifier_output' }
}
