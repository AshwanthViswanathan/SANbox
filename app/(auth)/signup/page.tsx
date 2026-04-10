'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

import { GoogleAuthButton } from '@/components/auth/google-auth-button'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(0.12 0.01 240) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.12 0.01 240) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-lg">Agentic</span>
          </Link>
        </div>

        <div className="panel p-7 shadow-lg shadow-foreground/5">
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Start building your agentic AI project with Google OAuth.
          </p>

          <GoogleAuthButton mode="signup" />

          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            By signing up you agree to the{' '}
            <span className="underline underline-offset-2 cursor-pointer hover:opacity-80">Terms of Service</span>.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-2 hover:opacity-80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
