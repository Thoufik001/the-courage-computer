import {createHmac, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {neon} from '@neondatabase/serverless';

export type ActivityEvent={type:'visit'|'heartbeat'|'click'|'input'|'output';at:number;session:string;label?:string;text?:string;words?:number;browser?:string;os?:string;device?:string;viewport?:string;language?:string;referrer?:string;visibleMs?:number};
const url=process.env.UPSTASH_REDIS_REST_URL;
const token=process.env.UPSTASH_REDIS_REST_TOKEN;
const supabaseUrl=process.env.SUPABASE_URL;
const supabaseSecret=process.env.SUPABASE_SECRET_KEY;
const databaseUrl=process.env.DATABASE_URL;
export const activityEnabled=Boolean(databaseUrl||(supabaseUrl&&supabaseSecret)||(url&&token));
function neonSql(){if(!databaseUrl)throw new Error('Neon is not configured');return neon(databaseUrl)}
async function redis(...command:(string|number)[]){
  if(!url||!token)throw new Error('Activity storage is not configured');
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),cache:'no-store'});
  if(!response.ok)throw new Error('Activity storage unavailable');
  const payload=await response.json();if(payload.error)throw new Error('Activity storage unavailable');return payload.result;
}
export async function recordActivity(event:ActivityEvent){
  if(databaseUrl){const sql=neonSql();await sql`insert into activity_events (session_id, kind, payload, created_at) values (${event.session}::uuid, ${event.type}, ${JSON.stringify(event)}::jsonb, ${new Date(event.at).toISOString()}::timestamptz)`;return}
  if(supabaseUrl&&supabaseSecret){const response=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/activity_events`,{method:'POST',headers:{apikey:supabaseSecret,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({session_id:event.session,kind:event.type,payload:event}),cache:'no-store'});if(!response.ok)throw new Error('Activity storage unavailable');return}
  const item=JSON.stringify(event);
  await redis('LPUSH',`activity:session:${event.session}`,item);
  await redis('LTRIM',`activity:session:${event.session}`,0,199);
  await redis('EXPIRE',`activity:session:${event.session}`,60*60*24*90);
  await redis('ZADD','activity:sessions',event.at,event.session);
}
export async function readActivity(){
  if(databaseUrl){const sql=neonSql();const cutoff=new Date(Date.now()-90*86400000).toISOString();const rows=await sql`select payload from activity_events where created_at >= ${cutoff}::timestamptz order by created_at desc limit 10000` as {payload:ActivityEvent}[];const grouped=new Map<string,ActivityEvent[]>();for(const row of rows){const event=row.payload;if(!grouped.has(event.session)&&grouped.size>=200)continue;grouped.set(event.session,[...(grouped.get(event.session)||[]),event])}return [...grouped].map(([id,events])=>({id,events}))}
  if(supabaseUrl&&supabaseSecret){const events:ActivityEvent[]=[];const cutoff=new Date(Date.now()-90*86400000).toISOString();for(let offset=0;offset<10000;offset+=1000){const response=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/activity_events?select=payload&created_at=gte.${encodeURIComponent(cutoff)}&order=created_at.desc&limit=1000&offset=${offset}`,{headers:{apikey:supabaseSecret},cache:'no-store'});if(!response.ok)throw new Error('Activity storage unavailable');const batch=(await response.json()) as {payload:ActivityEvent}[];events.push(...batch.map(row=>row.payload));if(batch.length<1000)break}const grouped=new Map<string,ActivityEvent[]>();for(const event of events){if(!grouped.has(event.session)&&grouped.size>=200)continue;grouped.set(event.session,[...(grouped.get(event.session)||[]),event])}return [...grouped].map(([id,events])=>({id,events}))}
  const ids=(await redis('ZREVRANGE','activity:sessions',0,199)) as string[];
  const sessions=await Promise.all(ids.map(async id=>{
    const values=(await redis('LRANGE',`activity:session:${id}`,0,199)) as string[];
    return {id,events:values.map(value=>{try{return JSON.parse(value) as ActivityEvent}catch{return null}}).filter(Boolean) as ActivityEvent[]};
  }));
  return sessions.filter(session=>session.events.length);
}
export async function readActivitySession(id:string){
  if(!/^[a-f0-9-]{36}$/.test(id))return [] as ActivityEvent[];
  if(databaseUrl){const sql=neonSql();const rows=await sql`select payload from activity_events where session_id = ${id}::uuid order by created_at desc limit 500` as {payload:ActivityEvent}[];return rows.map(row=>row.payload).reverse()}
  if(supabaseUrl&&supabaseSecret){
    const response=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/activity_events?select=payload&session_id=eq.${id}&order=created_at.desc&limit=500`,{headers:{apikey:supabaseSecret},cache:'no-store'});
    if(!response.ok)throw new Error('Activity storage unavailable');
    return ((await response.json()) as {payload:ActivityEvent}[]).map(row=>row.payload).reverse();
  }
  const values=(await redis('LRANGE',`activity:session:${id}`,0,499)) as string[];
  return values.map(value=>{try{return JSON.parse(value) as ActivityEvent}catch{return null}}).filter(Boolean).reverse() as ActivityEvent[];
}
const cookieName='diary_activity_admin';
export {cookieName};
function secret(){return process.env.ACTIVITY_SESSION_SECRET||''}
export function checkPassword(value:string){
  const stored=process.env.ACTIVITY_PASSWORD_HASH||'';
  const [salt,hash]=stored.split(':');if(!salt||!hash||!value)return false;
  try{const expected=Buffer.from(hash,'hex'),actual=scryptSync(value,salt,expected.length);return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}
}
export function createAdminToken(){const expiry=Date.now()+12*60*60*1000;const nonce=randomBytes(12).toString('hex');const body=`${expiry}.${nonce}`;return `${body}.${createHmac('sha256',secret()).update(body).digest('hex')}`}
export function validAdminToken(value?:string){if(!secret()||!value)return false;const parts=value.split('.');if(parts.length!==3||Number(parts[0])<Date.now())return false;const body=`${parts[0]}.${parts[1]}`;const expected=createHmac('sha256',secret()).update(body).digest();try{return timingSafeEqual(expected,Buffer.from(parts[2],'hex'))}catch{return false}}
