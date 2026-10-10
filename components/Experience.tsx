"use client";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import {startActivity,activityEvent,activityChat} from "@/lib/activity-client";
import HandCursor from "./HandCursor";
import dynamic from "next/dynamic";
const Room = dynamic(() => import("./Room"), { ssr: false });
class SceneBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
import { Screen, DottedLabel } from "./Screen";
import { greeting } from "@/lib/screen";
import { audio } from "@/lib/audio";
type Message = { role: "user" | "assistant"; content: string };
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
export default function Experience() {
  useEffect(()=>{let done=false,cleanup=()=>{};void startActivity().then(fn=>{if(done)fn();else cleanup=fn;});return()=>{done=true;cleanup();};},[]);
  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/chat",{cache:"no-store",signal:controller.signal}).catch(()=>{});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const root=document.documentElement;
    const wake=()=>{root.classList.remove("cursor-idle");clearTimeout(timer);timer=setTimeout(()=>root.classList.add("cursor-idle"),2000);};
    const down=(e:PointerEvent)=>{if(e.pointerType!=="touch"){wake();root.classList.add("cursor-pressed");}};
    const up=()=>{root.classList.remove("cursor-pressed");wake();};
    const blur=()=>{root.classList.remove("cursor-pressed");root.classList.add("cursor-idle");clearTimeout(timer);};
    wake();window.addEventListener("pointermove",wake);window.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);window.addEventListener("keydown",wake);window.addEventListener("blur",blur);
    return()=>{clearTimeout(timer);root.classList.remove("cursor-idle","cursor-pressed");window.removeEventListener("pointermove",wake);window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);window.removeEventListener("keydown",wake);window.removeEventListener("blur",blur);};
  },[]);
  const [musicOn, setMusicOn] = useState(true);
  const music = useRef<HTMLAudioElement | null>(null);
  const musicEnabled = useRef(true);
  useEffect(() => {
    const track = new Audio("/audio/theme.mp3");
    track.loop = true; track.volume = .16; track.preload = "auto";
    music.current = track;
    const unlock = (event?: Event) => {
      if(event?.isTrusted){void audio.start();audio.unlockVoice();}
      if(musicEnabled.current) void track.play().catch(() => {});
    };
    unlock();
    const events=["pointerdown","pointerup","touchend","keydown"];
    events.forEach(name=>window.addEventListener(name,unlock,{passive:true}));
    return () => { track.pause(); track.src=""; music.current=null; events.forEach(name=>window.removeEventListener(name,unlock)); };
  }, []);
  const toggleMusic = () => {
    const next=!musicEnabled.current;activityEvent("music",next?"on":"off");
    musicEnabled.current=next; setMusicOn(next);
    if(next) void music.current?.play().catch(()=>{musicEnabled.current=false;setMusicOn(false);});
    else music.current?.pause();
  };
  const [powered, setPowered] = useState(true),
    [lit, setLit] = useState(false),
    [ejected, setEjected] = useState(false);
  const powerRef = useRef(powered);
  powerRef.current = powered;
  const [thinkingDots, setThinkingDots] = useState(".");
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState<"room" | "entering" | "screen" | "leaving">(
      "room",
    ),
    [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false),
    [reduced, setReduced] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const enter = useCallback(() => {
    void audio.start().then(() => audio.play("power"));
    last.current = Date.now();
    activityEvent("sit", "Chair or monitor");
    setView("entering");
  }, []);
  const arrive = useCallback(() => {
    setView("screen");
    audio.speak(greeting);
    if (matchMedia("(pointer:coarse)").matches) input.current?.focus();
  }, []);
  const leave = useCallback(() => {activityEvent("leave_computer");setView("room");}, []);
  const sceneReady = useCallback(() => setReady(true), []);
  const fail = useCallback(() => {
    setFallback(true);
    setReady(true);
    setView("screen");
  }, []);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion:reduce)");
    const update = () => {
      setReduced(motion.matches);
      if (motion.matches) {
        setView("screen");
        setReady(true);
      }
    };
    update();
    setChecked(true);
    motion.addEventListener("change", update);
    try {
      if (!motion.matches) {
        const c = document.createElement("canvas");
        const context = c.getContext("webgl2");
        if (!context) fail();
        else context.getExtension("WEBGL_lose_context")?.loseContext();
      }
    } catch {
      fail();
    }
    return () => motion.removeEventListener("change", update);
  }, [fail]);
  const [text, setText] = useState(greeting),
    [draft, setDraft] = useState(""),
    [thinking, setThinking] = useState(false),
    [busy, setBusy] = useState(false),
    [pulse, setPulse] = useState(0),
    [muted, setMuted] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    history = useRef<Message[]>([]),
    last = useRef(Date.now()),
    active = useRef(true),
    sending = useRef(false),
    generation = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!thinking) return;
    setThinkingDots(".");
    const id = setInterval(
      () => setThinkingDots((d) => (d.length >= 3 ? "." : d + ".")),
      300,
    );
    return () => clearInterval(id);
  }, [thinking]);
  const togglePower = useCallback(() => {
    const next = !powerRef.current;activityEvent("power",next?"on":"off");
    powerRef.current = next;
    setPowered(next);
    generation.current++;
    requestController.current?.abort();
    audio.setPower(next);
    audio.stopVoice();
    void audio.start().then(() => audio.play("power"));
    setThinking(false);
    setBusy(false);
    setDraft("");
    setText(greeting);
    last.current = Date.now();
  }, []);
  const toggleLamp = useCallback(() => {
    activityEvent("lamp_toggle");
    setLit((v) => !v);
    void audio.start().then(() => audio.play("key"));
  }, []);
  const toggleTray = useCallback(() => {
    activityEvent("disc_tray_toggle");
    setEjected((v) => !v);
    void audio.start().then(() => audio.play("enter"));
  }, []);
  useEffect(() => {
    active.current = true;
    const id = setInterval(() => setBlink((v) => !v), 600);
    return () => {
      active.current = false;
      generation.current++;
      clearInterval(id);
    };
  }, []);
  const typeReply = useCallback(async (reply: string) => {
    const id = ++generation.current;
    if (!powerRef.current) return;
    audio.speak(reply);
    let out = "";
    for (const char of reply) {
      if (!active.current || !powerRef.current || id !== generation.current)
        return;
      out += char;
      setText(out);
      if (char !== " ") audio.play("blip");
      await pause(/[.!?,]/.test(char) ? 160 : 28);
    }
    last.current = Date.now();
  }, []);
  const send = useCallback(async () => {
    if (
      !powerRef.current ||
      viewRef.current !== "screen" ||
      sending.current ||
      !draft.trim()
    )
      return;
    const requestStarted=performance.now();let firstTextMs:number|null=null;
    const requestId = ++generation.current;
    sending.current = true;
    setBusy(true);
    setThinking(true);
    setPulse(1);
    setTimeout(() => setPulse(0), 180);
    audio.play("enter");
    last.current = Date.now();
    const messages = [
      ...history.current.slice(-10),
      { role: "user" as const, content: draft.trim() },
    ];
    setDraft("");
    if (input.current) input.current.value = "";
    setText("");
    try {
      const controller = new AbortController();
      requestController.current = controller;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
      const reader = response.body?.getReader();
      let reply = "", spokenChars = 0, voiceStarted = false, rendered = 0, visibleTarget = 0;
      let letterDelay = 70, reveal: Promise<void> | null = null;
      const speechTasks: Promise<void>[] = [];
      const current = () => active.current && powerRef.current && requestId === generation.current;
      const startReveal = () => {
        if (reveal) return;
        reveal = (async () => {
          while (rendered < visibleTarget && current()) {
            const char = reply[rendered++];
            setThinking(false);
            setText(reply.slice(0,rendered));
            if(char !== " ") audio.play("blip");
            await pause(letterDelay);
          }
        })().finally(()=>{ reveal=null; });
      };
      const publish = (final = false) => {
        if (!current()) return false;
        const pending = reply.slice(spokenChars);
        const boundary = final ? pending.length : pending.search(/[.!?](?=\s|$)/) + 1;
        if (boundary > 0) {
          const rawPhrase = pending.slice(0,boundary);
          const phrase = rawPhrase.trim();
          const offset = spokenChars + rawPhrase.length - rawPhrase.trimStart().length;
          const end = spokenChars + boundary;
          if(phrase) {
            speechTasks.push(new Promise<void>(resolve=>{
              let lastIndex=0, lastTime=0;
              const word = (index:number,elapsed:number) => {
                if(!current()) return;
                if(index>lastIndex && elapsed>lastTime)
                  letterDelay=Math.max(40,Math.min(110,(elapsed-lastTime)*1000/(index-lastIndex)));
                lastIndex=index;lastTime=elapsed;
                const absolute=Math.min(end,offset+index);
                // Finish the preceding word at the engine's next word boundary.
                rendered=Math.max(rendered,absolute);
                setThinking(false);setText(reply.slice(0,rendered));
                const wordLength=phrase.slice(index).match(/^\S+/)?.[0].length ?? 1;
                visibleTarget=Math.max(visibleTarget,Math.min(end,absolute+wordLength));
                startReveal();
              };
              const finish = () => {
                if(current()) { visibleTarget=Math.max(visibleTarget,end); startReveal(); }
                resolve();
              };
              audio.speak(phrase,voiceStarted,{
                onStart:()=>word(0,0), onBoundary:word,
                onEnd:finish, onUnavailable:finish,
              });
            }));
            voiceStarted=true;
          }
          spokenChars += boundary;
        }
        return true;
      };
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if(value.length && firstTextMs===null)firstTextMs=Math.round(performance.now()-requestStarted);
          reply = (reply + decoder.decode(value, { stream: true })).toUpperCase().slice(0,180);
          // Show the first streamed words immediately instead of waiting for
          // a complete sentence and the device's first voice startup.
          if(!voiceStarted && reply) {visibleTarget=reply.length;startReveal();}
          if(!publish()) { await reader.cancel(); return; }
        }
        reply = (reply + decoder.decode()).toUpperCase().slice(0,180);
      }
      reply ||= "THE NETWORK IS TAKING A NAP. TRY AGAIN.";
      activityChat(messages.at(-1)!.content,reply,firstTextMs,Math.round(performance.now()-requestStarted),response.status);
      if(!publish(true)) return;
      await Promise.all(speechTasks);
      while (rendered < reply.length && powerRef.current && requestId === generation.current) {
        startReveal();
        await reveal;
      }
      last.current = Date.now();
      if(response.ok) history.current = [
        ...messages,
        { role: "assistant" as const, content: reply },
      ].slice(-12);
      if (!powerRef.current || requestId !== generation.current) return;
      setThinking(false);
    } catch {
      if (requestId !== generation.current) return;
      setThinking(false);
      activityChat(messages.at(-1)!.content,"THE NETWORK IS TAKING A NAP. TRY AGAIN.",firstTextMs,Math.round(performance.now()-requestStarted),0);
      await typeReply("THE NETWORK IS TAKING A NAP. TRY AGAIN.");
    } finally {
      requestController.current = null;
      sending.current = false;
      setBusy(false);
    }
  }, [draft, typeReply]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewRef.current !== "room") {
        e.preventDefault();
        audio.stopVoice();
        if (!fallback && !reduced) setView("leaving");
        input.current?.blur();
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest("button")) return;
      if (viewRef.current === "room") {
        if (e.key === "Enter") {
          e.preventDefault();
          enter();
        }
        return;
      }
      if (viewRef.current !== "screen" || !powerRef.current) return;
      if (e.target instanceof HTMLElement && e.target.closest("button")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        void audio.start();
        void send();
        return;
      }
      if (e.target === input.current || sending.current) return;
      if (e.key === "Backspace") {
        generation.current++;
        audio.stopVoice();
        e.preventDefault();
        setDraft((d) => {
          const next = d.slice(0, -1);
          setText(next.toUpperCase() || greeting);
          return next;
        });
        audio.play("key");
      } else if (e.key.length === 1) {
        generation.current++;
        audio.stopVoice();
        e.preventDefault();
        void audio.start();
        audio.play("key");
        setDraft((d) => {
          const next = (d + e.key).slice(0, 200);
          setText(next.toUpperCase());
          return next;
        });
      }
      last.current = Date.now();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [send, enter, fallback, reduced]);
  useEffect(() => {
    const id = setInterval(() => {
      if (
        viewRef.current === "screen" &&
        powerRef.current &&
        !sending.current &&
        Date.now() - last.current > 20000 &&
        !draft
      ) {
        last.current = Date.now();
        void typeReply("I HAVE ALL DAY.\nREGRETTABLY,\nSO DO YOU.");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [draft, typeReply]);
  return (
    <main
      className={`experience ${busy ? "is-busy" : ""} view-${view} ${fallback || reduced ? "fallback" : ""}`}
      data-view={view}
      data-power={powered ? "on" : "off"}
      data-lamp={lit ? "on" : "off"}
      data-tray={ejected ? "open" : "closed"}
    >
      <HandCursor/>
      {checked && !fallback && !reduced && (
        <div className="room">
          <SceneBoundary onError={fail}>
            <Room
              text={thinking ? thinkingDots : text}
              thinking={false}
              pulse={pulse}
              view={view}
              onEnter={enter}
              onReady={sceneReady}
              onArrive={arrive}
              onLeave={leave}
              reduced={reduced}
              post
              onFailure={fail}
              powered={powered}
              lit={lit}
              ejected={ejected}
              onPower={togglePower}
              onLamp={toggleLamp}
              onEject={toggleTray}
            />
          </SceneBoundary>
        </div>
      )}
      {!ready && (
        <div className="loading">
          <DottedLabel text="WAKING UP IN NOWHERE..." />
        </div>
      )}
      {view === "room" && (
        <button
          className="enter-computer"
          aria-label="Sit at the computer"
          onClick={enter}
        />
      )}
      <div
        className={`overlay ${pulse ? "pulse" : ""}`}
        onClick={() => {
          void audio.start();
          input.current?.focus();
        }}
      >
        <Screen
          text={!powered ? "" : thinking ? thinkingDots : text}
          thinking={false}
          pulse={pulse}
        />
      </div>
      <DottedLabel
        text={
          view === "room"
            ? "DRAG OR SCROLL TO LOOK AROUND."
            : view === "entering"
              ? "PULL UP A CHAIR."
              : "TYPE YOUR QUESTION. ENTER TO SEND."
        }
      />
      <input
        ref={input}
        className="mobile-input"
        aria-label="Ask the computer"
        maxLength={200}
        value={draft}
        autoComplete="off"
        autoCapitalize="characters"
        disabled={busy || !powered}
        onChange={(e) => {
          generation.current++;
          audio.stopVoice();
          setDraft(e.target.value);
          setText(e.target.value.toUpperCase() || greeting);
          last.current = Date.now();
          audio.play("key");
        }}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {busy ? "Computer is thinking" : text}
      </p>
      <button
        className="mute"
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        aria-pressed={muted}
        onClick={() => {
          void audio.start();
          audio.mute(!muted);
          setMuted(!muted);
        }}
      >
        <svg
          width="29"
          height="29"
          viewBox="0 0 24 24"
          fill="#e2e2bc"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {muted ? (
            <path d="m17 9 5 6m0-6-5 6" />
          ) : (
            <path d="M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
          )}
        </svg>
      </button>
      {ready && <button className="music-toggle" aria-label={musicOn ? "Turn background music off" : "Turn background music on"} aria-pressed={musicOn} onClick={toggleMusic}>
        <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2" fill="#e2e2bc"/><ellipse cx="17" cy="16" rx="3" ry="2" fill="#e2e2bc"/>
          {!musicOn && <path d="m3 3 18 18"/>}
        </svg>
      </button>}
      <footer className="credits">
        <a href="https://www.linkedin.com/in/thoufikabdullah/" target="_blank" rel="noopener noreferrer">Made by Thoufik <span aria-hidden="true">↗</span></a>
        <a href="https://cartoonnetwork.fandom.com/wiki/Courage_the_Cowardly_Dog" target="_blank" rel="noopener noreferrer">Fan project inspired by Courage the Cowardly Dog <span aria-hidden="true">↗</span></a>
      </footer>
      {view === "screen" && !fallback && !reduced && (
        <button
          className="exit"
          aria-label="Leave the computer"
          onClick={() => {
            setView("leaving");
            audio.stopVoice();
            input.current?.blur();
          }}
        >
          <svg viewBox="0 0 64 52" width="48" height="40" aria-hidden="true">
            <path
              d="M26 6 5 22l21 11v-10c19-3 25 8 22 20 14-15 7-32-22-31Z"
              fill="#e2e2bc"
              stroke="#211b20"
              strokeWidth="3.3"
              strokeLinejoin="round"
            />
            <path
              d="M11 21 25 11"
              fill="none"
              stroke="#ffffe5"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      <div className="sr-only">
        <button
          onClick={toggleLamp}
          aria-label={lit ? "Turn lamp off" : "Turn lamp on"}
        />
        <button
          onClick={togglePower}
          aria-label={powered ? "Turn computer off" : "Turn computer on"}
        />
        <button
          onClick={toggleTray}
          aria-label={ejected ? "Close CD tray" : "Eject CD tray"}
        />
      </div>
    </main>
  );
}
