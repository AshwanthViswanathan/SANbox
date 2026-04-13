import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

const AUTH_NEXT_COOKIE = 'sanbox_auth_next'

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=')
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='))
    }
  }

  return null
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieNext = readCookie(request.headers.get('cookie'), AUTH_NEXT_COOKIE)
  const next = requestUrl.searchParams.get('next') ?? cookieNext ?? '/dashboard'
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_callback', origin))
  }

  const response = NextResponse.redirect(new URL(next, origin))
  response.cookies.set(AUTH_NEXT_COOKIE, '', {
    path: '/',
    expires: new Date(0),
  })
  return response
}
