type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type GroqChatOptions = {
  model: string
  messages: GroqChatMessage[]
  temperature?: number
  maxTokens?: number
  purpose?: string
}

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string
            text?: string
          }>
        | null
    }
  }>
  error?: {
    message?: string
  }
}

type GroqTranscriptionResponse = {
  text?: string
  error?: {
    message?: string
  }
}

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1'

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable.')
  }

  return apiKey
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: { message?: string } }
    return payload.error?.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

function extractChatContent(payload: GroqChatResponse) {
  const content = payload.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part?.type === 'text' || part?.text ? part?.text ?? '' : ''))
      .join('')
      .trim()
  }

  return ''
}

export async function runGroqChatCompletion(options: GroqChatOptions) {
  const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 300,
    }),
  })

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response)
    throw new Error(`Groq chat completion failed: ${response.status} ${errorMessage}`)
  }

  const payload = (await response.json()) as GroqChatResponse
  const content = extractChatContent(payload)

  if (!content) {
    const purpose = options.purpose ? ` for ${options.purpose}` : ''
    throw new Error(`Groq chat completion returned an empty response${purpose}.`)
  }

  return content
}

export async function runGroqTranscription(audio: File, model: string) {
  const formData = new FormData()
  formData.set('file', audio)
  formData.set('model', model)
  formData.set('response_format', 'json')

  const response = await fetch(`${GROQ_API_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response)
    throw new Error(`Groq transcription failed: ${response.status} ${errorMessage}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  let transcript = ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as GroqTranscriptionResponse
    transcript = payload.text?.trim() ?? ''
  } else {
    transcript = (await response.text()).trim()
  }

  if (!transcript) {
    throw new Error('Groq transcription returned an empty transcript.')
  }

  return transcript
}
