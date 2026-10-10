'use client';
import {useCallback,useEffect,useState} from 'react';
import dynamic from 'next/dynamic';

const MetallicPaint=dynamic(()=>import('./MetallicPaint'),{ssr:false});

export default function GoldTitle({reduced,onReady}:{reduced:boolean;onReady:()=>void}){
 const [mask,setMask]=useState('');
 const [paintReady,setPaintReady]=useState(false);
 const showPaint=useCallback(()=>{setPaintReady(true);onReady();},[onReady]);
 useEffect(()=>{
  let cancelled=false;
  void document.fonts.load('190px DiaryScript').then(()=>{
   if(cancelled)return;
   const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=760;
   const ctx=canvas.getContext('2d');if(!ctx)return;
   ctx.fillStyle='#000';ctx.textBaseline='alphabetic';
   const draw=(text:string,size:number,y:number)=>{
    let current=size;ctx.font=`${current}px DiaryScript`;
    while(ctx.measureText(text).width>900&&current>10){current-=2;ctx.font=`${current}px DiaryScript`;}
    ctx.fillText(text,50,y);
   };
   draw('Tom Riddle’s',245,280);draw('Diary',350,550);
   setMask(canvas.toDataURL('image/png'));
  }).catch(()=>{});
  return()=>{cancelled=true;};
 },[]);
 return <h1 className={`magic-title metal-title ${paintReady?'paint-ready':''}`} aria-label="Tom Riddle’s Diary">
  <span className="metal-title-fallback" aria-hidden="true">Tom Riddle’s<br/><span>Diary</span></span>
  {mask&&<span className="metal-title-paint" aria-hidden="true"><MetallicPaint imageSrc={mask} speed={reduced?0:0.3} gold onReady={showPaint}/></span>}
 </h1>;
}
