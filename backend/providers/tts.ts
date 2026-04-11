export async function synthesizeSpeech(params: { turnId: string }) {
  const { turnId } = params

  return {
    content_type: 'audio/mpeg',
    url: `/api/v1/audio/${turnId}.mp3`,
  }
}
