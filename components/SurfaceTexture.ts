"use client";
import {useMemo,useEffect} from "react";
import * as THREE from "three";
export function useSurfaceTexture(kind:"wood"|"rug"|"leather") {
 const texture=useMemo(()=>{
  const canvas=document.createElement("canvas");canvas.width=canvas.height=512;
  const c=canvas.getContext("2d")!;c.fillStyle=kind==="wood"?"#d8b68b":"#b6c6bb";c.fillRect(0,0,512,512);
  let seed=73;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  if(kind==="leather") {
   c.fillStyle="#d6a54d";c.fillRect(0,0,512,512);
   for(let i=0;i<9000;i++){
    c.fillStyle=rand()>.48?"#ffe6a44c":"#6c451f35";
    c.beginPath();c.ellipse(rand()*512,rand()*512,1.5+rand()*3.5,.7+rand()*1.7,rand()*.5,0,Math.PI*2);c.fill();
   }
   for(let i=0;i<220;i++){
    const x=rand()*512,y=rand()*512;
    c.strokeStyle=rand()>.5?"#6a411b26":"#fff0bd45";c.lineWidth=.8+rand();
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+4,y-2,x+8+rand()*8,y+rand()*3);c.stroke();
   }
  } else if(kind==="wood") {
   for(let i=0;i<150;i++){const x=rand()*512;c.strokeStyle=i%3?"#78532938":"#fff2ce38";c.lineWidth=.5+rand()*2;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+18,140,x-20,340,x+8,512);c.stroke();}
   for(let i=0;i<4;i++){c.strokeStyle="#77512838";c.lineWidth=1;c.beginPath();c.ellipse(70+i*110,120+i*78,8,32,0,0,Math.PI*2);c.stroke();}
  } else {
   c.fillStyle="#8aa99e";c.fillRect(0,0,512,512);
   for(let y=0;y<512;y+=12)for(let x=0;x<512;x+=12){
    const horizontal=((x+y)/12)%2===0;
    c.fillStyle="#45675e";c.fillRect(x,y,11,11);
    c.fillStyle=horizontal?"#bfd0b5":"#8da99b";
    c.fillRect(x+1,y+1,horizontal?10:8,horizontal?8:10);
    c.fillStyle="#d2d8bd90";c.fillRect(x+2,y+2,horizontal?8:1,horizontal?1:8);
    c.fillStyle="#527568";c.fillRect(x+2,y+8,horizontal?8:1,horizontal?1:2);
   }
   for(let i=0;i<7000;i++){c.fillStyle=rand()>.5?"#eff0db24":"#293c3320";c.fillRect(rand()*512,rand()*512,1,2);}
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1);t.anisotropy=8;return t;
 },[kind]);
 useEffect(()=>()=>texture.dispose(),[texture]);return texture;
}
