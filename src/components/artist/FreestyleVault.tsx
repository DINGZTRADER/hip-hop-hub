"use client";

import React from "react";
import { Freestyle } from "@/types";
import { Mic, Flame } from "lucide-react";

interface FreestyleVaultProps {
  freestyles?: Freestyle[];
  stageName: string;
}

export function FreestyleVault({ freestyles, stageName }: FreestyleVaultProps) {
  if (!freestyles || freestyles.length === 0) return null;

  return (
    <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
      <div className="flex items-center justify-between pb-6 border-b border-ug-border/80">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-2xl font-black text-white">Freestyle & Cypher Vault</h3>
        </div>
        <span className="text-xs text-ug-muted font-mono uppercase">Raw Studio Bars</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {freestyles.map((free) => (
          <div
            key={free.id}
            className="bg-ug-card rounded-2xl border border-ug-border p-4 flex items-center justify-between gap-4 hover:border-orange-500/60 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{free.title}</h4>
                <p className="text-xs text-ug-muted">
                  {free.mediaType} Session • {stageName}
                </p>
              </div>
            </div>

            <audio
              controls
              src={free.mediaUrl}
              className="h-9 w-40 md:w-48 filter invert hue-rotate-180 brightness-95"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
