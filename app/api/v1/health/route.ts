import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sanbox-backend',
    time: new Date().toISOString(),
    providers: {
      groq: Boolean(process.env.GROQ_API_KEY),
      supabase_admin: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      google_tts: Boolean(
        process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          process.env.GOOGLE_CLOUD_API_KEY
      ),
    },
  })
}
