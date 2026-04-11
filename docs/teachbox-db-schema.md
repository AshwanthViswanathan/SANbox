# TeachBox Database Schema

## Goal

This schema is designed for the current TeachBox hackathon build:

- voice sessions and turns
- lesson mode progress
- parent dashboard history
- safe extension points for future MCP/tool use, scraped sources, images, and charts

It is intentionally boring Postgres. The goal is to avoid repainting the storage layer later while keeping the first implementation simple.

## Core Tables

### `devices`

One row per physical or browser-backed TeachBox device.

Main fields:

- `id`: stable device id used by the current API contract
- `owner_user_id`: optional Supabase auth user that owns the device
- `name`: human-friendly display name
- `platform`: `web_pi`, `rpi`, `photon`, etc.
- `auth_token_hash`: future device token lookup
- `last_seen_at`
- `metadata`: flexible JSON for hardware details

### `sessions`

One row per conversation / lesson run.

Main fields:

- `id`: current `session_id`
- `device_id`
- `owner_user_id`
- `mode`: `free_chat` or `lesson`
- `status`: `active`, `idle`, `completed`, `errored`
- `lesson_id`
- `lesson_step_id`
- `lesson_state`: JSON for checkpoint/progress details
- `turn_count`
- `flagged_count`
- `started_at`, `last_turn_at`, `ended_at`
- `metadata`

This is the right place to support “continuous enough” lesson mode later. You do not need a separate lesson-session table yet.

### `turns`

One row per completed backend response cycle.

Main fields:

- `id`: current `turn_id`
- `session_id`
- `device_id`
- `turn_index`: monotonically increasing within a session
- `mode`
- `transcript`
- `input_safeguard_label`, `input_safeguard_reason`
- `assistant_text`
- `assistant_blocked`
- `output_safeguard_label`, `output_safeguard_reason`
- `cosmo_state`
- `audio_content_type`, `audio_url`
- `lesson_id`, `lesson_step_id`
- `debug_timings_ms`
- `provider_trace`
- `raw_response`

This table is the source of truth for the parent dashboard and for feeding recent context back into lesson mode.

## Extension Tables

### `turn_artifacts`

Use this for optional structured outputs attached to a turn:

- images
- charts
- links
- documents
- audio references
- tool result summaries

This is the main answer to “will MCPs or graphs force a DB redesign?” In most cases, no. New result types can be stored here without changing the core `turns` table.

### `tool_runs`

Use this for MCP/tool execution records later.

Main fields:

- `turn_id`
- `tool_name`
- `tool_kind`
- `status`
- `request_payload`
- `response_payload`
- `error_message`

This lets you add:

- search tools
- scraping tools
- data lookup tools
- graph builders
- MCP-backed capabilities

without polluting the core conversation tables.

## Why MCP Later Does Not Change Much

If you add MCP servers later, the main storage impact is:

- logging tool invocations
- storing structured outputs or references

The core entities stay the same:

- device
- session
- turn

That is why the schema includes `tool_runs` and `turn_artifacts` now. In most cases, future MCP work should be additive, not destructive.

## What Not To Add Yet

Do not add these until they are actually needed:

- vector tables
- long-term memory embeddings
- subscription/billing tables
- fine-grained multi-tenant workspace modeling
- a separate lessons database if lesson markdown already lives in repo

For the hackathon, lesson source content can stay on disk while progress lives in `sessions`.

## Implementation Notes

- Apply [schema.sql](/Users/ashwanth/DMAdventures/supabase/schema.sql) in Supabase SQL Editor.
- Backend writes should use the service role or trusted server client.
- Parent dashboard reads can use Supabase auth with the included read policies.
- Device ingest should continue using backend routes; do not let the Pi write directly to Supabase.
