const DEFAULT_TTS_MODEL = process.env.TEACHBOX_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts'
const DEFAULT_TTS_VOICE = process.env.TEACHBOX_TTS_VOICE_NAME ?? 'Kore'
const GEMINI_TTS_SAMPLE_RATE = 24000
const GEMINI_TTS_CHANNELS = 1
const GEMINI_TTS_BITS_PER_SAMPLE = 16

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

export async function synthesizeSpeech(params: { turnId: string; text: string }) {
  const { text } = params
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_TTS_MODEL}:generateContent`,
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
              text: `Read this exactly as a warm, encouraging K-5 learning companion. Keep the pacing calm and friendly.\n\n${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: process.env.TEACHBOX_TTS_VOICE_NAME ?? DEFAULT_TTS_VOICE,
            },
          },
        },
      },
      model: DEFAULT_TTS_MODEL,
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
