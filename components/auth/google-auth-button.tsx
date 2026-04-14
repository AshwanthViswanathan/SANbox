'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { startGoogleAuth } from '@/lib/auth/google-auth'

type GoogleAuthButtonProps = {
  mode: 'login' | 'signup'
  nextPath?: string
  className?: string
}

export function GoogleAuthButton({ mode, nextPath = '/dashboard', className }: GoogleAuthButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleGoogleAuth() {
    try {
      setErrorMessage(null)
      setLoading(true)

      await startGoogleAuth(nextPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.'
      setErrorMessage(message)
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className={className ?? 'w-full gap-2'}
        onClick={handleGoogleAuth}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12.24 10.285v3.821h5.445c-.22 1.414-1.648 4.145-5.445 4.145-3.278 0-5.95-2.716-5.95-6.065s2.672-6.065 5.95-6.065c1.865 0 3.11.794 3.823 1.477l2.598-2.51C16.999 3.54 14.84 2.75 12.24 2.75 7.167 2.75 3.05 6.866 3.05 11.94s4.117 9.19 9.19 9.19c5.302 0 8.818-3.723 8.818-8.973 0-.602-.066-1.06-.147-1.872H12.24Z"
              />
            </svg>
            {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
          </>
        )}
      </Button>

      {errorMessage && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
