import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';

if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const sql=neon(process.env.DATABASE_URL);
const schema=await readFile(new URL('../neon-activity-schema.sql',import.meta.url),'utf8');
for(const statement of schema.split(';').map(part=>part.trim()).filter(Boolean))await sql.query(statement);
console.log('Neon activity table is ready');

if(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY){
  let imported=0;
  for(let offset=0;offset<100000;offset+=1000){
    const response=await fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/activity_events?select=id,session_id,kind,payload,created_at&order=created_at.asc&limit=1000&offset=${offset}`,{headers:{apikey:process.env.SUPABASE_SECRET_KEY}});
    if(!response.ok)throw new Error(`Supabase export failed: ${response.status}`);
    const batch=await response.json();
    for(const row of batch){
      await sql`insert into activity_events (id,session_id,kind,payload,created_at) values (${row.id}::uuid,${row.session_id}::uuid,${row.kind},${JSON.stringify(row.payload)}::jsonb,${row.created_at}::timestamptz) on conflict (id) do nothing`;
      imported++;
    }
    if(batch.length<1000)break;
  }
  console.log(`Activity rows copied: ${imported}`);
}
const result=await sql`select count(*)::int as count from activity_events`;
console.log(`Neon activity rows: ${result[0].count}`);
