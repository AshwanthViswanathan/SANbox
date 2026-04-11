export async function synthesizeSpeech(params: { turnId: string }) {
  const { turnId } = params

  return {
    content_type: 'audio/wav',
    url: `/api/v1/audio/${turnId}.wav`,
  }
}
