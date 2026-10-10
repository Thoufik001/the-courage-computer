import {after} from 'next/server';
import {activityEnabled,recordActivity} from '@/lib/activity';
import { allowed, CARE, fallback, needsCare, SYSTEM_PROMPT, textStream, validateMessages } from '@/lib/diary-api';
export const runtime='nodejs';
export async function POST(request: Request) {
  try {
    const ip=process.env.TRUST_PROXY==='true' ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : 'local';
    if(!await allowed(ip)) return textStream('Let the ink rest a moment. Return in a minute, and we shall continue.',429);
    const raw=await request.text();
    if(raw.length>12000) return textStream('A little at a time, if you please. These pages can hold only so much.',413);
    const body=JSON.parse(raw);const messages=validateMessages(body);const activitySession=typeof body.activitySession==='string'&&/^[a-f0-9-]{36}$/.test(body.activitySession)?body.activitySession:'';
    if(!messages) return textStream('A few clear words will do. Begin again, and keep your message brief.',400);
    const last=messages.at(-1)!.content;const logExchange=async(type:'input'|'output',value:string)=>{if(activityEnabled&&activitySession)try{await recordActivity({type,at:Date.now(),session:activitySession,text:value.slice(0,1200),words:value.trim().split(/\s+/).filter(Boolean).length})}catch{}};after(()=>logExchange('input',last));
    if(needsCare(last)){after(()=>logExchange('output',CARE));return textStream(CARE,200,'care');}
    if(!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL){const answer=fallback(last,messages.length);after(()=>logExchange('output',answer));return textStream(answer);}
    const model=process.env.GEMINI_MODEL;
    if(!/^[a-zA-Z0-9._-]+$/.test(model)){const answer=fallback(last);after(()=>logExchange('output',answer));return textStream(answer);}
    const abort=new AbortController(); const timeout=setTimeout(()=>abort.abort(),12000);
    const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.any([abort.signal,request.signal]),
      body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:120,temperature:0.85,thinkingConfig:{thinkingLevel:'minimal'}}})
    }).catch(()=>null);
    if(!upstream?.ok || !upstream.body){clearTimeout(timeout);return textStream('The ink has gone silent. Try again in a moment.',503,'error');}
    const reader=upstream.body.getReader(), decoder=new TextDecoder(), encoder=new TextEncoder();
    let sent='', pending='',cancelled=false;
    after(()=>logExchange('output',sent||fallback(last)));
    return new Response(new ReadableStream({async start(controller){
      const consume=(line:string)=>{
        if(!line.startsWith('data:'))return;
        try { const event=JSON.parse(line.slice(5)); const chunk=(event.candidates?.[0]?.content?.parts??[]).filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text??'').join('');
          const room=280-Array.from(sent).length; const clipped=Array.from(chunk).slice(0,room).join(''); if(clipped){sent+=clipped;controller.enqueue(encoder.encode(clipped));}
        }catch{/* Ignore keepalive and incomplete provider events. */}
      };
      try {while(!cancelled){const {value,done}=await reader.read(); if(done)break;pending+=decoder.decode(value,{stream:true}); const lines=pending.split('\n');pending=lines.pop()??'';lines.forEach(consume);if(Array.from(sent).length>=280){await reader.cancel();break;}} if(pending)consume(pending);
      }catch{if(!cancelled && sent)controller.enqueue(encoder.encode(' …'));}
      finally{clearTimeout(timeout);if(!cancelled){if(!sent){sent=fallback(last);controller.enqueue(encoder.encode(sent));}controller.close();}}
    },cancel(){cancelled=true;clearTimeout(timeout);abort.abort();void reader.cancel();}}),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Diary-Mode':'live'}});
  } catch { return textStream('The ink has gone silent. Try again in a moment.',503,'error'); }
}
