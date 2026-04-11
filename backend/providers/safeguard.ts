import type { SafeguardResult } from '@/shared/types'

const BLOCK_PATTERNS = [/hurt/i, /kill/i, /weapon/i, /suicide/i]
const BORDERLINE_PATTERNS = [/stupid/i, /hate/i, /violent/i]

export async function classifySafety(text: string): Promise<SafeguardResult> {
  if (BLOCK_PATTERNS.some((pattern) => pattern.test(text))) {
    return { label: 'BLOCK', reason: 'unsafe_request' }
  }

  if (BORDERLINE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { label: 'BORDERLINE', reason: 'needs_review' }
  }

  return { label: 'SAFE', reason: 'normal_child_query' }
}
