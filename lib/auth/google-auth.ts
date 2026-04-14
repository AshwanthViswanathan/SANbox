'use client'

import { createClient } from '@/lib/supabase/client'

const AUTH_NEXT_COOKIE = 'sanbox_auth_next'

export async function startGoogleAuth(nextPath = '/dashboard') {
  const supabase = createClient()
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(nextPath)}; path=/; max-age=600; samesite=lax`
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw error
  }
}
