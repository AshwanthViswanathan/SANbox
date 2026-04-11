import type { TeachBoxMode } from '@/shared/types'

export async function generateTeachingReply(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
}) {
  const { transcript, mode, lessonTitle } = params

  if (mode === 'lesson' && lessonTitle) {
    return `Lesson mode: ${lessonTitle}. Let's think about this together. ${transcript}`
  }

  return `Here is a kid-friendly answer: ${transcript}`
}
