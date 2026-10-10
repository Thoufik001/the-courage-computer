begin;
create table public.courage_activity_sessions (
 id uuid primary key,
 started_at timestamptz not null,
 updated_at timestamptz not null default now(),
 sequence bigint not null check (sequence >= 0),
 payload jsonb not null check (jsonb_typeof(payload)='object')
);
create index courage_activity_sessions_started_idx on public.courage_activity_sessions (started_at desc, id);
create table public.courage_activity_events (
 session_id uuid not null references public.courage_activity_sessions(id) on delete cascade,
 event_key text not null,
 at timestamptz not null,
 payload jsonb not null,
 primary key(session_id,event_key)
);
create index courage_activity_events_time_idx on public.courage_activity_events(session_id,at);
create table public.courage_activity_chats (
 session_id uuid not null references public.courage_activity_sessions(id) on delete cascade,
 id uuid not null,
 at timestamptz not null,
 payload jsonb not null,
 primary key(session_id,id)
);
create index courage_activity_chats_time_idx on public.courage_activity_chats(session_id,at);
create table public.courage_activity_login_limits (
 fingerprint text primary key,
 attempts integer not null,
 until timestamptz not null
);
alter table public.courage_activity_sessions enable row level security;
alter table public.courage_activity_events enable row level security;
alter table public.courage_activity_chats enable row level security;
alter table public.courage_activity_login_limits enable row level security;
revoke all on public.courage_activity_sessions,public.courage_activity_events,public.courage_activity_chats,public.courage_activity_login_limits from public,anon,authenticated;
grant select,insert,update,delete on public.courage_activity_sessions,public.courage_activity_events,public.courage_activity_chats,public.courage_activity_login_limits to service_role;
create function public.save_courage_activity(p jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.courage_activity_sessions(id,started_at,updated_at,sequence,payload)
 values((p->>'id')::uuid,to_timestamp((p->>'startedAt')::double precision/1000),now(),(p->>'sequence')::bigint,p-'events'-'chats')
 on conflict(id) do update set updated_at=excluded.updated_at,sequence=excluded.sequence,payload=excluded.payload
 where public.courage_activity_sessions.sequence<excluded.sequence;
 insert into public.courage_activity_events(session_id,event_key,at,payload)
 select (p->>'id')::uuid,md5(e::text),to_timestamp((e->>'at')::double precision/1000),e from jsonb_array_elements(p->'events') e on conflict do nothing;
 insert into public.courage_activity_chats(session_id,id,at,payload)
 select (p->>'id')::uuid,(c->>'id')::uuid,to_timestamp((c->>'at')::double precision/1000),c from jsonb_array_elements(p->'chats') c on conflict do nothing;
end $$;
revoke all on function public.save_courage_activity(jsonb) from public,anon,authenticated;
grant execute on function public.save_courage_activity(jsonb) to service_role;
create function public.courage_activity_login_allowed(p_fingerprint text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.courage_activity_login_limits(fingerprint,attempts,until) values(p_fingerprint,1,now()+interval '15 minutes')
 on conflict(fingerprint) do update set attempts=case when public.courage_activity_login_limits.until<now() then 1 else public.courage_activity_login_limits.attempts+1 end,until=case when public.courage_activity_login_limits.until<now() then now()+interval '15 minutes' else public.courage_activity_login_limits.until end
 returning attempts into n;return n<=8;
end $$;
revoke all on function public.courage_activity_login_allowed(text) from public,anon,authenticated;
grant execute on function public.courage_activity_login_allowed(text) to service_role;
create function public.read_courage_activity(p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('total',(select count(*) from public.courage_activity_sessions where started_at>now()-interval '365 days'),'sessions',coalesce((select jsonb_agg(s.payload||jsonb_build_object('events',coalesce((select jsonb_agg(e.payload order by e.at) from (select payload,at from public.courage_activity_events where session_id=s.id order by at desc limit 150)e),'[]'::jsonb),'chats',coalesce((select jsonb_agg(c.payload order by c.at) from (select payload,at from public.courage_activity_chats where session_id=s.id order by at desc limit 60)c),'[]'::jsonb)) order by s.started_at desc) from (select * from public.courage_activity_sessions where started_at>now()-interval '365 days' order by started_at desc,id limit 200 offset greatest(0,p_offset))s),'[]'::jsonb));
$$;
revoke all on function public.read_courage_activity(integer) from public,anon,authenticated;
grant execute on function public.read_courage_activity(integer) to service_role;
commit;
create extension if not exists pg_cron;
select cron.schedule('courage-activity-retention','15 3 * * *',$$delete from public.courage_activity_sessions where started_at < now() - interval '365 days'; delete from public.courage_activity_login_limits where until < now();$$);
