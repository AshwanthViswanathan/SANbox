type GroqAssistantMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string | null
}

type GroqToolMessage = {
  role: 'tool'
  content: string
  tool_call_id: string
  name?: string
}

export type GroqChatMessage = GroqAssistantMessage | GroqToolMessage

export type GroqToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type GroqToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | {
      type: 'function'
      function: {
        name: string
      }
    }

export type GroqToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

type GroqChatOptions = {
  model: string
  messages: GroqChatMessage[]
  temperature?: number
  maxTokens?: number
  purpose?: string
}

type GroqChatWithToolsOptions = GroqChatOptions & {
  tools: GroqToolDefinition[]
  toolChoice?: GroqToolChoice
}

type GroqChatResponse = {
  choices?: Array<{
    finish_reason?: string | null
    message?: {
      content?:
        | string
        | Array<{
            type?: string
            text?: string
          }>
        | null
      tool_calls?: GroqToolCall[] | null
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

async function createGroqChatCompletion(
  options: GroqChatOptions | GroqChatWithToolsOptions
) {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 300,
  }

  if ('tools' in options) {
    body.tools = options.tools
    body.tool_choice = options.toolChoice ?? 'auto'
  }

  const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response)
    throw new Error(`Groq chat completion failed: ${response.status} ${errorMessage}`)
  }

  return (await response.json()) as GroqChatResponse
}

export async function runGroqChatCompletion(options: GroqChatOptions) {
  const payload = await createGroqChatCompletion(options)
  const content = extractChatContent(payload)

  if (!content) {
    const purpose = options.purpose ? ` for ${options.purpose}` : ''
    throw new Error(`Groq chat completion returned an empty response${purpose}.`)
  }

  return content
}

export async function runGroqChatCompletionWithTools(options: GroqChatWithToolsOptions) {
  const payload = await createGroqChatCompletion(options)
  const choice = payload.choices?.[0]
  const content = extractChatContent(payload)
  const toolCalls = choice?.message?.tool_calls ?? []

  return {
    content,
    toolCalls,
    finishReason: choice?.finish_reason ?? null,
  }
}

export async function runGroqTranscription(audio: File, model: string, prompt?: string | null) {
  const formData = new FormData()
  formData.set('file', audio)
  formData.set('model', model)
  formData.set('response_format', 'json')
  if (prompt?.trim()) {
    formData.set('prompt', prompt.trim())
  }

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
