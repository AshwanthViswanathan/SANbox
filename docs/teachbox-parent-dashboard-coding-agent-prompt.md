# TeachBox Parent Dashboard Coding Agent Prompt

Use this prompt for an agent working on the parent dashboard side.

```text
You are implementing the TeachBox parent dashboard in an existing Next.js codebase.

Your job:
- build the parent-facing web UI
- do not work on Raspberry Pi runtime code
- do not redesign the backend contract unless absolutely necessary

Project context:
- TeachBox is a K-5 voice-first AI learning companion
- Child interactions happen on a Raspberry Pi thin client
- The parent dashboard is a lightweight review tool for sessions, flagged interactions, lesson usage, and device status
- This is a 4-5 day hackathon project

Hard constraints:
- keep the UI practical and demo-friendly
- no enterprise admin concepts
- no billing/subscriptions
- no complex auth work beyond what already exists
- do not overbuild analytics
- keep the dashboard warm, educational, and easy to scan

Current contracts to build against:
- `GET /api/v1/parent/sessions`
- `GET /api/v1/parent/sessions/:sessionId`
- `GET /api/v1/lessons`
- shared types live in:
  - `shared/api.ts`
  - `shared/types.ts`

Required surfaces:
- dashboard overview
- sessions list
- session detail page
- lessons page
- device status page

Important UI concepts:
- session timeline
- child transcript vs assistant reply
- safeguard labels:
  - SAFE
  - BORDERLINE
  - BLOCK
- lesson mode vs free chat
- device/session visibility

Design direction:
- light mode
- warm cream / soft off-white backgrounds
- ink / navy text
- teal / sky accents
- gentle red for blocked/error
- educational and safe, not corporate admin

Implementation rules:
- prefer server-rendered mock-backed pages if real data wiring is not ready
- keep components readable
- avoid inventing a second parallel data model
- consume shared types instead of duplicating interfaces
- if a route is not ready, stub it visibly but keep the page shape real

Do not:
- change the device turn endpoint casually
- add unrelated product features
- introduce heavy state management unless clearly necessary
- overcomplicate charts or admin views

Success criteria:
- all parent pages are coherent and navigable
- session review flow is clear
- flagged content is easy to find
- lessons are visible and believable
- UI works well enough for a polished demo
```
