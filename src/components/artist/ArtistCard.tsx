"use client";

import React from "react";
import Link from "next/link";
import { Artist } from "@/types";
import { Disc3, MapPin, Music, Play, CheckCircle2, Video } from "lucide-react";
import { useAudio } from "../audio/AudioContext";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const firstTrack = artist.tracks?.[0];
  const isThisArtistPlaying = currentTrack && artist.tracks?.some((t) => t.id === currentTrack.id) && isPlaying;

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstTrack) {
      playTrack(firstTrack);
    }
  };

  return (
    <Link
      href={`/artist/${encodeURIComponent(artist.stageName)}`}
      className="group relative bg-ug-surface rounded-2xl border border-ug-border p-5 hover:border-ug-gold transition-all duration-300 shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
    >
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-ug-gold/5 rounded-full blur-2xl group-hover:bg-ug-gold/15 transition-all" />

      {/* Top Header: Region & Subgenre */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1 text-xs font-semibold text-ug-muted">
            <MapPin className="w-3.5 h-3.5 text-ug-red" />
            {artist.region}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-ug-card text-ug-gold border border-ug-border">
            {artist.subgenre}
          </span>
        </div>

        {/* Center: Stage Name and Vinyl Simulation */}
        <div className="flex items-center gap-4 my-2">
          {/* Virtual Vinyl Disc Icon */}
          <div className="relative w-16 h-16 rounded-full vinyl-grooves border-2 border-zinc-700 flex items-center justify-center shadow-lg group-hover:border-ug-gold transition">
            <div className={`w-6 h-6 rounded-full bg-ug-gold flex items-center justify-center ${isThisArtistPlaying ? "animate-spin-slow text-glow-gold" : ""}`}>
              <div className="w-2 h-2 rounded-full bg-black" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-black text-white group-hover:text-ug-gold transition truncate">
                {artist.stageName}
              </h3>
              {artist.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-ug-gold fill-current" />
              )}
            </div>
            <p className="text-xs text-ug-muted truncate">{artist.realName}</p>
          </div>
        </div>

        {/* Short Bio snippet */}
        <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
          {artist.bio || "Ugandan hip hop artist sharing raw lyrical delivery and original tracks."}
        </p>
      </div>

      {/* Card Footer: Media Stats & Action Button */}
      <div className="mt-5 pt-4 border-t border-ug-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-ug-muted">
          <span className="flex items-center gap-1">
            <Music className="w-3.5 h-3.5 text-ug-gold" />
            {artist.tracks?.length || 0} Tracks
          </span>
          {artist.heroVideoMp4Url && (
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-ug-red" />
              10s Reel
            </span>
          )}
        </div>

        {/* Quick Preview Button */}
        {firstTrack && (
          <button
            onClick={handleQuickPlay}
            className="flex items-center gap-1 bg-ug-card hover:bg-ug-gold hover:text-black text-white px-3 py-1.5 rounded-full border border-ug-border transition font-semibold"
            title="Preview latest track"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play</span>
          </button>
        )}
      </div>
    </Link>
  );
}
