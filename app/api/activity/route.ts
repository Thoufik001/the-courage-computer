import {activityEnabled,recordActivity,type ActivityEvent} from '@/lib/activity';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!activityEnabled)return new Response(null,{status:503});
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return new Response(null,{status:403});
  const raw=await request.text();if(raw.length>1800)return new Response(null,{status:413});
  let input:Partial<ActivityEvent>;try{input=JSON.parse(raw)}catch{return new Response(null,{status:400})}
  if(!input.session||!/^[a-f0-9-]{36}$/.test(input.session)||!['visit','heartbeat','click'].includes(input.type||''))return new Response(null,{status:400});
  const event:ActivityEvent={type:input.type as ActivityEvent['type'],at:Date.now(),session:input.session,label:String(input.label||'').slice(0,50),browser:String(input.browser||'').slice(0,60),os:String(input.os||'').slice(0,60),device:String(input.device||'').slice(0,20),viewport:String(input.viewport||'').slice(0,40),language:String(input.language||'').slice(0,30),referrer:String(input.referrer||'').slice(0,200),visibleMs:Math.max(0,Math.min(Number(input.visibleMs)||0,300000))};
  try{await recordActivity(event);return new Response(null,{status:204})}catch{return new Response(null,{status:503})}
}
