import { NextResponse } from 'next/server'

function createSilentWav(durationMs: number) {
  const sampleRate = 16000
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const numSamples = Math.floor((sampleRate * durationMs) / 1000)
  const dataSize = numSamples * numChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
  view.setUint16(32, numChannels * bytesPerSample, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  return Buffer.from(buffer)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await context.params
  const body = createSilentWav(900)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'Content-Length': String(body.byteLength),
    },
  })
}
