import { createSign } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const DEFAULT_GEMINI_TTS_MODEL = process.env.TEACHBOX_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts'
const DEFAULT_GEMINI_TTS_VOICE = process.env.TEACHBOX_TTS_VOICE_NAME ?? 'Kore'
const DEFAULT_GOOGLE_TTS_VOICE =
  process.env.TEACHBOX_TTS_VOICE_NAME ?? 'en-US-Chirp3-HD-Achernar'
const DEFAULT_GOOGLE_TTS_LANGUAGE = process.env.TEACHBOX_TTS_LANGUAGE_CODE ?? 'en-US'
const GOOGLE_TTS_AUDIO_ENCODING = 'MP3'
const DEFAULT_TTS_SPEED = getConfiguredTtsSpeed()
const GEMINI_TTS_SAMPLE_RATE = 24000
const GEMINI_TTS_CHANNELS = 1
const GEMINI_TTS_BITS_PER_SAMPLE = 16
const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const GOOGLE_OAUTH_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer'

type GeminiTtsResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string
          mimeType?: string
        }
      }>
    }
  }>
  error?: {
    message?: string
  }
}

type GoogleServiceAccount = {
  client_email: string
  private_key: string
  token_uri?: string
}

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

type GoogleTtsResponse = {
  audioContent?: string
  error?: {
    message?: string
  }
}

let cachedAccessToken:
  | {
      token: string
      expiresAt: number
    }
  | null = null

function getConfiguredTtsSpeed() {
  const raw = Number(process.env.TEACHBOX_TTS_SPEED ?? '1.15')

  if (!Number.isFinite(raw)) {
    return 1.15
  }

  return Math.min(2, Math.max(0.25, raw))
}

function getGeminiPacingInstruction(speed: number) {
  if (speed >= 1.35) {
    return 'Speak clearly at a fast pace.'
  }

  if (speed >= 1.1) {
    return 'Speak clearly at a slightly brisk pace.'
  }

  if (speed <= 0.9) {
    return 'Speak clearly at a slower, more deliberate pace.'
  }

  return 'Keep the pacing calm and friendly.'
}

function getGeminiApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_CLOUD_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_CLOUD_API_KEY.'
    )
  }

  return apiKey
}

function getGoogleCredentialsPath() {
  return process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() || null
}

function getGoogleServiceAccountJson() {
  return process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || null
}

async function loadGoogleServiceAccountCredentials() {
  const credentialsJson = getGoogleServiceAccountJson()
  if (credentialsJson) {
    const parsed = JSON.parse(credentialsJson) as Partial<GoogleServiceAccount>

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_JSON does not contain a valid Google service account.'
      )
    }

    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
      token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
    } satisfies GoogleServiceAccount
  }

  const credentialsPath = getGoogleCredentialsPath()

  if (!credentialsPath) {
    return null
  }

  const raw = await readFile(credentialsPath, 'utf8')
  const parsed = JSON.parse(raw) as Partial<GoogleServiceAccount>

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS does not point to a valid service-account JSON file.'
    )
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
  } satisfies GoogleServiceAccount
}

function createGoogleJwt(serviceAccount: GoogleServiceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  const payload = {
    iss: serviceAccount.client_email,
    scope: GOOGLE_OAUTH_SCOPE,
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  const unsignedToken = `${encode(header)}.${encode(payload)}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsignedToken)
  signer.end()
  const signature = signer.sign(serviceAccount.private_key).toString('base64url')

  return `${unsignedToken}.${signature}`
}

async function getGoogleAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token
  }

  const serviceAccount = await loadGoogleServiceAccountCredentials()

  if (!serviceAccount) {
    throw new Error(
      'Missing Google Cloud TTS credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'
    )
  }

  const assertion = createGoogleJwt(serviceAccount)
  const response = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: GOOGLE_OAUTH_GRANT_TYPE,
      assertion,
    }),
  })

  const payload = (await response.json().catch(() => null)) as GoogleTokenResponse | null

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `Google OAuth token exchange failed: ${response.status} ${payload?.error_description || payload?.error || 'Unknown error.'}`
    )
  }

  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(0, (payload.expires_in ?? 3600) - 60) * 1000,
  }

  return cachedAccessToken.token
}

function createWavBufferFromPcm(pcmBuffer: Buffer) {
  const bytesPerSample = GEMINI_TTS_BITS_PER_SAMPLE / 8
  const dataSize = pcmBuffer.byteLength
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(GEMINI_TTS_CHANNELS, 22)
  header.writeUInt32LE(GEMINI_TTS_SAMPLE_RATE, 24)
  header.writeUInt32LE(GEMINI_TTS_SAMPLE_RATE * GEMINI_TTS_CHANNELS * bytesPerSample, 28)
  header.writeUInt16LE(GEMINI_TTS_CHANNELS * bytesPerSample, 32)
  header.writeUInt16LE(GEMINI_TTS_BITS_PER_SAMPLE, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmBuffer])
}

async function synthesizeSpeechWithGoogleCloud(params: { text: string }) {
  const accessToken = await getGoogleAccessToken()
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        text: params.text,
      },
      voice: {
        languageCode: DEFAULT_GOOGLE_TTS_LANGUAGE,
        name: DEFAULT_GOOGLE_TTS_VOICE,
      },
      audioConfig: {
        audioEncoding: GOOGLE_TTS_AUDIO_ENCODING,
        speakingRate: DEFAULT_TTS_SPEED,
      },
    }),
  })

  const payload = (await response.json().catch(() => null)) as GoogleTtsResponse | null

  if (!response.ok || !payload?.audioContent) {
    throw new Error(
      `Google Cloud TTS failed: ${response.status} ${payload?.error?.message || 'Empty audio response.'}`
    )
  }

  return {
    content_type: 'audio/mpeg',
    url: `data:audio/mpeg;base64,${payload.audioContent}`,
  }
}

async function synthesizeSpeechWithGemini(params: { text: string }) {
  const { text } = params
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_TTS_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': getGeminiApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read this exactly as a warm, encouraging K-5 learning companion. ${getGeminiPacingInstruction(DEFAULT_TTS_SPEED)}\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: DEFAULT_GEMINI_TTS_VOICE,
              },
            },
          },
        },
        model: DEFAULT_GEMINI_TTS_MODEL,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini TTS failed: ${response.status} ${errorText}`)
  }

  const payload = (await response.json()) as GeminiTtsResponse
  const audioPart = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)
  const pcmBase64 = audioPart?.inlineData?.data

  if (!pcmBase64) {
    throw new Error('Gemini TTS returned an empty audio payload.')
  }

  const pcmBuffer = Buffer.from(pcmBase64, 'base64')
  const wavBuffer = createWavBufferFromPcm(pcmBuffer)

  return {
    content_type: 'audio/wav',
    url: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
  }
}

export async function synthesizeSpeech(params: { turnId: string; text: string }) {
  void params.turnId

  if (getGoogleServiceAccountJson() || getGoogleCredentialsPath()) {
    return synthesizeSpeechWithGoogleCloud({ text: params.text })
  }

  return synthesizeSpeechWithGemini({ text: params.text })
}
