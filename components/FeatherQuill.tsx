'use client';
import {useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';

// The photographed feather already includes its shaft and nib. Bend that single
// textured surface in 3D; adding a second shaft made the quill appear doubled.
function curvedFeather(){
 const geometry=new THREE.PlaneGeometry(.78,1.52,12,24);
 const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),v=(p.getY(i)+.76)/1.52;
  // The photographed nib is at the bottom. Keep it at the group origin;
  // the feather's body then rises above the page as the quill tilts.
  p.setXYZ(i,x+.03+v*.12,p.getY(i)+.76,
   .015+Math.abs(x)*.25+Math.sin(v*Math.PI)*.07);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();return geometry;
}
function softenVane(){
 const data=new Uint8Array(256*4);
 for(let i=0;i<256;i++){
  const v=i/255,t=Math.max(0,Math.min(1,(v-.58)/.42));
  const fade=1-.9*t*t*(3-2*t),channel=Math.round(fade*255);
  data.set([channel,channel,channel,255],i*4);
 }
 const map=new THREE.DataTexture(data,1,256,THREE.RGBAFormat);
 map.minFilter=THREE.LinearFilter;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;
 return map;
}
export default function FeatherQuill(){
 const photo=useTexture('/quill.png');photo.colorSpace=THREE.SRGBColorSpace;
 const surface=useMemo(curvedFeather,[]),vaneFade=useMemo(softenVane,[]);
 return <mesh geometry={surface} castShadow>
  <meshStandardMaterial map={photo} alphaMap={vaneFade} transparent alphaTest={.12} side={THREE.DoubleSide} shadowSide={THREE.DoubleSide} roughness={.96} metalness={0} depthWrite={false}/>
 </mesh>;
}
