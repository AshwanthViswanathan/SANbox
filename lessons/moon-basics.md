---
lesson_id: moon-basics
title: Why the Moon Changes Shape
grade_band: K-2
topic: space
estimated_minutes: 5
version: 1
---

```teachbox-step
{
  "step_id": "intro-1",
  "type": "narration",
  "title": "The moon does not glow on its own",
  "script_chunks": [
    "The moon does not make its own light.",
    "The sun shines on the moon, and from Earth we see different amounts of the bright part."
  ]
}
```

```teachbox-step
{
  "step_id": "pause-1",
  "type": "pause",
  "title": "Moon questions",
  "child_prompt": "Do you have any questions about why the moon looks different on different nights?",
  "allowed_followups": 2,
  "resume_line": "Great. Let’s see if you remember what makes the moon bright.",
  "teacher_note": "Answer only about sunlight lighting the moon."
}
```

```teachbox-step
{
  "step_id": "checkpoint-1",
  "type": "checkpoint_mcq",
  "title": "Moonlight check",
  "question": "What makes the moon look bright?",
  "choices": {
    "a": "The moon makes its own fire",
    "b": "The sun lights the moon",
    "c": "Clouds paint the moon",
    "d": "Stars hold flashlights on it"
  },
  "correct_choice": "b",
  "correct_response": "Correct. The sun lights the moon.",
  "incorrect_response": "Not quite.",
  "hint": "Think about which object gives the moon light.",
  "retry_limit": 2
}
```

```teachbox-step
{
  "step_id": "wrap-up",
  "type": "completion",
  "title": "Lesson complete",
  "closing_message": "Nice work. You learned that the moon does not make its own light. The sun lights it up.",
  "celebration_line": "You finished the moon lesson."
}
```
