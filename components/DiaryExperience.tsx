'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import type {Assets} from './DiaryScene';
const DiaryScene=dynamic(()=>import('./DiaryScene'),{ssr:false});
const DiaryPage=dynamic(()=>import('./DiaryPage'),{ssr:false});
import type {PageRect} from './DiaryPage';
import Quill from './Quill';
import CoverGlow from './CoverGlow';
import ActivityTracker from './ActivityTracker';
import GoldTitle from './GoldTitle';
import {sound} from '@/lib/sound';
export default function DiaryExperience({assets}:{assets:Assets}){
 const [assetsReady,setAssetsReady]=useState(false),[titleReady,setTitleReady]=useState(false),[revealed,setRevealed]=useState(false),[loaderGone,setLoaderGone]=useState(false);
 const [loadProgress,setLoadProgress]=useState(4);
 const [mountScene,setMountScene]=useState(false);
 const [highlight,setHighlight]=useState(false);
 const [open,setOpen]=useState(false),[closing,setClosing]=useState(false),[muted,setMuted]=useState(false),[reduced,setReduced]=useState(false);
 const music=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');setReduced(m.matches);const update=()=>setReduced(m.matches);m.addEventListener('change',update);const track=new Audio('/audio/hedwigs-theme.mp3');track.loop=true;track.volume=.22;track.preload='auto';music.current=track;void track.play().catch(()=>{/* Some browsers require the first interaction before audible playback. */});return()=>{m.removeEventListener('change',update);track.pause();music.current=null;sound.dispose();};},[]);
 const [rect,setRect]=useState<PageRect>(),[settled,setSettled]=useState(false),[ready,setReady]=useState(false),[fallback,setFallback]=useState(false);
 const sceneReady=useCallback(()=>setReady(true),[]),sceneSettled=useCallback((value:boolean)=>{setSettled(value);if(!value)setClosing(false);},[]),sceneFailure=useCallback(()=>{setFallback(true);setReady(true);setSettled(true);setClosing(false);},[]);
 const titlePaintReady=useCallback(()=>setTitleReady(true),[]);
 const enter=useCallback(()=>{void import('./DiaryPage');sound.awaken();void music.current?.play().catch(()=>{/* Playback waits for a user gesture. */});setSettled(false);setClosing(false);setOpen(true);},[]);
 const close=useCallback(()=>{if(!open)return;setSettled(false);setClosing(!fallback);setOpen(false);sound.thud();},[open,fallback]);
 useEffect(()=>{const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2');if(!context||new URLSearchParams(location.search).has('2d'))sceneFailure();context?.getExtension('WEBGL_lose_context')?.loseContext();},[sceneFailure]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};addEventListener('keydown',key);return()=>removeEventListener('keydown',key);},[close]);
 useEffect(()=>{let alive=true;setLoadProgress(72);void Promise.race([document.fonts.load('80px DiaryScript'),new Promise(r=>setTimeout(r,1200))]).finally(()=>{if(alive)setAssetsReady(true);});return()=>{alive=false;};},[]);
 useEffect(()=>{let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>setMountScene(true));});return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};},[]);
 useEffect(()=>{if(!ready||!assetsReady||!titleReady)return;setLoadProgress(100);setRevealed(true);const remove=setTimeout(()=>setLoaderGone(true),1300);return()=>clearTimeout(remove);},[ready,assetsReady,titleReady]);
 useEffect(()=>{const timeout=setTimeout(()=>setTitleReady(true),3000);return()=>clearTimeout(timeout);},[]);
 useEffect(()=>{if(ready)return;const timeout=setTimeout(sceneFailure,16000);return()=>clearTimeout(timeout);},[ready,sceneFailure]);
 useEffect(()=>{const start=()=>{sound.start();void music.current?.play().catch(()=>{/* Audible autoplay requires a user gesture. */});removeEventListener('pointerdown',start);removeEventListener('keydown',start);};addEventListener('pointerdown',start);addEventListener('keydown',start);return()=>{removeEventListener('pointerdown',start);removeEventListener('keydown',start);};},[]);
 return <main className={`experience ${open?'is-open':closing?'is-closing':''} ${revealed?'is-revealed':'is-loading'}`} aria-busy={!revealed} data-state={!revealed?'loading':open?(settled||fallback?'writing':'floating'):closing?'closing':'idle'}>
 <ActivityTracker/><div className="scene-placeholder"/>{!fallback&&mountScene&&<DiaryScene open={open} reduced={reduced} assets={assets} highlight={highlight} onOpen={enter} onReady={sceneReady} onSettled={sceneSettled} onRect={setRect} onFailure={sceneFailure}/>}
 <svg width="0" height="0" aria-hidden="true"><filter id="ink-roughness"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale=".35"/></filter></svg>
 <div className="film-grain"/><CoverGlow/><Quill open={open} rect={settled?rect:undefined} reduced={reduced}/>
 <a className="maker-credit" href="https://www.linkedin.com/in/thoufikabdullah/" target="_blank" rel="noopener noreferrer" tabIndex={revealed?0:-1}>Made by Thoufik</a>
 <a className="fan-credit" href="https://harrypotter.fandom.com/wiki/Tom_Riddle" target="_blank" rel="noopener noreferrer" tabIndex={revealed?0:-1}>Fan project inspired by Tom Riddle · Harry Potter</a>
 <div className="intro" aria-hidden={open||closing}><GoldTitle reduced={reduced} onReady={titlePaintReady}/><p className="intro-copy">Some things should remain unwritten.</p><button className="open-button enchanted-button" onPointerEnter={()=>setHighlight(true)} onPointerLeave={()=>setHighlight(false)} onFocus={()=>setHighlight(true)} onBlur={()=>setHighlight(false)} onClick={enter} disabled={!revealed||open||closing}><span className="seal" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor"><path d="M16 2 28 16 16 30 4 16Z"/><path d="m16 8 2.2 5.8L24 16l-5.8 2.2L16 24l-2.2-5.8L8 16l5.8-2.2Z"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg></span><span>Touch the diary</span></button></div>
 {open&&<>{(fallback||(settled&&rect))&&<DiaryPage rect={fallback?undefined:rect} reduced={reduced} onClose={close}/>}<button className="close-button" onClick={close} aria-label="Close the diary"><span className="close-sigil" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor"><path d="m16 2 14 14-14 14L2 16Z"/><path d="m11 11 10 10m0-10L11 21"/></svg></span><span>Close the diary<kbd>Esc</kbd></span></button></>}
 <button className="mute-button medieval-sound" disabled={!revealed} onClick={()=>{const next=!muted;sound.mute(next);if(music.current){music.current.muted=next;if(!next)void music.current.play().catch(()=>{});}setMuted(next);}} aria-label={muted?'Unmute sound':'Mute sound'} aria-pressed={muted} title={muted?'Unmute sound':'Mute sound'}><span className="sound-sigil" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor"><path d="m16 2 14 14-14 14L2 16Z"/><path d="M8 14h4l4-3v10l-4-3H8z"/>{muted?<path d="m21 13 5 6m0-6-5 6"/>:<path d="M20 12q5 4 0 8"/>}</svg></span><span>{muted?'Sound off':'Sound on'}<kbd>Music &amp; ink</kbd></span></button>
 {!loaderGone&&<div className={`loading-veil ${revealed?'leaving':''}`} role="status" aria-live="polite"><div className="magic-progress" role="progressbar" aria-label="Awakening the diary" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadProgress}><div className="magic-progress-fill" style={{width:`${loadProgress}%`}}>{Array.from({length:12},(_,i)=><b key={i} style={{right:`${i*2.8}px`,animationDelay:`${i*.14}s`}}/>)}</div></div><p className="loading-caption">Tracing forgotten words…</p></div>}
 </main>;
}
