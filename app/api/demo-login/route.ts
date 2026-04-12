import { NextResponse } from 'next/server'

import {
  createDemoAccessToken,
  DEMO_ACCESS_COOKIE,
  isDemoPasswordProtectionEnabled,
  isValidDemoPassword,
} from '@/lib/security/demo-password'

export async function POST(request: Request) {
  if (!isDemoPasswordProtectionEnabled()) {
    return NextResponse.json({ error: 'Demo password protection is not enabled.' }, { status: 400 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  let password = ''
  let next = '/dashboard'
  let wantsJson = false

  if (contentType.includes('application/json')) {
    wantsJson = true
    const body = (await request.json().catch(() => null)) as
      | { password?: string; next?: string }
      | null
    password = body?.password?.trim() ?? ''
    next = normalizeNextPath(body?.next)
  } else {
    const formData = await request.formData().catch(() => null)
    password = String(formData?.get('password') ?? '').trim()
    next = normalizeNextPath(String(formData?.get('next') ?? ''))
  }

  if (!isValidDemoPassword(password)) {
    if (wantsJson) {
      return NextResponse.json({ error: 'Invalid demo password.' }, { status: 401 })
    }

    const loginUrl = new URL('/demo-login', request.url)
    loginUrl.searchParams.set('next', next)
    loginUrl.searchParams.set('error', 'invalid_password')
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  const token = createDemoAccessToken()
  if (!token) {
    return NextResponse.json({ error: 'Demo password protection is misconfigured.' }, { status: 500 })
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 })
  response.cookies.set({
    name: DEMO_ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}

function normalizeNextPath(input: string | undefined) {
  if (!input || !input.startsWith('/')) {
    return '/dashboard'
  }

  if (input.startsWith('//')) {
    return '/dashboard'
  }

  return input
}
