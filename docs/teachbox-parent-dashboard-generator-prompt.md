# TeachBox Parent Dashboard Generator Prompt

Use the following prompt with a frontend/UI generator.

```text
Design and implement a polished hackathon-ready parent dashboard frontend for a project called TeachBox.

Project concept:
TeachBox is a voice-first AI learning companion for K-5 students. A child interacts through a Raspberry Pi device with a microphone, speaker, button, and optional small display. The Pi is a thin client. The cloud handles STT, safety checks, the main LLM, TTS, lesson logic, and logging. This frontend is only for the parent/dashboard side, not the Pi runtime UI.

Important scope:
- 4–5 day hackathon build
- believable vertical slice
- parent dashboard can be lightweight and partially mocked
- no billing, subscriptions, or enterprise admin features
- no complex account management UI
- keep it practical and demo-friendly

What the dashboard should cover:
1. Parent dashboard home
2. Session detail page
3. Lessons page
4. Basic device/session visibility
5. Flagged interaction review

Required product concepts:
- child sessions
- turns/conversation history
- safeguard labels:
  - SAFE
  - BORDERLINE
  - BLOCK
- lesson mode vs free chat
- lesson usage
- flagged moments
- timestamps
- device id
- simple health/status indicators

Design direction:
- warm, calm, trustworthy educational product
- not a generic AI SaaS dashboard
- not corporate admin software
- not dark cyberpunk
- light mode by default
- color palette should use:
  - soft cream / warm off-white backgrounds
  - deep ink / navy text
  - teal / sky accents
  - warm gold highlights
  - gentle red only for blocked/error states
- polished but not overdesigned
- should feel made for parents reviewing a child-safe learning assistant

Pages to generate:

1. Dashboard home
- summary cards:
  - sessions today
  - flagged turns
  - lessons used
  - active device
- recent sessions list/table
- flagged moments panel
- lesson usage panel
- recent activity timeline

2. Session detail page
- chronological conversation timeline
- child transcript bubbles
- assistant reply bubbles
- safeguard result chips for input/output
- mode indicator: lesson or free chat
- timestamps
- optional audio playback row for responses
- lesson context panel if lesson mode is active

3. Lessons page
- list or card grid of markdown-driven lessons
- metadata shown:
  - title
  - topic
  - grade band
  - status
- lesson preview panel showing:
  - explanation
  - prompts
  - checkpoints
  - questions

4. Optional devices/session overview section
- current active device
- latest session state
- simple reliability signals
- keep this simple, not IoT-heavy

Content examples:
- “Why does the moon follow me?”
- “Can plants grow without sunlight?”
- “What is multiplication?”
- blocked fallback examples should sound warm and child-safe

UI requirements:
- Next.js App Router
- TypeScript
- Tailwind CSS
- component-based structure
- reusable cards, timeline items, badges, filters
- realistic mock data specific to TeachBox
- clean typography hierarchy
- responsive desktop/tablet layout
- tasteful motion only where useful
- use CSS variables/tokens

Avoid:
- auth-centered UI
- subscription UI
- billing UI
- team management UI
- overcomplicated analytics
- DevOps-style logs aesthetic
- giant generic dashboard templates

Deliver:
- polished dashboard pages
- reusable summary cards
- conversation/session components
- safeguard badges
- lessons UI
- realistic demo content
```
