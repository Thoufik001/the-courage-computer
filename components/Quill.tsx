'use client';
import {useEffect,useRef} from 'react';
import type {PageRect} from './DiaryPage';
type Position={x:number;y:number;scale:number;angle:number};
export default function Quill({open,rect,reduced}:{open:boolean;rect?:PageRect;reduced:boolean}){
 const mode=useRef({open,rect,reduced});mode.current={open,rect,reduced};
 const p=useRef({x:0,y:0,tx:0,ty:0,restX:0,restY:0,scale:.7,restScale:.7,angle:-12,flight:0,started:0,fromX:0,fromY:0,fromScale:.7,active:false,writingUntil:0});
 useEffect(()=>{if(!open)window.dispatchEvent(new Event('diary-quill-return'));},[open]);
 useEffect(()=>{function start(target?:Position){if(!mode.current.open)return;const q=p.current,r=mode.current.rect??document.querySelector('.paper-sheet')?.getBoundingClientRect();if(!r)return;q.active=true;q.flight=1;q.started=performance.now();q.fromX=q.x;q.fromY=q.y;q.fromScale=q.scale;q.tx=target?.x??r.left+r.width*.12;q.ty=target?.y??r.top+r.height*.16;q.writingUntil=0;document.documentElement.dataset.quillLifted='true';window.dispatchEvent(new Event('diary-quill-lift'));}
  const rest=(e:Event)=>{const d=(e as CustomEvent<Position>).detail,q=p.current;q.restX=d.x;q.restY=d.y;q.restScale=d.scale;if(!q.active&&!q.flight){q.x=q.tx=d.x;q.y=q.ty=d.y;q.scale=d.scale;q.angle=-12;}};
  const touch=()=>{if(!p.current.active)start();};
  const prepare=()=>{if(!p.current.active)start();};
  const tip=(e:Event)=>{const d=(e as CustomEvent<Position>).detail,q=p.current;if(!mode.current.open)return;if(!q.active)start(d);q.tx=d.x;q.ty=d.y;q.scale=d.scale;q.angle=d.angle;q.writingUntil=performance.now()+180;};
  const back=()=>{const q=p.current;if(!q.active||q.flight===-1)return;q.flight=-1;q.started=performance.now();q.fromX=q.x;q.fromY=q.y;q.fromScale=q.scale;};
  addEventListener('diary-quill-rest',rest);addEventListener('diary-paper-touch',touch);addEventListener('diary-quill-prepare',prepare);addEventListener('diary-quill-tip',tip);addEventListener('diary-quill-return',back);
  let id=0;const tick=(now:number)=>{const q=p.current;document.documentElement.dataset.quillLifted=String(q.active||Boolean(q.flight));if(q.flight){const duration=mode.current.reduced?1:q.flight===1?580:400;const t=Math.min(1,(now-q.started)/duration),ease=1-Math.pow(1-t,3),returning=q.flight===-1;q.x=q.fromX+((returning?q.restX:q.tx)-q.fromX)*ease;q.y=q.fromY+((returning?q.restY:q.ty)-q.fromY)*ease-Math.sin(Math.PI*t)*(mode.current.reduced?0:28);q.scale=q.fromScale+((returning?q.restScale:q.scale)-q.fromScale)*ease;if(t===1){q.flight=0;if(returning){q.active=false;q.x=q.tx=q.restX;q.y=q.ty=q.restY;q.scale=q.restScale;q.angle=-12;document.documentElement.dataset.quillLifted='false';window.dispatchEvent(new Event('diary-quill-dock'));}}}else if(q.active){q.x=q.tx;q.y=q.ty;}
   const flightProgress=q.flight?Math.min(1,(now-q.started)/(mode.current.reduced?1:q.flight===1?580:400)):1;const lift=q.flight===1?flightProgress:q.flight===-1?1-flightProgress:1;const visible=Boolean(q.x&&(q.active||q.flight));const contact=q.flight?0:Math.max(0,Math.min(1,(q.writingUntil-now)/180));const ink=document.querySelector<HTMLElement>('.ink-area');if(ink){const box=ink.getBoundingClientRect();ink.style.setProperty('--quill-ink-x',`${q.x-box.left+50}px`);ink.style.setProperty('--quill-ink-y',`${q.y-box.top+105}px`);ink.classList.toggle('under-quill',visible&&Boolean(ink.querySelector('.ink.user')));}window.dispatchEvent(new CustomEvent('diary-quill-pose',{detail:{x:q.x,y:q.y,lift,arc:q.flight?Math.sin(Math.PI*flightProgress):0,visible,angle:q.angle,contact}}));id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);
  return()=>{document.documentElement.dataset.quillLifted='false';cancelAnimationFrame(id);removeEventListener('diary-quill-rest',rest);removeEventListener('diary-paper-touch',touch);removeEventListener('diary-quill-prepare',prepare);removeEventListener('diary-quill-tip',tip);removeEventListener('diary-quill-return',back);};},[]);
 return null;
}
