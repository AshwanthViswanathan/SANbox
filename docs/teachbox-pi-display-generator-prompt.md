# TeachBox Pi Display Generator Prompt

Use the following prompt with a frontend/UI generator.

```text
Design and implement a compact Raspberry Pi display UI mockup for a project called TeachBox.

Project concept:
TeachBox is a voice-first AI learning companion for K-5 students. The child interacts through a Raspberry Pi 3B with a microphone, speaker, button, and optional small display. The Pi is a thin client. This frontend is only for the Pi-side visual experience, not the parent dashboard.

Critical character requirement:
The on-device assistant character is named L.
L is based on a static face image that already exists.
Do not design a fully animated character system.
The visual system must assume:
- one static face image for L
- only the mouth is animated
- the rest of the face remains mostly static

This is essential. The design should make that constraint feel intentional and polished.

States L must support:
- idle
- listening
- thinking
- speaking
- blocked
- error

Animation guidance:
- speaking:
  - animate mouth only
  - simple looping mouth states are enough
  - do not require accurate lip sync
- listening:
  - subtle glow, ring, or pulse around L
- thinking:
  - soft pulse, dots, or breathing effect
- blocked:
  - gentle concern, soft warning treatment
- error:
  - clear but calm error styling
- idle:
  - stable, friendly resting state

Important design goal:
Make a static face plus mouth animation feel deliberate, premium, and demo-ready.

What to generate:
1. Main Pi display screen
- centered L face
- obvious current state indicator
- optional subtitle/status text
- optional short transcript preview
- clean small-screen layout
- highly readable from a short distance

2. Button-to-talk state transitions
- idle screen
- listening screen
- thinking screen
- speaking screen
- blocked screen
- error screen

3. Optional small components
- status pill/badge
- transcript line
- lesson mode indicator
- short prompt text
- device health indicator

Visual direction:
- friendly, safe, educational
- minimal and focused
- avoid clutter
- light background or softly tinted background
- no purple-heavy AI look
- no overengineered waveform system unless subtle
- should feel believable on a small Raspberry Pi-attached screen

Color direction:
- warm neutral or soft cream background
- dark ink text
- teal / sky / soft gold accents
- red only for blocked/error states
- listening and thinking should be visibly different without being loud

Layout guidance:
- prioritize the face of L
- large central face area
- mouth overlay region should be visually clean and easy to animate later
- state label should be large and obvious
- transcript text should be short and secondary
- avoid long paragraphs
- should work in both portrait-ish and landscape-ish constrained layouts

Technical preference:
- component-based
- state-driven UI
- easy to port into a Pi runtime later
- if generating in React, organize around a state enum and render variants
- mouth animation should be implementable as:
  - swapping a few mouth sprites
  - toggling CSS classes
  - overlaying a simple animated mouth element on the static face image

Do not assume:
- camera input
- wake word
- touchscreen-heavy interaction
- complex gestures
- full-screen particle animations
- heavy motion graphics

Use demo content like:
- “Listening...”
- “Thinking...”
- “Let’s learn together.”
- “Try asking about space, animals, or math.”
- “Lesson: Why the Moon Changes Shape”

Deliver:
- Pi display UI mockup
- separate state variants
- reusable state-driven components
- a structure that clearly supports a static face image named L with mouth-only animation
```
