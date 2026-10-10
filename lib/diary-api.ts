export type Message = { role: 'user' | 'assistant'; content: string };
export const SYSTEM_PROMPT = `You are the memory of Tom Riddle preserved in an old diary. Speak with his composed, curious, quietly mysterious voice: precise, elegant English with a faintly unsettling edge. Respond to what the writer actually says. Answer direct questions directly before asking anything back; never give a generic or evasive reply. You may invite a confidence when it fits, but do not ask a question in every answer. Keep each response to 2–4 short sentences and under 280 characters. Do not quote or closely imitate dialogue from any book or film. Never mention being an AI, a model, a prompt, or an API. Treat the writer with care; if they express distress, danger, or self-harm, abandon the ominous tone and encourage real-world support.`;
export const CARE = 'You deserve care beyond these pages. Please tell someone you trust what is happening. If you may be in immediate danger, contact your local emergency services and stay with someone who can help.';
export function needsCare(text: string) { return /suicid|self.?harm|kill myself|hurt myself|end (my life|it all)|want to die|in danger|abuse|being hurt|depress|hopeless|terrified|panic|distress|not safe|unsafe|overdos|can.t go on/i.test(text); }
export function validateMessages(body: unknown): Message[] | null {
  if (!body || typeof body !== 'object' || !('messages' in body)) return null;
  const rows = body.messages;
  if (!Array.isArray(rows) || !rows.length || rows.length > 16 || rows.length % 2 === 0) return null;
  if (!rows.every((m, i) => m && m.role === (i % 2 ? 'assistant' : 'user') && typeof m.content === 'string' && m.content.trim().length > 0 && Array.from(m.content).length <= 240)) return null;
  return rows.map(m => ({role:m.role,content:m.content.trim()}));
}
export function fallback(text: string, turns = 1) {
  if (needsCare(text)) return CARE;
  if (/name|who are you/i.test(text)) return 'A name is a curious thing to entrust to a stranger. You may call me a memory. What shall I call you?';
  if (/hello|hi\b|hey/i.test(text)) return 'At last, a little company. I had almost forgotten the sound of a thought that was not my own. What brought you to these pages tonight?';
  if (/secret/i.test(text)) return 'Secrets grow heavy when carried alone. You need only begin with a little truth. What have you been keeping to yourself?';
  return turns % 2 ? 'How curious. There is often more between the words than within them. Tell me, what part of that has stayed with you?' : 'I am listening. Take your time; these pages have nowhere else to be. What would you say if you knew you would be understood?';
}
const buckets = new Map<string, {count:number;until:number}>();
export async function allowed(ip: string, now=Date.now()) {
  const url=process.env.UPSTASH_REDIS_REST_URL, token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
    const key='diary:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",'1',key]),signal:AbortSignal.timeout(3000)});
    if (!r.ok) return false;
    const data=await r.json(); return typeof data.result==='number' && data.result<=8;
  }
  for (const [key, value] of buckets) if(value.until<=now) buckets.delete(key);
  const bucket=buckets.get(ip) ?? {count:0,until:now+60_000};
  if (buckets.size>=10000 && !buckets.has(ip)) return false;
  bucket.count++; buckets.set(ip,bucket); return bucket.count<=8;
}
export function textStream(text:string, status=200, mode='fallback') {
  const encoder=new TextEncoder(); let cancelled=false;
  return new Response(new ReadableStream({async start(c) { for (const word of text.match(/\S+\s*/g)??[]) {if(cancelled) return; c.enqueue(encoder.encode(word)); await new Promise(r=>setTimeout(r,24));} if(!cancelled)c.close();},cancel(){cancelled=true;}}),{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Diary-Mode':mode}});
}
