import {cookies} from 'next/headers';
import {adminCookie,cookieOptions,sameOrigin} from '@/lib/activity-auth';
export async function POST(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});(await cookies()).set(adminCookie,'',{...cookieOptions,maxAge:0});return Response.json({ok:true});}
