# TeachBox Lesson API Contract

This document locks the first-pass contract for parent-assigned lessons and Pi-side lesson start.

The goal is not to finalize every lesson runner detail yet. The goal is to give the parent UI and Pi UI a stable interface they can build against now.

## Scope

This contract covers:

- parent assigns or clears a lesson for a device
- Pi reads whether a lesson is available
- Pi starts the assigned lesson for the current session
- Pi continues scripted lesson chunks
- Pi submits keyboard checkpoint answers
- normal lesson turns continue through the existing turn API using `mode: "lesson"`

This contract does not yet define:

- step evaluation internals
- lesson completion scoring
- interruption/resume edge cases
- branching lesson trees

## Shared Types

Source of truth lives in:

- [shared/api.ts](/Users/ashwanth/DMAdventures/shared/api.ts)
- [shared/types.ts](/Users/ashwanth/DMAdventures/shared/types.ts)

## Lesson Status

`LessonAssignmentStatus`:

- `none`: no lesson assigned to this device
- `assigned`: lesson is assigned but not started
- `active`: lesson has been started for the active session
- `completed`: lesson finished for the active session

## Parent Flow

Parent chooses a lesson for a specific device.

Recommended route:

- `PUT /api/v1/parent/devices/:deviceId/lesson`

Request body:

```json
{
  "lesson_id": "plants-basics"
}
```

Clear lesson assignment:

```json
{
  "lesson_id": null
}
```

Response shape:

```json
{
  "device_id": "web_demo_pi",
  "status": "assigned",
  "assigned_lesson": {
    "lesson_id": "plants-basics",
    "title": "How Plants Grow",
    "grade_band": "K-2",
    "topic": "science",
    "assigned_at": "2026-04-11T21:00:00.000Z",
    "assigned_by_user_id": "user_123"
  },
  "updated_at": "2026-04-11T21:00:00.000Z"
}
```

## Pi Read Flow

Pi needs to know whether a lesson is available.

Recommended route:

- `GET /api/v1/devices/:deviceId/lesson`

Response shape:

```json
{
  "device_id": "web_demo_pi",
  "status": "assigned",
  "assigned_lesson": {
    "lesson_id": "plants-basics",
    "title": "How Plants Grow",
    "grade_band": "K-2",
    "topic": "science",
    "assigned_at": "2026-04-11T21:00:00.000Z",
    "assigned_by_user_id": "user_123"
  },
  "active_session_id": null,
  "active_lesson_id": null,
  "current_step_id": null,
  "started_at": null,
  "completed_at": null,
  "updated_at": "2026-04-11T21:00:00.000Z"
}
```

Pi behavior:

- if `status === "assigned"`, show `Start Lesson`
- if `status === "active"`, render lesson UI
- if `status === "none"`, stay in normal talk mode

## Pi Start Flow

When the child taps `Start Lesson`, the Pi starts the already-assigned lesson for the current session.

Recommended route:

- `POST /api/v1/devices/:deviceId/lesson/start`

Request body:

```json
{
  "session_id": "session_abc123"
}
```

## Pi Continue Flow

When the Pi finishes playing an auto-continue lesson chunk, it asks the backend for the next scripted response.

Recommended route:

- `POST /api/v1/devices/:deviceId/lesson/continue`

Request body:

```json
{
  "session_id": "session_abc123"
}
```

Response shape:

- same lesson interaction shape as the start response

## Pi Checkpoint Flow

Keyboard-driven multiple-choice checkpoints use a separate route.

Recommended route:

- `POST /api/v1/devices/:deviceId/lesson/checkpoint`

Request body:

```json
{
  "session_id": "session_abc123",
  "choice": "a"
}
```

Response shape:

- same lesson interaction shape as the start response

Response shape:

```json
{
  "device_id": "web_demo_pi",
  "session_id": "session_abc123",
  "mode": "lesson",
  "lesson": {
    "lesson_id": "plants-basics",
    "step_id": "intro",
    "title": "How Plants Grow"
  },
  "prompt_text": "Today we are learning how plants grow. Ready to start?",
  "status": "active",
  "started_at": "2026-04-11T21:01:00.000Z"
}
```

## Turn API Interaction

The existing turn API remains the same entry point for voice turns.

Pi should continue sending:

```json
{
  "mode": "lesson"
}
```

Additional lesson context should come from backend session state, not from the Pi deciding step IDs on its own.

This is intentional. It avoids frontend/backend drift.

## Ownership Split

Parent-side work can proceed with:

- lesson picker UI
- assign/clear lesson action
- showing assigned lesson per device

Pi-side work can proceed with:

- polling/fetching lesson state
- `Start Lesson` button
- continue-chunk calls after narrated audio finishes
- `A`/`B`/`C`/`D` checkpoint controls
- switching UI between free chat and lesson mode

Backend can proceed independently with:

- persistence for device lesson assignment
- persistence for active lesson progress
- lesson runner logic for `current_step_id`

## Constraints

- only one assigned lesson per device
- only one active lesson per session
- Pi cannot pick arbitrary lessons directly
- backend is the source of truth for current lesson step

## Next Implementation Steps

1. Add device lesson assignment persistence.
2. Add the two routes described above.
3. Connect Pi `/pi` page to `GET /api/v1/devices/:deviceId/lesson`.
4. Connect parent dashboard to assign and clear a lesson.
5. Add the lesson runner behind the existing turn API.
