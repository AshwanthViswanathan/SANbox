import { runGroqChatCompletion } from '@/backend/providers/groq'
import type { SafeguardResult } from '@/shared/types'

const DEFAULT_SAFEGUARD_MODEL =
  process.env.TEACHBOX_SAFEGUARD_MODEL ?? 'openai/gpt-oss-safeguard-20b'

type SafeguardLabel = SafeguardResult['label']
type SafeguardConfidence = 'low' | 'medium' | 'high'
type SafeguardCategory =
  | 'safe'
  | 'profanity'
  | 'self_harm'
  | 'dangerous_instruction'
  | 'sexual_content'
  | 'violent_wrongdoing'
  | 'age_inappropriate'
  | 'ambiguous_safety'

type SafeguardSource = 'heuristic' | 'model' | 'repair' | 'fallback'

type SafeguardPayload = {
  label?: string
  reason?: string
  confidence?: string
  category?: string
}

export type DetailedSafeguardResult = SafeguardResult & {
  confidence: SafeguardConfidence
  category: SafeguardCategory
  source: SafeguardSource
  raw: string | null
}

const HEURISTIC_BLOCK_PATTERNS = [
  /\b(kill myself|want to die|hurt myself|self[-\s]?harm|suicide)\b/i,
  /\b(kill you|murder you|shoot you|stab you)\b/i,
  /\b(make|build|use)\b.{0,30}\b(bomb|explosive|poison)\b/i,
  /\b(how do i|how to)\b.{0,40}\b(shoot|stab|poison|blow up)\b/i,
  /\b(cock|penis|deep throat|blowjob|suck (?:a|my|his|her)?\s*(cock|dick|penis)|cum|ejaculate)\b/i,
  /\b(touch you inappropriately|touch (?:you|someone) (?:sexually|inappropriately)|sexual assault|rape)\b/i,
  /\b(child porn|minor sex|sexual with a child)\b/i,
] as const

const HEURISTIC_BORDERLINE_PATTERNS = [
  /\b(fuck|shit|bitch|asshole)\b/i,
  /\b(stupid|idiot|dumb|shut up|hate you)\b/i,
  /\b(nigga|nigger)\b/i,
  /\byour mom\b/i,
] as const

function normalizeLabel(value?: string | null): SafeguardLabel | null {
  const label = value?.trim().toUpperCase()
  if (label === 'SAFE' || label === 'BORDERLINE' || label === 'BLOCK') {
    return label
  }

  return null
}

function normalizeConfidence(value?: string | null): SafeguardConfidence {
  const confidence = value?.trim().toLowerCase()
  if (confidence === 'low' || confidence === 'medium' || confidence === 'high') {
    return confidence
  }

  return 'medium'
}

function normalizeCategory(value?: string | null): SafeguardCategory {
  const category = value?.trim().toLowerCase()
  if (
    category === 'safe' ||
    category === 'profanity' ||
    category === 'self_harm' ||
    category === 'dangerous_instruction' ||
    category === 'sexual_content' ||
    category === 'violent_wrongdoing' ||
    category === 'age_inappropriate' ||
    category === 'ambiguous_safety'
  ) {
    return category
  }

  return 'ambiguous_safety'
}

function extractJsonObject(rawResult: string) {
  const trimmed = rawResult.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return trimmed
  }

  return trimmed.slice(start, end + 1)
}

function parseSafeguardResponse(rawResult: string): DetailedSafeguardResult | null {
  const jsonCandidate = extractJsonObject(rawResult)

  try {
    const parsed = JSON.parse(jsonCandidate) as SafeguardPayload
    const label = normalizeLabel(parsed.label)
    if (label) {
      return {
        label,
        reason: parsed.reason?.trim() || 'model_classification',
        confidence: normalizeConfidence(parsed.confidence),
        category: normalizeCategory(parsed.category),
        source: 'model',
        raw: rawResult,
      }
    }
  } catch {
    // Fall through to regex-based parsing.
  }

  const trimmed = rawResult.trim()
  const labelMatch = trimmed.toUpperCase().match(/\b(SAFE|BORDERLINE|BLOCK)\b/)
  if (!labelMatch) return null

  const reasonMatch = trimmed.match(/"reason"\s*:\s*"([^"]+)"/i)
  const confidenceMatch = trimmed.match(/"confidence"\s*:\s*"([^"]+)"/i)
  const categoryMatch = trimmed.match(/"category"\s*:\s*"([^"]+)"/i)
  return {
    label: labelMatch[1] as SafeguardResult['label'],
    reason: reasonMatch?.[1]?.trim() || 'model_classification',
    confidence: normalizeConfidence(confidenceMatch?.[1]),
    category: normalizeCategory(categoryMatch?.[1]),
    source: 'model',
    raw: rawResult,
  }
}

function classifyWithHeuristic(text: string): DetailedSafeguardResult | null {
  if (HEURISTIC_BLOCK_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      label: 'BLOCK',
      reason: 'heuristic_high_confidence_block',
      confidence: 'high',
      category: 'dangerous_instruction',
      source: 'heuristic',
      raw: null,
    }
  }

  if (HEURISTIC_BORDERLINE_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      label: 'BORDERLINE',
      reason: 'heuristic_profanity_or_insult',
      confidence: 'high',
      category: 'profanity',
      source: 'heuristic',
      raw: null,
    }
  }

  return null
}

async function runSafeguardModel(text: string, purpose: 'model' | 'repair') {
  const systemPrompt =
    purpose === 'model'
      ? 'You are a safety classifier for K-5 educational conversations. Analyze the message and return exactly one JSON object with keys "label", "reason", "confidence", and "category". The label must be SAFE, BORDERLINE, or BLOCK. Use SAFE only for normal child-safe learning and casual questions. Use BORDERLINE for profanity, slurs, insults, sexual innuendo, age-inappropriate content, harassment, or genuinely ambiguous cases that merit parent review but are not clearly dangerous. Use BLOCK for self-harm, threats of violence, sexual acts or explicit sexual instructions, sexual contact or assault, sexual content involving minors, violent wrongdoing, dangerous illegal activity, or instructions involving weapons, bombs, explosives, or poison. If the text explicitly describes a sex act, threatening harm, or inappropriate touching, it must not be SAFE. "reason" should be a short snake_case style string. "confidence" must be low, medium, or high. "category" must be one of safe, profanity, self_harm, dangerous_instruction, sexual_content, violent_wrongdoing, age_inappropriate, or ambiguous_safety. Return JSON only.'
      : 'Convert the following classifier output into exactly one valid JSON object with keys "label", "reason", "confidence", and "category". Preserve the intended classification as faithfully as possible. The label must be SAFE, BORDERLINE, or BLOCK. The confidence must be low, medium, or high. The category must be one of safe, profanity, self_harm, dangerous_instruction, sexual_content, violent_wrongdoing, age_inappropriate, or ambiguous_safety. Return JSON only.'

  return runGroqChatCompletion({
    model: DEFAULT_SAFEGUARD_MODEL,
    temperature: 0,
    maxTokens: 120,
    purpose: purpose === 'model' ? 'safeguard classification' : 'safeguard repair',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: text,
      },
    ],
  })
}

function makeFallback(
  reason: string,
  source: SafeguardSource,
  category: SafeguardCategory = 'ambiguous_safety'
): DetailedSafeguardResult {
  return {
    label: 'SAFE',
    reason,
    confidence: 'low',
    category,
    source,
    raw: null,
  }
}

export async function classifySafetyDetailed(text: string): Promise<DetailedSafeguardResult> {
  const heuristicResult = classifyWithHeuristic(text)

  try {
    const rawResult = await runSafeguardModel(text, 'model')

    const parsed = parseSafeguardResponse(rawResult)
    if (parsed) {
      if (heuristicResult) {
        if (heuristicResult.label === 'BLOCK' && parsed.label !== 'BLOCK') {
          return heuristicResult
        }

        if (
          heuristicResult.label === 'BORDERLINE' &&
          parsed.label === 'SAFE'
        ) {
          return heuristicResult
        }
      }

      return parsed
    }

    try {
      const repaired = await runSafeguardModel(rawResult, 'repair')
      const repairedParsed = parseSafeguardResponse(repaired)

      if (repairedParsed) {
        if (heuristicResult) {
          if (heuristicResult.label === 'BLOCK' && repairedParsed.label !== 'BLOCK') {
            return heuristicResult
          }

          if (heuristicResult.label === 'BORDERLINE' && repairedParsed.label === 'SAFE') {
            return heuristicResult
          }
        }

        return {
          ...repairedParsed,
          source: 'repair',
        }
      }
    } catch {
      return heuristicResult ?? makeFallback('classifier_repair_failed', 'fallback')
    }

    return heuristicResult ?? makeFallback('classifier_unparseable', 'fallback')
  } catch {
    return heuristicResult ?? makeFallback('classifier_unavailable', 'fallback')
  }
}

export async function classifySafety(text: string): Promise<SafeguardResult> {
  const result = await classifySafetyDetailed(text)

  return {
    label: result.label,
    reason: result.reason,
  }
}
