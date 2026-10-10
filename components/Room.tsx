"use client";
import {useSurfaceTexture} from "./SurfaceTexture";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Outlines,
  Edges,
  RoundedBox,
  PerformanceMonitor,
  OrbitControls,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { gsap } from "gsap";
// Keep camera transitions on wall-clock time, including on slow renderers.
gsap.ticker.lagSmoothing(0);
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Attic from "./Attic";
import Chair from "./Chair";
import KeyboardHardware from "./KeyboardHardware";
import { LampHardware, TowerHardware } from "./Hardware";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { palette, paintScreen } from "@/lib/screen";
import { crtVertex, crtFragment } from "@/lib/crt-shader";
type V = [number, number, number];
type Props = {
  text: string;
  thinking: boolean;
  pulse: number;
  view: "room" | "entering" | "screen" | "leaving";
  onEnter: () => void;
  onReady: () => void;
  onArrive: () => void;
  onLeave: () => void;
  reduced: boolean;
  post?: boolean;
  onFailure?: () => void;
  powered: boolean;
  lit: boolean;
  ejected: boolean;
  onPower: () => void;
  onLamp: () => void;
  onEject: () => void;
};
function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = palette.case,
  r = 0,
  outline = true,
}: {
  p?: V;
  s?: V;
  color?: string;
  r?: number;
  outline?: boolean;
}) {
  return (
    <group position={p}>
      {r ? (
        <RoundedBox args={s} radius={r} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={0.75} metalness={0.03} />
          {outline && <Outlines thickness={0.023} color={palette.ink} />}
        </RoundedBox>
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={s} />
          <meshStandardMaterial color={color} roughness={0.75} metalness={0.03} />
          {outline && <Outlines thickness={0.023} color={palette.ink} />}
        </mesh>
      )}
    </group>
  );
}
function MonitorHousing() {
  const geometry = useMemo(() => {
    const sections = [[1.56,1.21,.59],[1.51,1.17,.12],[1.17,.97,-.65],[.87,.81,-1.5]];
    const count=48, vertices:number[]=[], indices:number[]=[];
    for (const [width,height,z] of sections) {
      for(let i=0;i<count;i++) {
        const angle=2*Math.PI*i/count, x=Math.cos(angle), y=Math.sin(angle);
        vertices.push(width*Math.sign(x)*Math.pow(Math.abs(x),.25),
          height*Math.sign(y)*Math.pow(Math.abs(y),.25),z);
      }
    }
    for(let ring=0;ring<sections.length-1;ring++) for(let i=0;i<count;i++) {
      const a=ring*count+i,b=ring*count+(i+1)%count,c=a+count,d=b+count;
      indices.push(a,b,c,b,d,c);
    }
    vertices.push(0,0,-1.5);
    const center=vertices.length/3-1;
    for(let i=0;i<count;i++) indices.push(center,3*count+i,3*count+(i+1)%count);
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  return <group>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#999981" side={THREE.DoubleSide} roughness={0.75} />
    </mesh>
    {Array.from({length:9},(_,i)=><Box key={i} p={[0,.52-i*.105,-1.506]} s={[1.15,.035,.018]} color="#41463b" outline={false} />)}
  </group>;
}
function RecessedBezel() {
  const geometry = useMemo(() => {
    const positions: number[] = [], indices: number[] = [];
    const g = new THREE.BufferGeometry();
    const count = 96;
    for (let i = 0; i <= count; i++) {
      const angle = Math.PI * 2 * i / count;
      const x = Math.cos(angle), y = Math.sin(angle);
      const edge = Math.max(Math.abs(x), Math.abs(y));
      // Four parabolic sides meet at distinct corners, like the reference CRT.
      const side = Math.min(3, Math.floor(i / 24));
      const t = (i - side * 24) / 24;
      const bendX = .057, bendY = .0498;
      let cornerX = 1, cornerY = 1;
      for (let j=0;j<10;j++) { cornerX=1-bendX*cornerY*cornerY; cornerY=1-bendY*cornerX*cornerX; }
      let gx: number, gy: number;
      if (side === 0) { gy = cornerY*(2*t-1); gx = 1-bendX*gy*gy; }
      else if (side === 1) { gx = cornerX*(1-2*t); gy = 1-bendY*gx*gx; }
      else if (side === 2) { gy = cornerY*(1-2*t); gx = -1+bendX*gy*gy; }
      else { gx = cornerX*(2*t-1); gy = -1+bendY*gx*gx; }
      const outerScale = Math.max(Math.abs(gx),Math.abs(gy));
      positions.push(1.43*gx/outerScale, 1.08*gy/outerScale, .84,
        1.25*gx, .925*gy, .775);
      if (i < count) {
        const k = i*2;
        indices.push(k,k+1,k+2,k+1,k+3,k+2);
        const material = [1,0,3,2][side];
        g.addGroup(i*6,6,material);
      }
    }
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices); g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geometry} receiveShadow>
    {["#252c29", "#424b40", "#626957", "#4e5749"].map((color,i) =>
      <meshStandardMaterial key={color} attach={`material-${i}`} color={color} side={THREE.DoubleSide} roughness={0.85} />)}
  </mesh>;
}
function Cable({
  points,
  r = 0.026,
  color = palette.ink,
}: {
  points: V[];
  r?: number;
  color?: string;
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 40, r, 6, false]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
function Slot({ name, children }: { name: string; children: React.ReactNode }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  useEffect(() => {
    let alive = true;
    const loader = new GLTFLoader();
    fetch(`/models/${name}.glb`, { method: "HEAD" })
      .then((r) => {
        if (r.ok)
          loader.load(
            `/models/${name}.glb`,
            (g) => {
              if (alive) setModel(g.scene);
              else
                g.scene.traverse((o) => {
                  if (o instanceof THREE.Mesh) o.geometry.dispose();
                });
            },
            undefined,
            () => {},
          );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name]);
  return model ? <primitive object={model} /> : children;
}
function ScreenPlane({
  text,
  thinking,
  pulse,
  powered,
  lit,
}: {
  powered: boolean;
  lit: boolean;
  text: string;
  thinking: boolean;
  pulse: number;
}) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 888;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, [canvas]);
  useEffect(() => {
    let alive = true;
    const draw = () => {
      if (alive) {
        paintScreen(canvas, text, thinking, pulse);
        texture.needsUpdate = true;
      }
    };
    draw();
    document.fonts.ready.then(draw);
    return () => {
      alive = false;
    };
  }, [canvas, texture, text, thinking, pulse]);
  useEffect(() => () => texture.dispose(), [texture]);
  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      time: { value: 0 },
      pulse: { value: 0 },
      powered: { value: 1 },
      powerTime: { value: 10 },
      lamp: { value: 0 },
      eye: { value: new THREE.Vector3() },
    }),
    [texture],
  );
  const material = useRef<THREE.ShaderMaterial>(null);
  const powerTransition = useRef({ powered, start: -10 });
  useFrame(({ clock, camera }) => {
    if (powerTransition.current.powered !== powered) {
      powerTransition.current = { powered, start: clock.elapsedTime };
    }
    const live = material.current?.uniforms;
    if (!live) return;
    live.powerTime.value = clock.elapsedTime - powerTransition.current.start;
    live.eye.value.copy(camera.position);
    live.time.value = clock.elapsedTime;
    live.pulse.value = pulse;
    live.powered.value = powered ? 1 : 0;
    live.lamp.value = lit ? 1 : 0;
  });
  return (
    <mesh position={[0.2, 4.27, 1.065]}>
      <planeGeometry args={[2.5, 1.85, 24, 24]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        vertexShader={crtVertex}
        fragmentShader={crtFragment}
      />
    </mesh>
  );
}
function CameraRig({
  view,
  onArrive,
  onLeave,
  onReady,
  reduced,
  onFailure,
}: Props) {
  const { camera, size, gl } = useThree();
  const orbit = useRef<OrbitControlsImpl>(null);
  const homePosition = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const target = useRef(new THREE.Vector3(0.25, 2.95, 0.25)),
    moving = useRef(false);
  useEffect(() => {
    onReady();
    const handler = (e: Event) => {
      e.preventDefault();
      onFailure?.();
    };
    gl.domElement.addEventListener("webglcontextlost", handler);
    return () => gl.domElement.removeEventListener("webglcontextlost", handler);
  }, [onReady, gl, onFailure]);
  useEffect(() => {
    const mobile = size.width < 650;
    if (!initialized.current) {
      homePosition.current.set(
        ...((mobile ? [2.0, 5.3, 11.3] : [2.4, 5.3, 11.3]) as V),
      );
      initialized.current = true;
    }
    const home = homePosition.current.toArray();
    if (view === "room") {
      (camera as THREE.PerspectiveCamera).fov=55;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      camera.position.set(...(home as V));
      target.current.set(0.25, 2.95, 0.25);
      camera.lookAt(target.current);
      return;
    }
    const entering = view === "entering";
    if (entering) homePosition.current.copy(camera.position);
    // Seated framing includes the CRT, the desk, and the actual animated keys.
    const portrait = size.width / size.height < 1;
    const seated: V = portrait ? [0.2, 4.9, 9.8] : [0.2, 4.9, 7.6];
    const seatedTarget: V = [0.2, 3.3, 0.9];
    if (view === "screen") {
      (camera as THREE.PerspectiveCamera).fov=42;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      camera.position.set(...seated);
      target.current.set(...seatedTarget);
      camera.lookAt(target.current);
      return;
    }
    moving.current = true;
    const dest = entering ? seated : home;
    const destTarget = entering ? seatedTarget : [0.25, 2.95, 0.25];
    const tl = gsap.timeline({
      onComplete: () => {
        moving.current = false;
        entering ? onArrive() : onLeave();
      },
    });
    tl.to(camera,{fov:entering?42:55,duration:reduced?0:1.65,ease:"power3.inOut",onUpdate:()=>{(camera as THREE.PerspectiveCamera).updateProjectionMatrix();}},0);
    tl.to(
      camera.position,
      {
        x: dest[0],
        y: dest[1],
        z: dest[2],
        duration: reduced ? 0 : 1.65,
        ease: "power3.inOut",
      },
      0,
    ).to(
      target.current,
      {
        x: destTarget[0],
        y: destTarget[1],
        z: destTarget[2],
        duration: reduced ? 0 : 1.65,
        ease: "power3.inOut",
      },
      0,
    );
    return () => {
      tl.kill();
    };
  }, [view, camera, size.width, size.height, reduced, onArrive, onLeave]);
  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      if (view !== "room" || !orbit.current) return;
      event.preventDefault();
      orbit.current.setAzimuthalAngle(
        THREE.MathUtils.clamp(orbit.current.getAzimuthalAngle() +
          (event.deltaY + event.deltaX) * 0.002, -.58, .58),
      );
    };
    gl.domElement.addEventListener("wheel", wheel, { passive: false });
    return () => gl.domElement.removeEventListener("wheel", wheel);
  }, [gl, view]);
  useFrame(({ clock }) => {
    if (view === "room" && !moving.current) return;
    camera.lookAt(target.current);
    if (moving.current && !reduced)
      camera.rotateZ(Math.sin(clock.elapsedTime * 2) * 0.0015);
    if (!reduced && view === "room" && !moving.current) {
      camera.position.y += Math.sin(clock.elapsedTime * 0.8) * 0.0003;
    }
  });
  return (
    <OrbitControls
      ref={orbit}
      makeDefault
      enabled={view === "room"}
      target={[0.25, 2.95, 0.25]}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.5}
      minAzimuthAngle={-.58}
      maxAzimuthAngle={.58}
      minPolarAngle={1.35}
      maxPolarAngle={1.48}
    />
  );
}
function Scene(props: Props) {
  const [hover, setHover] = useState(false);
  const outline = useRef<THREE.Mesh>(null);
  const wall = useRef<THREE.Group>(null);
  useFrame(({ clock, camera }) => {
    if (wall.current) wall.current.visible = camera.position.z > -1.8;
    if (outline.current) {
      const m = outline.current.material as THREE.MeshBasicMaterial;
      m.opacity = hover ? 0.08 + Math.sin(clock.elapsedTime * 4) * 0.025 : 0;
    }
  });
  return (
    <>
      <color attach="background" args={["#49392f"]} />
      <ambientLight intensity={1.65} />
      <directionalLight
        position={[-4, 8, 6]}
        intensity={1.1}
        color="#eee0be"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <CameraRig {...props} />
      <group ref={wall}><Attic /></group>
      <Box
        p={[0, -0.12, 1]}
        s={[22, 0.2, 15]}
        color="#40372c"
        outline={false}
      />
      {Array.from({ length: 14 }, (_, i) => (
        <Box
          key={i}
          p={[-10 + i * 1.5, 0, 1]}
          s={[0.025, 0.012, 15]}
          color="#211e1b"
          outline={false}
        />
      ))}
      <Slot name="desk">
        <Box p={[0, 1.94, 0.9]} s={[9, 0.28, 4.9]} color="#827351" r={0.035} />
        <Box p={[0, 1.72, 3.28]} s={[9, 0.25, 0.14]} color="#5a4f38" />
        {[-3.9, 3.9].map((x) => (
          <group key={x}>
            <Box p={[x, 0.86, 1.9]} s={[0.25, 1.75, 0.32]} color="#544732" />
            <Box p={[x, 0.86, -0.8]} s={[0.25, 1.75, 0.32]} color="#544732" />
          </group>
        ))}
        <Box p={[2.9, 1.24, 1]} s={[2, 0.91, 2.8]} color="#716344" />
        {[1.06, 1.53].map((y) => (
          <group key={y}>
            <Box p={[2.9, y, 2.42]} s={[1.92, 0.43, 0.12]} color="#8d7c53" />
            <Box p={[2.9, y, 2.52]} s={[0.49, 0.08, 0.1]} color="#3d372c" />
          </group>
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Cable
            key={i}
            points={[
              [-4.3, 2.089, -1.2 + i * 0.32],
              [-2, 2.089, -1.22 + i * 0.32],
              [1, 2.089, -1.19 + i * 0.32],
              [4.3, 2.089, -1.2 + i * 0.32],
            ]}
            r={0.007}
            color="#685839"
          />
        ))}
      </Slot>
      <Rug/>
      {Array.from({length:35},(_,i)=><Box key={`fringe${i}`} p={[-3.02+i*.19,.049,6.17]} s={[.04,.01,.15]} color="#91aba0" outline={false}/>)}
      <Chair view={props.view} onEnter={props.onEnter} reduced={props.reduced}/>
      <LampHardware lit={props.lit} onToggle={props.onLamp} />
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return;
          if (props.view === "room") props.onEnter();
          else if (props.view === "screen")
            document.querySelector<HTMLInputElement>(".mobile-input")?.focus();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return;
          if (props.view === "room") {
            setHover(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <group position={[0.2, 4.27, 0.28]}>
          <Slot name="monitor">
            <MonitorHousing />
            <Box
              p={[0, 0, 0.61]}
              s={[3.14, 2.44, 0.21]}
              r={0.025}
              color="#b9b59b"
            />
            <RecessedBezel />
            <mesh position={[0,-1.32,0]}><cylinderGeometry args={[.35,.42,.35,32]}/><meshStandardMaterial color="#929984" roughness={.7}/></mesh>
            <mesh position={[0,-1.47,.12]}><cylinderGeometry args={[.69,.73,.17,48]}/><meshStandardMaterial color="#aaa990" roughness={.7}/></mesh>
            <Box
              p={[1.16, -1.06, 0.75]}
              s={[0.15, 0.07, 0.035]}
              color="#485144"
            />
            <mesh position={[0.95, -1.06, 0.77]}>
              <circleGeometry args={[0.022, 8]} />
              <meshBasicMaterial
                color={props.powered ? "#bbc498" : "#374638"}
              />
            </mesh>
          </Slot>
        </group>
        <ScreenPlane
          text={props.text}
          thinking={props.thinking}
          pulse={props.pulse}
          powered={props.powered}
          lit={props.lit}
        />
        <TowerHardware
          powered={props.powered}
          ejected={props.ejected}
          onPower={props.onPower}
          onEject={props.onEject}
        />
        <Slot name="keyboard">
          <KeyboardHardware powered={props.powered} />
        </Slot>
      </group>
      {/* Each lead terminates in a plug, rather than dangling at a desk edge. */}
      <Box p={[0.2, 3.23, -1.26]} s={[0.3, 0.18, 0.12]} color="#343837" r={0.025} />
      <Box p={[.6, 2.34, -1.06]} s={[0.3, 0.18, 0.12]} color="#343837" r={0.025} />
      <Box p={[-.1, 2.34, -1.06]} s={[0.18, 0.16, 0.12]} color="#343837" r={0.02} />
      <Box p={[1.3, 2.34, -1.06]} s={[0.24, 0.22, 0.12]} color="#343837" r={0.025} />
      <Box p={[-0.65, 2.28, 1.17]} s={[0.16, 0.13, 0.14]} color="#343837" r={0.02} />
      <Cable points={[
        [-0.65, 2.28, 1.17], [-0.65, 2.14, 0.95], [-1.6, 2.12, 0.35],
        [-1.65, 2.12, -0.85], [0.4, 2.12, -1.15], [3.1, 2.15, -1.12],
        [-.1, 2.14, -1.2], [-.1, 2.34, -1.12],
      ]} r={0.022} />
      <Cable points={[
        [0.2, 3.23, -1.32], [0.2, 2.9, -0.9], [1.1, 2.25, -1.05],
        [2.4, 2.22, -1.12], [.6, 2.18, -1.2], [.6, 2.34, -1.12],
      ]} />
      {/* A mounted strip and wall outlet give the power leads real endpoints. */}
      <Box p={[-0.3, 1.55, -1.76]} s={[1.65, 0.3, 0.18]} color="#c0baa2" r={0.04} />
      {[-0.85, -0.3, 0.25].map(x => (
        <Box key={x} p={[x, 1.55, -1.64]} s={[0.23, 0.17, 0.12]} color="#343837" r={0.025} />
      ))}
      <Cable points={[
        [-3.05, 2.12, -0.38], [-3.1, 2.12, -0.75], [-2.2, 2.12, -1.25],
        [-1.1, 2.12, -1.45], [-0.85, 1.9, -1.75], [-0.85, 1.55, -1.58],
      ]} />
      <Cable points={[
        [0.6, 3.33, -1.26], [0.6, 2.5, -1.04], [0.2, 2.12, -1.35],
        [-0.3, 1.95, -1.75], [-0.3, 1.55, -1.58],
      ]} />
      <Box p={[0.6, 3.33, -1.26]} s={[0.22, 0.18, 0.12]} color="#343837" r={0.02} />
      <Cable points={[
        [1.3, 2.34, -1.12], [1.3, 2.18, -1.3], [1.1, 2.12, -1.4],
        [1.9, 2.12, -1.4], [0.25, 1.95, -1.75], [0.25, 1.55, -1.58],
      ]} />
      <Box p={[-1.65, 0.65, -2.2]} s={[0.32, 0.46, 0.07]} color="#bcb59a" r={0.025} />
      <Box p={[-1.65, 0.65, -2.12]} s={[0.17, 0.2, 0.13]} color="#343837" r={0.02} />
      <Cable points={[
        [-1.12, 1.55, -1.76], [-1.4, 1.45, -1.88], [-1.55, 1.05, -2],
        [-1.65, 0.65, -2.05],
      ]} />
    </>
  );
}
function FrameClock() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    // Fine CRT grain refreshes at 24 Hz; keys and the dolly remain responsive.
    const timer = setInterval(() => invalidate(), 1000 / 24);
    return () => clearInterval(timer);
  }, [invalidate]);
  return null;
}
function Room(props: Props) {
  const [dpr, setDpr] = useState(1.25);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      shadows
      camera={{ fov: 55, position: [2.4, 5.3, 11.3], near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.NoToneMapping,
      }}
    >
      <FrameClock />
      <PerformanceMonitor
        bounds={() => [18, 35]}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(devicePixelRatio, 1.5))}
      />
      <Scene {...props} />
      {props.post && props.view !== "screen" && (
        <EffectComposer multisampling={2}>
          <Bloom luminanceThreshold={1.05} intensity={0.12} mipmapBlur />
          <Vignette offset={0.25} darkness={0.28} />
          <Noise opacity={0.023} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function Rug(){const weave=useSurfaceTexture("rug");return <group position={[.2,.045,2.5]}>
 <RoundedBox args={[6.6,.045,7.2]} radius={.02} receiveShadow><meshStandardMaterial map={weave} bumpMap={weave} bumpScale={.085} color="#709b93" roughness={1}/></RoundedBox>
 {[-1,1].map(side=><group key={side}>
  <mesh position={[side*3.16,.026,0]} receiveShadow><boxGeometry args={[.13,.008,7.05]}/><meshStandardMaterial map={weave} color="#466d66" roughness={1}/></mesh>
  <mesh position={[0,.026,side*3.46]} receiveShadow><boxGeometry args={[6.35,.008,.13]}/><meshStandardMaterial map={weave} color="#466d66" roughness={1}/></mesh>
  {Array.from({length:58},(_,i)=><mesh key={i} position={[-3.12+i*.11,.033,side*3.46]}><boxGeometry args={[.045,.005,.025]}/><meshStandardMaterial color="#a8bba5" roughness={1}/></mesh>)}
 </group>)}
 </group>;}
export default memo(Room);
