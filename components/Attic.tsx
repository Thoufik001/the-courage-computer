"use client";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import {activityEvent} from "@/lib/activity-client";
import NightWindow from "./NightWindow";
import { audio } from "@/lib/audio";
import * as THREE from "three";
function Timber({position, size, color="#78452f", rotation=[0,0,0]}:{position:[number,number,number];size:[number,number,number];color?:string;rotation?:[number,number,number]}) {
  return <mesh position={position} rotation={rotation} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
}
function Poster({url,x,width,height}:{url:string;x:number;width:number;height:number}) {
  const texture=useTexture(url);
  texture.colorSpace=THREE.SRGBColorSpace;
  const pivot=useRef<THREE.Group>(null), glass=useRef<THREE.ShaderMaterial>(null);
  const busy=useRef(false), swing=useRef<gsap.core.Tween|null>(null), timeline=useRef<gsap.core.Timeline|null>(null);
  const appearance=useRef({opacity:1,blur:0});
  const base=x<0?-.035:.025;
  const uniforms=useMemo(()=>({map:{value:texture},alpha:{value:1},blur:{value:0}}),[texture]);
  useEffect(()=>()=>{swing.current?.kill();timeline.current?.kill();},[]);
  useFrame(()=>{
    if(glass.current){glass.current.uniforms.alpha.value=appearance.current.opacity;glass.current.uniforms.blur.value=appearance.current.blur;}
    pivot.current?.traverse(object=>{if(object instanceof THREE.Mesh && !(object.material instanceof THREE.ShaderMaterial)) {
      const material=object.material as THREE.MeshStandardMaterial;material.transparent=appearance.current.opacity<1;material.opacity=appearance.current.opacity;
    }});
  });
  const hover=()=>{if(busy.current||!pivot.current)return;document.body.style.cursor="pointer";swing.current?.kill();swing.current=gsap.to(pivot.current.rotation,{z:base+.045,duration:.55,repeat:-1,yoyo:true,ease:"sine.inOut"});};
  const unhover=()=>{document.body.style.cursor="auto";swing.current?.kill();if(!busy.current&&pivot.current)gsap.to(pivot.current.rotation,{z:base,duration:.45,ease:"elastic.out(1,.5)"});};
  const fall=()=>{
    if(busy.current||!pivot.current)return;busy.current=true;activityEvent("poster_fall",x<0?"Nowhere poster":"Courage poster");swing.current?.kill();document.body.style.cursor="auto";
    const p=pivot.current;const tl=gsap.timeline({onComplete:()=>{busy.current=false;}});timeline.current=tl;
    tl.to(p.position,{y:.085,z:-2.03,duration:.9,ease:"power2.in"},0)
      .to(p.rotation,{x:-Math.PI/2,z:base+.24,duration:.2,ease:"power2.in"},.9)
      .call(()=>{void audio.start().then(()=>audio.crack());},[],1.1)
      .to(p.position,{y:.17,duration:.11,ease:"power1.out"},1.1)
      .to(p.position,{y:.085,duration:.16,ease:"power1.in"},1.21)
      .to(appearance.current,{opacity:0,blur:1,duration:.45},6.1)
      .call(()=>{p.position.set(x,4.85+height/2,-2.03);p.rotation.set(0,0,base);},[],6.55)
      .to(appearance.current,{opacity:1,blur:0,duration:.7,ease:"power1.out"},6.55);
  };
  return <group ref={pivot} position={[x,4.85+height/2,-2.03]} rotation={[0,0,base]} onPointerOver={e=>{e.stopPropagation();hover();}} onPointerOut={unhover} onClick={e=>{e.stopPropagation();if(e.delta<5)fall();}}>
    <group position={[0,-height/2,0]}>
      <Timber position={[0,0,0]} size={[width+.16,height+.16,.1]} color="#30271f"/>
      <Timber position={[0,0,.055]} size={[width+.06,height+.06,.02]} color="#bca47a"/>
      <mesh position={[0,0,.074]}><planeGeometry args={[width,height]}/>
        <shaderMaterial ref={glass} transparent uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`uniform sampler2D map;uniform float alpha;uniform float blur;varying vec2 vUv;void main(){vec2 d=vec2(.014)*blur;vec3 c=texture2D(map,vUv).rgb*.4;c+=(texture2D(map,vUv+d).rgb+texture2D(map,vUv-d).rgb+texture2D(map,vUv+vec2(d.x,-d.y)).rgb+texture2D(map,vUv+vec2(-d.x,d.y)).rgb)*.15;gl_FragColor=vec4(c,alpha);
#include <colorspace_fragment>
}`}/>
      </mesh>
    </group>
    <mesh position={[0,.025,.08]}><sphereGeometry args={[.025,8,6]}/><meshStandardMaterial color="#a9a89a" metalness={.5}/></mesh>
  </group>;
}
export default function Attic() {
  const wood=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
    const c=canvas.getContext("2d")!;c.fillStyle="#8b482b";c.fillRect(0,0,1024,256);
    let seed=41;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let row=0;row<4;row++) {
      const y=row*64;c.fillStyle=["#85432a","#995337","#82442c","#a05635"][row];c.fillRect(0,y,1024,64);
      c.fillStyle="#3c2419";c.fillRect(0,y,1024,3);
      c.fillStyle="#c67748";c.fillRect(0,y+3,1024,2);
      for(let j=0;j<24;j++) { c.strokeStyle=j%3?"#49281865":"#d4824b55";c.lineWidth=1+random()*2;c.beginPath();const gy=y+8+random()*50;const gx=random()*1024;c.moveTo(gx,gy);c.bezierCurveTo(gx+50,gy-4,gx+180,gy+5,gx+300,gy);c.stroke(); }
    }
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,5);return t;
  },[]);
  return <group>
    <mesh position={[0,.012,4.5]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[14,14]}/><meshStandardMaterial map={wood} color="#b88969" roughness={.95}/></mesh>
    <mesh position={[0,4.5,-2.24]} receiveShadow><boxGeometry args={[14,9,.15]}/><meshStandardMaterial map={wood} roughness={.9}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*6.8,5,4.5]} receiveShadow><boxGeometry args={[.15,10,14]}/><meshStandardMaterial map={wood} roughness={.9}/></mesh>
      <mesh position={[0,8.97,4.5+side*3.3]} rotation={[side*.34,0,0]} receiveShadow><boxGeometry args={[14,.15,7.5]}/><meshStandardMaterial map={wood} roughness={.9} side={THREE.DoubleSide}/></mesh>
      {[-4.8,0,4.8].map(x=><Timber key={x} position={[x,8.85,4.5+side*3.3]} rotation={[side*.34,0,0]} size={[.18,.16,7.5]} color="#4c2e20"/>)}
    </group>)}
    <Timber position={[0,10.05,4.5]} size={[14,.22,.2]} color="#3d271d"/>
    <group position={[-6.65,3.65,4.5]} rotation={[0,Math.PI/2,0]}>
      <Timber position={[0,0,0]} size={[2.25,3.25,.14]} color="#c0a16b"/>
      <NightWindow/>
      <Timber position={[0,0,.14]} size={[.095,3.04,.12]} color="#77644b"/>
      <Timber position={[0,0,.14]} size={[2.04,.095,.12]} color="#77644b"/>
      <Timber position={[0,-1.68,.2]} size={[2.5,.14,.4]} color="#94794e"/>
    </group>
    <group position={[6.65,2.28,4.5]} rotation={[0,-Math.PI/2,-.018]}>
      <Timber position={[0,0,0]} size={[2.27,4.6,.16]} color="#b49c66"/>
      <Timber position={[0,0,.11]} size={[2.04,4.38,.1]} color="#69343e"/>
      {[1.08,-.95].map(y=><Timber key={y} position={[0,y,.175]} size={[1.66,1.7,.02]} color="#713944"/>)}
      <mesh position={[.7,-.05,.24]}><sphereGeometry args={[.072,16,12]}/><meshStandardMaterial color="#ccb980" metalness={.5} roughness={.3}/></mesh>
    </group>
    <Poster url="/art/nowhere.png" x={-3.65} width={1.24} height={1.86}/>
    <Poster url="/art/courage.png" x={3.65} width={1.20} height={1.80}/>
    <Timber position={[0,8.775,4.5]} size={[.035,2.45,.035]} color="#28231e"/>
    <mesh position={[0,7.45,4.5]}><sphereGeometry args={[.15,20,16]}/><meshStandardMaterial color="#fff0b9" emissive="#ffd184" emissiveIntensity={1.5}/></mesh>
    <pointLight position={[0,7.25,4.5]} color="#ffd7a1" intensity={9} distance={15}/>
  </group>;
}
