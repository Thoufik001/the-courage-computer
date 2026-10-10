"use client";
import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
type Key = { code: string; label: string; units: number; x: number; z: number };
const unit = 0.224;
function layout() {
  const keys: Key[] = [];
  const rows: [string, string, number][][] = [
    [
      ["Backquote", "~\n`", 1],
      ...Array.from(
        { length: 10 },
        (_, i) =>
          [
            `Digit${(i + 1) % 10}`,
            `${["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"][i]}\n${(i + 1) % 10}`,
            1,
          ] as [string, string, number],
      ),
      ["Minus", "_\n-", 1],
      ["Equal", "+\n=", 1],
      ["Backspace", "Backspace", 2],
    ],
    [
      ["Tab", "Tab", 1.5],
      ..."QWERTYUIOP"
        .split("")
        .map((c) => [`Key${c}`, c, 1] as [string, string, number]),
      ["BracketLeft", "{\n[", 1],
      ["BracketRight", "}\n]", 1],
      ["Backslash", "|\n\\", 1.5],
    ],
    [
      ["CapsLock", "Caps Lock", 1.75],
      ..."ASDFGHJKL"
        .split("")
        .map((c) => [`Key${c}`, c, 1] as [string, string, number]),
      ["Semicolon", ":\n;", 1],
      ["Quote", "\"\n'", 1],
      ["Enter", "Enter", 2.25],
    ],
    [
      ["ShiftLeft", "Shift", 2.25],
      ..."ZXCVBNM"
        .split("")
        .map((c) => [`Key${c}`, c, 1] as [string, string, number]),
      ["Comma", "<\n,", 1],
      ["Period", ">\n.", 1],
      ["Slash", "?\n/", 1],
      ["ShiftRight", "Shift", 2.75],
    ],
    [
      ["ControlLeft", "Ctrl", 1.25],
      ["MetaLeft", "◇", 1.25],
      ["AltLeft", "Alt", 1.25],
      ["Space", "", 6.25],
      ["AltRight", "Alt", 1.25],
      ["MetaRight", "◇", 1.25],
      ["ContextMenu", "▤", 1.25],
      ["ControlRight", "Ctrl", 1.25],
    ],
  ];
  rows.forEach((row, r) => {
    let x = -1.77;
    for (const [code, label, units] of row) {
      keys.push({
        code,
        label,
        units,
        x: x + (units * unit) / 2,
        z: -0.32 + r * 0.24,
      });
      x += units * unit;
    }
  });
  keys.push({ code: "Escape", label: "Esc", units: 1, x: -1.65, z: -0.7 });
  for (let i = 0; i < 12; i++)
    keys.push({
      code: `F${i + 1}`,
      label: `F${i + 1}`,
      units: 1,
      x: -1.15 + i * 0.238,
      z: -0.7,
    });
  return keys;
}
const keys = layout();
function capGeometry(width: number) {
  const g = new THREE.BufferGeometry(),
    vertices: number[] = [],
    indices: number[] = [];
  const depth = 0.2;
  // Tapered skirt, bevel shoulder, and a shallow concave finger dish.
  const rings = [
    [width / 2, depth / 2, 0],
    [width / 2, depth / 2, 0.033],
    [width / 2 - 0.024, depth / 2 - 0.018, 0.095],
    [width / 2 - 0.034, depth / 2 - 0.028, 0.104],
  ];
  for (const [x, z, y] of rings)
    vertices.push(-x, y, -z, x, y, -z, x, y, z, -x, y, z);
  for (let r = 0; r < 3; r++)
    for (let j = 0; j < 4; j++) {
      const a = r * 4 + j,
        b = r * 4 + ((j + 1) % 4),
        c = b + 4,
        d = a + 4;
      indices.push(a, d, b, b, d, c);
    }
  const offset = vertices.length / 3,
    n = 6,
    tw = width - 0.068,
    td = depth - 0.056;
  for (let z = 0; z <= n; z++)
    for (let x = 0; x <= n; x++) {
      const u = (x / n) * 2 - 1,
        v = (z / n) * 2 - 1;
      vertices.push(
        (u * tw) / 2,
        0.104 - 0.011 * (1 - u * u) * (1 - v * v),
        (v * td) / 2,
      );
    }
  for (let z = 0; z < n; z++)
    for (let x = 0; x < n; x++) {
      const a = offset + z * (n + 1) + x,
        b = a + 1,
        c = a + n + 1,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export default function KeyboardHardware({
  powered = true,
}: {
  powered?: boolean;
}) {
  const nodes = useRef(new Map<string, THREE.Group>());
  const atlas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#222a28";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    keys.forEach((key, i) => {
      const x = (i % 8) * 128,
        y = Math.floor(i / 8) * 96;
      const lines = key.label.split("\n");
      ctx.font = `${key.label.length > 5 ? 18 : 30}px Arial`;
      lines.forEach((line, j) =>
        ctx.fillText(line, x + 64, y + 48 + (j - (lines.length - 1) / 2) * 29),
      );
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  const caps = useMemo(
    () =>
      new Map(
        [...new Set(keys.map((k) => k.units))].map((u) => [
          u,
          capGeometry(u * unit - 0.019),
        ]),
      ),
    [],
  );
  const legends = useMemo(
    () =>
      keys.map((_, i) => {
        const g = new THREE.PlaneGeometry(0.13, 0.097);
        const uv = g.attributes.uv;
        for (let j = 0; j < uv.count; j++) {
          uv.setXY(
            j,
            ((i % 8) * 128 + uv.getX(j) * 128) / 1024,
            1 - (Math.floor(i / 8) * 96 + (1 - uv.getY(j)) * 96) / 1024,
          );
        }
        return g;
      }),
    [],
  );
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const n = nodes.current.get(e.code);
      if (n) gsap.to(n.position, { y: 0.055, duration: 0.04, overwrite: true });
    };
    const up = (e: KeyboardEvent) => {
      const n = nodes.current.get(e.code);
      if (n) gsap.to(n.position, { y: 0.105, duration: 0.12, overwrite: true });
    };
    const reset = () =>
      nodes.current.forEach((n) =>
        gsap.to(n.position, { y: 0.105, duration: 0.1 }),
      );
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
    };
  }, []);
  useEffect(
    () => () => {
      atlas.dispose();
      caps.forEach((g) => g.dispose());
      legends.forEach((g) => g.dispose());
    },
    [atlas, caps, legends],
  );
  return (
    <group position={[0.29, 2.2, 2.5]} rotation={[0.1, 0, 0]}>
      <RoundedBox
        args={[3.7, 0.23, 1.75]}
        radius={0.075}
        smoothness={4}
        position={[-0.09, 0, -0.05]}
      >
        <meshStandardMaterial color="#b9b59b" roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[3.55, 0.1, 1.63]}
        radius={0.035}
        smoothness={3}
        position={[-0.09, 0.085, -0.05]}
      >
        <meshStandardMaterial color="#a5a88d" roughness={0.9} />
      </RoundedBox>
      {keys.map((key, i) => (
        <group
          key={key.code}
          name={key.code}
          ref={(n) => {
            if (n) nodes.current.set(key.code, n);
            else nodes.current.delete(key.code);
          }}
          position={[key.x, 0.105, key.z]}
        >
          <mesh geometry={caps.get(key.units)} castShadow receiveShadow>
            <meshStandardMaterial
              color={key.units > 1 ? "#b9b59b" : "#c3bfa5"}
              roughness={0.53}
            />
          </mesh>
          {key.label && (
            <mesh
              geometry={legends[i]}
              position={[0, 0.109, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <meshBasicMaterial
                map={atlas}
                transparent
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
              />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[1.48, 0.112, -0.69]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.045, 0.015]} />
        <meshBasicMaterial color={powered ? "#a6d55f" : "#33422c"} />
      </mesh>
      <mesh position={[1.33, 0.112, -0.69]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.045, 0.015]} />
        <meshBasicMaterial color="#34402e" />
      </mesh>
    </group>
  );
}
