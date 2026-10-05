"use client";

import React, {useEffect, useState} from "react";
import { Track } from "@/types";
import { useAudio } from "../audio/AudioContext";
import { Play, Pause, Download, Music2, ShoppingBag, ShieldCheck } from "lucide-react";

interface TrackCrateProps {
  tracks: Track[];
  stageName: string;
}

export function TrackCrate({ tracks, stageName }: TrackCrateProps) {
  const { playTrack, currentTrack, isPlaying, openCheckout, playCounts } = useAudio();

  const [stats,setStats]=useState<Record<string,{playCount:number;purchaseCount:number}>>({});
  const ids=tracks.map(track=>track.id).join(',');
  useEffect(()=>{if(!ids)return;let active=true;const update=()=>{fetch(`/api/tracks/stats?ids=${encodeURIComponent(ids)}`,{cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{if(active&&data?.tracks)setStats(Object.fromEntries(data.tracks.map((track:{id:string;playCount:number;purchaseCount:number})=>[track.id,track])));}).catch(()=>{});};update();window.addEventListener('focus',update);return()=>{active=false;window.removeEventListener('focus',update);};},[ids]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ug-border/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-ug-gold" />
            <h3 className="text-2xl font-black text-white">The Music Crate</h3>
          </div>
          <p className="text-xs text-ug-muted mt-1">
            Original MP3 tracks by {stageName} • 80% of every sale goes directly to the artist
          </p>
        </div>

        <div className="flex items-center gap-2 bg-ug-card px-3.5 py-1.5 rounded-full border border-ug-border text-xs text-ug-muted font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Instant MTN / Airtel Mobile Money Download</span>
        </div>
      </div>

      {/* Tracks List */}
      <div className="divide-y divide-ug-border/60 mt-4">
        {tracks.map((track, index) => {
          const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;

          return (
            <div
              key={track.id}
              className={`py-4 px-3 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                isThisTrackPlaying ? "bg-ug-card/70 border border-ug-gold/30" : "hover:bg-ug-card/40"
              }`}
            >
              {/* Left: Track #, Play Button, Title */}
              <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
                <span className="text-sm font-mono font-bold text-ug-muted w-5">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>

                <button
                  onClick={() => playTrack(track)}
                  disabled={!(track.playbackUrl || track.previewUrl)}
                  title={track.playbackUrl ? "Play your full MP3" : track.previewUrl ? "Play preview" : "Preview unavailable"}
                  aria-label={track.playbackUrl ? `${isThisTrackPlaying ? "Pause" : "Play"} ${track.title}` : track.previewUrl ? `${isThisTrackPlaying ? "Pause" : "Play"} preview of ${track.title}` : `Preview unavailable for ${track.title}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isThisTrackPlaying
                      ? "bg-ug-gold text-black shadow-lg"
                      : "bg-ug-border hover:bg-ug-gold hover:text-black text-white"
                  }`}
                >
                  {isThisTrackPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <p className="font-bold text-white text-base truncate">{track.title}</p>
                  <p className="text-xs text-ug-muted flex items-center gap-3 mt-0.5">
                    <span>{formatDuration(track.durationSeconds)}</span>
                    <span>•</span>
                    <span>{Math.max(track.playCount,stats[track.id]?.playCount||0,playCounts?.[track.id]||0).toLocaleString()} plays</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {(stats[track.id]?.purchaseCount ?? track.purchaseCount ?? 0).toLocaleString()} buys
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Price & Buy Button */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-ug-muted block md:hidden">Price</span>
                  <span className="text-base font-black text-ug-gold">
                    UGX {track.priceUgx.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => openCheckout(track)}
                  className="flex items-center gap-2 bg-gradient-to-r from-ug-red to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-full shadow-md transition transform hover:scale-105 shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy MP3</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
