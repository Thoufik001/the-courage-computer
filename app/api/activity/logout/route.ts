import {NextResponse} from 'next/server';
import {cookieName} from '@/lib/activity';
export async function POST(request:Request){const response=NextResponse.redirect(new URL('/activity',request.url),303);response.cookies.set(cookieName,'',{path:'/activity',maxAge:0});return response}
