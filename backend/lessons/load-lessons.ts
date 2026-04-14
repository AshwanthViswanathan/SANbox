import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import type { LessonListItem } from '@/shared/types'

const lessonsDir = path.join(process.cwd(), 'lessons')

const lessonMetaSchema = z.object({
  lesson_id: z.string().min(1),
  title: z.string().min(1),
  grade_band: z.string().default('K-5'),
  topic: z.string().default('general'),
  estimated_minutes: z.coerce.number().int().positive().default(5),
  version: z.coerce.number().int().positive().default(1),
})

const lessonChoiceSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  c: z.string().min(1),
  d: z.string().min(1),
})

const narrationStepSchema = z.object({
  step_id: z.string().min(1),
  type: z.literal('narration'),
  title: z.string().min(1),
  script_chunks: z.array(z.string().min(1)).min(1),
})

const pauseStepSchema = z.object({
  step_id: z.string().min(1),
  type: z.literal('pause'),
  title: z.string().min(1),
  child_prompt: z.string().min(1),
  allowed_followups: z.coerce.number().int().min(1).max(2).default(2),
  resume_line: z.string().min(1),
  teacher_note: z.string().optional(),
})

const checkpointStepSchema = z.object({
  step_id: z.string().min(1),
  type: z.literal('checkpoint_mcq'),
  title: z.string().min(1),
  question: z.string().min(1),
  choices: lessonChoiceSchema,
  correct_choice: z.enum(['a', 'b', 'c', 'd']),
  correct_response: z.string().min(1),
  incorrect_response: z.string().min(1),
  hint: z.string().optional(),
  retry_limit: z.coerce.number().int().min(1).max(4).default(2),
})

const completionStepSchema = z.object({
  step_id: z.string().min(1),
  type: z.literal('completion'),
  title: z.string().min(1),
  closing_message: z.string().min(1),
  celebration_line: z.string().optional(),
})

const lessonStepSchema = z.discriminatedUnion('type', [
  narrationStepSchema,
  pauseStepSchema,
  checkpointStepSchema,
  completionStepSchema,
])

export type TeachBoxLessonMeta = z.infer<typeof lessonMetaSchema>
export type TeachBoxLessonStep = z.infer<typeof lessonStepSchema>
export type TeachBoxParsedLesson = {
  meta: TeachBoxLessonMeta
  steps: TeachBoxLessonStep[]
  raw: string
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---/
const TEACHBOX_STEP_PATTERN = /```teachbox-step\s*?\r?\n([\s\S]*?)\r?\n```/g

function normalizeChoiceText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function validateLessonCheckpointStep(step: z.infer<typeof checkpointStepSchema>) {
  const normalizedChoices = {
    a: normalizeChoiceText(step.choices.a),
    b: normalizeChoiceText(step.choices.b),
    c: normalizeChoiceText(step.choices.c),
    d: normalizeChoiceText(step.choices.d),
  }

  const uniqueChoices = new Set(Object.values(normalizedChoices))
  if (uniqueChoices.size !== 4) {
    throw new Error(`Lesson checkpoint "${step.step_id}" must have four distinct answer choices.`)
  }

  const correctValue = normalizedChoices[step.correct_choice]
  const distractorValues = (['a', 'b', 'c', 'd'] as const)
    .filter((choice) => choice !== step.correct_choice)
    .map((choice) => normalizedChoices[choice])

  if (distractorValues.includes(correctValue)) {
    throw new Error(
      `Lesson checkpoint "${step.step_id}" must not repeat the correct answer text in another choice.`
    )
  }
}

function parseFrontmatter(raw: string) {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return {}

  const lines = match[1].split(/\r?\n/)
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

function parseTeachboxStepBlocks(raw: string) {
  const blocks = [...raw.matchAll(TEACHBOX_STEP_PATTERN)].map((match) => match[1].trim())

  const steps = blocks.map((block, index) => {
    try {
      return lessonStepSchema.parse(JSON.parse(block))
    } catch (error) {
      throw new Error(
        `Invalid teachbox-step block ${index + 1}: ${
          error instanceof Error ? error.message : 'Unknown parsing error.'
        }`
      )
    }
  })

  if (steps.length === 0) {
    throw new Error('Lesson markdown must include at least one ```teachbox-step``` block.')
  }

  const stepIds = new Set<string>()
  for (const step of steps) {
    if (stepIds.has(step.step_id)) {
      throw new Error(`Duplicate lesson step_id: ${step.step_id}`)
    }

    stepIds.add(step.step_id)

    if (step.type === 'checkpoint_mcq') {
      validateLessonCheckpointStep(step)
    }
  }

  const completionCount = steps.filter((step) => step.type === 'completion').length
  if (completionCount !== 1) {
    throw new Error('Lesson markdown must include exactly one completion step.')
  }

  if (steps[steps.length - 1]?.type !== 'completion') {
    throw new Error('The final lesson step must be a completion step.')
  }

  return steps
}

function parseLesson(raw: string): TeachBoxParsedLesson {
  const meta = lessonMetaSchema.parse(parseFrontmatter(raw))
  const steps = parseTeachboxStepBlocks(raw)

  return {
    meta,
    steps,
    raw,
  }
}

export async function loadLessons(): Promise<LessonListItem[]> {
  const entries = await fs.readdir(lessonsDir)
  const lessons: LessonListItem[] = []

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const fullPath = path.join(lessonsDir, entry)
    const raw = await fs.readFile(fullPath, 'utf8')
    const parsedLesson = parseLesson(raw)

    lessons.push({
      lesson_id: parsedLesson.meta.lesson_id,
      title: parsedLesson.meta.title,
      grade_band: parsedLesson.meta.grade_band,
      topic: parsedLesson.meta.topic,
    })
  }

  return lessons
}

export async function loadLessonById(lessonId: string): Promise<TeachBoxParsedLesson | null> {
  const entries = await fs.readdir(lessonsDir)

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const fullPath = path.join(lessonsDir, entry)
    const raw = await fs.readFile(fullPath, 'utf8')
    const meta = lessonMetaSchema.parse(parseFrontmatter(raw))

    if (meta.lesson_id === lessonId) {
      return parseLesson(raw)
    }
  }

  return null
}
