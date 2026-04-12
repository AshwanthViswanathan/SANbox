create extension if not exists pgcrypto;

create table if not exists public.devices (
  id text primary key,
  owner_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  platform text not null default 'web_pi',
  auth_token_hash text,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  device_id text not null references public.devices (id) on delete cascade,
  owner_user_id uuid references auth.users (id) on delete set null,
  mode text not null check (mode in ('free_chat', 'lesson')),
  status text not null default 'active' check (status in ('active', 'idle', 'completed', 'errored')),
  lesson_id text,
  lesson_step_id text,
  lesson_state jsonb not null default '{}'::jsonb,
  turn_count integer not null default 0,
  flagged_count integer not null default 0,
  started_at timestamptz not null default now(),
  last_turn_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devices
  add column if not exists assigned_lesson_id text,
  add column if not exists assigned_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists lesson_assignment_status text not null default 'none' check (lesson_assignment_status in ('none', 'assigned', 'active', 'completed')),
  add column if not exists lesson_assigned_at timestamptz,
  add column if not exists lesson_started_at timestamptz,
  add column if not exists lesson_completed_at timestamptz,
  add column if not exists active_session_id text references public.sessions (id) on delete set null,
  add column if not exists current_step_id text;

create table if not exists public.turns (
  id text primary key,
  session_id text not null references public.sessions (id) on delete cascade,
  device_id text not null references public.devices (id) on delete cascade,
  turn_index integer not null,
  mode text not null check (mode in ('free_chat', 'lesson')),
  transcript text not null,
  input_safeguard_label text not null check (input_safeguard_label in ('SAFE', 'BORDERLINE', 'BLOCK')),
  input_safeguard_reason text not null,
  assistant_text text not null,
  assistant_blocked boolean not null default false,
  output_safeguard_label text check (output_safeguard_label in ('SAFE', 'BORDERLINE', 'BLOCK')),
  output_safeguard_reason text,
  cosmo_state text not null check (cosmo_state in ('idle', 'listening', 'thinking', 'speaking', 'blocked', 'error')),
  audio_content_type text,
  audio_url text,
  lesson_id text,
  lesson_step_id text,
  debug_timings_ms jsonb not null default '{}'::jsonb,
  provider_trace jsonb not null default '{}'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create table if not exists public.turn_artifacts (
  id uuid primary key default gen_random_uuid(),
  turn_id text not null references public.turns (id) on delete cascade,
  artifact_type text not null check (artifact_type in ('image', 'chart', 'link', 'document', 'audio', 'tool_result')),
  title text,
  mime_type text,
  url text,
  text_content text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_runs (
  id uuid primary key default gen_random_uuid(),
  turn_id text not null references public.turns (id) on delete cascade,
  tool_name text not null,
  tool_kind text not null default 'internal',
  status text not null check (status in ('started', 'completed', 'failed')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists sessions_owner_user_id_idx on public.sessions (owner_user_id);
create index if not exists sessions_device_id_idx on public.sessions (device_id);
create index if not exists sessions_last_turn_at_idx on public.sessions (last_turn_at desc);
create index if not exists devices_owner_user_id_idx on public.devices (owner_user_id);
create index if not exists devices_assignment_status_idx on public.devices (lesson_assignment_status);
create index if not exists turns_session_id_created_at_idx on public.turns (session_id, created_at desc);
create index if not exists turns_session_id_turn_index_idx on public.turns (session_id, turn_index);
create index if not exists turns_blocked_created_at_idx on public.turns (assistant_blocked, created_at desc);
create index if not exists turn_artifacts_turn_id_idx on public.turn_artifacts (turn_id);
create index if not exists tool_runs_turn_id_idx on public.tool_runs (turn_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
before update on public.devices
for each row
execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

create or replace function public.sync_session_counters()
returns trigger
language plpgsql
as $$
declare
  flagged_delta integer := case
    when new.assistant_blocked
      or new.input_safeguard_label <> 'SAFE'
      or (new.output_safeguard_label is not null and new.output_safeguard_label <> 'SAFE')
    then 1
    else 0
  end;
begin
  update public.sessions
  set
    turn_count = turn_count + 1,
    flagged_count = flagged_count + flagged_delta,
    last_turn_at = new.created_at
  where id = new.session_id;

  return new;
end;
$$;

drop trigger if exists turns_sync_session_counters on public.turns;
create trigger turns_sync_session_counters
after insert on public.turns
for each row
execute function public.sync_session_counters();

alter table public.devices enable row level security;
alter table public.sessions enable row level security;
alter table public.turns enable row level security;
alter table public.turn_artifacts enable row level security;
alter table public.tool_runs enable row level security;

drop policy if exists "devices_select_own" on public.devices;
create policy "devices_select_own"
on public.devices
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
on public.sessions
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "turns_select_own_session" on public.turns;
create policy "turns_select_own_session"
on public.turns
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions
    where public.sessions.id = turns.session_id
      and public.sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "turn_artifacts_select_own_session" on public.turn_artifacts;
create policy "turn_artifacts_select_own_session"
on public.turn_artifacts
for select
to authenticated
using (
  exists (
    select 1
    from public.turns
    join public.sessions on public.sessions.id = public.turns.session_id
    where public.turns.id = turn_artifacts.turn_id
      and public.sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "tool_runs_select_own_session" on public.tool_runs;
create policy "tool_runs_select_own_session"
on public.tool_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.turns
    join public.sessions on public.sessions.id = public.turns.session_id
    where public.turns.id = tool_runs.turn_id
      and public.sessions.owner_user_id = auth.uid()
  )
);
