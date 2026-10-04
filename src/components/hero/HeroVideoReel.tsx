"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2, VolumeX, ArrowRight, Disc } from "lucide-react";

interface Clip {
  artistId: string;
  stageName: string;
  region: string;
  subgenre: string;
  heroVideoMp4Url: string;
}

interface HeroVideoReelProps {
  initialClips: Clip[];
}

export function HeroVideoReel({ initialClips }: HeroVideoReelProps) {
  const [clips] = useState<Clip[]>(initialClips);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100%
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const DURATION_SECONDS = 10;

  useEffect(() => {
    if (clips.length <= 1) return;

    // Reset progress on slide change
    setProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min((elapsed / DURATION_SECONDS) * 100, 100);
      setProgress(pct);

      if (elapsed >= DURATION_SECONDS) {
        setCurrentIndex((prev) => (prev + 1) % clips.length);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, clips.length]);

  const currentClip = clips[currentIndex];

  if (!currentClip) {
    return (
      <div className="w-full h-80 rounded-2xl bg-ug-card flex items-center justify-center border border-ug-border">
        <div className="text-center px-6"><p className="text-ug-muted">No artist highlights yet.</p><Link href="/dashboard/onboarding" className="mt-4 inline-block rounded-full bg-ug-gold px-6 py-3 font-bold text-black">Register as an Artist</Link></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-ug-border group">
      {/* Background Video Element */}
      <video
        ref={videoRef}
        key={currentClip.heroVideoMp4Url}
        src={currentClip.heroVideoMp4Url}
        autoPlay
        playsInline
        muted={isMuted}
        loop
        className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
      />

      {/* Cinematic Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30 pointer-events-none" />

      {/* Top Controls: 10s Countdown Timer Badge & Audio Toggle */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-ug-gold/40 text-xs font-semibold text-ug-gold">
          <span className="w-2 h-2 rounded-full bg-ug-red animate-pulse" />
          <span>CYPHER REEL</span>
          <span className="text-white/60">|</span>
          <span className="text-white font-mono">
            {Math.ceil(DURATION_SECONDS - (progress / 100) * DURATION_SECONDS)}s
          </span>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md p-2.5 rounded-full border border-white/20 text-white transition transform hover:scale-105"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-ug-muted" /> : <Volume2 className="w-4 h-4 text-ug-gold" />}
        </button>
      </div>

      {/* Bottom Floating Info & Direct Link to Artist Zone */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-ug-gold text-black text-xs font-black uppercase tracking-wider">
              {currentClip.region}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-ug-card border border-ug-border text-ug-muted text-xs font-medium">
              {currentClip.subgenre}
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
            {currentClip.stageName}
          </h2>
          <p className="text-sm text-gray-300 mt-1 line-clamp-1 drop-shadow">
            Rotating 10-Second Showcase • Watch raw video highlight & explore original MP3 tracks
          </p>
        </div>

        <Link
          href={`/artist/${encodeURIComponent(currentClip.stageName)}`}
          className="flex items-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold px-6 py-3 rounded-full shadow-lg transition transform hover:scale-105 text-sm uppercase tracking-wider"
        >
          <Disc className="w-4 h-4 animate-spin-slow" />
          <span>Enter Artist Zone</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 10-Second Progress Bar at Bottom of Card */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-30">
        <div
          className="h-full bg-ug-gold transition-all duration-100 ease-linear shadow-[0_0_10px_#FFCC00]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {clips.map((clip, index) => (
          <button
            key={clip.artistId}
            onClick={() => {
              setCurrentIndex(index);
              setProgress(0);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex
                ? "bg-ug-gold w-6 shadow-[0_0_8px_#FFCC00]"
                : "bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
