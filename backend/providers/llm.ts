import { z } from 'zod'

import {
  runGroqChatCompletion,
  type GroqChatMessage,
} from '@/backend/providers/groq'
import { buildCheckpointChoiceRuntime } from '@/backend/lessons/runtime'
import { ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS } from '@/backend/utils/assistant-prompt'
import { makeId } from '@/backend/utils/ids'
import type { InteractiveCheckpoint, LessonRuntime, TeachBoxMode } from '@/shared/types'

const DEFAULT_LLM_MODEL = process.env.TEACHBOX_LLM_MODEL ?? 'openai/gpt-oss-120b'

type RecentConversationTurn = {
  transcript: string
  assistantText: string
}

type ExampleToolName = 'generate_worked_math_example' | 'generate_concept_example'
type CheckpointToolName = 'create_checkpoint'

type ExampleToolArgs = {
  transcript: string
  explanation: string
  lessonTitle?: string | null
}

export type TeachingReplyPayload = {
  explanation: string
  example: string | null
  checkpoint: InteractiveCheckpoint | null
  checkpointRuntime: LessonRuntime | null
}

const assistantExampleToolSchema = z.object({
  name: z.enum(['generate_worked_math_example', 'generate_concept_example']),
})

const assistantCheckpointToolSchema = z.object({
  name: z.literal('create_checkpoint'),
  args: z
    .object({
      question: z.string().trim().min(1),
      choices: z.object({
        a: z.string().trim().min(1),
        b: z.string().trim().min(1),
        c: z.string().trim().min(1),
        d: z.string().trim().min(1),
      }),
      correct_choice: z.enum(['a', 'b', 'c', 'd']),
      explanation: z.string().trim().min(1),
      reason_for_check: z.string().trim().min(1).nullable().optional(),
    })
    .nullable()
    .optional(),
})

const assistantPayloadSchema = z.object({
  explanation: z.string().trim().min(1),
  exampleTool: assistantExampleToolSchema.nullable().optional(),
  checkpointTool: assistantCheckpointToolSchema.nullable().optional(),
})

const exampleToolArgsSchema = z.object({
  transcript: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  lessonTitle: z.string().trim().min(1).nullable().optional(),
})

function isLikelyMathQuestion(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  return (
    /[=+\-*/^]/.test(normalized) ||
    /\b(x|y|slope|equation|function|factor|simplify|solve|quadratic|polynomial|inequality|graph|log|algebra|root|square root|fraction)\b/.test(
      normalized
    )
  )
}

function shouldStronglyPreferExample(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return [
    'example',
    'worked example',
    'worked-out example',
    'walk me through',
    'explain',
    'how does',
    'how do',
    'why does',
    'why do',
    'what is',
    'what does',
    'show me',
    'give me an example',
    'for example',
    'solve',
    'equation',
    'function',
    'graph',
    'factor',
    'simplify',
    'quadratic',
    'slope',
    'polynomial',
    'log',
    'inequality',
    'triangle',
  ].some((phrase) => normalized.includes(phrase))
}

function shouldStronglyPreferCheckpoint(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return [
    'quiz',
    'test',
    'checkpoint',
    'multiple choice',
    'multiple-choice',
    'mcq',
    'practice quiz',
    'practice check',
    'check-in question',
    'knowledge check',
    'pop quiz',
    'quiz me',
    'test me',
    'check my understanding',
    'quick check',
    'practice question',
    'challenge question',
    'comprehension question',
    'review question',
    'check question',
    'one question',
    'with a question',
    'and a question',
    'let me try',
    'can i try',
    'ask me one',
    'ask me a question',
    'ask me one question',
    'give me one question',
    'give me a multiple choice question',
    'give me a multiple-choice question',
    'make me a question',
    'make me a quiz',
    'make a quiz',
    'give me a test',
    'practice mcq',
    'question me',
    'test my understanding',
    'check me',
    'see if i get it',
    'see if i got it',
  ].some((phrase) => normalized.includes(phrase))
}

function explicitlyRequestsExample(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  return [
    'example',
    'worked example',
    'worked-out example',
    'give me an example',
    'show me an example',
    'walk me through',
  ].some((phrase) => normalized.includes(phrase))
}

function explicitlyRequestsCheckpoint(transcript: string) {
  const normalized = transcript.trim().toLowerCase()

  return [
    'quiz',
    'test',
    'checkpoint',
    'multiple choice',
    'multiple-choice',
    'mcq',
    'practice quiz',
    'practice check',
    'check-in question',
    'knowledge check',
    'pop quiz',
    'quiz me',
    'test me',
    'check my understanding',
    'give me a checkpoint',
    'give me a quiz',
    'ask me a question',
    'ask me one question',
    'can you quiz me',
    'can you test me',
    'can you check my understanding',
    'let me try',
    'can i try',
    'let me answer',
    'give me a practice question',
    'give me a question',
    'give me one question',
    'give me a multiple choice question',
    'give me a multiple-choice question',
    'make me a question',
    'make me a quiz',
    'make a quiz',
    'give me a test',
    'practice mcq',
    'challenge question',
    'comprehension question',
    'review question',
    'check question',
    'question me',
    'test my understanding',
    'check me',
    'ask me one',
    'one question',
    'with a question',
    'and a question',
    'see if i get it',
    'see if i got it',
    'quick check',
    'checkpoint',
  ].some((phrase) => normalized.includes(phrase))
}

function extractJsonObject(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const withoutFences = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const firstBrace = withoutFences.indexOf('{')
  const lastBrace = withoutFences.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return withoutFences
  }

  return withoutFences.slice(firstBrace, lastBrace + 1)
}

function normalizeQuestionStyleText(value: string) {
  return value
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function separateQuestionSentences(value: string) {
  const segments =
    value
      .match(/[^?.!]+[?.!]?/g)
      ?.map((segment) => normalizeQuestionStyleText(segment))
      .filter(Boolean) ?? []

  const questionSegments = segments.filter((segment) => segment.includes('?'))
  const statementSegments = segments.filter((segment) => !segment.includes('?'))

  return {
    hasQuestion: questionSegments.length > 0,
    questionText: questionSegments.join(' ').trim(),
    statementText: statementSegments.join(' ').trim(),
  }
}

function looksLikeCheckpointLeak(value: string) {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return [
    'here is a question',
    'here is one',
    'try this',
    'solve this',
    'quick check',
    'which of these',
    'which one',
    'pick the correct',
    'choose the correct',
    'choose one',
    'answer this',
  ].some((phrase) => normalized.includes(phrase))
}

function normalizeCheckpointText(value: string) {
  return normalizeQuestionStyleText(value).replace(/\n{3,}/g, '\n\n')
}

function normalizeCheckpointPayload(checkpoint: InteractiveCheckpoint): InteractiveCheckpoint {
  return {
    ...checkpoint,
    prompt_text: normalizeCheckpointText(checkpoint.prompt_text),
    choices: {
      a: normalizeCheckpointText(checkpoint.choices.a),
      b: normalizeCheckpointText(checkpoint.choices.b),
      c: normalizeCheckpointText(checkpoint.choices.c),
      d: normalizeCheckpointText(checkpoint.choices.d),
    },
    explanation: checkpoint.explanation ? normalizeCheckpointText(checkpoint.explanation) : checkpoint.explanation,
    reason_for_check: checkpoint.reason_for_check
      ? normalizeCheckpointText(checkpoint.reason_for_check)
      : checkpoint.reason_for_check,
  }
}

function createCheckpointSummaryChoice(explanation: string) {
  const normalized = normalizeCheckpointText(explanation)
    .replace(/^here is a simple answer:\s*/i, '')
    .replace(/^the answer is:\s*/i, '')
    .trim()

  if (!normalized) {
    return 'It matches what SANbox just explained.'
  }

  const firstSentence =
    normalized.match(/[^.!?]+[.!?]?/)?.[0]?.trim() ??
    normalized

  const condensed = firstSentence.replace(/\s+/g, ' ').trim()
  return condensed.length <= 120 ? condensed : `${condensed.slice(0, 117).trimEnd()}...`
}

type CheckpointToolArgs = {
  question: string
  choices: {
    a: string
    b: string
    c: string
    d: string
  }
  correct_choice: 'a' | 'b' | 'c' | 'd'
  explanation: string
  reason_for_check?: string | null
}

type CheckpointValidationResult = {
  valid: boolean
  correct_choice: 'a' | 'b' | 'c' | 'd' | null
  reason: string
}

function buildDeterministicCheckpointCandidate(explanation: string): CheckpointToolArgs {
  return normalizeCheckpointCandidate({
    question: 'Which choice best matches what SANbox just taught?',
    choices: {
      a: createCheckpointSummaryChoice(explanation),
      b: 'It means the opposite of the idea SANbox explained.',
      c: 'It is about a totally different topic.',
      d: 'There was not enough information to answer.',
    },
    correct_choice: 'a',
    explanation: 'A is correct because it matches what SANbox just explained.',
    reason_for_check: 'The child asked for a quick check.',
  })
}

function checkpointArgsToInteractiveCheckpoint(args: CheckpointToolArgs): InteractiveCheckpoint {
  return normalizeCheckpointPayload({
    source: 'free_chat',
    checkpoint_id: makeId('chk'),
    prompt_text: args.question,
    choices: args.choices,
    correct_choice: args.correct_choice,
    explanation: args.explanation,
    reason_for_check: args.reason_for_check ?? null,
  })
}

function checkpointArgsToRuntime(args: CheckpointToolArgs): LessonRuntime {
  return buildCheckpointChoiceRuntime(args.question, args.choices)
}

function decodeJsonStringFragment(value: string) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function repairAssistantPayload(raw: string) {
  const repaired = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0,
    maxTokens: 320,
    purpose: 'assistant payload repair',
    messages: [
      {
        role: 'system',
        content:
          'Convert the following assistant draft into exactly one valid JSON object with this exact shape: {"explanation":"...","exampleTool":null,"checkpointTool":null}. Preserve any tool intent if present. "exampleTool" may be {"name":"generate_worked_math_example"} or {"name":"generate_concept_example"}. "checkpointTool" may be {"name":"create_checkpoint","args":{"question":"...","choices":{"a":"...","b":"...","c":"...","d":"..."},"correct_choice":"a","explanation":"...","reason_for_check":"..."}} or null. Return JSON only.',
      },
      {
        role: 'user',
        content: raw,
      },
    ],
  })

  return assistantPayloadSchema.parse(JSON.parse(extractJsonObject(repaired)))
}

async function parseAssistantPayload(
  content: string,
  fallbackExplanation: string
): Promise<{
  explanation: string
  exampleToolName: ExampleToolName | null
  checkpointTool: {
    name: CheckpointToolName
    args: CheckpointToolArgs | null
  } | null
}> {
  const normalizedContent = content.trim()

  try {
    const parsed = assistantPayloadSchema.parse(JSON.parse(extractJsonObject(content)))

    return {
      explanation: parsed.explanation,
      exampleToolName: parsed.exampleTool?.name ?? null,
      checkpointTool: parsed.checkpointTool
        ? {
            name: parsed.checkpointTool.name,
            args: parsed.checkpointTool.args ?? null,
          }
        : null,
    }
  } catch {
    const explanationMatch = normalizedContent.match(/"explanation"\s*:\s*"([\s\S]*?)"/)
    const exampleToolNameMatch = normalizedContent.match(
      /"exampleTool"\s*:\s*\{\s*"name"\s*:\s*"(generate_worked_math_example|generate_concept_example)"/
    )
    const checkpointToolNameMatch = normalizedContent.match(
      /"checkpointTool"\s*:\s*\{\s*"name"\s*:\s*"(create_checkpoint)"/
    )

    if (explanationMatch?.[1]?.trim()) {
      return {
        explanation: decodeJsonStringFragment(explanationMatch[1]),
        exampleToolName: (exampleToolNameMatch?.[1] as ExampleToolName | undefined) ?? null,
        checkpointTool: checkpointToolNameMatch?.[1]
          ? {
              name: checkpointToolNameMatch[1] as CheckpointToolName,
              args: null,
            }
          : null,
      }
    }

    if (normalizedContent.startsWith('{') || normalizedContent.includes('"explanation"')) {
      try {
        const repaired = await repairAssistantPayload(normalizedContent)

        return {
          explanation: repaired.explanation,
          exampleToolName: repaired.exampleTool?.name ?? null,
          checkpointTool: repaired.checkpointTool
            ? {
                name: repaired.checkpointTool.name,
                args: repaired.checkpointTool.args ?? null,
              }
            : null,
        }
      } catch {
        return {
          explanation: fallbackExplanation,
          exampleToolName: null,
          checkpointTool: null,
        }
      }
    }

    return {
      explanation: normalizedContent || fallbackExplanation,
      exampleToolName: null,
      checkpointTool: null,
    }
  }
}

const generatedCheckpointSchema = z.object({
  question: z.string().trim().min(1),
  choices: z.object({
    a: z.string().trim().min(1),
    b: z.string().trim().min(1),
    c: z.string().trim().min(1),
    d: z.string().trim().min(1),
  }),
  correct_choice: z.enum(['a', 'b', 'c', 'd']),
  explanation: z.string().trim().min(1),
  reason_for_check: z.string().trim().min(1).nullable().optional(),
})

const checkpointValidationResultSchema = z.object({
  valid: z.boolean(),
  correct_choice: z.enum(['a', 'b', 'c', 'd']).nullable(),
  reason: z.string().trim().min(1),
})

function normalizeCheckpointCandidate(candidate: CheckpointToolArgs): CheckpointToolArgs {
  return {
    question: normalizeCheckpointText(candidate.question),
    choices: {
      a: normalizeCheckpointText(candidate.choices.a),
      b: normalizeCheckpointText(candidate.choices.b),
      c: normalizeCheckpointText(candidate.choices.c),
      d: normalizeCheckpointText(candidate.choices.d),
    },
    correct_choice: candidate.correct_choice,
    explanation: normalizeCheckpointText(candidate.explanation),
    reason_for_check: candidate.reason_for_check
      ? normalizeCheckpointText(candidate.reason_for_check)
      : null,
  }
}

function passesDeterministicCheckpointChecks(candidate: CheckpointToolArgs) {
  const values = Object.values(candidate.choices).map((value) => value.trim().toLowerCase())
  const uniqueChoices = new Set(values)

  if (uniqueChoices.size !== 4) {
    return false
  }

  if (!candidate.question.trim() || !candidate.explanation.trim()) {
    return false
  }

  return true
}

async function validateCheckpointCandidate(
  candidate: CheckpointToolArgs
): Promise<CheckpointToolArgs | null> {
  const normalizedCandidate = normalizeCheckpointCandidate(candidate)

  if (!passesDeterministicCheckpointChecks(normalizedCandidate)) {
    return null
  }

  const raw = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0,
    maxTokens: 180,
    purpose: 'checkpoint validation',
    messages: [
      {
        role: 'system',
        content:
          'You validate a multiple-choice checkpoint. Determine whether exactly one option is actually correct based only on the question, the answer choices, and the explanation. Do not trust any provided answer key. Return raw JSON only with this exact shape: {"valid":true,"correct_choice":"a","reason":"..."} or {"valid":false,"correct_choice":null,"reason":"..."}. Mark valid false if the explanation does not clearly support exactly one option, if multiple options could be correct, or if the checkpoint is malformed.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          question: normalizedCandidate.question,
          choices: normalizedCandidate.choices,
          explanation: normalizedCandidate.explanation,
        }),
      },
    ],
  })

  const validation = checkpointValidationResultSchema.parse(
    JSON.parse(extractJsonObject(raw))
  ) satisfies CheckpointValidationResult

  if (!validation.valid || !validation.correct_choice) {
    return null
  }

  return {
    ...normalizedCandidate,
    correct_choice: validation.correct_choice,
  }
}

async function parseAndValidateCheckpointResponse(raw: string) {
  try {
    const parsed = generatedCheckpointSchema.parse(JSON.parse(extractJsonObject(raw)))
    return await validateCheckpointCandidate(parsed)
  } catch {
    try {
      const repaired = await repairCheckpointResponse(raw)
      if (repaired.success) {
        return await validateCheckpointCandidate(repaired.data)
      }
    } catch {
      // Fall through to labeled text parsing.
    }

    const parsedFromText = parseCheckpointFromLabeledText(raw)
    if (parsedFromText?.success) {
      return await validateCheckpointCandidate(parsedFromText.data)
    }

    return null
  }
}

function parseCheckpointFromLabeledText(raw: string) {
  const normalized = raw.replace(/\r\n/g, '\n').trim()
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const choices = {
    a: '',
    b: '',
    c: '',
    d: '',
  }

  for (const key of ['a', 'b', 'c', 'd'] as const) {
    const match = lines.find((line) => new RegExp(`^${key}[\\).:-]\\s+`, 'i').test(line))
    if (match) {
      choices[key] = match.replace(new RegExp(`^${key}[\\).:-]\\s+`, 'i'), '').trim()
    }
  }

  if (!choices.a || !choices.b || !choices.c || !choices.d) {
    return null
  }

  const promptLine =
    lines.find((line) => line.includes('?')) ??
    lines.find((line) => !/^[abcd][\).:-]\s+/i.test(line)) ??
    'Quick check: choose the best answer.'

  const correctMatch = normalized.match(/correct(?:_choice)?\s*[:=-]\s*([abcd])/i)
  const explanationMatch = normalized.match(/explanation\s*[:=-]\s*(.+)$/im)

  return generatedCheckpointSchema.safeParse({
    question: promptLine,
    choices,
    correct_choice: (correctMatch?.[1]?.toLowerCase() as 'a' | 'b' | 'c' | 'd') ?? 'a',
    explanation: explanationMatch?.[1]?.trim() || 'That is the best match for the idea SANbox explained.',
    reason_for_check: null,
  })
}

async function repairCheckpointResponse(raw: string) {
  const repaired = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0,
    maxTokens: 260,
    purpose: 'checkpoint repair',
    messages: [
      {
        role: 'system',
        content:
          'Convert the following checkpoint draft into exactly one valid JSON object with this shape: {"question":"...","choices":{"a":"...","b":"...","c":"...","d":"..."},"correct_choice":"a","explanation":"...","reason_for_check":"..."}. The question must be answerable by choosing A, B, C, or D only. Make exactly one answer correct. Return JSON only.',
      },
      {
        role: 'user',
        content: raw,
      },
    ],
  })

  return generatedCheckpointSchema.safeParse(JSON.parse(extractJsonObject(repaired)))
}

function buildExampleToolArgs(params: {
  transcript: string
  explanation: string
  lessonTitle?: string | null
}): ExampleToolArgs {
  const parsed = exampleToolArgsSchema.safeParse({
    transcript: params.transcript,
    explanation: params.explanation,
    lessonTitle: params.lessonTitle ?? null,
  })

  if (parsed.success) {
    return {
      transcript: parsed.data.transcript,
      explanation: parsed.data.explanation,
      lessonTitle: parsed.data.lessonTitle ?? null,
    }
  }

  return {
    transcript: params.transcript,
    explanation: params.explanation.trim(),
    lessonTitle: params.lessonTitle ?? null,
  }
}

async function generateWorkedMathExample(args: ExampleToolArgs) {
  return runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0.2,
    maxTokens: 900,
    purpose: 'worked math example',
    messages: [
      {
        role: 'system',
        content:
          'You write one fully worked-out, mathematically valid example problem that helps clarify an explanation. Use the actual math topic from the question. Do not use fantasy stories, gardens, magic, characters, or unrelated analogies. If there is an expression or equation, work directly with expressions or numbers. Show all steps clearly, one step per line without extra blank lines. Use standard LaTeX with $...$ for inline math or $$...$$ for full equations. Do not use \\(...\\). Keep the layout clean and compact on screen. Return only the example text with no labels or surrounding commentary.',
      },
      {
        role: 'system',
        content: args.lessonTitle
          ? `The child is currently in the lesson "${args.lessonTitle}". Keep the example aligned with that lesson.`
          : 'The child is in open question mode.',
      },
      {
        role: 'user',
        content: `Question: ${args.transcript}\nExplanation: ${args.explanation}\nWrite one fully worked-out example problem using the actual math in the question. Show all steps. Put each step on its own line without extra blank lines between them. Wrap math in $...$ or $$...$$.`,
      },
    ],
  })
}

async function generateConceptExample(args: ExampleToolArgs) {
  return runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0.3,
    maxTokens: 360,
    purpose: 'concept example',
    messages: [
      {
        role: 'system',
        content:
          'You write one short child-friendly example that helps clarify an explanation. Keep it concrete, directly relevant, and short. Do not use random fantasy analogies unless the child asked for one. Return only the example text with no labels, no markdown, and no surrounding commentary.',
      },
      {
        role: 'system',
        content: args.lessonTitle
          ? `The child is currently in the lesson "${args.lessonTitle}". Keep the example aligned with that lesson.`
          : 'The child is in open question mode.',
      },
      {
        role: 'user',
        content: `Question: ${args.transcript}\nExplanation: ${args.explanation}\nWrite one short example that would help a K-5 student understand this.`,
      },
    ],
  })
}

async function generateFreeChatCheckpoint(params: {
  transcript: string
  explanation: string
  recentTurns: RecentConversationTurn[]
}): Promise<{ checkpoint: InteractiveCheckpoint; checkpointRuntime: LessonRuntime } | null> {
  const conversationContext =
    params.recentTurns.length > 0
      ? params.recentTurns
          .slice(-3)
          .map(
            (turn, index) =>
              `Turn ${index + 1} child: ${turn.transcript}\nTurn ${index + 1} SANbox: ${turn.assistantText}`
          )
          .join('\n\n')
      : 'No recent conversation context.'

  const raw = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: 0.2,
    maxTokens: 320,
    purpose: 'free chat checkpoint',
    messages: [
      {
        role: 'system',
        content:
          'You create one short multiple-choice comprehension check for a K-5 child. Return raw JSON only with this exact shape: {"question":"...","choices":{"a":"...","b":"...","c":"...","d":"..."},"correct_choice":"a","explanation":"...","reason_for_check":"..."}. The checkpoint must test the concept that SANbox just explained. Do not introduce a new topic. The child-facing question must be answerable by choosing A, B, C, or D only. Do not ask open-ended or free-response questions. Do not ask the child to explain, describe, or tell you why. Keep all options short. Make exactly one answer correct. The correct_choice field must contain the letter (a, b, c, or d) of the actually correct option. The explanation must support the marked correct_choice. If the checkpoint includes math, use the same style as SANbox examples: standard LaTeX wrapped in $...$ for inline math or $$...$$ for display math. Do not emit bare x^2-style math when LaTeX is needed. Do not use markdown fences.',
      },
      {
        role: 'user',
        content: `Child question: ${params.transcript}\nSANbox explanation: ${params.explanation}\n\nRecent conversation:\n${conversationContext}\n\nCreate a short comprehension checkpoint for free chat.`,
      },
    ],
  })

  const validated = await parseAndValidateCheckpointResponse(raw)
  if (!validated) {
    return null
  }

  return {
    checkpoint: checkpointArgsToInteractiveCheckpoint(validated),
    checkpointRuntime: checkpointArgsToRuntime(validated),
  }
}

async function generateForcedFreeChatCheckpoint(params: {
  transcript: string
  explanation: string
  recentTurns: RecentConversationTurn[]
}): Promise<{ checkpoint: InteractiveCheckpoint; checkpointRuntime: LessonRuntime } | null> {
  const conversationContext =
    params.recentTurns.length > 0
      ? params.recentTurns
          .slice(-3)
          .map(
            (turn, index) =>
              `Turn ${index + 1} child: ${turn.transcript}\nTurn ${index + 1} SANbox: ${turn.assistantText}`
          )
          .join('\n\n')
      : 'No recent conversation context.'

  const attempts = [
    {
      temperature: 0.15,
      maxTokens: 420,
      purpose: 'forced free chat checkpoint',
      system:
        'You create one topic-specific multiple-choice checkpoint for a K-5 child. Return raw JSON only with this exact shape: {"question":"...","choices":{"a":"...","b":"...","c":"...","d":"..."},"correct_choice":"a","explanation":"...","reason_for_check":"..."}. The child explicitly asked for a question, quiz, checkpoint, or multiple-choice problem. You must create a real problem about the current topic, not a summary question and not a generic comprehension card. If the topic is math, create a concrete solvable math problem using actual numbers, expressions, or equations. Do not ask open-ended questions. Make exactly one answer correct. Keep choices concise. The explanation must justify the correct answer. Use lightweight LaTeX in $...$ or $$...$$ for math when useful. Do not use markdown fences.',
    },
    {
      temperature: 0,
      maxTokens: 460,
      purpose: 'forced free chat checkpoint retry',
      system:
        'Return one valid topic-specific multiple-choice checkpoint as raw JSON only: {"question":"...","choices":{"a":"...","b":"...","c":"...","d":"..."},"correct_choice":"a","explanation":"...","reason_for_check":"..."}. The child explicitly requested a question. This must be a real problem about the current topic. Never write a generic summary question like "Which choice best matches what SANbox taught?" If the topic is math, write a concrete solve-this problem with actual numbers or equations. Exactly one choice must be correct. No open-ended prompts. No markdown fences.',
    },
  ] as const

  for (const attempt of attempts) {
    const raw = await runGroqChatCompletion({
      model: DEFAULT_LLM_MODEL,
      temperature: attempt.temperature,
      maxTokens: attempt.maxTokens,
      purpose: attempt.purpose,
      messages: [
        {
          role: 'system',
          content: attempt.system,
        },
        {
          role: 'user',
          content: `Child request: ${params.transcript}\nSANbox explanation: ${params.explanation}\n\nRecent conversation:\n${conversationContext}\n\nCreate one real, topic-specific multiple-choice problem for the child right now.`,
        },
      ],
    })

    const validated = await parseAndValidateCheckpointResponse(raw)
    if (validated) {
      return {
        checkpoint: checkpointArgsToInteractiveCheckpoint(validated),
        checkpointRuntime: checkpointArgsToRuntime(validated),
      }
    }
  }

  return null
}

function createDeterministicCheckpointResult(explanation: string) {
  const candidate = buildDeterministicCheckpointCandidate(explanation)

  return {
    checkpoint: checkpointArgsToInteractiveCheckpoint(candidate),
    checkpointRuntime: checkpointArgsToRuntime(candidate),
  }
}

async function dispatchExampleTool(name: ExampleToolName, args: ExampleToolArgs) {
  if (name === 'generate_worked_math_example') {
    return generateWorkedMathExample(args)
  }

  return generateConceptExample(args)
}

function getTeachingFallback(
  transcript: string,
  mode: TeachBoxMode,
  lessonTitle?: string | null,
  safetyLabel?: 'SAFE' | 'BORDERLINE' | 'BLOCK'
): TeachingReplyPayload {
  const normalizedTranscript = normalizeQuestionStyleText(transcript.trim())

  if (safetyLabel === 'BORDERLINE') {
    return {
      explanation:
        'That is not a kind or appropriate way to talk. We should use respectful and safe words. If you want, I can help you ask that in a better way or we can learn about something else together.',
      example: null,
      checkpoint: null,
      checkpointRuntime: null,
    }
  }

  if (mode === 'lesson' && lessonTitle) {
    return {
      explanation: `We are working on ${lessonTitle}. Let's think about this together: ${normalizedTranscript}`,
      example: null,
      checkpoint: null,
      checkpointRuntime: null,
    }
  }

  return {
    explanation:
      `You asked about ${normalizedTranscript}. Here is a simple answer: sometimes things work the way they do because of patterns in nature, and we can figure them out step by step.`,
    example: null,
    checkpoint: null,
    checkpointRuntime: null,
  }
}

async function resolveAssistantWithOptionalTool(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
  recentTurns?: RecentConversationTurn[]
  messages: GroqChatMessage[]
  temperature: number
  maxTokens: number
  purpose: string
  fallbackExplanation: string
  forcedToolName?: ExampleToolName | null
  forcedCheckpointToolName?: CheckpointToolName | null
  explicitCheckpointRequest?: boolean
  checkpointEligible?: boolean
}) {
  const response = await runGroqChatCompletion({
    model: DEFAULT_LLM_MODEL,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    purpose: params.purpose,
    messages: params.messages,
  })

  const payload = await parseAssistantPayload(response, params.fallbackExplanation)
  const normalizedExplanation = normalizeQuestionStyleText(payload.explanation)
  const selectedToolName = params.forcedToolName ?? payload.exampleToolName
  const selectedCheckpointToolName =
    params.mode === 'free_chat'
      ? params.forcedCheckpointToolName ?? payload.checkpointTool?.name ?? null
      : null
  const explanationParts =
    params.mode === 'free_chat' ? separateQuestionSentences(normalizedExplanation) : null
  let example: string | null = null
  let checkpoint: InteractiveCheckpoint | null = null
  let checkpointRuntime: LessonRuntime | null = null

  if (selectedToolName) {
    const toolArgs = buildExampleToolArgs({
      transcript: params.transcript,
      explanation: payload.explanation,
      lessonTitle: params.lessonTitle ?? null,
    })

    try {
      example = (await dispatchExampleTool(selectedToolName, toolArgs)).trim() || null
    } catch {
      example = null
    }
  }

  if (selectedCheckpointToolName === 'create_checkpoint') {
    if (payload.checkpointTool?.args) {
      try {
        const validatedCheckpoint = await validateCheckpointCandidate(payload.checkpointTool.args)
        if (validatedCheckpoint) {
          checkpoint = checkpointArgsToInteractiveCheckpoint(validatedCheckpoint)
          checkpointRuntime = checkpointArgsToRuntime(validatedCheckpoint)
        }
      } catch {
        checkpoint = null
        checkpointRuntime = null
      }
    } else {
      try {
        const generatedCheckpoint =
          params.explicitCheckpointRequest
            ? await generateForcedFreeChatCheckpoint({
                transcript: params.transcript,
                explanation:
                  explanationParts?.statementText ||
                  explanationParts?.questionText ||
                  normalizedExplanation,
                recentTurns: params.recentTurns ?? [],
              })
            : await generateFreeChatCheckpoint({
                transcript: params.transcript,
                explanation:
                  explanationParts?.statementText ||
                  explanationParts?.questionText ||
                  normalizedExplanation,
                recentTurns: params.recentTurns ?? [],
              })
        checkpoint = generatedCheckpoint?.checkpoint ?? null
        checkpointRuntime = generatedCheckpoint?.checkpointRuntime ?? null
      } catch {
        checkpoint = null
        checkpointRuntime = null
      }
    }
  }

  const shouldBackfillCheckpoint =
    params.mode === 'free_chat' &&
    !checkpoint &&
    (
      Boolean(params.forcedCheckpointToolName) ||
      explanationParts?.hasQuestion ||
      looksLikeCheckpointLeak(normalizedExplanation)
    )

  if (shouldBackfillCheckpoint) {
    try {
      const generatedCheckpoint =
        params.explicitCheckpointRequest
          ? await generateForcedFreeChatCheckpoint({
              transcript: params.transcript,
              explanation:
                explanationParts?.statementText ||
                normalizedExplanation.replace(/\?/g, '.'),
              recentTurns: params.recentTurns ?? [],
            })
          : await generateFreeChatCheckpoint({
              transcript: params.transcript,
              explanation:
                explanationParts.statementText ||
                normalizedExplanation.replace(/\?/g, '.'),
              recentTurns: params.recentTurns ?? [],
            })
      checkpoint = generatedCheckpoint?.checkpoint ?? null
      checkpointRuntime = generatedCheckpoint?.checkpointRuntime ?? null
    } catch {
      checkpoint = null
      checkpointRuntime = null
    }
  }

  if (params.explicitCheckpointRequest && !checkpoint) {
    const deterministicExplanation =
      explanationParts?.statementText ||
      normalizedExplanation ||
      params.fallbackExplanation

    const deterministicCheckpoint = createDeterministicCheckpointResult(deterministicExplanation)
    checkpoint = deterministicCheckpoint.checkpoint
    checkpointRuntime = deterministicCheckpoint.checkpointRuntime
  }

  const finalExplanation = checkpoint
    ? ''
    : params.mode === 'free_chat' &&
        (explanationParts?.hasQuestion || looksLikeCheckpointLeak(normalizedExplanation))
      ? explanationParts?.statementText || normalizedExplanation.replace(/\?/g, '.')
      : normalizedExplanation

  return {
    explanation: finalExplanation,
    example,
    checkpoint,
    checkpointRuntime,
  }
}

export async function generateTeachingReply(params: {
  transcript: string
  mode: TeachBoxMode
  lessonTitle?: string | null
  recentTurns?: RecentConversationTurn[]
  inputSafety?: {
    label: 'SAFE' | 'BORDERLINE' | 'BLOCK'
    reason?: string | null
    category?: string | null
  }
  checkpointEligible?: boolean
}): Promise<TeachingReplyPayload> {
  const {
    transcript,
    mode,
    lessonTitle,
    recentTurns = [],
    inputSafety,
    checkpointEligible = false,
  } = params
  const explicitExampleRequest = explicitlyRequestsExample(transcript)
  const explicitCheckpointRequest = explicitlyRequestsCheckpoint(transcript)

  const lessonContext =
    mode === 'lesson' && lessonTitle
      ? `The child is currently in lesson mode for "${lessonTitle}". Tie the answer back to that lesson when useful.`
      : 'The child is in open question mode.'

  const safetyContext =
    inputSafety?.label === 'BORDERLINE'
      ? `The child's message was classified as BORDERLINE for reason "${inputSafety.reason ?? 'unspecified'}"${inputSafety.category ? ` and category "${inputSafety.category}"` : ''}. Do not answer the request normally. Briefly explain why the language or request is not okay, model a better or safer way to ask, and then redirect into a respectful learning direction. Keep the tone firm but teacher-like, not chatty.`
      : 'The child message was classified SAFE. Answer normally.'

  const conversationContext =
    recentTurns.length > 0
      ? 'Use the recent conversation to resolve follow-up questions like "that," "it," or "the cycle." Prefer the most recent turns when the topic is ambiguous.'
      : 'No recent conversation history is available. Treat this as a standalone question.'

  const conversationMessages: GroqChatMessage[] = recentTurns.flatMap((turn) => [
    {
      role: 'user' as const,
      content: turn.transcript,
    },
    {
      role: 'assistant' as const,
      content: turn.assistantText,
    },
  ])

  const forcedToolName = explicitExampleRequest
    ? isLikelyMathQuestion(transcript)
      ? 'generate_worked_math_example'
      : 'generate_concept_example'
    : null
  const strongCheckpointPreference = shouldStronglyPreferCheckpoint(transcript)
  const forcedCheckpointToolName =
    mode === 'free_chat' && (explicitCheckpointRequest || strongCheckpointPreference)
      ? 'create_checkpoint'
      : null

  if (
    mode === 'free_chat' &&
    explicitCheckpointRequest &&
    inputSafety?.label !== 'BORDERLINE'
  ) {
    const checkpointSeedExplanation =
      recentTurns.at(-1)?.assistantText?.trim() || transcript.trim()

    try {
      const generatedCheckpoint = await generateForcedFreeChatCheckpoint({
        transcript,
        explanation: checkpointSeedExplanation,
        recentTurns,
      })

      if (generatedCheckpoint) {
        return {
          explanation: '',
          example: null,
          checkpoint: generatedCheckpoint.checkpoint,
          checkpointRuntime: generatedCheckpoint.checkpointRuntime,
        }
      }
    } catch {
      // Fall through to the normal path and its explicit-checkpoint fallback behavior.
    }
  }

  try {
    return await resolveAssistantWithOptionalTool({
      transcript,
      mode,
      lessonTitle,
      temperature: 0.4,
      maxTokens: 700,
      purpose: 'main LLM response',
      fallbackExplanation: getTeachingFallback(
        transcript,
        mode,
        lessonTitle,
        inputSafety?.label
      ).explanation,
      forcedToolName,
      forcedCheckpointToolName,
      explicitCheckpointRequest,
      recentTurns,
      checkpointEligible,
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. Respond with short, warm, concrete explanations. Use plain language, avoid markdown, avoid lists unless needed, and keep answers easy to read aloud. For math, you may use lightweight LaTeX in $...$ or $$...$$ when it helps. Supported math includes fractions, exponents, subscripts, square roots and n-th roots, multiplication and division symbols, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable: no matrices, no long derivations, no obscure commands. If the child uses rude, sexual, threatening, or age-inappropriate language, respond like a calm teacher: explain briefly why it is not okay, encourage safer and more respectful wording, and redirect to a safe topic. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
        },
        ...(shouldStronglyPreferExample(transcript)
          ? [
              {
                role: 'system' as const,
                content:
                  'When a worked example or concrete illustration would materially improve understanding, set "exampleTool" in the JSON response instead of writing the example inline.',
              },
            ]
          : []),
        ...(mode === 'free_chat'
          ? [
              {
                role: 'system' as const,
                content:
                  'In free chat, "explanation" must only contain statements, never a question for the child to answer. Do not ask open-ended questions. Do not embed a quiz, practice question, or A/B/C/D options inside "explanation". If you want to check understanding or ask the child anything at all, you must set "checkpointTool" to {"name":"create_checkpoint"} and include it in the current response JSON so it renders immediately. Never defer a checkpoint to a later turn. If the child explicitly asks to be quizzed, tested, checked, or asked a question, you must set "checkpointTool".',
              },
              ...(strongCheckpointPreference
                ? [
                    {
                      role: 'system' as const,
                      content:
                        'A checkpoint is especially helpful for this request. Strongly prefer setting "checkpointTool" instead of only explaining. If the child asked for a question, quick check, quiz, or a chance to try one, prefer "checkpointTool".',
                    },
                  ]
                : []),
            ]
          : []),
        {
          role: 'system',
          content: lessonContext,
        },
        {
          role: 'system',
          content: safetyContext,
        },
        {
          role: 'system',
          content: conversationContext,
        },
        ...conversationMessages,
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    const fallback = getTeachingFallback(
      transcript,
      mode,
      lessonTitle,
      inputSafety?.label
    )
    let checkpoint: InteractiveCheckpoint | null = null
    let checkpointRuntime: LessonRuntime | null = null

    if (mode === 'free_chat' && explicitCheckpointRequest) {
      try {
        const generatedCheckpoint = await generateForcedFreeChatCheckpoint({
          transcript,
          explanation: normalizeQuestionStyleText(fallback.explanation),
          recentTurns,
        })
        checkpoint = generatedCheckpoint?.checkpoint ?? null
        checkpointRuntime = generatedCheckpoint?.checkpointRuntime ?? null
      } catch {
        checkpoint = null
        checkpointRuntime = null
      }

      if (!checkpoint) {
        const deterministicCheckpoint = createDeterministicCheckpointResult(
          normalizeQuestionStyleText(fallback.explanation)
        )
        checkpoint = deterministicCheckpoint.checkpoint
        checkpointRuntime = deterministicCheckpoint.checkpointRuntime
      }
    }

    return {
      ...fallback,
      explanation: checkpoint ? '' : fallback.explanation,
      checkpoint,
      checkpointRuntime,
    }
  }
}

export async function generateLessonPauseReply(params: {
  transcript: string
  lessonTitle: string
  stepTitle: string
  stepPrompt: string
  teacherNote?: string | null
}): Promise<TeachingReplyPayload> {
  const { transcript, lessonTitle, stepTitle, stepPrompt, teacherNote } = params
  const explicitExampleRequest = explicitlyRequestsExample(transcript)
  const forcedToolName = explicitExampleRequest
    ? isLikelyMathQuestion(transcript)
      ? 'generate_worked_math_example'
      : 'generate_concept_example'
    : null

  try {
    return await resolveAssistantWithOptionalTool({
      transcript,
      mode: 'lesson',
      lessonTitle,
      temperature: 0.3,
      maxTokens: 420,
      purpose: 'lesson pause reply',
      fallbackExplanation: `That is a good question. The main idea here is ${stepPrompt.toLowerCase()}`,
      forcedToolName,
      messages: [
        {
          role: 'system',
          content:
            `You are SANbox, a voice-first AI learning companion for K-5 students. You are inside a scripted lesson. Answer the child's follow-up question briefly, clearly, and only about the current lesson concept. Do not open a new topic. Do not ask multiple follow-up questions. Do not change the lesson plan. Keep the reply short enough to read aloud comfortably. For math, you may use lightweight LaTeX in $...$ when it helps, including fractions, exponents, subscripts, roots, inequalities, common Greek letters, trig functions, logs, infinity, arrows, and simple set notation. Keep the LaTeX minimal and readable. ${ASSISTANT_RESPONSE_FORMAT_INSTRUCTIONS}`,
        },
        {
          role: 'system',
          content: `Current lesson: "${lessonTitle}". Current pause point: "${stepTitle}". Pause prompt: "${stepPrompt}".`,
        },
        ...(teacherNote
          ? [
              {
                role: 'system' as const,
                content: `Teacher note: ${teacherNote}`,
              },
            ]
          : []),
        ...(shouldStronglyPreferExample(transcript)
          ? [
              {
                role: 'system' as const,
                content:
                  'When a worked example or concrete illustration would materially improve understanding, set "exampleTool" in the JSON response instead of writing the example inline.',
              },
            ]
          : []),
        {
          role: 'user',
          content: transcript,
        },
      ],
    })
  } catch {
    return {
      explanation: `That is a good question. The main idea here is ${stepPrompt.toLowerCase()}`,
      example: null,
      checkpoint: null,
      checkpointRuntime: null,
    }
  }
}
