'use client'

import Link from 'next/link'
import Image from 'next/image'

import { GoogleAuthButton } from '@/components/auth/google-auth-button'

export default function LoginPage() {
  return (
    <div className="stitch-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-3 font-semibold text-foreground">
            <Image src="/sans-faces/San-Normal-Thinking-Listening.svg" alt="SANbox Logo" width={44} height={44} className="object-contain" />
            <span className="font-beach-display text-2xl">SANbox</span>
          </Link>
        </div>

        <div className="stitch-panel p-8">
          <p className="stitch-label mb-3 text-tertiary">Parent access</p>
          <h1 className="stitch-heading mb-2 text-3xl">Sign in</h1>
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Access the SANbox parent dashboard with Google OAuth.
          </p>

          <GoogleAuthButton mode="login" />

          <div className="mt-5 rounded-[1.5rem] bg-surface-container-low px-4 py-4 text-xs leading-5 text-muted-foreground">
            Supabase will redirect back to <code className="font-mono">/auth/callback</code> and then into the
            dashboard.
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-foreground underline underline-offset-2 hover:opacity-80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
