import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/config'
import {
  DEMO_ACCESS_COOKIE,
  hasValidDemoAccessToken,
  isDemoPasswordProtectionEnabled,
} from '@/lib/security/demo-password'

function isDemoProtectedPath(pathname: string) {
  if (pathname === '/pi' || pathname.startsWith('/pi/')) {
    return true
  }

  if (pathname.startsWith('/api/v1/demo/')) {
    return true
  }

  if (pathname.startsWith('/api/v1/audio/')) {
    return true
  }

  if (pathname.startsWith('/api/v1/devices/')) {
    return pathname.endsWith('/claim') || pathname.includes('/lesson')
  }

  return false
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isDemoPasswordProtectionEnabled() && isDemoProtectedPath(pathname)) {
    const allowlistedPath =
      pathname === '/demo-login' ||
      pathname === '/api/demo-login' ||
      pathname === '/auth/callback'

    if (!allowlistedPath) {
      const token = request.cookies.get(DEMO_ACCESS_COOKIE)?.value

      if (!hasValidDemoAccessToken(token)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Demo password required' }, { status: 401 })
        }

        const loginUrl = new URL('/demo-login', request.url)
        loginUrl.searchParams.set('next', `${pathname}${search}`)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  let supabaseUrl: string
  let supabaseKey: string
  try {
    ;({ supabaseUrl, supabaseKey } = getSupabaseEnv())
  } catch {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase auth timeout in proxy.')), 3000)
      }),
    ])
  } catch {
    // Local development should still render even if Supabase is unavailable.
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
