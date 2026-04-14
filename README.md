# SANbox

SANbox is a voice-first AI learning companion for K-5 students with a browser Pi demo, a parent dashboard, lesson authoring in markdown, and a thin backend pipeline for speech, safeguards, and lesson flow.

## What Is In This Repo

- `app/`: Next.js app routes, including marketing pages, auth, the parent dashboard, and the browser Pi demo at `/pi`
- `backend/`: lesson runtime, turn handling, storage helpers, provider integrations, and safeguard logic
- `lessons/`: authored lesson files in markdown with structured `teachbox-step` blocks
- `parent-dashboard/`: notes for the dashboard contract
- `docs/`: internal docs and architecture notes

## Main Flows

- Marketing site at `/`
- Browser Pi demo at `/pi`
- Parent dashboard at `/dashboard`
- Demo password gate at `/demo-login` when enabled
- Health check at `/api/v1/health`

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase for auth and persistence
- Groq-backed STT / LLM / safeguard paths
- Gemini / Google TTS

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local` and add the environment variables you need.

3. Start the app.

```bash
npm run dev
```

4. Open:

- `http://localhost:3000/`
- `http://localhost:3000/pi`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/api/v1/health`

## Environment Variables

### Needed For Supabase Auth/App Access

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Needed For Admin Persistence

- `SUPABASE_SERVICE_ROLE_KEY`

This is especially important for device/session persistence outside the local non-production fallback paths.

### Needed For Voice + AI

- `GROQ_API_KEY`
- One TTS credential path:
  - `GEMINI_API_KEY`, or
  - `GOOGLE_API_KEY`, or
  - `GOOGLE_CLOUD_API_KEY`, or
  - `GOOGLE_SERVICE_ACCOUNT_JSON`, or
  - `GOOGLE_APPLICATION_CREDENTIALS`

### Optional

- `NEXT_PUBLIC_PI_DEVICE_ID`
- `DEMO_PASSWORD`
- `DEMO_PASSWORD_SECRET`
- `DEVICE_INGEST_TOKEN`
- `NEXT_ALLOWED_DEV_ORIGINS`
- `TEACHBOX_LLM_MODEL`
- `TEACHBOX_STT_MODEL`
- `TEACHBOX_SAFEGUARD_MODEL`
- `TEACHBOX_TTS_MODEL`
- `TEACHBOX_TTS_VOICE_NAME`
- `TEACHBOX_TTS_SPEED`
- `TEACHBOX_TTS_LANGUAGE_CODE`

## Lessons

Lessons live in `lessons/*.md` and are loaded at runtime by the backend.

Each lesson uses:

- frontmatter like `lesson_id`, `title`, `grade_band`, and `topic`
- one or more fenced `teachbox-step` JSON blocks

Supported step types today:

- `narration`
- `pause`
- `checkpoint_mcq`
- `completion`

Every lesson must end with a `completion` step.

Example lessons currently include:

- `basic-multiplication`
- `moon-basics`
- `ocean-habitats`
- `plant-growth`
- `rainbow-basics`

## Pi Demo

The browser Pi demo at `/pi` is the fastest way to test the flow locally:

- start an assigned lesson
- speak into the mic for pause/free-chat turns
- answer lesson checkpoints with the on-screen controls
- review sessions later in the dashboard

## Related Readmes

- `backend/README.md`
- `parent-dashboard/README.md`
