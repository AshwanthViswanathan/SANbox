# TeachBox Lesson Markdown Standard

TeachBox lessons are markdown files with frontmatter plus one or more structured `teachbox-step` blocks.

This format is intentionally strict. The backend, not the LLM, owns lesson progression.

## Goals

- Lessons stay editable as markdown files.
- The backend can parse them deterministically.
- The LLM only helps during pause-point questions.
- Checkpoints are explicit and keyboard-driven.
- Long narration is chunked so the Pi does not need to handle giant monologues in one response.

## File Layout

Each lesson file must include:

1. Frontmatter
2. Optional human-readable markdown notes
3. One or more fenced `teachbox-step` JSON blocks

Example:

```md
---
lesson_id: plant-growth
title: Can Plants Grow Without Sunlight?
grade_band: 3-5
topic: biology
estimated_minutes: 5
version: 1
---

# Optional Author Notes

This text is ignored by the parser. It exists only for humans.

```teachbox-step
{
  "step_id": "intro-1",
  "type": "narration",
  "title": "Plants need light",
  "script_chunks": [
    "Plants use sunlight to make food in their leaves.",
    "Without enough light, many plants grow slowly and look pale."
  ]
}
```
```

## Frontmatter Fields

Required:

- `lesson_id`
- `title`

Optional but recommended:

- `grade_band`
- `topic`
- `estimated_minutes`
- `version`

## Step Types

Allowed step types:

- `narration`
- `pause`
- `checkpoint_mcq`
- `completion`

Rules:

- Every lesson must include at least one `teachbox-step` block.
- Every `step_id` must be unique.
- Every lesson must include exactly one `completion` step.
- The final step must be the `completion` step.

## Narration Step

Use `narration` for scripted teaching content.

Required fields:

- `step_id`
- `type: "narration"`
- `title`
- `script_chunks`

Example:

```teachbox-step
{
  "step_id": "intro-1",
  "type": "narration",
  "title": "Plants use sunlight",
  "script_chunks": [
    "Plants use sunlight to make food in their leaves.",
    "That food gives the plant energy to grow."
  ]
}
```

Authoring guidance:

- Keep each chunk short enough for one clean spoken response.
- Use multiple chunks instead of one long paragraph.
- Do not ask open questions inside narration unless you want the child to wait for a pause step.

## Pause Step

Use `pause` when the lesson should stop and let the child ask follow-up questions.

Required fields:

- `step_id`
- `type: "pause"`
- `title`
- `child_prompt`
- `resume_line`

Optional fields:

- `allowed_followups`
- `teacher_note`

Example:

```teachbox-step
{
  "step_id": "pause-1",
  "type": "pause",
  "title": "Sunlight check-in",
  "child_prompt": "Do you have any questions about why sunlight matters for plants?",
  "allowed_followups": 2,
  "resume_line": "Great. Now let’s think about what happens when a plant does not get enough light.",
  "teacher_note": "Only answer questions about plant light needs. Keep the answer short and return to the lesson."
}
```

Runtime behavior:

- The LLM may answer up to `allowed_followups` questions.
- Each child question gets one answer.
- After the limit is reached, the lesson automatically resumes.

## Multiple-Choice Checkpoint Step

Use `checkpoint_mcq` for keyboard-only checkpoints.

Required fields:

- `step_id`
- `type: "checkpoint_mcq"`
- `title`
- `question`
- `choices`
- `correct_choice`
- `correct_response`
- `incorrect_response`

Optional fields:

- `hint`
- `retry_limit`

Example:

```teachbox-step
{
  "step_id": "checkpoint-1",
  "type": "checkpoint_mcq",
  "title": "Sunlight check",
  "question": "Why do plants need sunlight?",
  "choices": {
    "a": "To make food",
    "b": "To make noise",
    "c": "To jump higher",
    "d": "To turn into rocks"
  },
  "correct_choice": "a",
  "correct_response": "Yes. Plants need sunlight to make food.",
  "incorrect_response": "Not quite.",
  "hint": "Think about energy and food.",
  "retry_limit": 2
}
```

Runtime behavior:

- The Pi only accepts `a`, `b`, `c`, or `d`.
- Voice input is disabled during these steps.
- The backend owns retry count and advancement.

## Completion Step

Use `completion` as the final step.

Required fields:

- `step_id`
- `type: "completion"`
- `title`
- `closing_message`

Optional fields:

- `celebration_line`

Example:

```teachbox-step
{
  "step_id": "wrap-up",
  "type": "completion",
  "title": "Lesson complete",
  "closing_message": "Nice work. You learned that plants need sunlight to make food and grow well.",
  "celebration_line": "You finished the lesson."
}
```

## Authoring Constraints

- Keep narration chunks short and spoken-friendly.
- Put all checkpoints in explicit `checkpoint_mcq` steps.
- Use pause steps instead of letting the model invent question breaks.
- Do not rely on hidden state in the markdown prose outside the JSON blocks.
- Use human-readable optional notes above or between blocks only for authors; the runtime ignores them.

## Recommended Lesson Pattern

Good default structure:

1. `narration`
2. `pause`
3. `narration`
4. `checkpoint_mcq`
5. `completion`

This gives a reliable demo rhythm:

- teach
- pause for questions
- reinforce
- check understanding
- close clearly
