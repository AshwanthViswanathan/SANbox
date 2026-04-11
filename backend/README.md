# TeachBox Backend

This folder contains TeachBox-specific orchestration logic that sits behind Next.js API routes.

Key rule: route handlers should stay thin. The turn pipeline belongs in `backend/pipeline/handle-turn.ts`.
