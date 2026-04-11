import fs from 'node:fs/promises'
import path from 'node:path'

import type { LessonListItem } from '@/shared/types'

const lessonsDir = path.join(process.cwd(), 'lessons')

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const lines = match[1].split('\n')
  const data: Record<string, string> = {}

  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    data[key] = value
  }

  return data
}

export async function loadLessons(): Promise<LessonListItem[]> {
  const entries = await fs.readdir(lessonsDir)
  const lessons: LessonListItem[] = []

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const fullPath = path.join(lessonsDir, entry)
    const raw = await fs.readFile(fullPath, 'utf8')
    const meta = parseFrontmatter(raw)

    if (!meta.lesson_id || !meta.title) continue

    lessons.push({
      lesson_id: meta.lesson_id,
      title: meta.title,
      grade_band: meta.grade_band ?? 'K-5',
      topic: meta.topic ?? 'general',
    })
  }

  return lessons
}

export async function loadLessonById(lessonId: string) {
  const entries = await fs.readdir(lessonsDir)

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const fullPath = path.join(lessonsDir, entry)
    const raw = await fs.readFile(fullPath, 'utf8')
    const meta = parseFrontmatter(raw)

    if (meta.lesson_id === lessonId) {
      return {
        meta,
        raw,
      }
    }
  }

  return null
}
