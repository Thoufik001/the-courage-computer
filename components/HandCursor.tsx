"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
export default function HandCursor(){
 const image=useRef<HTMLImageElement>(null);const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!mounted)return;
  const move=(e:PointerEvent)=>{const cursor=image.current;if(!cursor||e.pointerType==="touch")return;cursor.style.transform=`translate3d(${e.clientX-5}px,${e.clientY}px,0)`;cursor.dataset.visible=String(e.target instanceof Element&&!!e.target.closest("main"));};
  const down=(e:PointerEvent)=>{move(e);if(image.current)image.current.src="/courage-cursor-pressed.png?v=3";};
  const up=()=>{if(image.current)image.current.src="/courage-cursor.png?v=3";};
  const leave=()=>{if(image.current)image.current.dataset.visible="false";up();};
  const preload=new Image();preload.src="/courage-cursor-pressed.png?v=3";
  window.addEventListener("pointermove",move);window.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);window.addEventListener("blur",leave);document.addEventListener("pointerleave",leave);
  return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);window.removeEventListener("blur",leave);document.removeEventListener("pointerleave",leave);};
 },[mounted]);
 return mounted?createPortal(<img ref={image} className="hand-cursor" src="/courage-cursor.png?v=3" alt="" aria-hidden="true" data-visible="false"/>,document.body):null;
}
