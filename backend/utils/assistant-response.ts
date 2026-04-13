const EXAMPLE_OPEN = '[example]'
const EXAMPLE_CLOSE = '[/example]'
const EXPLANATION_OPEN = '[explanation]'
const EXPLANATION_CLOSE = '[/explanation]'

export type ParsedAssistantResponse = {
  example: string | null
  explanation: string
}

function cleanSegment(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractTaggedSegment(source: string, open: string, close: string) {
  const start = source.indexOf(open)
  const end = source.indexOf(close)

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return cleanSegment(source.slice(start + open.length, end))
}

export function parseAssistantResponse(rawText: string): ParsedAssistantResponse {
  const normalized = rawText.trim()

  if (!normalized) {
    return {
      example: null,
      explanation: '',
    }
  }

  const example = extractTaggedSegment(normalized, EXAMPLE_OPEN, EXAMPLE_CLOSE)
  const explanation = extractTaggedSegment(normalized, EXPLANATION_OPEN, EXPLANATION_CLOSE)

  if (example || explanation) {
    return {
      example: example ? cleanSegment(example) : null,
      explanation: explanation || cleanSegment(normalized.replace(/\[[^\]]+\]/g, ' ')),
    }
  }

  return {
    example: null,
    explanation: cleanSegment(normalized),
  }
}

export function composeAssistantSpeechText(response: ParsedAssistantResponse) {
  if (response.example && response.explanation) {
    return `${response.example} ${response.explanation}`.trim()
  }

  return (response.example || response.explanation).trim()
}

export function composeAssistantLogText(response: ParsedAssistantResponse) {
  if (response.example && response.explanation) {
    return `Example: ${response.example}\n\n${response.explanation}`
  }

  return (response.example || response.explanation).trim()
}
