"use client";
import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import type { ThreeEvent } from "@react-three/fiber";
const stop = (event: ThreeEvent<MouseEvent>) => {
  event.stopPropagation();
};
const hover = () => {
  document.body.style.cursor = "pointer";
};
const unhover = () => {
  document.body.style.cursor = "auto";
};
function Part({
  size,
  position = [0, 0, 0],
  color = "#b9b59b",
  radius = 0.02,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
  radius?: number;
}) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} position={position}>
      <meshStandardMaterial color={color} roughness={0.65} />
    </RoundedBox>
  );
}
export function LampHardware({
  lit,
  onToggle,
}: {
  lit: boolean;
  onToggle: () => void;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(-0.9, 2.3, 1.25);
  return (
    <group>
      <group
        position={[-3.05, 2.1, 0.15]}
        onClick={(e) => {
          stop(e);
          if (e.delta < 5) onToggle();
        }}
        onPointerOver={hover}
        onPointerOut={unhover}
      >
        <mesh>
          <cylinderGeometry args={[0.53, 0.65, 0.11, 40]} />
          <meshStandardMaterial
            color="#65685c"
            roughness={0.42}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.38, 0.5, 0.11, 40]} />
          <meshStandardMaterial
            color="#8a8973"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.74, 0]} rotation={[0, 0, -0.13]}>
          <cylinderGeometry args={[0.055, 0.065, 1.32, 16]} />
          <meshStandardMaterial
            color="#898b78"
            roughness={0.4}
            metalness={0.45}
          />
        </mesh>
        <mesh position={[0.19, 1.46, 0]} rotation={[0, 0, -0.56]}>
          <cylinderGeometry args={[0.06, 0.06, 0.65, 16]} />
          <meshStandardMaterial
            color="#898b78"
            roughness={0.4}
            metalness={0.45}
          />
        </mesh>
        <group position={[0.49, 1.94, 0]} rotation={[0, 0, -0.27]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.64, 0.6, 40, 1, true]} />
            <meshStandardMaterial
              color={lit ? "#c4b78a" : "#a9a27d"}
              emissive="#dba84b"
              emissiveIntensity={lit ? 0.18 : 0}
              roughness={0.45}
              metalness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.19, 0.62, 0.575, 40, 1, true]} />
            <meshStandardMaterial color="#eee3bb" side={THREE.BackSide}
              roughness={0.5} emissive="#ffe5a3" emissiveIntensity={lit ? 1.2 : 0} />
          </mesh>
          <mesh position={[0,-0.3,0]} rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.635,0.018,8,48]} />
            <meshStandardMaterial color={lit ? "#ffe6ac" : "#8b896f"}
              emissive="#ffdb83" emissiveIntensity={lit ? 1.4 : 0} />
          </mesh>
          <mesh position={[0, -0.21, 0]}>
            <sphereGeometry args={[0.105, 20, 12]} />
            <meshStandardMaterial
              color={lit ? "#fff2c0" : "#c4c6b8"}
              emissive="#ffdda0"
              emissiveIntensity={lit ? 4 : 0}
              roughness={0.25}
            />
          </mesh>
        </group>
        <Part
          size={[0.11, 0.035, 0.12]}
          position={[-0.27, 0.15, 0.27]}
          color={lit ? "#d6cfad" : "#363e33"}
          radius={0.009}
        />
      </group>
      <primitive object={target} />
      {lit && (
        <>
        <pointLight position={[-2.5,3.72,.15]} color="#ffe1a0" intensity={10} distance={8} decay={2} />
        <spotLight
          position={[-2.56, 3.83, 0.15]}
          target={target}
          color="#ffe3a0"
          intensity={38}
          distance={10}
          angle={0.83}
          penumbra={0.5}
          decay={2}
        />
        </>
      )}
    </group>
  );
}
export function TowerHardware({powered,ejected,onPower,onEject}:{powered:boolean;ejected:boolean;onPower:()=>void;onEject:()=>void}) {
  const tray=useRef<THREE.Group>(null);
  useEffect(()=>{if(!tray.current)return;const tween=gsap.to(tray.current.position,{z:ejected?1.88:1.09,duration:.65,ease:"power2.inOut"});return()=>{tween.kill();};},[ejected]);
  return <group position={[.2,2.43,.05]}>
    <Part size={[3.55,.70,2.1]} color="#a5a88d" radius={.025}/>
    <Part size={[3.51,.64,.1]} position={[0,0,1.045]} color="#c9c7a7" radius={.016}/>
    <Part size={[1.58,.21,.026]} position={[-.45,.13,1.106]} color="#777f70" radius={.007}/>
    <group ref={tray} position={[-.45,.13,1.09]} onClick={e=>{stop(e);if(ejected&&e.delta<5)onEject();}} onPointerOver={()=>{if(ejected)hover();}} onPointerOut={unhover}>
      <Part size={[1.48,.042,.88]} position={[0,-.025,-.43]} color="#414a41" radius={.01}/>
      <Part size={[1.51,.12,.048]} color="#babd9c" radius={.008}/>
      <Part size={[1.33,.035,.018]} position={[-.02,.02,.03]} color="#303a30" radius={.002}/>
      <mesh position={[0,.005,-.43]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.05,.36,64]}/><meshStandardMaterial color="#c1d1d1" metalness={.85} roughness={.15} side={THREE.DoubleSide}/></mesh>
    </group>
    <group position={[.47,.13,1.13]} onClick={e=>{stop(e);if(e.delta<5)onEject();}} onPointerOver={hover} onPointerOut={unhover}>
      <Part size={[.16,.07,.045]} color="#77816b" radius={.008}/>
      <mesh><boxGeometry args={[.25,.22,.09]}/><meshBasicMaterial visible={false}/></mesh>
    </group>
    <group position={[1.29,0,1.13]} onClick={e=>{stop(e);if(e.delta<5)onPower();}} onPointerOver={hover} onPointerOut={unhover}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.115,.115,.055,32]}/><meshStandardMaterial color={powered?"#d7562f":"#773c2c"} roughness={.4}/></mesh>
      <mesh><boxGeometry args={[.3,.3,.1]}/><meshBasicMaterial visible={false}/></mesh>
    </group>
    {Array.from({length:8},(_,i)=><Part key={i} size={[.42,.015,.015]} position={[-1.49,-.12+i*.033,1.11]} color="#606b55" radius={.002}/>)}
    <mesh position={[.85,-.11,1.112]}><circleGeometry args={[.024,12]}/><meshBasicMaterial color={powered?"#b5c78c":"#52604a"}/></mesh>
  </group>;
}
