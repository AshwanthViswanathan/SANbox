# TeachBox Architecture

## Goal

TeachBox is a voice-first AI learning companion for K-5 students.

For the hackathon, the product is a thin Raspberry Pi client plus a cloud backend and a lightweight parent dashboard. The Pi is not responsible for LLM inference, heavy STT, or heavy TTS. It captures audio, sends requests, plays returned audio, and displays simple UI state.

## Scope

This is a believable vertical slice, not a production system.

In scope:

- button-to-talk voice interaction
- cloud STT
- input safeguard
- main LLM response
- output safeguard
- cloud TTS
- Cosmo state changes
- markdown lesson mode
- lightweight parent dashboard
- stable API contract

Out of scope:

- wake word
- subscriptions or billing
- advanced auth
- long-term memory
- deep personalization
- complex infra
- device fleet management

## Repo Shape

```text
app/                Next.js routes, pages, and API routes
backend/            TeachBox orchestration logic
components/         existing UI components
docs/               product and frontend guidance
lessons/            markdown lessons
parent-dashboard/   coordination notes for parent UI workstream
pi-client/          Raspberry Pi client workstream
shared/             shared schemas, types, constants
```

## Runtime Architecture

Single deployable web app:

- Next.js app hosts the parent dashboard
- Next.js API routes host the TeachBox backend contract
- `backend/` contains the actual turn pipeline

This avoids spinning up multiple services during a 4-5 day hackathon.

## Main Interaction Flow

1. Child presses the button on the Raspberry Pi
2. Pi records audio locally
3. Pi sends a multipart request to `POST /api/v1/session/turn`
4. Backend pipeline performs:
   - speech-to-text
   - input safeguard classification
   - lesson lookup if lesson mode is active
   - main LLM response generation
   - output safeguard classification
   - text-to-speech generation
   - turn logging
5. Backend returns transcript, safeguard results, assistant text, Cosmo state, lesson pointer, and audio URL
6. Pi plays returned audio and updates the UI
7. Parent dashboard reads session and turn data from backend APIs

## Cosmo UI States

- `idle`
- `listening`
- `thinking`
- `speaking`
- `blocked`
- `error`

Important implementation note:

Cosmo should be a mostly static character image. For the hackathon, the animation should focus on the mouth only. Keep the body and face mostly static and drive state with:

- mouth movement during speaking
- glow/ring/state badge for listening and thinking
- distinct blocked/error overlays

Do not build a complex animated character system. That is unnecessary risk.

## Stable API Contract

### Health

`GET /api/v1/health`

Response:

```json
{
  "ok": true,
  "service": "teachbox-backend",
  "time": "2026-04-10T19:00:00.000Z"
}
```

### Main Turn Endpoint

`POST /api/v1/session/turn`

Headers:

```text
Authorization: Bearer <DEVICE_INGEST_TOKEN>
```

Form fields:

- `audio`: required file
- `device_id`: required string
- `session_id`: required string
- `mode`: `free_chat` or `lesson`
- `lesson_id`: optional
- `transcript_override`: optional debug-only override for fast backend testing without STT

Response shape:

```json
{
  "turn_id": "turn_123",
  "session_id": "sess_abc",
  "device_id": "pi_01",
  "mode": "lesson",
  "cosmo_state": "speaking",
  "transcript": "Why does the moon follow me?",
  "input_safeguard": {
    "label": "SAFE",
    "reason": "normal_child_query"
  },
  "assistant": {
    "text": "It looks that way because the moon is very far away.",
    "blocked": false
  },
  "output_safeguard": {
    "label": "SAFE",
    "reason": "normal_child_query"
  },
  "audio": {
    "content_type": "audio/mpeg",
    "url": "/api/v1/audio/turn_123.mp3"
  },
  "lesson": {
    "lesson_id": "moon-basics",
    "step_id": "checkpoint-1",
    "title": "Why the Moon Changes Shape"
  },
  "debug": {
    "timings_ms": {
      "stt": 200,
      "input_safeguard": 50,
      "llm": 180,
      "output_safeguard": 45,
      "tts": 120
    }
  }
}
```

Blocked responses should still return `200` with `assistant.blocked = true` and `cosmo_state = "blocked"`. For a demo, this is better than surfacing hard failures to the Pi.

### Parent Dashboard Endpoints

`GET /api/v1/parent/sessions`

`GET /api/v1/parent/sessions/:sessionId`

`GET /api/v1/lessons`

These are the contract the parent dashboard should build against immediately, even if the backing storage is mocked first.

## Folder Responsibilities

### `shared/`

Contains the contract.

- `constants.ts`
- `api.ts`
- `types.ts`

This is the first place both workstreams should trust.

### `backend/`

Contains orchestration logic.

- `pipeline/handle-turn.ts`
- `providers/` for STT, safeguard, LLM, and TTS wrappers
- `lessons/` for loading markdown lessons
- `storage/` for session and turn access

### `pi-client/`

Thin client only.

- button
- recording
- playback
- API requests
- state machine
- simple mouth animation control

### `parent-dashboard/`

Consumes stable APIs and displays:

- sessions
- turns
- flagged interactions
- lesson information

## Build Order

1. Lock the shared API contract
2. Build a stubbed backend pipeline that always returns valid contract shapes
3. Build the Pi client against the stable endpoint
4. Build the parent dashboard against the parent/session endpoints
5. Swap real STT/TTS/LLM/safeguard providers in behind the pipeline

## Practical Simplifications

Use these:

- one deployable app
- one device token
- one synchronous turn endpoint
- markdown lessons on disk
- a mostly static Cosmo with animated mouth only
- mock parent data if storage is not ready

Avoid these:

- websocket orchestration
- multiple services
- advanced streaming architecture
- complex device auth
- full lesson engine
- complex motion system for Cosmo

## Current Scaffold Status

Current TeachBox-specific files added:

- `shared/api.ts`
- `shared/types.ts`
- `shared/constants.ts`
- `backend/pipeline/handle-turn.ts`
- `backend/providers/*`
- `app/api/v1/*`
- `lessons/moon-basics.md`

This is enough to let both the Pi side and parent side proceed in parallel.
