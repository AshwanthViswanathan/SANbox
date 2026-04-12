---
lesson_id: ocean-habitats
title: Ocean Habitats for Young Explorers
grade_band: 1-3
topic: science
estimated_minutes: 6
version: 1
---

```teachbox-step
{
  "step_id": "intro-1",
  "type": "narration",
  "title": "Different ocean homes",
  "script_chunks": [
    "The ocean has different habitats where animals live.",
    "Some animals live near the shore, some live around coral reefs, and some live deep in the ocean."
  ]
}
```

```teachbox-step
{
  "step_id": "pause-1",
  "type": "pause",
  "title": "Ocean habitat questions",
  "child_prompt": "Do you have any questions about ocean habitats or where animals live?",
  "allowed_followups": 2,
  "resume_line": "Great. Now let’s check whether you can match animals to the right kind of ocean home.",
  "teacher_note": "Keep answers focused on habitats, food, shelter, and safety."
}
```

```teachbox-step
{
  "step_id": "checkpoint-1",
  "type": "checkpoint_mcq",
  "title": "Habitat check",
  "question": "Which place is an ocean habitat?",
  "choices": {
    "a": "A coral reef",
    "b": "A school hallway",
    "c": "A parking lot",
    "d": "A kitchen table"
  },
  "correct_choice": "a",
  "correct_response": "Yes. A coral reef is an ocean habitat.",
  "incorrect_response": "Not quite.",
  "hint": "Choose the place where ocean animals can live safely.",
  "retry_limit": 2
}
```

```teachbox-step
{
  "step_id": "wrap-up",
  "type": "completion",
  "title": "Lesson complete",
  "closing_message": "Nice work. You learned that the ocean has different habitats, and different animals live in different places.",
  "celebration_line": "You finished the ocean habitat lesson."
}
```
