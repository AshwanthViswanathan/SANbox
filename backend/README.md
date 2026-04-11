# TeachBox Backend

This folder contains TeachBox-specific orchestration logic that sits behind Next.js API routes.

Key rule: route handlers should stay thin. The turn pipeline belongs in `backend/pipeline/handle-turn.ts`.

Provider defaults:
- STT: Groq `whisper-large-v3-turbo`
- Main LLM: Groq `openai/gpt-oss-120b`
- Safeguard: Groq `openai/gpt-oss-safeguard-20b`
- TTS: Gemini TTS via Google AI Studio / Gemini API key

Gemini TTS auth can use:
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `GOOGLE_CLOUD_API_KEY`
