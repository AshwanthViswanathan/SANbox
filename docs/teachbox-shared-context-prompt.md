# TeachBox Shared Context Prompt

Feed this to a coding agent before asking it to implement anything.

```text
You are working on a hackathon project called TeachBox.

TeachBox is a voice-first AI learning companion for K-5 students.

Core product:
- A child interacts through a Raspberry Pi 3B device
- The Pi has a microphone, speaker, button, and optional small display
- The Pi is only a thin client
- No local LLM inference on device
- Avoid heavy local STT/TTS
- Backend handles orchestration
- Parent dashboard is a lightweight web UI

Important constraints:
- 4-5 day hackathon build
- prioritize demo reliability over completeness
- no subscriptions, billing, or production-grade infra
- no wake word
- button-to-talk only
- no advanced memory/personalization
- keep abstractions minimal
- avoid overengineering

Architecture direction:
- single repo
- parent dashboard and backend live in the Next.js app
- browser Pi demo lives at `/pi` inside the Next.js app
- shared contracts live in `shared/`
- lessons live as markdown in `lessons/`

Current source of truth:
- shared API/types:
  - `shared/api.ts`
  - `shared/types.ts`
  - `shared/constants.ts`
- backend orchestration:
  - `backend/pipeline/handle-turn.ts`
- main device endpoint:
  - `POST /api/v1/session/turn`
- parent endpoints:
  - `GET /api/v1/parent/sessions`
  - `GET /api/v1/parent/sessions/:sessionId`
  - `GET /api/v1/lessons`

Pi interaction model:
- press button
- record audio
- send request to backend
- receive transcript, assistant text, safeguard result, and audio
- play audio
- show simple state transitions

UI character constraint:
- the on-device character is named L
- use a static image/face
- animate only the mouth
- do not build a complex animated character system

Safety:
- input safeguard before main LLM
- output safeguard after main LLM
- blocked responses should return a warm child-safe fallback

Working style:
- respect the shared contract
- do not casually change request/response shapes
- prefer boring, reliable implementation choices
- preserve easy debugging
- if you must change the contract, call it out explicitly
```
