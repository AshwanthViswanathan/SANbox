# TeachBox Pi Client Coding Agent Prompt

Use this prompt for an agent working on the Raspberry Pi side.

```text
You are implementing the TeachBox Raspberry Pi client.

Your job:
- build the thin-client side only
- do not redesign the parent dashboard
- do not move orchestration logic onto the Pi

Project context:
- TeachBox is a voice-first AI learning companion for K-5 students
- Pi hardware: Raspberry Pi 3B
- attached hardware:
  - microphone
  - speaker
  - button
  - optional small display
- Pi is weak: do not assume local Whisper, local LLM, or heavy local TTS/STT
- backend handles the intelligence

Hard constraints:
- 4-5 day hackathon build
- prioritize demo reliability
- button-to-talk only
- no wake word
- no heavy local inference
- no overengineered IPC or async architecture

Current backend contract:
- `GET /api/v1/health`
- `POST /api/v1/session/turn`

Main turn request model:
- send multipart form data with:
  - `audio`
  - `device_id`
  - `session_id`
  - `mode`
  - optional `lesson_id`
- bearer token auth via `DEVICE_INGEST_TOKEN`

Expected response includes:
- transcript
- assistant text
- cosmo/L state
- safeguard results
- optional lesson pointer
- audio URL

Pi responsibilities:
- read button input
- start/stop recording
- upload audio
- handle errors clearly
- play returned audio
- update display state

Character/UI constraint:
- the character is named L
- use a static face/image
- animate only the mouth
- no complex character rigging

Suggested file split:
- `main.py`
- `api.py`
- `audio.py`
- `button.py`
- `ui.py`
- `state.py`
- `config.py`

State machine:
- idle
- listening
- thinking
- speaking
- blocked
- error

Implementation rules:
- keep state transitions explicit
- keep logging easy to read
- prefer boring libraries and straightforward control flow
- use environment/config for backend URL, token, and device id
- if a provider is unavailable, fail visibly and safely

Do not:
- put LLM logic on device
- invent a websocket architecture unless absolutely necessary
- split the thin client into unnecessary subsystems
- assume the backend response shape can drift from `shared/`

Success criteria:
- child can press a button, speak, get a response, and hear audio back
- the Pi UI clearly shows state transitions
- mouth animation works as a simple speaking indicator
- the demo feels responsive and understandable
```
