import { z } from 'zod'

import { COSMO_STATES, SAFEGUARD_LABELS, TEACHBOX_MODES } from '@/shared/constants'

export const cosmoStateSchema = z.enum(COSMO_STATES)
export const teachBoxModeSchema = z.enum(TEACHBOX_MODES)
export const safeguardLabelSchema = z.enum(SAFEGUARD_LABELS)

export const safeguardResultSchema = z.object({
  label: safeguardLabelSchema,
  reason: z.string(),
})

export const audioDescriptorSchema = z.object({
  content_type: z.string(),
  url: z.string(),
})

export const lessonPointerSchema = z.object({
  lesson_id: z.string(),
  step_id: z.string(),
  title: z.string(),
})

export const sessionTurnResponseSchema = z.object({
  turn_id: z.string(),
  session_id: z.string(),
  device_id: z.string(),
  mode: teachBoxModeSchema,
  cosmo_state: cosmoStateSchema,
  transcript: z.string(),
  input_safeguard: safeguardResultSchema.nullable(),
  assistant: z.object({
    text: z.string(),
    blocked: z.boolean(),
  }),
  output_safeguard: safeguardResultSchema.nullable(),
  audio: audioDescriptorSchema.nullable(),
  lesson: lessonPointerSchema.nullable().optional(),
  debug: z
    .object({
      timings_ms: z.record(z.string(), z.number()),
    })
    .optional(),
})

export const lessonListItemSchema = z.object({
  lesson_id: z.string(),
  title: z.string(),
  grade_band: z.string(),
  topic: z.string(),
})

export const lessonsResponseSchema = z.object({
  lessons: z.array(lessonListItemSchema),
})

export const parentSessionSummarySchema = z.object({
  session_id: z.string(),
  device_id: z.string(),
  started_at: z.string(),
  last_turn_at: z.string(),
  mode: teachBoxModeSchema,
  turn_count: z.number(),
  flagged_count: z.number(),
})

export const parentSessionsResponseSchema = z.object({
  sessions: z.array(parentSessionSummarySchema),
})

export const parentSessionTurnSchema = z.object({
  turn_id: z.string(),
  created_at: z.string(),
  transcript: z.string(),
  assistant_text: z.string(),
  input_label: safeguardLabelSchema,
  output_label: safeguardLabelSchema.nullable(),
  blocked: z.boolean(),
})

export const parentSessionDetailResponseSchema = z.object({
  session: z.object({
    session_id: z.string(),
    device_id: z.string(),
    mode: teachBoxModeSchema,
    lesson_id: z.string().nullable().optional(),
  }),
  turns: z.array(parentSessionTurnSchema),
})

export const parentDeviceControlStateSchema = z.object({
  device: z.enum(['active', 'paused', 'off']),
  microphone: z.enum(['on', 'off']),
  speaker: z.enum(['on', 'off']),
})

export const parentDeviceControlResponseSchema = z.object({
  device_id: z.string(),
  controls: parentDeviceControlStateSchema,
  updated_at: z.string(),
})

export const parentDeviceControlRequestSchema = z.object({
  controls: parentDeviceControlStateSchema,
})

export type CosmoState = z.infer<typeof cosmoStateSchema>
export type TeachBoxMode = z.infer<typeof teachBoxModeSchema>
export type SafeguardLabel = z.infer<typeof safeguardLabelSchema>
export type SafeguardResult = z.infer<typeof safeguardResultSchema>
export type SessionTurnResponse = z.infer<typeof sessionTurnResponseSchema>
export type LessonListItem = z.infer<typeof lessonListItemSchema>
export type LessonsResponse = z.infer<typeof lessonsResponseSchema>
export type ParentSessionsResponse = z.infer<typeof parentSessionsResponseSchema>
export type ParentSessionDetailResponse = z.infer<typeof parentSessionDetailResponseSchema>
export type ParentDeviceControlState = z.infer<typeof parentDeviceControlStateSchema>
export type ParentDeviceControlResponse = z.infer<typeof parentDeviceControlResponseSchema>
export type ParentDeviceControlRequest = z.infer<typeof parentDeviceControlRequestSchema>
