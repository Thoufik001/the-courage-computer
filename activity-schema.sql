-- Run in the Supabase SQL Editor for the project used by this diary.
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  kind text not null check (kind in ('visit','heartbeat','click','input','output')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);
create index if not exists activity_events_session_id_idx on public.activity_events (session_id, created_at);
alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon, authenticated;
grant select, insert on public.activity_events to service_role;
