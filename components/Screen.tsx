"use client";
import { useEffect, useRef } from "react";
import { paintScreen, dotted } from "@/lib/screen";
export function Screen({
  text,
  thinking = false,
  pulse = 0,
}: {
  text: string;
  thinking?: boolean;
  pulse?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      const r = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      paintScreen(canvas, text, thinking, pulse);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    document.fonts.ready.then(draw);
    draw();
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [text, thinking, pulse]);
  return <canvas ref={ref} className="crt-canvas" aria-label={text} />;
}
export function DottedLabel({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const draw = () => {
      c.width = 760;
      c.height = 44;
      const x = c.getContext("2d");
      if (x) {
        x.clearRect(0, 0, 760, 44);
        dotted(x, text, 380, 22, Math.min(15, 700 / (text.length * 1.2)));
      }
    };
    document.fonts.ready.then(draw);
    draw();
  }, [text]);
  return <canvas ref={ref} className="dotted-label" aria-label={text} />;
}
