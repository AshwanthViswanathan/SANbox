# SANbox UI Generator Brief

This document describes the current UI as implemented in the repo so a UI generator can redesign it without guessing product structure, route coverage, or interaction intent.

## Scope

This brief covers the current Next.js UI only:

- marketing landing page
- authenticated parent dashboard shell
- dashboard overview
- sessions list
- session detail
- lessons page
- devices page
- settings page
- floating internal prompt chat widget

It does not describe backend APIs in depth, the Raspberry Pi UI, or lesson markdown formats beyond what is visible in the current web UI.

## Product Summary

`SANbox` is presented as a voice-first learning companion for children with a parent-facing dashboard.

The current visible AI name in the UI is `San`.

The current web experience mixes two ideas:

- a beach-themed visual direction on the landing page and parts of the dashboard
- a practical parent-review dashboard that exposes sessions, flags, lessons, devices, and settings

## Current Visual Direction

### Theme

The current palette is beach/coastal:

- primary: ocean blue
- accent: coral
- secondary: sandy yellow / warm cream
- backgrounds: pale sand, seafoam, and soft blue gradients

Global theme tokens live in [app/globals.css](/abs/path/app/globals.css).

### Typography

There are three active font roles:

- default sans: `Nunito`-leaning rounded UI feel
- display: rounded, friendly, beachy display stack
- accent: playful handwritten stack for small voice/persona callouts

Utility classes:

- `.font-beach-display`
- `.font-beach-accent`

### Surfaces

Common surface treatments:

- soft gradient page backgrounds
- rounded panels and cards
- light borders
- low-contrast shadows
- translucent overlays
- subtle grid texture via `.wave-grid`
- beach gradient shell via `.beach-shell`
- elevated hero/feature cards via `.beach-card`

### Overall Mood

The current mood is:

- safe
- calm
- parent-friendly
- slightly playful
- not corporate

## Global App Structure

### Public Marketing Surface

Routes and structure:

- `/`
- fixed top nav
- hero section
- features section
- final CTA section
- footer

Primary files:

- [app/page.tsx](/abs/path/app/page.tsx)
- [app/(marketing)/layout.tsx](/abs/path/app/(marketing)/layout.tsx)
- [components/marketing/nav.tsx](/abs/path/components/marketing/nav.tsx)
- [components/marketing/hero.tsx](/abs/path/components/marketing/hero.tsx)
- [components/marketing/features.tsx](/abs/path/components/marketing/features.tsx)
- [components/marketing/cta.tsx](/abs/path/components/marketing/cta.tsx)
- [components/marketing/footer.tsx](/abs/path/components/marketing/footer.tsx)

### Authenticated Dashboard Surface

Routes:

- `/dashboard`
- `/dashboard/sessions`
- `/dashboard/sessions/[id]`
- `/dashboard/lessons`
- `/dashboard/devices`
- `/dashboard/settings`

Primary shell files:

- [app/(app)/layout.tsx](/abs/path/app/(app)/layout.tsx)
- [components/app/sidebar.tsx](/abs/path/components/app/sidebar.tsx)
- [components/app/topbar.tsx](/abs/path/components/app/topbar.tsx)
- [components/app/page-header.tsx](/abs/path/components/app/page-header.tsx)

Shared dashboard helpers:

- [components/app/teachbox-badges.tsx](/abs/path/components/app/teachbox-badges.tsx)
- [components/app/empty-state.tsx](/abs/path/components/app/empty-state.tsx)
- [components/app/status-badge.tsx](/abs/path/components/app/status-badge.tsx)
- [components/app/device-command-panel.tsx](/abs/path/components/app/device-command-panel.tsx)

## Landing Page Breakdown

## Top Navigation

File: [components/marketing/nav.tsx](/abs/path/components/marketing/nav.tsx)

Current layout:

- fixed, translucent top bar
- left: SANbox icon + brand name + small badge `SHORE GUIDE`
- center/right: nav links
- right: `Sign in` and `Open SANbox`
- mobile: hamburger menu with stacked links and the same actions

Current nav links:

- `Features`
- `Dashboard`

## Hero

File: [components/marketing/hero.tsx](/abs/path/components/marketing/hero.tsx)

Current composition:

- full-width hero with beach gradients and subtle grid
- left text column
- right dashboard preview card
- background image behind the main text only, not full-bleed across the whole page

Hero image source:

- [docs/360_F_603755850_EmEXsTLLSljHRiazimrAya1HukruzkjO.jpg](/abs/path/docs/360_F_603755850_EmEXsTLLSljHRiazimrAya1HukruzkjO.jpg)

How the image is used:

- absolutely positioned behind the main left text block
- covered by warm sand-to-transparent overlays so text stays readable
- decorative only, empty alt text

Hero content hierarchy:

1. small status pill: `Beach-themed voice companion for curious kids`
2. persona line: `Meet San`
3. primary headline: `SANbox turns every question into a calm shoreline lesson.`
4. supporting body copy about San guiding kids through safe voice conversations and lesson dives
5. CTAs:
   - `Open SANbox Dashboard`
   - `See Shore Demo`
6. three supporting feature bullets with icons

Right-side preview card:

- labeled `SANbox family dashboard`
- small badge `Live tide`
- fake dashboard preview with:
  - left nav column
  - top row summary
  - stat tiles
  - fake terminal/activity log

Notable preview labels:

- `Family cove`
- `Shoreline overview`
- `1 live learning wave`
- `SANboxes`
- `Lesson dives`
- `Safe turns`
- `Tide checks`

The preview is illustrative, not interactive.

## Features Section

File: [components/marketing/features.tsx](/abs/path/components/marketing/features.tsx)

Current section structure:

- intro eyebrow: `What SANbox includes`
- heading explaining that the beach theme sits on top of the same learning stack
- 6 feature cards in a responsive grid

Current card themes:

- SANbox Dashboard
- Guided lesson dives
- Fast voice replies
- Simple voice-first flow
- Built-in safeguards
- A beach guide with guardrails

The cards use beach-card styling but still read like product capability summaries, not decorative marketing fluff.

## Final CTA

File: [components/marketing/cta.tsx](/abs/path/components/marketing/cta.tsx)

Current composition:

- centered beach-card
- subtle background grid
- display headline
- supporting copy
- two CTAs

Copy goal:

- bridge from marketing to product
- push users into dashboard or demo

## Footer

File: [components/marketing/footer.tsx](/abs/path/components/marketing/footer.tsx)

Current structure:

- left: SANbox mini brand
- middle: short one-line descriptor
- right: links to dashboard and sign-in

## Dashboard Shell Breakdown

## Sidebar

File: [components/app/sidebar.tsx](/abs/path/components/app/sidebar.tsx)

Current structure:

- narrow left rail on desktop
- hidden on mobile, shown in overlay drawer
- top brand block with shell icon, `SANbox`, and subtitle `San dashboard`
- active family panel with email
- nav list
- bottom note block

Current sidebar nav:

- Overview
- Sessions
- Lessons
- Devices
- Settings

Current bottom note:

- title: `Beach theme live`
- subtext: `San dashboard preview`

## Top Bar

File: [components/app/topbar.tsx](/abs/path/components/app/topbar.tsx)

Current structure:

- breadcrumb-ish left side on desktop
- page title on mobile
- notifications button
- authenticated email summary
- sign-out button

Mobile behavior:

- hamburger opens full-screen overlay with sidebar

## Dashboard Overview Page

File: [app/(app)/dashboard/page.tsx](/abs/path/app/(app)/dashboard/page.tsx)

Current purpose:

- high-level parent view for sessions, flags, lessons, and device status

Sections:

1. page header
2. hero summary panel
3. stat card grid
4. recent sessions list
5. flagged queue

### Page Header

- title: `SANbox Dashboard`
- description: parent-oriented review summary
- badge: `DEMO READY`

### Hero Summary Panel

Two-column block:

- left:
  - eyebrow `Shoreline review`
  - headline about reviewing what a child heard, asked, and learned
  - buttons:
    - `Review tide checks`
    - `Browse lesson dives`
- right:
  - `Today at a glance`
  - 3 recent sessions as mini linked items

### Stat Cards

Current stat cards:

- Sessions
- Tide checks
- Lesson dives
- Devices online

### Recent Sessions Panel

Shows top sessions with:

- session id
- mode badge
- device id
- start time
- turns
- flagged count
- last reply time

### Flagged Queue Panel

Shows up to 4 flagged items with:

- safeguard badge
- mode badge
- time
- child transcript
- assistant text snippet
- session and device identifiers

Empty state exists if there are no flagged turns.

## Sessions List Page

File: [app/(app)/dashboard/sessions/page.tsx](/abs/path/app/(app)/dashboard/sessions/page.tsx)

Current purpose:

- full list of all sessions
- quick filter views

Page elements:

- page header
- filter pills
- either:
  - empty state
  - list of session cards

Current filters:

- All sessions
- Needs review
- Lesson mode
- Free chat

Each session card includes:

- session id
- mode badge
- flagged indicator if applicable
- device id and start time
- 3 metrics:
  - turns
  - last turn
  - visibility
- CTA: `Open session`

## Session Detail Page

File: [app/(app)/dashboard/sessions/[id]/page.tsx](/abs/path/app/(app)/dashboard/sessions/[id]/page.tsx)

Current purpose:

- turn-by-turn conversation review
- parent moderation context
- lesson context

Layout:

- main timeline column
- right sidebar with context cards

### Top Metadata

Three summary cards:

- Device
- Started
- Last turn

### Session Timeline

Each turn is shown as a pair:

- child bubble
- SANbox reply bubble

Displayed per turn:

- timestamp
- safeguard labels
- blocked indicator where relevant
- assistant text
- audio delivery note

Current styling:

- child messages: white panel bubble
- assistant messages: tinted accent bubble
- blocked assistant messages: destructive-tinted bubble

### Right Sidebar Cards

Current cards:

- Session context
- Lesson status
- Review notes

Session context fields:

- mode
- turns
- flagged
- session visibility

Lesson status:

- if attached to lesson, shows title, grade band, topic
- otherwise shows free chat note

Review notes:

- plain guidance for parents about how to interpret the session record

## Lessons Page

File: [app/(app)/dashboard/lessons/page.tsx](/abs/path/app/(app)/dashboard/lessons/page.tsx)

Current purpose:

- show available lesson modules and whether they were used

Page structure:

- page header
- 3 top stats
- responsive card grid for lessons

Top stats:

- Lesson library
- Used in sessions
- Most recent lesson turn

Each lesson card includes:

- lesson id chip
- lesson title
- grade band badge
- topic chip
- active/inactive usage chip
- metrics:
  - session count
  - last seen
- one explanatory paragraph for parents

## Devices Page

File: [app/(app)/dashboard/devices/page.tsx](/abs/path/app/(app)/dashboard/devices/page.tsx)

Current purpose:

- show device fleet health and local parent controls

Page structure:

- page header
- 3 top stats
- explainer panel
- one card per device

Top stats:

- Devices
- Online now
- Flagged turns seen

Explainer panel:

- explains that parent controls are local UI controls for demo purposes and do not change session routes or turn APIs

Each device card contains:

- device icon and name
- online/offline badge
- device id
- last seen panel
- battery bar
- recent sessions metric
- flagged turns metric
- embedded parent controls
- microphone status
- speaker status
- footer row with status badge, mode badge, and note `Button-to-talk flow only`

### Device Command Panel

File: [components/app/device-command-panel.tsx](/abs/path/components/app/device-command-panel.tsx)

Current controls:

- Pause device / Resume device
- Turn off device / Turn device back on
- Turn microphone on/off
- Turn speaker on/off

Current status readout:

- Microphone
- Speaker
- Device

Current note block changes copy depending on state.

The component fetches and saves against:

- `GET /api/v1/parent/devices/[deviceId]/control`
- `POST /api/v1/parent/devices/[deviceId]/control`

The current UI assumes this control panel is part of the dashboard experience.

## Settings Page

File: [app/(app)/dashboard/settings/page.tsx](/abs/path/app/(app)/dashboard/settings/page.tsx)

Current purpose:

- lightweight workspace/integrations admin screen

Sections:

- Workspace
- API Keys
- Notifications
- Integrations

Current page is mostly static/form scaffold UI with TODO comments and placeholder values.

The visual style matches the rest of the dashboard but is more conventional and form-oriented.

## Floating Prompt Chat

File: [components/app/floating-chat.tsx](/abs/path/components/app/floating-chat.tsx)

Current purpose:

- internal prompt lab widget
- always mounted from root layout

Behavior:

- floating button bottom-right
- opens a chat panel
- uses `@ai-sdk/react` `useChat`
- posts to `/api/chat`

Current visible copy:

- `Groq Chat`
- `Internal prompt lab for SANbox flows`
- placeholder asks about SANbox prompts or lesson flows

Important for redesign:

- this is not customer-facing product chat
- it behaves like an internal developer utility

## Shared UI Components and Patterns

## Page Header

File: [components/app/page-header.tsx](/abs/path/components/app/page-header.tsx)

Common pattern:

- title
- optional short description
- optional badge
- optional action region

## Badges

File: [components/app/teachbox-badges.tsx](/abs/path/components/app/teachbox-badges.tsx)

Badge types:

- safeguard labels:
  - SAFE
  - BORDERLINE
  - BLOCK
- mode labels:
  - LESSON MODE
  - FREE CHAT

These are reused throughout the dashboard and should remain visually distinct in any redesign.

## Empty State

File: [components/app/empty-state.tsx](/abs/path/components/app/empty-state.tsx)

Current structure:

- icon block
- title
- description
- optional action

## Data Sources Visible in UI

The dashboard is driven from server-side helpers in:

- [lib/parent-dashboard-data.ts](/abs/path/lib/parent-dashboard-data.ts)

Visible UI data concepts:

- sessions
- turns
- flagged counts
- lessons and usage
- devices and statuses
- parent control state

The UI generator does not need to redesign the data layer, but it should preserve these conceptual entities.

## Interaction and Responsiveness

## Marketing Page

- desktop: two-column hero
- mobile: stacks vertically
- nav collapses to hamburger
- CTA buttons stack on small screens

## Dashboard

- desktop: persistent sidebar
- mobile: top bar + overlay sidebar
- overview and detail pages collapse into single-column stacks on smaller screens

The current UI is responsive but not especially ambitious. A redesign can push layout quality further as long as the route structure and information hierarchy remain clear.

## What Should Be Preserved in a Redesign

- SANbox product name
- AI name `San`
- parent-facing dashboard concept
- visible route structure
- session review workflow
- safeguard label prominence
- device control panel as a dedicated UI block
- beach/coastal mood as the current intended art direction
- the docs image currently used in the hero can be reused or replaced with a better asset, but the current design expects a real beach image behind the hero copy

## What Can Change Safely

- exact layout composition
- typography choices
- card styling
- icon usage
- motion and micro-interactions
- visual metaphors
- naming of decorative section labels like `Shoreline review` or `Live tide`
- the illustrative dashboard preview inside the landing page hero

## Constraints for a UI Generator

- do not remove core routes
- do not remove session detail visibility
- do not remove safeguard badges
- do not bury device controls
- do not make the dashboard read like a generic SaaS admin
- do not revert the interface to a corporate gray dashboard
- keep the experience readable for parents first
- keep the child-facing AI identity warm, safe, and simple

## Recommended Output From a UI Generator

If using this brief with a generator, ask it to produce:

1. a refined landing page with stronger hero composition and clearer SANbox/San branding
2. a redesigned dashboard shell with improved hierarchy and denser but cleaner scanning
3. a refreshed overview page
4. updated list/detail patterns for sessions
5. a consistent design language for lessons, devices, and settings
6. mobile-aware layouts for all dashboard routes

## File Map

Marketing:

- [components/marketing/nav.tsx](/abs/path/components/marketing/nav.tsx)
- [components/marketing/hero.tsx](/abs/path/components/marketing/hero.tsx)
- [components/marketing/features.tsx](/abs/path/components/marketing/features.tsx)
- [components/marketing/cta.tsx](/abs/path/components/marketing/cta.tsx)
- [components/marketing/footer.tsx](/abs/path/components/marketing/footer.tsx)

Theme:

- [app/globals.css](/abs/path/app/globals.css)

Dashboard shell:

- [app/(app)/layout.tsx](/abs/path/app/(app)/layout.tsx)
- [components/app/sidebar.tsx](/abs/path/components/app/sidebar.tsx)
- [components/app/topbar.tsx](/abs/path/components/app/topbar.tsx)
- [components/app/page-header.tsx](/abs/path/components/app/page-header.tsx)

Dashboard pages:

- [app/(app)/dashboard/page.tsx](/abs/path/app/(app)/dashboard/page.tsx)
- [app/(app)/dashboard/sessions/page.tsx](/abs/path/app/(app)/dashboard/sessions/page.tsx)
- [app/(app)/dashboard/sessions/[id]/page.tsx](/abs/path/app/(app)/dashboard/sessions/[id]/page.tsx)
- [app/(app)/dashboard/lessons/page.tsx](/abs/path/app/(app)/dashboard/lessons/page.tsx)
- [app/(app)/dashboard/devices/page.tsx](/abs/path/app/(app)/dashboard/devices/page.tsx)
- [app/(app)/dashboard/settings/page.tsx](/abs/path/app/(app)/dashboard/settings/page.tsx)

Supporting dashboard components:

- [components/app/teachbox-badges.tsx](/abs/path/components/app/teachbox-badges.tsx)
- [components/app/empty-state.tsx](/abs/path/components/app/empty-state.tsx)
- [components/app/status-badge.tsx](/abs/path/components/app/status-badge.tsx)
- [components/app/device-command-panel.tsx](/abs/path/components/app/device-command-panel.tsx)
- [components/app/floating-chat.tsx](/abs/path/components/app/floating-chat.tsx)
