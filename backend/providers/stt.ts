import { runGroqTranscription } from '@/backend/providers/groq'

const DEFAULT_STT_MODEL = process.env.TEACHBOX_STT_MODEL ?? 'whisper-large-v3-turbo'

export async function transcribeAudio(audio: File, transcriptOverride?: string) {
  if (transcriptOverride?.trim()) {
    return transcriptOverride.trim()
  }

  return runGroqTranscription(audio, DEFAULT_STT_MODEL)
}
