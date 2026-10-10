# COURAGE-OS

An unofficial interactive fan portfolio built with Next.js App Router, TypeScript, React Three Fiber, Three.js, Drei, GSAP, Tailwind 4, and React Postprocessing.

## Run

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Set `GEMINI_API_KEY` in `.env.local` for live answers. The default `GEMINI_MODEL` is `gemini-3.1-flash-lite`, validated with the live Gemini API on 9 October 2026. Without a key, the computer returns a canned network remark. The key stays in the server route.

```sh
npm run build
npm start
```

If the host blocks filesystem watchers, use the production build/start commands for preview.

## Controls

Click the computer (or press Enter) to sit down. Type a question, Backspace to edit, Enter to send. Escape or the curved cartoon back arrow returns to the room. On touch devices, tap the screen to open the native keyboard. The top-right cartoon sound control mutes both speech and effects. The greeting and replies use the browser’s English speech voice, with a lower pitch. Voice selection waits for the system list, locks to a named male voice (Alex/Daniel/Fred or another supported male voice), and never uses the browser’s arbitrary English default. Devices with no exposed supported male voice remain silent rather than switch to a female voice. Effects are synthesized until original WAV overrides are supplied. Audio starts only after a user gesture.

The screen uses a shared canvas painter: custom glowing single-center-line glyphs, automatic uppercase wrapping, two glass reflections, scanlines, faint glow, and barrel warping. The same painter supplies the CRT texture and DPR-aware 2D overlay. A reversible GSAP camera move enters a seated view with the keyboard visible below the monitor. The live 3D screen uses a local GLSL CRT shader for curved glass, phosphor diffusion, fine scanlines, mild flicker, grain, and a rolling refresh band. The 2D canvas is retained for the WebGL and reduced-motion fallback. Reduced-motion preferences skip the move; WebGL failure uses the canvas alone.

The outer camera orbits the computer with dragging or scrolling. The keyboard has sculpted concave keycaps, staggered rows, modifier widths, legends, and animated physical key presses. Click the lamp for an illuminated shade interior and rim, a directional beam over the keyboard and monitor, and warm spill light on the wall and nearby surfaces, the tower power button to switch the CRT and hum off/on, and the eject button to open/close the tray. Clicking the extended tray or CD also closes it. The latest production build and physical tray-click browser check passed on 9 October 2026; lamp-on and lamp-off screenshots were visually inspected. The camera transition has no depth-of-field blur. Power-off vertically collapses the live picture over 200 ms, contracts the white line to a point over 180 ms, then fades the phosphor point by 800 ms. The final glass is black with dim room reflections. Power-on warms up over 480 ms. Thinking uses animated dots.

## Deployment to Vercel

The private `/activity` dashboard stores sessions in the linked Neon `production` branch. `DATABASE_URL` is server-only and uses Neon's pooled connection; `DATABASE_URL_UNPOOLED` is for migrations. Apply `db/neon-schema.sql` to a fresh database, then set `DATABASE_URL`, `ACTIVITY_PASSWORD_HASH`, `ACTIVITY_SIGNING_SECRET`, and `CRON_SECRET` in Vercel. The daily Vercel cron removes sessions older than 365 days. `scripts/migrate-activity-neon.mjs` was used to copy the prior Supabase records and is safe to rerun during a migration window.

Import this folder as the project root using Vercel's Next.js preset. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in Vercel environment settings. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for a shared serverless rate limit; otherwise limits apply independently in each warm process. No deployment account or production credentials are bundled. The production site is deployed at https://the-courage-computer.vercel.app.

`POST /api/chat` accepts `{messages:[{role:'user'|'assistant',content:string}]}`. Histories must alternate, begin and end with user messages, and contain no more than six user turns. Each message is limited to 200 characters. The route limits requests to 12 per IP per minute, caps request size, streams plain text, allows 128 output tokens with minimal thinking, and uses an original in-character fallback on errors.

## Assets and remaining reference work

All room objects are procedural: monitor, tower, keyboard, desk, lamp, and cables. These are intentional defaults, not downloaded show assets. The supplied reference frame was sampled on 8 October 2026: screen teal `#70b8a7`, phosphor lettering `#abe4c7`, case `#f4f4d5`, bezel `#9fa688`, wall `#833e29`. The screen now uses a deeper teal (#519f91) and brighter phosphor (#d3ffe0), with two narrow white arc reflections at opposite corners; the room geometry and remaining room palette retain their procedural defaults. The seated camera now keeps the keyboard visible. Exact whole-room matching still needs an art pass.

- Optional original GLB replacements: `public/models/desk.glb`, `monitor.glb`, `tower.glb`, `keyboard.glb`, `lamp.glb`. See `public/models/README.md` for dimensions/origins. The screen remains live. Keyboard GLB animation bindings depend on its hierarchy; the default procedural keys are animated by event.code.
- Optional original or licensed sound replacements: `public/audio/key.wav`, `blip.wav`, `enter.wav`, `power.wav`. See `public/audio/README.md`. The CRT hum remains synthesized.
- Live Gemini replies need your server-side key. Canned offline and idle replies work without it.
- A future higher-fidelity art pass may replace procedural geometry and tune screen shape and lettering against the supplied reference frame.

Michroma is bundled locally under the SIL Open Font License in `public/fonts/OFL.txt`. No show dialogue, audio, or models are bundled.

## Verification

Production build passed. All ten browser checks passed in the latest verification run. Hardware and locked male-voice checks were rerun with Metal rendering after software-rendering timeouts. A rendered-pixel check confirms the glass turns black after CPU shutdown; shader uniforms are updated on the live material. Desktop and mobile screenshots were inspected. No runtime or shader errors were captured in the room/transition test.

```sh
npx playwright install chromium
# Start the production server first, then:
npm test
# Optional on macOS for GPU-backed checks:
COURAGE_QA_GPU=metal npm test
```

The suite covers the room-to-screen move, typing and Backspace, reply fallback, mute, cartoon back arrow reversal, physical lamp/power/CD controls, orbit scrolling and dragging, speech dispatch, mobile input/reduced motion, missing WebGL, response display, API validation, and in-memory rate limits. Browser QA uses 1440×900 and 390×844 screenshots. Live Gemini was verified separately with the configured local key. Upstash still requires credentials and was not exercised.


## CRT and speech references

- [CRT System: deflection, scanning and phosphor persistence](https://www.crt-mon.com/pdf/_CRT-Data/CRT-System.pdf). The shutdown is a stylized classic line/point collapse, rather than a claim that every CRT model powers down identically.
- [Web Speech getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices) and [utterance voice selection](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/voice). Browser voices are platform dependent; selecting a generic English voice does not guarantee a male voice.

## Response latency (9 October 2026)

The client no longer adds a random 400–900 ms wait, buffers the whole response, or waits for completion before starting the letter animation. Streamed sentences enter the male voice queue as soon as they are complete. The letter reveal waits for actual speech start; native word-boundary character indices gate the next word. Letters within that word interpolate at a pace learned from boundary elapsed times (40–110 ms per letter), so text cannot run several words ahead of the voice. Voice end completes the sentence reveal. Muted/unavailable speech uses a slower 70 ms letter reveal. Engines without word events use estimated timing from speech start; browser speech exposes word timing rather than phoneme timing. Power-off aborts the request. Failed HTTP replies are excluded from history. The server reuses its SDK client, prefers IPv4, requests minimal thinking, and retains up to 100 exact-context replies for 60 seconds in process memory. Failed responses are not cached.

Measured locally for “What is 2+2?”: Gemini 3.5 Flash-Lite took 9,472 ms to first text in a successful request and another request exceeded 10 seconds. The selected Gemini 3.1 Flash-Lite returned the first text in 1,061 ms and completed in 1,102 ms; an identical cached request completed in 6 ms. These are individual measurements, not latency guarantees. Provider/network traffic still varies. The key lives only in ignored `.env.local`, is excluded from the source archive, and was verified absent from browser bundles.

[Google’s thinking guidance](https://ai.google.dev/gemini-api/docs/thinking.md) supports minimal thinking for simple questions. No premium inference tier is enabled.

Speech-paced letters use [Web Speech boundary character indices and elapsed times](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisEvent), with automated checks proving the display waits for speech start and the next word boundary.

The attic now uses the supplied framed Courage/Nowhere artwork, horizontal timber walls and floor, pitched roof beams, a left window and right red door. The desktop computer sits beneath the monitor with working power and eject controls. The supplied theme loops at 16% volume after the first user interaction; its musical-note toggle is independent of the sound/voice control. Footer links credit Thoufik and the Courage inspiration. Replies may occasionally use the requested short signature quips.

Room update: the window is mounted on the left side wall, the red door on the right side wall, and the roof ridge runs across the attic. A centered hanging bulb lights the room. Clicking the orange wooden chair or monitor slides the chair back and enters the seated view; leaving restores it. A teal rug sits beneath the desk and chair. Framed posters sway gently from their nail on hover; clicking drops them with a synthesized glass-crack sound, holds them on the floor for five seconds, then returns them with a blur/fade. Poster and chair interactions were verified in the browser.
