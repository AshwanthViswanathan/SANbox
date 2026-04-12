import { createHmac, timingSafeEqual } from 'node:crypto'

export const DEMO_ACCESS_COOKIE = 'teachbox_demo_access'

function getDemoPassword() {
  return process.env.DEMO_PASSWORD?.trim() ?? ''
}

function getDemoSecret() {
  const configured = process.env.DEMO_PASSWORD_SECRET?.trim()
  if (configured) {
    return configured
  }

  return getDemoPassword()
}

export function isDemoPasswordProtectionEnabled() {
  return Boolean(getDemoPassword())
}

export function createDemoAccessToken() {
  const password = getDemoPassword()
  const secret = getDemoSecret()

  if (!password || !secret) {
    return null
  }

  return createHmac('sha256', secret).update(`teachbox-demo:${password}`).digest('hex')
}

export function isValidDemoPassword(input: string) {
  const expected = getDemoPassword()
  return Boolean(expected) && input === expected
}

export function hasValidDemoAccessToken(token: string | undefined) {
  const expectedToken = createDemoAccessToken()
  if (!token || !expectedToken) {
    return false
  }

  const left = Buffer.from(token)
  const right = Buffer.from(expectedToken)

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

