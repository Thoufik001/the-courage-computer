import { monoline, lineWidth } from "./monoline";
export const palette = {
  screen: "#519f91",
  text: "#d3ffe0",
  case: "#b9b59b",
  ink: "#211b20",
  wood: "#76513e",
  keys: "#777a78",
};
export const greeting = "OH, GOOD.\nYOU AGAIN.\nWHAT IS IT\nTHIS TIME?";
export function dotted(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
) {
  monoline(ctx, text, x, y, size, palette.text);
}
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  size: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.toUpperCase().split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      if (lineWidth(word, size) > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let part = "";
        for (const char of word) {
          if (lineWidth(part + char, size) > width) {
            lines.push(part);
            part = "";
          }
          part += char;
        }
        line = part;
        continue;
      }
      const next = line ? `${line} ${word}` : word;
      if (lineWidth(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}
export function paintScreen(
  canvas: HTMLCanvasElement,
  text: string,
  blink = false,
  pulse = 0,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, [w * 0.07]);
  ctx.clip();
  ctx.fillStyle = palette.screen;
  ctx.fillRect(0, 0, w, h);
  // Light falloff belongs to CRT glass, not interface chrome.
  const falloff = ctx.createRadialGradient(
    w * 0.48,
    h * 0.44,
    w * 0.05,
    w * 0.5,
    h * 0.5,
    w * 0.64,
  );
  falloff.addColorStop(0, "#ffffff06");
  falloff.addColorStop(1, "#063f3715");
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, w, h);
  // Fit to the physical glass, including its curved-edge safe area. A fixed
  // five-line limit compressed longer replies into a small central rectangle.
  const usableWidth = w * 0.84;
  const usableHeight = h * 0.76;
  const longestWord = Math.max(1, ...text.split(/\s+/).map(word => word.length));
  let size = Math.min(w * 0.078, h * 0.125, usableWidth / (longestWord * 1.2));
  let lines = wrap(ctx, text, usableWidth, size);
  while ((lines.length - 1) * size * 1.43 + size > usableHeight && size > w * 0.022) {
    size *= 0.94;
    lines = wrap(ctx, text, usableWidth, size);
  }
  // Start at the center and grow outward as lines arrive. Short replies should
  // not place two lines at opposite edges of the glass.
  const leading = lines.length > 1
    ? Math.min(size * 1.65, (usableHeight - size) / (lines.length - 1))
    : 0;
  lines.forEach((line, i) => {
    const y = h * 0.5 + (i - (lines.length - 1) / 2) * leading;
    const scale = 1 - 0.018 * Math.pow((y / h - 0.5) * 2, 2);
    ctx.save();
    ctx.translate(w * 0.5, y);
    ctx.scale(scale, 1);
    dotted(ctx, line, 0, 0, size);
    ctx.restore();
  });
  if (blink) dotted(ctx, "_", w * 0.5, h * 0.83, size * 0.7);
  ctx.fillStyle = "#092a3010";
  for (let y = 0; y < h; y += Math.max(3, h / 210)) ctx.fillRect(0, y, w, 1);
  if (pulse) {
    ctx.fillStyle = `rgba(210,255,235,${pulse * 0.12})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
