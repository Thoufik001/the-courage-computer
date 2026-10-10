import 'server-only';
import {cookies} from 'next/headers';
import {createHmac,scryptSync,timingSafeEqual} from 'node:crypto';
export const adminCookie='courage_activity_admin';
const secret=()=>process.env.ACTIVITY_SIGNING_SECRET;
export function sign(value:string){const key=secret();if(!key)throw new Error('Activity auth is not configured');return createHmac('sha256',key).update(value).digest('hex');}
export function seal(value:string){return `${value}.${sign(value)}`;}
export function unseal(token:string|undefined){if(!token||!secret())return null;const i=token.lastIndexOf('.');if(i<0)return null;const value=token.slice(0,i),sig=token.slice(i+1);const expected=sign(value);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;return value;}
export async function isAdmin(){const raw=unseal((await cookies()).get(adminCookie)?.value);return !!raw&&/^admin:\d+$/.test(raw)&&Number(raw.split(':')[1])>Date.now();}
export function validPassword(username:string,password:string){const stored=process.env.ACTIVITY_PASSWORD_HASH;if(!stored||username!=='admin'||password.length>128)return false;const [salt,hash]=stored.split(':');if(!salt||!hash)return false;const candidate=scryptSync(password,salt,64).toString('hex');return candidate.length===hash.length&&timingSafeEqual(Buffer.from(candidate),Buffer.from(hash));}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin)return false;try{const url=new URL(origin);const host=req.headers.get('host');return url.host===host&&['http:','https:'].includes(url.protocol);}catch{return false;}}
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production'&&!process.env.ACTIVITY_LOCAL_TEST,sameSite:'strict' as const,path:'/'};
