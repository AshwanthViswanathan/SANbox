import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

export async function proxy(request: NextRequest) {
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
