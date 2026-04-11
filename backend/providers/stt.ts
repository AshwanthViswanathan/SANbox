export async function transcribeAudio(audio: File, transcriptOverride?: string) {
  if (transcriptOverride?.trim()) {
    return transcriptOverride.trim()
  }

  return `Audio received (${audio.name || 'recording'})`
}
