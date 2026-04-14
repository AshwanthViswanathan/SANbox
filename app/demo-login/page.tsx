import Image from 'next/image'

export default async function DemoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = normalizeNextPath(params.next)
  const hasError = params.error === 'invalid_password'

  return (
    <div className="stitch-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 font-semibold text-foreground">
            <Image
              src="/sans-faces/San-Normal-Thinking-Listening.svg"
              alt="SANbox Logo"
              width={44}
              height={44}
              className="object-contain"
            />
            <span className="font-beach-display text-2xl">SANbox</span>
          </div>
        </div>

        <div className="stitch-panel p-8">
          <p className="stitch-label mb-3 text-tertiary">Demo access</p>
          <h1 className="stitch-heading mb-2 text-3xl">Enter password</h1>
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            This temporary deployment is protected with a shared password.
          </p>

          <form action="/api/demo-login" method="post" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                name="password"
                required
                autoFocus
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </label>

            {hasError ? (
              <div className="rounded-[1.25rem] bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Incorrect password.
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Continue
            </button>
          </form>

          <div className="mt-5 rounded-[1.5rem] bg-surface-container-low px-4 py-4 text-xs leading-5 text-muted-foreground">
            After the password gate, the normal app auth flow still applies.
          </div>
        </div>
      </div>
    </div>
  )
}

function normalizeNextPath(input: string | undefined) {
  if (!input || !input.startsWith('/')) {
    return '/pi'
  }

  if (input.startsWith('//')) {
    return '/pi'
  }

  return input
}
