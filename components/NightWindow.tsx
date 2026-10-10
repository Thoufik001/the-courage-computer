"use client";
import {useMemo,useRef,useEffect} from "react";
import {useFrame} from "@react-three/fiber";
import {useFBO} from "@react-three/drei";
import * as THREE from "three";
export default function NightWindow(){
 const pane=useRef<THREE.Mesh>(null);const target=useFBO(512,768,{depthBuffer:true});
 const camera=useMemo(()=>new THREE.PerspectiveCamera(),[]);
 const local=useMemo(()=>new THREE.Vector3(),[]);
 const scene=useMemo(()=>{
  const s=new THREE.Scene();s.background=new THREE.Color("#070e22");
  const sky=new THREE.Mesh(new THREE.SphereGeometry(240,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;void main(){float h=clamp(normalize(p).y*.8+.3,0.,1.);gl_FragColor=vec4(mix(vec3(.012,.025,.05),vec3(.002,.004,.014),h),1.);\n#include <colorspace_fragment>\n}`}));s.add(sky);
  const sphere=(position:number[],scale:number[],color:string)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color}));m.position.set(...position as [number,number,number]);m.scale.set(...scale as [number,number,number]);s.add(m);return m;};
  const moon=sphere([40,-5,-100],[1.6,1.6,1.6],"#e2dfc9");
  const canvas=document.createElement("canvas");canvas.width=canvas.height=256;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#c9c7b9";ctx.fillRect(0,0,256,256);
  let craterSeed=19;const random=()=>{craterSeed=(craterSeed*16807)%2147483647;return craterSeed/2147483647;};
  for(let i=0;i<85;i++){const x=random()*256,y=random()*256,r=2+random()*19;const gradient=ctx.createRadialGradient(x-r*.2,y-r*.2,r*.15,x,y,r);gradient.addColorStop(0,"#787c7655");gradient.addColorStop(.72,"#92958b44");gradient.addColorStop(.86,"#edead16b");gradient.addColorStop(1,"#c9c7b900");ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);}
  const moonMap=new THREE.CanvasTexture(canvas);moonMap.colorSpace=THREE.SRGBColorSpace;(moon.material as THREE.MeshBasicMaterial).map=moonMap;

  let seed=71;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const stars=[];
  for(let i=0;i<450;i++)stars.push((rand()-.5)*300,rand()*100-35,-120-rand()*60);
  const points=new THREE.BufferGeometry();points.setAttribute("position",new THREE.Float32BufferAttribute(stars,3));s.add(new THREE.Points(points,new THREE.PointsMaterial({color:"#d0dbea",size:.4,sizeAttenuation:true})));
  for(let i=0;i<9;i++)sphere([-90+i*24,-22,-65-(i%3)*8],[20,8+(i%3)*2,12],"#203e4c");
  for(let i=0;i<7;i++)sphere([-55+i*18,-16,-32-(i%2)*7],[14,5+(i%3),10],"#142e38");
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(350,350),new THREE.MeshBasicMaterial({color:"#192d2e"}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-20,-70);s.add(ground);
  for(const x of [-13,-8,11,18,30]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.22,12,7),new THREE.MeshBasicMaterial({color:"#101f28"}));trunk.position.set(x,-12,-28);s.add(trunk);sphere([x,-8,-28],[1.8,5,1.2],"#102630");}
  return s;
 },[]);
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m instanceof THREE.MeshBasicMaterial)m.map?.dispose();m.dispose();});}});},[scene]);
 useFrame(({gl,camera:viewer})=>{
  if(!pane.current)return;local.copy(viewer.position);pane.current.worldToLocal(local);if(local.z<=.1)return;
  const near=.1,z=local.z;camera.position.copy(local);camera.rotation.set(0,0,0);
  camera.projectionMatrix.makePerspective((-.99-local.x)*near/z,(.99-local.x)*near/z,(1.485-local.y)*near/z,(-1.485-local.y)*near/z,near,500);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld();
  const previous=gl.getRenderTarget();gl.setRenderTarget(target);gl.render(scene,camera);gl.setRenderTarget(previous);
 });
 return <group><mesh ref={pane} position={[0,0,.085]}><planeGeometry args={[1.98,2.97]}/><meshBasicMaterial map={target.texture} toneMapped={false}/></mesh><mesh position={[0,0,.095]}><planeGeometry args={[1.98,2.97]}/><meshBasicMaterial color="#9ec9e0" transparent opacity={.008} depthWrite={false}/></mesh></group>;
}
