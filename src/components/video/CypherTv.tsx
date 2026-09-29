"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Disc3, Plus, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

const FEATURED_IDS = [
  "Qj84C2r0ahw", "Y2A7g1X8Lks", "Wp3RJEXxS3o", "o66mG8c9yU8",
  "4MqRvrqZ0so", "QMchOEWMTuY", "kRYKFHl3kW4", "wrMBSqGmSn8",
];
const SLOT_SECONDS = 30;
const DEFAULT_VOLUME = 70;
const STORAGE_KEY = "hiphopug_cypher_tv_v1";

type YouTubePlayer = {
  destroy(): void;
  getCurrentTime(): number;
  loadVideoById(id: string, startSeconds: number): void;
  mute(): void;
  pauseVideo(): void;
  setVolume(volume: number): void;
  unMute(): void;
};

type YouTubeApi = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    playerVars: Record<string, number | string>;
    events: {
      onReady: (event: { target: YouTubePlayer }) => void;
      onStateChange: (event: { data: number }) => void;
      onAutoplayBlocked: () => void;
      onError: () => void;
    };
  }) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | undefined;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const script = document.createElement("script");
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player API did not initialize"));
    };
    script.onerror = () => {
      apiPromise = undefined;
      reject(new Error("YouTube player API could not load"));
    };
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

function youtubeId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    let id: string | null = null;
    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    } else if (host === "youtu.be" || host === "www.youtu.be") {
      id = url.pathname.slice(1);
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function CypherTv() {
  const [extras, setExtras] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(SLOT_SECONDS);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [playbackError, setPlaybackError] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const playerHost = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  mutedRef.current = muted;
  volumeRef.current = volume;
  const queue = [...FEATURED_IDS, ...extras];
  const queueLengthRef = useRef(queue.length);
  queueLengthRef.current = queue.length;
  const current = queue[index] ?? FEATURED_IDS[0];
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (!running || !playerHost.current) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHost.current) return;
      const mount = document.createElement("div");
      playerHost.current.appendChild(mount);
      player.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: currentRef.current,
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, start: 0, origin: window.location.origin },
        events: {
          onReady: ({ target }) => {
            target.setVolume(volumeRef.current);
            if (mutedRef.current) target.mute(); else target.unMute();
          },
          onStateChange: ({ data }) => {
            setPlaying(data === 1);
            if (data === 1) setPlaybackError("");
            if (data === 0) {
              setSeconds(SLOT_SECONDS);
              setIndex((i) => (i + 1) % queueLengthRef.current);
            }
          },
          onAutoplayBlocked: () => setPlaybackError("Tap the video to start playback."),
          onError: () => { setPlaying(false); setPlaybackError("This video cannot play here. Try the next one."); },
        },
      });
    }).catch(() => { if (!cancelled) setPlaybackError("The video player could not load. Please refresh and try again."); });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      playerHost.current?.replaceChildren();
    };
  // The YouTube player is created once when playback starts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!player.current || !running) return;
    setPlaying(false);
    setPlaybackError("");
    player.current.loadVideoById(current, 0);
    player.current.setVolume(volumeRef.current);
    player.current.mute();
    if (!muted) player.current.unMute();
  // The mute button controls audio separately from video selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, running]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        setExtras(saved.filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id) && !FEATURED_IDS.includes(id)).slice(0, 100));
      }
    } catch { /* Ignore invalid saved playlists. */ }
  }, []);

  useEffect(() => {
    if (!running || !playing) return;
    const timer = window.setInterval(() => {
      const position = player.current?.getCurrentTime() ?? 0;
      if (!Number.isFinite(position) || position < 0) return;
      if (position < SLOT_SECONDS) {
        setSeconds(Math.max(1, Math.ceil(SLOT_SECONDS - position)));
        return;
      }
      player.current?.pauseVideo();
      setSeconds(SLOT_SECONDS);
      setPlaying(false);
      setIndex((i) => (i + 1) % queueLengthRef.current);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, playing]);

  function select(next: number) {
    setPlaying(false);
    setPlaybackError("");
    setIndex((next + queue.length) % queue.length);
    setSeconds(SLOT_SECONDS);
  }

  function startWithSound() {
    setMuted(false);
    setRunning(true);
  }

  function toggleSound() {
    if (!running) { startWithSound(); return; }
    if (muted) {
      const nextVolume = volume || DEFAULT_VOLUME;
      setVolume(nextVolume);
      player.current?.setVolume(nextVolume);
      player.current?.unMute();
    } else {
      player.current?.mute();
    }
    setMuted(!muted);
  }

  function changeVolume(nextVolume: number) {
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
    player.current?.setVolume(nextVolume);
    if (nextVolume === 0) player.current?.mute();
    else player.current?.unMute();
  }

  function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = youtubeId(url);
    if (!id) { setError("Enter a valid YouTube watch, Shorts, or youtu.be link."); return; }
    if (queue.includes(id)) { setError("This video is already in the rotation."); return; }
    const updated = [...extras, id];
    setExtras(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUrl("");
    setError("");
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-ug-muted hover:text-ug-gold mb-8"><ArrowLeft size={16} /> Explore artists</Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ug-gold font-black mb-2">Uganda hip-hop, on repeat</p>
          <h1 className="text-4xl md:text-6xl font-black text-white">CYPHER <span className="text-ug-gold">TV</span></h1>
          <p className="text-ug-muted mt-2">Eight featured videos. Thirty seconds each. One continuous rotation.</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-ug-gold border border-ug-gold/40 rounded-full px-4 py-2">{queue.length} videos in rotation</span>
      </div>

      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-ug-border bg-black shadow-2xl shadow-ug-gold/10 sm:rounded-3xl">
        <div className="relative aspect-video min-h-[200px] bg-black sm:min-h-0">
          {running ? (
            <div ref={playerHost} className="absolute inset-0 h-full w-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#25101a] via-[#15151d] to-black text-center px-5">
              <Disc3 className="mb-3 h-12 w-12 animate-spin-slow text-ug-gold sm:mb-5 sm:h-20 sm:w-20" />
              <p className="text-xl font-black text-white sm:text-2xl md:text-4xl">The Ugandan hip-hop rotation</p>
              <p className="mb-4 mt-1 text-sm text-ug-muted sm:mb-7 sm:mt-2 sm:text-base">Press play to start the show</p>
              <button onClick={startWithSound} className="min-h-11 bg-ug-gold hover:bg-yellow-400 text-black font-black rounded-full px-8 py-3">Play with sound</button>
            </div>
          )}
        </div>
        <div className="h-1.5 bg-white/10"><div className="h-full bg-ug-gold transition-[width] duration-1000 ease-linear" style={{ width: `${((SLOT_SECONDS - seconds) / SLOT_SECONDS) * 100}%` }} /></div>
        <div className="flex flex-col gap-3 p-3 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-bold text-white sm:text-base">Video {index + 1} of {queue.length} <span className="ml-2 font-mono text-ug-gold">{seconds}s</span>{running && !playing && <span className="ml-2 text-xs font-normal text-ug-muted sm:text-sm">{playbackError || "Loading or paused"}</span>}</div>
          <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:items-center">
            <button onClick={() => select(index - 1)} className="min-h-11 rounded-full border border-ug-border px-2 text-sm font-bold text-white hover:border-ug-gold md:px-4" aria-label="Previous video">Previous</button>
            <button onClick={() => select(index + 1)} className="min-h-11 rounded-full border border-ug-border px-2 text-sm font-bold text-white hover:border-ug-gold md:px-4" aria-label="Next video">Next <ArrowRight className="inline w-4 h-4" /></button>
            <button onClick={toggleSound} className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-ug-border px-2 text-xs font-bold text-white hover:border-ug-gold md:px-3" aria-label={muted ? "Turn sound on" : "Mute sound"}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}<span>{muted ? "Sound on" : "Mute"}</span></button>
            <label className="col-span-3 flex min-h-11 items-center gap-2 rounded-xl border border-ug-border px-3 text-xs font-semibold text-white md:w-36">
              <span>Volume</span>
              <input type="range" min="0" max="100" step="5" value={muted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Volume" className="h-11 min-w-0 flex-1 accent-[#facc15]" />
              <span className="w-7 text-right font-mono text-ug-gold">{muted ? 0 : volume}%</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden border-y border-ug-gold/30 py-3" aria-label="Hip Hop Hub rolling logo">
        <div className="cypher-logo-track flex w-max items-center gap-10" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <Image key={i} src="/brand/hip-hop-hub-logo.png" alt="" width={221} height={100} className="h-12 w-auto rounded-sm bg-white" />
          ))}
        </div>
      </div>

      <section className="mt-10 rounded-3xl border border-ug-border bg-ug-surface p-6 md:p-8">
        <h2 className="text-2xl font-black text-white">Add a Ugandan hip-hop video</h2>
        <p className="text-sm text-ug-muted mt-1">Paste a YouTube watch or Shorts link. Your additions stay in this browser.</p>
        <form onSubmit={addVideo} className="mt-5 flex flex-col sm:flex-row gap-3">
          <input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." aria-label="YouTube video URL" className="min-w-0 flex-1 rounded-xl border border-ug-border bg-ug-card px-4 py-3 text-white focus:border-ug-gold focus:outline-none" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ug-gold px-6 py-3 font-black text-black hover:bg-yellow-400"><Plus size={18} /> Add to rotation</button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <p className="mt-4 text-xs text-ug-muted">Playback quality comes from the YouTube upload and your connection. Some videos may restrict embedding.</p>
      </section>
    </main>
  );
}
