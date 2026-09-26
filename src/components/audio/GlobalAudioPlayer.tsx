"use client";

import React from "react";
import { useAudio } from "./AudioContext";
import { Play, Pause, Volume2, VolumeX, ShoppingCart, Disc3 } from "lucide-react";

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    openCheckout,
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-ug-surface/95 backdrop-blur-md border-t border-ug-border/80 px-4 py-3 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <div className="relative">
            <Disc3
              className={`w-11 h-11 text-ug-gold ${
                isPlaying ? "animate-spin-slow text-glow-gold" : ""
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-white">{currentTrack.title}</p>
            <p className="text-xs text-ug-muted truncate">
              {currentTrack.artistStageName || "Ugandan Emcee"}
            </p>
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex flex-col items-center w-full md:w-2/4 gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-ug-gold text-black flex items-center justify-center hover:bg-yellow-400 transition transform hover:scale-105"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md text-xs text-ug-muted">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-ug-card rounded-lg appearance-none cursor-pointer accent-ug-gold"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Purchase CTA & Volume */}
        <div className="flex items-center justify-end gap-4 w-full md:w-1/4">
          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="text-ug-muted hover:text-white"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 h-1 bg-ug-card rounded-lg appearance-none cursor-pointer accent-ug-gold"
            />
          </div>

          {/* Buy Button */}
          <button
            onClick={() => openCheckout(currentTrack)}
            className="flex items-center gap-2 bg-gradient-to-r from-ug-red to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy MP3 (UGX {currentTrack.priceUgx.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
