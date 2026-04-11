import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'teachbox-backend',
    time: new Date().toISOString(),
    providers: {
      groq: Boolean(process.env.GROQ_API_KEY),
      google_tts: Boolean(
        process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          process.env.GOOGLE_CLOUD_API_KEY
      ),
    },
  })
}
