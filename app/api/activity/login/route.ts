import {NextResponse} from 'next/server';
import {checkPassword,cookieName,createAdminToken} from '@/lib/activity';
export const runtime='nodejs';
export async function POST(request:Request){
  const form=await request.formData();const user=String(form.get('username')||'');const pass=String(form.get('password')||'');
  const ok=user==='admin'&&checkPassword(pass);
  const response=NextResponse.redirect(new URL(ok?'/activity':'/activity?error=1',request.url),303);
  response.headers.set('Cache-Control','no-store');
  if(ok)response.cookies.set(cookieName,createAdminToken(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/activity',maxAge:43200});
  return response;
}
