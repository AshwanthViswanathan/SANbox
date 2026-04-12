'use client'

import Link from 'next/link'
import { Anchor } from 'lucide-react'

import { GoogleAuthButton } from '@/components/auth/google-auth-button'

export default function SignupPage() {
  return (
    <div className="stitch-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-3 font-semibold text-foreground">
            <span className="flex h-11 w-11 items-center justify-center rounded-full coastal-gradient text-white shadow-lg shadow-primary/20">
              <Anchor className="w-5 h-5" />
            </span>
            <span className="font-beach-display text-2xl">SANbox</span>
          </Link>
        </div>

        <div className="stitch-panel p-8">
          <p className="stitch-label mb-3 text-tertiary">Family setup</p>
          <h1 className="stitch-heading mb-2 text-3xl">Create account</h1>
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Create a SANbox parent dashboard account with Google OAuth.
          </p>

          <GoogleAuthButton mode="signup" />

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By signing up you agree to the{' '}
            <span className="underline underline-offset-2 cursor-pointer hover:opacity-80">Terms of Service</span>.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-2 hover:opacity-80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
