"use client";

import React, { useState } from "react";
import { Artist } from "@/types";
import { useAudio } from "../audio/AudioContext";
import { Play, Pause } from "lucide-react";

interface VirtualDjBoothProps {
  artist: Artist;
}

export function VirtualDjBooth({ artist }: VirtualDjBoothProps) {
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudio();
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [pitch, setPitch] = useState<number>(0); // -8 to +8 pitch

  const activeTrack = currentTrack?.artistStageName === artist.stageName
    ? currentTrack
    : artist.tracks?.[0] || null;

  const isCurrentArtistPlaying = isPlaying && currentTrack?.artistStageName === artist.stageName;

  const handleTurntableClick = () => {
    if (activeTrack && (activeTrack.playbackUrl || activeTrack.previewUrl)) {
      if (currentTrack?.id === activeTrack.id) {
        togglePlay();
      } else {
        playTrack(activeTrack);
      }
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-[#13151D] to-[#0A0B0E] rounded-3xl border border-ug-border p-6 md:p-8 shadow-2xl overflow-hidden">
      {/* Decorative DJ Deck Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-ug-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ug-red animate-ping" />
            <span className="text-xs uppercase font-mono tracking-widest text-ug-gold font-bold">
              UG-DEEJAY VIRTUAL BOOTH • DECK A
            </span>
          </div>
          <h3 className="text-2xl font-black text-white mt-1">
            {artist.stageName}&apos;s Master Console
          </h3>
        </div>

        {/* LED VU Meter & BPM Display */}
        <div className="flex items-center gap-4 bg-black/60 px-4 py-2 rounded-xl border border-ug-border">
          <div className="text-right">
            <p className="text-[10px] text-ug-muted font-mono uppercase">TEMPO / BPM</p>
            <p className="text-sm font-black font-mono text-ug-gold">
              {92 + pitch * 2} BPM
            </p>
          </div>

          <div className="flex items-end gap-1 h-6">
            {[40, 75, 60, 90, 85, 30].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-t transition-all ${
                  isCurrentArtistPlaying ? "bg-ug-gold animate-pulse" : "bg-zinc-700"
                }`}
                style={{ height: isCurrentArtistPlaying ? `${h}%` : "20%" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Turntable and Mixer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
        {/* Left: Interactive Vinyl Platter (Reference to DJ decks) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <button
            type="button"
            disabled={!(activeTrack?.playbackUrl || activeTrack?.previewUrl)}
            aria-label={activeTrack?.playbackUrl || activeTrack?.previewUrl ? `${isCurrentArtistPlaying ? "Pause" : "Play"} ${activeTrack?.title}` : "Preview unavailable"}
            onClick={handleTurntableClick}
            className="cursor-pointer relative w-64 h-64 md:w-80 md:h-80 rounded-full vinyl-grooves border-8 border-[#222533] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center group transition transform hover:scale-102"
            title={activeTrack?.playbackUrl ? "Play / pause your full MP3" : activeTrack?.previewUrl ? "Play / pause preview" : "Preview unavailable"}
          >
            {/* Spinning Vinyl Texture & Center Label */}
            <div
              className={`w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-ug-red via-ug-gold to-yellow-500 border-4 border-black flex flex-col items-center justify-center text-center p-2 shadow-inner transition-transform ${
                isCurrentArtistPlaying
                  ? rpm === 45
                    ? "animate-[spin_4s_linear_infinite]"
                    : "animate-spin-slow"
                  : ""
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-black mb-1" />
              <p className="text-[10px] md:text-xs font-black text-black uppercase tracking-tighter truncate max-w-[90px]">
                {artist.stageName}
              </p>
              <p className="text-[8px] font-mono text-black/80 font-bold">LUGAGROOVE</p>
            </div>

            {/* Tonearm Visual Indicator */}
            <div
              className={`absolute top-4 right-4 w-2 md:w-3 bg-zinc-400 rounded-full shadow-md origin-top transition-all duration-500 ${
                isCurrentArtistPlaying ? "h-28 rotate-12" : "h-24 -rotate-12"
              }`}
            >
              <div className="w-4 h-6 bg-ug-red rounded absolute bottom-0 -left-1 shadow" />
            </div>

            {/* Play/Pause Overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <div className="w-14 h-14 rounded-full bg-ug-gold text-black flex items-center justify-center shadow-xl">
                {isCurrentArtistPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </div>
            </div>
          </button>

          {/* RPM Selector & Pitch Controls */}
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-lg border border-ug-border text-xs font-bold">
              <button
                onClick={() => setRpm(33)}
                className={`px-3 py-1 rounded ${
                  rpm === 33 ? "bg-ug-gold text-black" : "text-ug-muted hover:text-white"
                }`}
              >
                33 RPM
              </button>
              <button
                onClick={() => setRpm(45)}
                className={`px-3 py-1 rounded ${
                  rpm === 45 ? "bg-ug-gold text-black" : "text-ug-muted hover:text-white"
                }`}
              >
                45 RPM
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-ug-muted">
              <span>PITCH:</span>
              <input
                type="range"
                min={-8}
                max={8}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-24 h-1 bg-ug-border rounded appearance-none accent-ug-gold"
              />
              <span className="w-8 text-right font-bold text-ug-gold">
                {pitch > 0 ? `+${pitch}` : pitch}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Now Playing Crate Track Display & Live Lyrics / Info */}
        <div className="lg:col-span-5 bg-black/40 rounded-2xl border border-ug-border p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-ug-gold uppercase font-bold">
                NOW LOADED ON THE DECK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-ug-surface text-gray-300 border border-ug-border">
                {artist.region} Hip-Hop
              </span>
            </div>

            <h4 className="text-xl font-black text-white">
              {activeTrack?.title || "Select a Track from the Crate"}
            </h4>
            <p className="text-xs text-ug-muted mt-1">
              Length: {activeTrack ? `${Math.floor(activeTrack.durationSeconds / 60)}:${(activeTrack.durationSeconds % 60).toString().padStart(2, "0")}` : "--:--"} • Format: MP3 Master
            </p>

            {/* Audio Waveform Graphic */}
            <div className="mt-5 p-3 rounded-xl bg-[#0e1017] border border-ug-border flex items-center justify-between gap-1 h-16">
              {[20, 45, 70, 85, 40, 60, 95, 80, 50, 65, 30, 75, 90, 45, 35, 60, 80, 50, 30].map(
                (bar, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all ${
                      isCurrentArtistPlaying ? "bg-ug-gold shadow-[0_0_8px_#FFCC00]" : "bg-zinc-800"
                    }`}
                    style={{
                      height: isCurrentArtistPlaying
                        ? `${Math.max(15, (bar * (idx % 2 === 0 ? 1 : 0.8)))}%`
                        : "15%",
                    }}
                  />
                )
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-ug-border/60 text-xs">
            <span className="text-ug-muted">Direct Artist Purchase: 80% to Emcee</span>
            <span className="font-bold text-ug-gold text-sm">
              UGX {activeTrack?.priceUgx.toLocaleString() || "3,000"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
