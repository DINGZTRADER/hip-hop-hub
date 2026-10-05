"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Disc3, Plus, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

import { FEATURED_IDS, normalizeVideoIds, youtubeId } from "@/lib/cypher-playlist";
const SLOT_SECONDS = 60;
const DEFAULT_VOLUME = 70;
const STORAGE_KEY = "hiphopug_cypher_tv_v1";

import {loadYouTubeApi, type YouTubePlayer} from "@/lib/youtube-iframe";

export function CypherTv() {
  const [extras, setExtras] = useState<string[]>([]);
  const [legacyVideos, setLegacyVideos] = useState<string[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(SLOT_SECONDS);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [playbackError, setPlaybackError] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const playerHost = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const transitioningRef = useRef(false);
  const transitionTimer = useRef<number | null>(null);
  const elapsed = useRef(0);
  const lastTick = useRef<number | null>(null);
  const expectedVideo = useRef<string | null>(null);
  const activeVideo = useRef<string | null>(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  mutedRef.current = muted;
  volumeRef.current = volume;
  const queue = [...FEATURED_IDS, ...extras];
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const queueLengthRef = useRef(queue.length);
  queueLengthRef.current = queue.length;
  const current = queue[index] ?? FEATURED_IDS[0];
  const currentRef = useRef(current);
  currentRef.current = current;

  function advance(next: number) {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setPlaying(false);
    setPlaybackError("");
    lastTick.current = null;
    elapsed.current = 0;
    expectedVideo.current = null;
    activeVideo.current = null;
    player.current?.pauseVideo();
    const nextIndex = (next + queueLengthRef.current) % queueLengthRef.current;
    transitionTimer.current = window.setTimeout(() => {
      expectedVideo.current = queueRef.current[nextIndex];
      setSeconds(SLOT_SECONDS);
      setIndex(nextIndex);
      transitionTimer.current = null;
    }, 850);
  }

  useEffect(() => {
    if (!running || !playerHost.current) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHost.current) return;
      expectedVideo.current = currentRef.current;
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
            const isExpectedVideo = player.current?.getVideoData().video_id === expectedVideo.current;
            if (data === 0 && !transitioningRef.current && isExpectedVideo && activeVideo.current === expectedVideo.current) {
              advance(indexRef.current + 1);
              return;
            }
            if (data === 1 && isExpectedVideo) {
              activeVideo.current = expectedVideo.current;
              lastTick.current = performance.now();
              setPlaying(true);
              setPlaybackError("");
              transitioningRef.current = false;
              setTransitioning(false);
            } else if (data !== 1) {
              lastTick.current = null;
              setPlaying(false);
            }
          },
          onAutoplayBlocked: () => { transitioningRef.current = false; setTransitioning(false); setPlaybackError("Tap the video to start playback."); },
          onError: () => { transitioningRef.current = false; setTransitioning(false); setPlaying(false); setPlaybackError("This video cannot play here. Try the next one."); },
        },
      });
    }).catch(() => { if (!cancelled) setPlaybackError("The video player could not load. Please refresh and try again."); });
    return () => {
      cancelled = true;
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
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
    expectedVideo.current = current;
    activeVideo.current = null;
    elapsed.current = 0;
    lastTick.current = null;
    setSeconds(SLOT_SECONDS);
    player.current.loadVideoById(current, 0);
    player.current.setVolume(volumeRef.current);
    player.current.mute();
    if (!muted) player.current.unMute();
  // The mute button controls audio separately from video selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, running]);

  useEffect(() => {
    let controller: AbortController | null = null;
    async function loadPlaylist() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoadingPlaylist(true);
      try {
        const response = await fetch("/api/cypher-playlist", { cache: "no-store", signal: request.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Could not load your saved videos.");
        if (request.signal.aborted) return;
        const saved = normalizeVideoIds(data.videoIds);
        if (!saved) throw new Error("Could not load your saved videos.");
        setAuthenticated(data.authenticated === true);
        setCanAdd(data.canAdd === true);
        setExtras(saved);
        setIndex(previous => Math.min(previous, FEATURED_IDS.length + saved.length - 1));
        setError("");
      } catch (cause) {
        if (!request.signal.aborted) {
          setAuthenticated(false);
          setCanAdd(false);
          setExtras([]);
          setError(cause instanceof Error ? cause.message : "Could not load your saved videos.");
        }
      } finally { if (!request.signal.aborted) setLoadingPlaylist(false); }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      setLegacyVideos(normalizeVideoIds(saved) ?? []);
    } catch { /* Account saving remains available when browser storage is unavailable. */ }
    void loadPlaylist();
    const onVisible = () => { if (document.visibilityState === "visible") void loadPlaylist(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller?.abort(); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  useEffect(() => {
    if (!running || !playing) return;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const previous = lastTick.current;
      lastTick.current = now;
      if (previous === null || transitioningRef.current) return;
      elapsed.current += Math.max(0, now - previous) / 1000;
      if (elapsed.current < SLOT_SECONDS) {
        setSeconds(Math.max(1, Math.ceil(SLOT_SECONDS - elapsed.current)));
        return;
      }
      advance(indexRef.current + 1);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, playing]);

  function select(next: number) {
    if (running) {
      advance(next);
    } else {
      setIndex((next + queue.length) % queue.length);
      setSeconds(SLOT_SECONDS);
    }
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

  async function saveVideos(videoIds: string[]) {
    if (!canAdd || saving || loadingPlaylist) return;
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await fetch("/api/cypher-playlist", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoIds }) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { setCanAdd(false); setExtras([]); if (response.status === 401) setAuthenticated(false); }
        throw new Error(data.error?.message || "Could not save videos. Try again.");
      }
      const saved = normalizeVideoIds(data.videoIds);
      if (!saved) throw new Error("Could not confirm your saved videos. Refresh and try again.");
      setExtras(saved);
      setLegacyVideos(previous => previous.filter(id => !saved.includes(id)));
      setUrl("");
      setSaveMessage("Saved to your account. Available on your other devices.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save videos. Try again."); }
    finally { setSaving(false); }
  }

  function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = youtubeId(url);
    if (!id) { setError("Enter a valid YouTube watch, Shorts, or youtu.be link."); return; }
    if (queue.includes(id)) { setError("This video is already in the rotation."); return; }
    void saveVideos([id]);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-ug-muted hover:text-ug-gold mb-8"><ArrowLeft size={16} /> Explore artists</Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ug-gold font-black mb-2">Uganda hip-hop, on repeat</p>
          <h1 className="text-4xl md:text-6xl font-black text-white">CYPHER <span className="text-ug-gold">TV</span></h1>
          <p className="text-ug-muted mt-2">Eight featured videos. Up to one minute each. One continuous rotation.</p>
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
          {transitioning && (
            <div className="cypher-transition absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-[#08090c]" role="status" aria-label="Loading next video">
              <div className="cypher-transition-glow absolute h-52 w-52 rounded-full bg-ug-gold/30 blur-3xl" />
              <div className="cypher-transition-logo relative w-44 rounded-xl bg-white p-3 shadow-[0_0_55px_rgba(255,204,0,0.55)] sm:w-64 sm:p-4">
                <Image src="/brand/hip-hop-hub-logo.png" alt="Hip Hop Hub" width={221} height={100} className="h-auto w-full" priority />
              </div>
              <p className="relative mt-5 text-xs font-black uppercase tracking-[0.4em] text-ug-gold sm:text-sm">Up next</p>
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
        <p className="text-sm text-ug-muted mt-1">Paste a YouTube watch or Shorts link. Your saved videos follow your account across devices.</p>
        {loadingPlaylist && <p role="status" className="mt-4 text-ug-muted">Loading your saved videos...</p>}
        {!loadingPlaylist && !authenticated && <p className="mt-4 text-ug-gold"><Link href="/auth/login?next=cypher">Sign in as an artist to save videos</Link></p>}
        {canAdd && legacyVideos.some(id => !extras.includes(id)) && <button type="button" disabled={saving || loadingPlaylist} onClick={() => void saveVideos(legacyVideos)} className="mt-4 rounded-xl border border-ug-gold px-4 py-3 text-ug-gold disabled:opacity-50">Import videos saved in this browser</button>}
        {!loadingPlaylist && authenticated && !canAdd && <p className="mt-4 text-ug-muted">Only signed-in artists can add videos. <Link href="/dashboard/onboarding" className="text-ug-gold">Register as an Artist</Link></p>}
        <form onSubmit={addVideo} className="mt-5 flex flex-col sm:flex-row gap-3">
          <input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." aria-label="YouTube video URL" className="min-w-0 flex-1 rounded-xl border border-ug-border bg-ug-card px-4 py-3 text-white focus:border-ug-gold focus:outline-none" />
          <button type="submit" disabled={!canAdd || loadingPlaylist || saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ug-gold px-6 py-3 font-black text-black hover:bg-yellow-400"><Plus size={18} /> {saving ? "Saving..." : "Save to rotation"}</button>
        </form>
        {saveMessage && <p role="status" className="mt-3 text-sm text-emerald-400">{saveMessage}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <p className="mt-4 text-xs text-ug-muted">Playback quality comes from the YouTube upload and your connection. Some videos may restrict embedding.</p>
      </section>
    </main>
  );
}
