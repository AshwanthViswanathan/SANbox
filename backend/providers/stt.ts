import { runGroqTranscription } from '@/backend/providers/groq'

const DEFAULT_STT_MODEL = process.env.TEACHBOX_STT_MODEL ?? 'whisper-large-v3-turbo'
const DEFAULT_STT_PROMPT =
  process.env.TEACHBOX_STT_PROMPT ??
  'Important names and spellings: San, SANbox. Use those exact spellings when they are spoken.'

export async function transcribeAudio(audio: File, transcriptOverride?: string) {
  if (transcriptOverride?.trim()) {
    return transcriptOverride.trim()
  }

  return runGroqTranscription(audio, DEFAULT_STT_MODEL, DEFAULT_STT_PROMPT)
}
