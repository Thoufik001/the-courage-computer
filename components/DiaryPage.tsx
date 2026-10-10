'use client';
import {useEffect,useRef,useState} from 'react';
import Ink from './Ink';
import type {Message} from '@/lib/diary-api';
import {sound} from '@/lib/sound';
import {getActivitySession} from './ActivityTracker';
import {completeWordBoundary,paginate} from '@/lib/pagination';
export type PageRect={left:number;top:number;width:number;height:number};
type Stage='ready'|'writing'|'absorbing'|'waiting'|'replying'|'replied'|'error';
let writingHintSeenThisLoad=false;
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export default function DiaryPage({rect,reduced,onClose}:{rect?:PageRect;reduced:boolean;onClose:()=>void}){
  const [text,setText]=useState(''),[reply,setReply]=useState(''),[stage,setStage]=useState<Stage>('ready'),[smudge,setSmudge]=useState(false),[page,setPage]=useState(1),[turning,setTurning]=useState(false),[live,setLive]=useState('Write what you dare. Press Enter to send.'),[pending,setPending]=useState(false),[expiring,setExpiring]=useState(false),[slow,setSlow]=useState(false),[hintSeen,setHintSeen]=useState(writingHintSeenThisLoad),[helperReady,setHelperReady]=useState(false);
  const input=useRef<HTMLTextAreaElement>(null),history=useRef<Message[]>([]),abort=useRef<AbortController|null>(null),alive=useRef(true),finished=useRef(true),streamDone=useRef(false),stageRef=useRef(stage),textRef=useRef(text),replyRef=useRef(reply),pendingRef=useRef(false);
  stageRef.current=stage;textRef.current=text;replyRef.current=reply;
  useEffect(()=>{alive.current=true;const prepare=setTimeout(()=>window.dispatchEvent(new Event('diary-quill-prepare')),80);const focus=setTimeout(()=>input.current?.focus({preventScroll:true}),150);return()=>{alive.current=false;clearTimeout(prepare);clearTimeout(focus);abort.current?.abort();};},[]);
  useEffect(()=>{const reveal=setTimeout(()=>setHelperReady(true),140);return()=>clearTimeout(reveal);},[]);
  const replyBuffer=useRef('');
  function appendReply(value:string){if(value===replyBuffer.current)return;replyBuffer.current=value;finished.current=false;setReply(value);}
  useEffect(()=>{if(stage==='absorbing'||stage==='waiting'||stage==='replying'||stage==='replied')window.dispatchEvent(new Event('diary-quill-return'));},[stage]);
  const busy=stage==='absorbing'||stage==='waiting'||stage==='replying'||expiring;
  async function change(value:string){value=Array.from(value).slice(0,240).join('');if(busy||pendingRef.current)return;
    if(stageRef.current==='error')setStage(value?'writing':'ready');
    if(stageRef.current==='replied'){setText(value);setStage('absorbing');await pause(reduced?80:650);if(!alive.current)return;setReply('');setPage(p=>p+1);setStage('writing');finished.current=false;return;}
    if(value.length<textRef.current.length){setSmudge(true);setTimeout(()=>alive.current&&setSmudge(false),550);}
    if(value.length>textRef.current.length&&value.trim()){sound.writeMark();writingHintSeenThisLoad=true;setHintSeen(true);}
    finished.current=false;setText(value);setStage(value?'writing':'ready');
    if(value)setLive('Writing on the page. Press Enter to send.');
  }
  async function submit(){if(busy||pendingRef.current||!textRef.current.trim())return;pendingRef.current=true;setPending(true);
    const message=textRef.current.trim();window.dispatchEvent(new Event('diary-quill-return'));setStage('absorbing');setSlow(false);setLive(`You wrote: ${message}. The ink is sinking into the page.`);sound.scratch(0);
    const slowTimer=setTimeout(()=>{if(alive.current){setSlow(true);setLive('The diary is considering your words.');}},5000);
    const messages=[...history.current,{role:'user' as const,content:message}].slice(-15);abort.current=new AbortController();
    const response=fetch('/api/diary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,activitySession:getActivitySession()}),signal:abort.current.signal}).catch(()=>null);
    await pause(reduced?60:650);if(!alive.current)return;setText('');setStage('waiting');await pause(reduced?20:60);if(!alive.current)return;
    replyBuffer.current='';setReply('');setStage('replying');streamDone.current=false;finished.current=false;let answer='';
    try {const r=await response;if(!r?.ok||!r.body)throw new Error('No response');const reader=r.body.getReader(),decoder=new TextDecoder();while(alive.current){const {value,done}=await reader.read();if(done)break;clearTimeout(slowTimer);setSlow(false);answer+=decoder.decode(value,{stream:true});const boundary=completeWordBoundary(answer);if(boundary>replyBuffer.current.length)appendReply(answer.slice(0,boundary));}answer+=decoder.decode();if(!answer.trim())throw new Error('Empty response');appendReply(answer);}
    catch{clearTimeout(slowTimer);if(!alive.current)return;setSlow(false);setText('');setReply('');setStage('error');setLive('The ink has gone silent. Try again in a moment.');pendingRef.current=false;setPending(false);input.current?.focus({preventScroll:true});return;}
    clearTimeout(slowTimer);
    if(!alive.current)return;streamDone.current=true;history.current=[...messages,{role:'assistant',content:Array.from(answer).slice(0,240).join('')}].slice(-14) as Message[];
    if(finished.current){setStage('replied');setLive(answer);}pendingRef.current=false;setPending(false);
  }
  useEffect(()=>{if(stage!=='replied')return;let clear:ReturnType<typeof setTimeout>;const fade=setTimeout(()=>{if(!alive.current)return;setExpiring(true);clear=setTimeout(()=>{if(!alive.current)return;setExpiring(false);replyBuffer.current='';setReply('');setText('');setPage(p=>p+1);setStage('ready');setLive('The page is waiting for your next words.');finished.current=true;input.current?.focus({preventScroll:true});window.dispatchEvent(new Event('diary-quill-prepare'));},reduced?80:650);},2000);return()=>{clearTimeout(fade);clearTimeout(clear);};},[stage,reduced]);
  useEffect(()=>{if(stage!=='error')return;const reset=setTimeout(()=>{if(alive.current&&stageRef.current==='error'){setStage('ready');setLive('Write what you dare. Press Enter to send.');window.dispatchEvent(new Event('diary-quill-prepare'));}},5000);return()=>clearTimeout(reset);},[stage]);
  function completed(){finished.current=true;if(stageRef.current==='replying'&&streamDone.current){setStage('replied');setLive(replyRef.current);input.current?.focus({preventScroll:true});}}
  const rightText=reply || text;const hand=reply?'memory':'user';
  // Use font advances to keep unusually wide glyphs inside the paper.
  const chunks=paginate(rightText,hand);
  const [leaf,setLeaf]=useState(0);
  useEffect(()=>{setLeaf(0);},[hand]);
  useEffect(()=>{if(leaf>=chunks.length)setLeaf(Math.max(0,chunks.length-1));},[leaf,chunks.length]);
  const display=chunks[leaf]??'';
  function leafComplete(){if(chunks.length>leaf+1){setTurning(true);setTimeout(()=>{if(!alive.current)return;setLeaf(n=>n+1);setPage(p=>p+1);setTurning(false);sound.rustle();},reduced?50:700);}else completed();}
  useEffect(()=>{if(finished.current&&chunks.length>leaf+1)leafComplete();},[chunks.length]); // continue if another chunk arrives after this leaf completes
  const scale=rect?rect.width/480:undefined;
  const helper=stage==='error'?'The ink has gone silent. Try again in a moment.':slow&&!reply?'The diary is considering your words…':'Write what you dare. Press Enter to send.';
  const showHelper=stage==='error'||(slow&&!reply)||(!hintSeen&&stage==='ready'&&!text&&!reply);
  return <section className={`page-overlay ${rect?'projected':'standalone'} ${turning?'turning':''}`} style={rect?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:undefined} aria-label="Open diary">
    <div className="paper-sheet" style={scale?{width:480,height:650,transform:`scale(${scale})`}:undefined} onPointerDown={()=>{window.dispatchEvent(new Event('diary-paper-touch'));input.current?.focus({preventScroll:true});}} onClick={()=>input.current?.focus({preventScroll:true})}>
      <div className="paper-grain"/>

      <div className={`ink-area ${stage==='absorbing'||expiring?'absorbing':''} ${smudge?'smudged':''}`}>
        <Ink key={`${hand}-${leaf}-${page}`} text={display} hand={hand} dissolving={stage==='absorbing'||expiring} reduced={reduced} onComplete={leafComplete}/>
      </div>
      <textarea ref={input} className="hidden-input" aria-label="Write in the diary" aria-describedby="writing-instructions" value={text} onChange={e=>void change(e.target.value)} maxLength={480} autoComplete="off" autoCapitalize="sentences" spellCheck={false} enterKeyHint="send" readOnly={busy||pending} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();void submit();}}}/>
      <span id="writing-instructions" className="sr-only">Type your words, then press Enter to send.</span>
    </div><div className={`paper-helper ${helperReady&&showHelper?'visible':''}`} style={{left:rect?`calc(50vw - ${rect.left}px)`:'50%'}} aria-hidden="true">{helper}</div><button className="send-ink" disabled={busy||pending||!text.trim()} onClick={()=>void submit()} aria-label="Send your words"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M37 11c1 3 1 7 .7 11-.6 8-4.6 12.8-13.4 13.1H10" strokeWidth="1.5"/><path d="m18 28-8 7 8 7" strokeWidth="1.5"/><path d="M38 8c.8-.7 1.4-1.2 2.3-1.5M7 35l-2 1M23 37l1.5 1" strokeWidth=".8"/></svg></button><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>
  </section>;
}
