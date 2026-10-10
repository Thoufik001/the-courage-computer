-- Private activity records, accessed only by the server using DATABASE_URL.
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  kind text not null check (kind in ('visit','heartbeat','click','input','output')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);
create index if not exists activity_events_session_id_idx on public.activity_events (session_id, created_at desc);
