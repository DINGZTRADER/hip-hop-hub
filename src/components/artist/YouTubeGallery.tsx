"use client";

import React from "react";
import { ArtistYouTubeVideo } from "@/types";
import { Youtube, ExternalLink } from "lucide-react";

interface YouTubeGalleryProps {
  videos?: ArtistYouTubeVideo[];
  stageName: string;
}

export function YouTubeGallery({ videos, stageName }: YouTubeGalleryProps) {
  if (!videos || videos.length === 0) return null;

  const getEmbedUrl = (rawUrl: string) => {
    try {
      if (rawUrl.includes("watch?v=")) {
        const id = rawUrl.split("watch?v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      } else if (rawUrl.includes("youtu.be/")) {
        const id = rawUrl.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  return (
    <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
      <div className="flex items-center justify-between pb-6 border-b border-ug-border/80">
        <div className="flex items-center gap-2">
          <Youtube className="w-6 h-6 text-ug-red" />
          <h3 className="text-2xl font-black text-white">Visuals & Music Videos</h3>
        </div>
        <span className="text-xs text-ug-muted font-mono uppercase">
          Top 3 Official Videos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {videos.slice(0, 3).map((video, idx) => {
          const embedUrl = getEmbedUrl(video.youtubeUrl);

          return (
            <div
              key={video.id || idx}
              className="bg-ug-card rounded-2xl border border-ug-border overflow-hidden shadow-lg flex flex-col group hover:border-ug-gold transition"
            >
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={embedUrl}
                  title={video.videoTitle || `${stageName} Visual ${idx + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              <div className="p-4 flex items-center justify-between">
                <p className="font-bold text-sm text-white truncate">
                  {video.videoTitle || `Official Video ${idx + 1}`}
                </p>
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ug-muted hover:text-ug-gold transition"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
