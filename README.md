# THE DIARY

An original candlelit 3D fan portfolio experience. Open the leather diary, write a thought, and watch the ink disappear before a different hand replies. No film imagery, sound, or quoted dialogue is included.

## Run

```sh
npm ci
cp .env.example .env.local
npm run dev
```

For production: `npm run build && npm start`. On a sandboxed macOS host that blocks FSEvents: `WATCHPACK_POLLING=true npm run dev -- --webpack`. The delivered app uses Next.js App Router, TypeScript, Tailwind 4, Three.js, React Three Fiber, Drei, react-three/postprocessing, GSAP, and Tegaki 1.0.3. Dependencies are locked in package-lock.json.

## Gemini

Set `GEMINI_API_KEY` and `GEMINI_MODEL` on the server. The example uses `gemini-3.1-flash-lite`, verified against Google's official model list on 2026-10-08: https://ai.google.dev/gemini-api/docs/models . The model is never guessed or selected silently in code. Without both variables, original canned dialogue keeps the whole interaction working. Set the key in `.env.local` for local use. The server streams Gemini output and keeps the key out of the browser bundle.

`POST /api/diary` accepts `{messages:[{role:'user'|'assistant',content:string}]}`. It validates alternating roles, keeps up to eight conversational turns (15 messages before a new answer), limits incoming messages to 240 Unicode code points, streams text, and caps model output at 280 characters with a 120-token provider budget. The client preserves a rolling eight-turn context in memory only. Reloading or closing the diary clears it. Configured Gemini receives conversation content; provider data policies apply.

Eight requests per minute are allowed per client key. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable an atomic shared Redis limiter. Otherwise a bounded process-local limiter is used; it resets on process restart and is not shared across replicas. Local Next defaults to one shared bucket, so untrusted clients cannot spoof their address. Set `TRUST_PROXY=true` only behind a proxy that replaces `x-forwarded-for`. The hosted Sites adapter uses the edge-provided `cf-connecting-ip`.

Distress signals receive a direct supportive response even when the provider is unavailable. The supplied character prompt also instructs the live model to drop the menace and encourage real-person support. The local phrase detector is a fallback, not comprehensive mental-health classification.

## Interaction

- Click the diary or use the keyboard-accessible “Touch the diary” button.
- Type up to 240 characters. Enter or the page's Enter button submits.
- Backspace erases with a brief smudge; Enter waits for queued strokes.
- Ink absorbs for 1.8 seconds, pauses, then the reply writes at about 12 characters/second with punctuation pauses.
- Start writing again to absorb the reply. Long content fades to another leaf.
- Escape or the close control reverses the camera and cover sequence.
- A candle control mutes synthesized sound. Sound starts on the first gesture.
- Reduced motion skips camera travel and shows finished ink. The native textarea supports mobile keyboards and composition input. Tap the paper to summon a mobile keyboard.
- An aria-live status mirrors completed replies. WebGL failure switches to the 2D page. `?2d` forces that fallback for inspection.

## Scene and handwriting

The book, fittings, candle, study, ink bottle and page geometry are original procedural assets. The cover opens at the spine; separate leaves riffle while the book lifts. At the top-down endpoint the DOM page is placed from four projected 3D corners, updated on resize. The idle camera drifts slightly; reduced motion stops idle movement and flicker.

Leather uses MeshPhysicalMaterial with normal/roughness maps and sheen. The scene uses an environment reflection fill and a flickering candle point light. Desktop quality adds N8AO and targeted DoF. Selective bloom selects the flame mesh only. ACES in the composer is the sole tone mapper. Mobile/reduced-motion quality omits N8AO and DoF.

Tegaki renders the reader's writing in Italianno and exposes active stroke heads for the feather to follow. The diary's reply uses the same script with a separate letter-by-letter blur reveal. The text uses multiply compositing and SVG edge displacement. Cormorant Garamond supplies display typography.

## Assets and optional swaps

- **Included, real CC0 surfaces:** Poly Haven `wood_table_worn` and `brown_leather`, with exact downloads in `public/textures/README.md`.
- **Procedural placeholders:** paper and stone maps. Add matching `paper-*` / `stone-*` color, OpenGL normal and roughness maps as described there.
- **Optional production models:** `public/models/diary.glb` and `table.glb`. Follow the dimensions and `CoverHinge` contract in `public/models/README.md`. Local Draco/KTX2 decoders are included. No GLB is needed to use the app.
- **Audio:** all four sounds are synthesized. `public/audio/README.md` documents the sample override interface if original or CC0 recordings are desired.
- **Live replies:** Gemini key/model configuration remains to be supplied. Upstash configuration is optional.

## Verification

`npm run build`, `npm run typecheck`, and `npm test` pass. Browser QA covers desktop 1440×900 idle/floating/writing states, the full write/absorb/reply cycle, backspace, Escape, mute, mobile 390×844, reduced motion, care fallback, and forced 2D mode. A local Chromium 310-character handwriting test measured 16.7 ms median / 16.8 ms p95 frame intervals (~60 fps) in 2D mode; this is not a guarantee for all GPUs or mobile hardware. Gemini and Upstash network integrations need credentials for live verification.

Unofficial fan project.

## October 8 interaction revision

The diary opens to blank writing paper. A quill rests in an inkpot beside the candle and flies to the page when touched. During writing it follows Tegaki's active stroke head; the ordinary cursor stays in use. Submitted ink absorbs quickly, while replies appear letter by letter in a softer blur. Manual page turning and the folded corner were removed at the user's request. Long replies retain automatic pagination.

The opening screen uses “Tom Riddle’s Diary” in locally bundled Italianno, a single tagline, and a “Touch the diary” button with a hand seal. A magical light-line progress indicator covers texture and scene loading. Sound starts enabled on the first gesture, with a soft harmonic opening cue and a bottom mute icon. The cover follows the supplied references, with a nameplate and Hogwarts crest. A projected amber rim and soft halo follow the cover silhouette, smoothly easing on hover or keyboard focus. The close control has a diamond ornament and Esc shortcut. “Made by Thoufik” links to LinkedIn.

Generated asset provenance is in `public/GENERATED-ASSETS.md`.

## October 8 paper revision

The right page uses fine laid writing paper as its 3D material, lit and shadowed by the scene; the transparent HTML overlay only positions the writing. The left inscription sits directly over the book's inside cover with no additional lining panel. The quill remains on the page through spaces and pauses and returns to the inkpot when text is sent or the book closes. Both voices use Italianno; reader text is drawn along stroke paths, and the diary's reply blurs in letter by letter. The absorption transition lasts about 650 ms. The “Touch the diary” cue is styled as an instruction, and the loader's embers cluster around its flame.
