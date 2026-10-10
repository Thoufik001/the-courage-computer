"use client";
import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";
import {useSurfaceTexture} from "./SurfaceTexture";
type View="room"|"entering"|"screen"|"leaving";
function Rail({position,size}:{position:[number,number,number];size:[number,number,number]}) {
  const grain=useSurfaceTexture("wood");
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#ad5729" roughness={.8}/></mesh>;
}
function LeatherLabel() {
  const leather=useSurfaceTexture("leather");
  const lettering=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
    const c=canvas.getContext("2d")!;
    c.textAlign="center";c.textBaseline="middle";c.font="bold 152px Georgia,serif";
    c.fillStyle="#fff2bdc9";c.fillText("CLICK TO SIT",512,145,900);
    c.fillStyle="#42250e";c.fillText("CLICK TO SIT",512,130,900);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
  },[]);
  useEffect(()=>()=>lettering.dispose(),[lettering]);
  return <group position={[0,2.67,.58]}>
    <RoundedBox args={[.82,.195,.025]} radius={.026} smoothness={3} castShadow>
      <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={.014} color="#fff0ba" roughness={.96}/>
    </RoundedBox>
    {[-.372,.372].flatMap(x=>[-.065,.065].map(y=><mesh key={`${x},${y}`} position={[x,y,.026]}><sphereGeometry args={[.009,8,8]}/><meshStandardMaterial color="#705039" metalness={.35} roughness={.55}/></mesh>))}
    <mesh position={[0,0,.022]}><planeGeometry args={[.69,.17]}/><meshBasicMaterial map={lettering} transparent depthWrite={false}/></mesh>
  </group>;
}
export default function Chair({view,onEnter,reduced}:{view:View;onEnter:()=>void;reduced:boolean}) {
  const grain=useSurfaceTexture("wood");
  const group=useRef<THREE.Group>(null);
  const back=useMemo(()=>{
    const s=new THREE.Shape();s.moveTo(-.47,0);s.lineTo(-.62,.43);s.quadraticCurveTo(0,.65,.62,.43);s.lineTo(.47,0);s.quadraticCurveTo(0,-.035,-.47,0);
    return new THREE.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.015,bevelThickness:.02,bevelSegments:2,steps:1});
  },[]);
  useEffect(()=>()=>back.dispose(),[back]);
  useEffect(()=>{
    const chair=group.current;if(!chair)return;
    const entering=view==="entering"||view==="screen";
    if(view==="screen"){chair.visible=false;return;}
    chair.visible=true;
    const tween=gsap.to(chair.position,{z:entering?6.8:4.65,duration:reduced?0:.8,ease:"power2.inOut",onComplete:()=>{if(entering)chair.visible=false;}});
    return()=>{tween.kill();};
  },[view,reduced]);
  return <group ref={group} name="desk-chair" position={[.2,0,4.65]} onClick={e=>{e.stopPropagation();if(view==="room"&&e.delta<5)onEnter();}} onPointerOver={e=>{e.stopPropagation();if(view==="room")document.body.style.cursor="pointer";}} onPointerOut={()=>{document.body.style.cursor="auto";}}>
    <RoundedBox args={[1.32,.11,1.12]} radius={.10} position={[0,1.17,0]} castShadow receiveShadow><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#b77a42" roughness={.9}/></RoundedBox>
    {[-.55,.55].flatMap(x=>[-.46,.46].map(z=><mesh key={`${x},${z}`} position={[x,.58,z]} rotation={[z*.05,0,-x*.07]} castShadow><cylinderGeometry args={[.055,.08,1.17,10]}/><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#a96c37" roughness={.8}/></mesh>))}
    {[-.48,.48].map(x=><mesh key={x} position={[x,1.85,.49]} rotation={[.06,0,0]} castShadow><cylinderGeometry args={[.036,.048,1.4,12]}/><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#a96c37" roughness={.8}/></mesh>)}
    {[-.26,0,.26].map(x=><mesh key={x} position={[x,1.80,.49]} castShadow><cylinderGeometry args={[.024,.035,1.18,12]}/><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#a96c37" roughness={.8}/></mesh>)}
    <mesh geometry={back} position={[0,2.32,.48]} castShadow receiveShadow><meshStandardMaterial map={grain} bumpMap={grain} bumpScale={.012} color="#bd7d40" roughness={.9}/></mesh>
    <LeatherLabel/>
    {[-.46,.46].map(z=><Rail key={z} position={[0,.42,z]} size={[1.14,.055,.055]}/>)}
  </group>;
}
