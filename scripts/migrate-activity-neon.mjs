import nextEnv from '@next/env';
import {neon} from '@neondatabase/serverless';

nextEnv.loadEnvConfig(process.cwd());
const source = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const target = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!source || !key || !target) throw new Error('Source or destination database credentials are missing');
const sql = neon(target);

async function sourceRows(table) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${source}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`, {
      headers: {apikey: key, Authorization: `Bearer ${key}`},
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Could not read ${table}: ${response.status}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const [sessions, events, chats] = await Promise.all([
  sourceRows('courage_activity_sessions'),
  sourceRows('courage_activity_events'),
  sourceRows('courage_activity_chats'),
]);
for (const row of sessions) {
  await sql.query(`insert into public.courage_activity_sessions(id,started_at,updated_at,sequence,payload)
    values($1::uuid,$2::timestamptz,$3::timestamptz,$4::bigint,$5::jsonb)
    on conflict(id) do update set started_at=excluded.started_at,updated_at=excluded.updated_at,
    sequence=excluded.sequence,payload=excluded.payload
    where public.courage_activity_sessions.sequence <= excluded.sequence`,
  [row.id,row.started_at,row.updated_at,row.sequence,JSON.stringify(row.payload)]);
}
for (const row of events) {
  await sql.query(`insert into public.courage_activity_events(session_id,event_key,at,payload)
    values($1::uuid,$2::text,$3::timestamptz,$4::jsonb) on conflict do nothing`,
  [row.session_id,row.event_key,row.at,JSON.stringify(row.payload)]);
}
for (const row of chats) {
  await sql.query(`insert into public.courage_activity_chats(session_id,id,at,payload)
    values($1::uuid,$2::uuid,$3::timestamptz,$4::jsonb) on conflict do nothing`,
  [row.session_id,row.id,row.at,JSON.stringify(row.payload)]);
}
const counts = await sql.query(`select
  (select count(*)::integer from public.courage_activity_sessions) as sessions,
  (select count(*)::integer from public.courage_activity_events) as events,
  (select count(*)::integer from public.courage_activity_chats) as chats`);
const destination = counts[0];
if (destination.sessions < sessions.length || destination.events < events.length || destination.chats < chats.length) {
  throw new Error('Destination row count is smaller than source; migration incomplete');
}
console.log(JSON.stringify({source:{sessions:sessions.length,events:events.length,chats:chats.length},destination}));
