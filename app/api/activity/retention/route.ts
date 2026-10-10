import {neon} from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = process.env.DATABASE_URL;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(null, {status: 401});
  }
  if (!url) return new Response(null, {status: 503});
  const sql = neon(url);
  await sql.query(`delete from public.courage_activity_sessions where started_at < now() - interval '365 days'`);
  await sql.query(`delete from public.courage_activity_login_limits where until < now()`);
  return Response.json({ok: true});
}
