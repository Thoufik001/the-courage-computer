# Audio override slots

The shipped experience uses WebAudio synthesis only: bandpass noise for quill strokes, quiet randomized candle crackles, a paper-noise envelope, and a pitched wooden thud. Audio begins on a gesture and can be muted.

This folder is reserved for original or CC0 sample replacements. No copyrighted film sound is included. To replace synthesis, decode your sample in `lib/sound.ts` and retain the existing `start`, `scratch`, `rustle`, `thud`, `mute` and `dispose` interface. Scratch amplitude should continue to follow pen-tip velocity.
