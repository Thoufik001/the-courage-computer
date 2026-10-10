'use client';
import { useMemo, useRef, useEffect } from 'react';
import { TegakiRenderer, type TegakiRendererHandle } from 'tegaki';
import { variationPlugin, taperPlugin, type TegakiPlugin } from 'tegaki/core';
import italianno from 'tegaki/fonts/italianno';
import { sound } from '@/lib/sound';

const memoryRevealMs=(index:number)=>Math.min(index*20,5600);

export default function Ink({text,hand,onComplete,reduced=false,dissolving=false}:{text:string;hand:'user'|'memory';onComplete?:()=>void;reduced?:boolean;dissolving?:boolean}) {
  const host=useRef<HTMLDivElement>(null),renderer=useRef<TegakiRendererHandle>(null);
  const completion=useRef(onComplete);completion.current=onComplete;
  useEffect(()=>{if(!text||hand!=='user')return;let id=0,cancelled=false;let first=true;const check=()=>{const engine=renderer.current?.engine;if(!first&&engine&&(reduced||engine.currentTime>=engine.duration-.005)){if(!cancelled)completion.current?.();return;}first=false;id=requestAnimationFrame(check);};id=requestAnimationFrame(check);return()=>{cancelled=true;cancelAnimationFrame(id);};},[text,reduced,hand]);
  useEffect(()=>{if(!text||hand!=='memory')return;const id=setTimeout(()=>completion.current?.(),reduced?40:memoryRevealMs(text.length)+600);return()=>clearTimeout(id);},[text,reduced,hand]);
  const plugins=useMemo(()=>{
    const pen:TegakiPlugin={name:'diary-pen',onFrame(frame){const active=frame.active.at(-1);if(hand!=='user')return;const node=host.current;if(active?.head&&node){const anchor=renderer.current?.element??node,box=anchor.getBoundingClientRect(),scale=box.width/Math.max(anchor.offsetWidth,1);window.dispatchEvent(new CustomEvent('diary-quill-tip',{detail:{x:box.left+active.head.x*scale,y:box.top+active.head.y*scale-10*scale,angle:Math.sin(active.head.angle)*3,scale}}));}sound.scratch(active?.head ? .57+.16*Math.sin(frame.time*31) : 0);},
      paint(stroke,next){next(stroke);if(stroke.stroke.state==='pending')return;const h=stroke.stroke.path.pointAt(0),ctx=stroke.ctx;ctx.save();ctx.fillStyle='#21150e';ctx.globalAlpha=.17;ctx.beginPath();ctx.ellipse(h.x,h.y,Math.max(.6,h.width*.5),Math.max(.5,h.width*.35),0,0,Math.PI*2);ctx.fill();if(stroke.stroke.entryIndex%61===45&&stroke.stroke.strokeIndex===0){ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(h.x+7,h.y+6,1.3,.8,.3,0,Math.PI*2);ctx.fill();}ctx.restore();},
      timing({strokes}){let extra=0,last=-1;return{strokes:strokes.map(s=>{if(s.entryIndex!==last){if(last>=0 && /[.,!?;]/.test(strokes.find(t=>t.entryIndex===last)?.entry.char??''))extra+=.18;last=s.entryIndex;}return{start:s.start+extra,duration:s.duration};})};}
    };
    return [variationPlugin({rotation:.35,slant:.4,drift:.004,warp:.002,width:.08}),taperPlugin(),pen];
  },[hand]);
  useEffect(()=>()=>sound.scratch(0),[]);
  let index=0;
  const groupedLetters=(text.match(/\s+|[^\s]+/gu)??[]).map((token,tokenIndex)=>{
    if(/^\s+$/u.test(token)){index+=Array.from(token).length;return <span key={tokenIndex} className="ink-space">{token}</span>;}
    const letters=Array.from(token).map(char=>{const i=index++;return <span key={i} className={hand==='memory'?'memory-letter':'user-letter'} style={{animationDelay:`${reduced?0:hand==='memory'&&!dissolving?memoryRevealMs(i):i*Math.min(10,110/Math.max(text.length,1))}ms`}} aria-hidden="true">{char}</span>;});
    return <span key={tokenIndex} className="ink-word">{letters}</span>;
  });
  return <div ref={host} className={`ink ${hand} ${dissolving?'ink-dissolving':''}`}>{hand==='memory'?<div className="memory-letters" aria-label={text}>{groupedLetters}</div>:<><div className="user-letters" aria-hidden="true">{groupedLetters}</div><TegakiRenderer ref={renderer} font={italianno} plugins={plugins} pressure={.9} seed={17} quality={{segmentSize:2}} timing={{stagger:{advance:'82%',duration:.22},wordGap:.06,lineGap:.12,strokeEasing:t=>t}} time={reduced?'100%':{mode:'uncontrolled',speed:1}} reducedMotion="never" style={{fontSize:35,lineHeight:'1.4',color:'#1b1410'}}>{text}</TegakiRenderer></>}</div>;
}
