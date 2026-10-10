type SpeechTiming = { onStart?: () => void; onBoundary?: (index: number, elapsed: number) => void; onEnd?: () => void; onUnavailable?: () => void };
type Sound = "key" | "blip" | "power" | "enter";
class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  private samples = new Map<string, AudioBuffer>();
  muted = false;
  private humGain: GainNode | null = null;
  private powered = true;
  private voice: SpeechSynthesisVoice | null = null;
  private voiceRequest = 0;
  private speechFinishes = new Map<SpeechSynthesisUtterance, () => void>();
  private utterance: SpeechSynthesisUtterance | null = null;
  private glassLoad:Promise<void>|null=null;
  private speechUnlocked = false;
  unlockVoice() {
    if(typeof window === "undefined" || !("speechSynthesis" in window) || this.muted)return;
    speechSynthesis.getVoices();
    speechSynthesis.resume();
    if(this.speechUnlocked || this.utterance)return;
    this.speechUnlocked=true;
    const warmup=new SpeechSynthesisUtterance(".");warmup.volume=0;warmup.rate=10;
    speechSynthesis.speak(warmup);
  }
  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.22;
      this.master.connect(this.ctx.destination);
      this.hum = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      this.humGain = gain;
      gain.gain.value = this.powered ? 0.018 : 0;
      this.hum.frequency.value = 60;
      this.hum.type = "sine";
      this.hum.connect(gain);
      gain.connect(this.master);
      this.hum.start();

    }
    if(!this.glassLoad)this.glassLoad=fetch("/audio/glass-pane.mp3").then(r=>{if(!r.ok)throw new Error("Missing glass sound");return r.arrayBuffer();}).then(b=>this.ctx!.decodeAudioData(b)).then(b=>{this.samples.set("glass",b);}).catch(()=>{});
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }
  async crack() {
    if(!this.ctx||!this.master||this.muted)return;
    await this.glassLoad;
    if(this.muted)return;
    const sample=this.samples.get("glass");if(!sample)return;
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=sample;gain.gain.value=1.5;source.connect(gain);gain.connect(this.master);source.start();
  }
  mute(value: boolean) {
    this.muted = value;
    if (value) this.stopVoice();
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(
        value ? 0 : 0.22,
        this.ctx.currentTime,
        0.02,
      );
  }
  stopVoice() {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    this.utterance = null;
    this.voiceRequest++;
    for (const finish of [...this.speechFinishes.values()]) finish();
    this.speechFinishes.clear();
  }
  setPower(powered: boolean) {
    this.powered = powered;
    if (this.ctx && this.humGain)
      this.humGain.gain.setTargetAtTime(
        powered ? 0.018 : 0,
        this.ctx.currentTime,
        0.1,
      );
    if (!powered) this.stopVoice();
  }
  speak(text: string, queue = false, timing: SpeechTiming = {}) {
    if (
      this.muted ||
      !this.powered ||
      !this.ctx ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) { timing.onUnavailable?.(); return; }
    if (!queue) this.stopVoice();
    const request = this.voiceRequest;
    const selectMale = () => {
      if (this.voice) return this.voice;
      const voices = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
      // Prefer the familiar male voices; mobile engines may expose only generic voice names.
      const names = ["Alex", "Daniel", "David", "Fred", "George", "James", "Arthur", "Aaron", "Rishi", "Oliver", "Microsoft Mark", "Microsoft Guy", "Microsoft Ryan", "UK English Male"];
      for (const name of names) {
        const found = voices.find(v => new RegExp(`(^|\\s)${name}(\\s|$|\\()`, "i").test(v.name));
        if(found) { this.voice=found; return found; }
      }
      const available=voices.find(v=>v.localService) || voices[0];
      if(available){this.voice=available;return available;}
      return null;
    };
    const begin = () => {
      if(request !== this.voiceRequest || this.muted || !this.powered) { timing.onUnavailable?.(); return true; }
      const voice = selectMale();
      if(!voice) return false;
      const line = new SpeechSynthesisUtterance(text.toLowerCase().replace(/\n/g, " "));
      line.voice=voice;
      line.lang=voice.lang;
      line.rate=.91;
      line.pitch=.72;
      line.volume=.9;
      this.utterance=line;
      let ended=false, nativeBoundary=false;
      let approximation: ReturnType<typeof setInterval> | undefined;
      const finish = (unavailable=false) => {
        if(ended) return;
        ended=true;
        clearInterval(approximation); clearTimeout(watchdog);
        this.speechFinishes.delete(line);
        if(this.utterance===line) this.utterance=null;
        unavailable ? timing.onUnavailable?.() : timing.onEnd?.();
      };
      // Prevent unsupported/failed engines from leaving the interface stuck.
      const queuedChars=[...this.speechFinishes.keys()].reduce((n,u)=>n+u.text.length,0);
      const watchdog=setTimeout(()=>finish(true),3000+(queuedChars+line.text.length)*130);
      this.speechFinishes.set(line,()=>finish(true));
      line.onstart=()=>{
        timing.onStart?.();
        const started=performance.now();
        let lastIndex=-1;
        approximation=setInterval(()=>{
          if(nativeBoundary || ended) return;
          const elapsed=(performance.now()-started)/1000;
          const estimated=Math.floor(elapsed*11*line.rate);
          const starts=[...line.text.matchAll(/\S+/g)].map(m=>m.index!);
          const index=starts.filter(i=>i<=estimated).at(-1) ?? 0;
          if(index!==lastIndex) { lastIndex=index; timing.onBoundary?.(index,elapsed); }
        },50);
      };
      line.onboundary=(event)=>{
        if(event.name && event.name!=="word") return;
        nativeBoundary=true;clearInterval(approximation);
        timing.onBoundary?.(event.charIndex,event.elapsedTime);
      };
      line.onend=()=>finish();
      line.onerror=()=>finish(true);
      try { speechSynthesis.speak(line); } catch { finish(true); }
      return true;
    };
    if(begin()) return;
    // Mobile voice lists can arrive after the first user interaction.
    let attempts=0;
    const timer=setInterval(()=>{
      if(begin()) clearInterval(timer);
      else if(++attempts>=20) { clearInterval(timer); timing.onUnavailable?.(); }
    },100);
  }

  play(kind: Sound) {
    const c = this.ctx,
      m = this.master;
    if (!c || !m || this.muted) return;
    const sample = this.samples.get(kind);
    if (sample) {
      const s = c.createBufferSource();
      s.buffer = sample;
      s.playbackRate.value = 0.92 + Math.random() * 0.16;
      const gain=c.createGain();gain.gain.value=kind==="key"?2.2:1;
      s.connect(gain);gain.connect(m);
      s.start();
      return;
    }
    const now = c.currentTime;
    const tone = (
      freq: number,
      end: number,
      type: OscillatorType,
      volume: number,
      length: number,
    ) => {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = type;
      const pitch = 0.92 + Math.random() * 0.16;
      o.frequency.setValueAtTime(freq * pitch, now);
      o.frequency.exponentialRampToValueAtTime(end * pitch, now + length);
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + length);
      o.connect(g);
      g.connect(m);
      o.start(now);
      o.stop(now + length);
    };
    if (kind === "key") {
      tone(170, 55, "sine", 0.8, 0.075);
      tone(2500, 700, "triangle", 0.2, 0.024);
    }
    if (kind === "blip") tone(830, 640, "square", 0.045, 0.034);
    if (kind === "enter") {
      tone(240, 70, "triangle", 0.18, 0.15);
    }
    if (kind === "power") {
      tone(120, 25, "sine", 0.5, 0.5);
      tone(440, 40, "sawtooth", 0.05, 0.32);
    }
  }
}
export const audio = new Synth();
