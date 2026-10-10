import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/diary/route';
function req(messages=[{role:'user',content:'Hello'}]){return new Request('http://localhost/api/diary',{method:'POST',body:JSON.stringify({messages})});}
test('SSE chunks are decoded and streamed; thought parts are excluded',async()=>{
 const savedFetch=globalThis.fetch,savedKey=process.env.GEMINI_API_KEY,savedModel=process.env.GEMINI_MODEL;
 process.env.GEMINI_API_KEY='test-only';process.env.GEMINI_MODEL='test-model';
 const raw='data: '+JSON.stringify({candidates:[{content:{parts:[{text:'Hidden reasoning',thought:true},{text:'Good evening. '}]}}]})+'\n\n'+'data: '+JSON.stringify({candidates:[{content:{parts:[{text:'Tell me your name.'}]}}]})+'\n\n';
 globalThis.fetch=async()=>new Response(new ReadableStream({start(c){const e=new TextEncoder();for(let i=0;i<raw.length;i+=7)c.enqueue(e.encode(raw.slice(i,i+7)));c.close();}}));
 try{const response=await POST(req());assert.equal(response.headers.get('X-Diary-Mode'),'live');assert.equal(await response.text(),'Good evening. Tell me your name.');}
 finally{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=savedKey;if(savedModel===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=savedModel;}
});
test('oversized user input is rejected before provider use',async()=>{const response=await POST(req([{role:'user',content:'a'.repeat(241)}]));assert.equal(response.status,400);});
