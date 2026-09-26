"use client";

import React from "react";
import Image from "next/image";
import { EventFlyer } from "@/types";
import { Calendar, MapPin, Ticket, Sparkles } from "lucide-react";

interface FlyerCarouselProps {
  flyers?: EventFlyer[];
  stageName: string;
}

export function FlyerCarousel({ flyers, stageName }: FlyerCarouselProps) {
  if (!flyers || flyers.length === 0) return null;

  return (
    <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
      <div className="flex items-center justify-between pb-6 border-b border-ug-border/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-ug-gold" />
          <h3 className="text-2xl font-black text-white">Live Shows & Event Flyers</h3>
        </div>
        <span className="text-xs text-ug-muted font-mono uppercase">
          Official Gig Flyers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {flyers.map((flyer) => {
          const dateStr = new Date(flyer.eventDate).toLocaleDateString("en-UG", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={flyer.id}
              className="bg-ug-card rounded-2xl border border-ug-border overflow-hidden shadow-lg group hover:border-ug-gold transition flex flex-col justify-between"
            >
              {/* Flyer Graphic */}
              <div className="relative aspect-[4/5] w-full bg-zinc-900 overflow-hidden">
                <img
                  src={flyer.flyerImageUrl}
                  alt={flyer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-ug-gold border border-ug-gold/40">
                  {dateStr}
                </div>
              </div>

              {/* Details */}
              <div className="p-5">
                <h4 className="font-black text-lg text-white group-hover:text-ug-gold transition truncate">
                  {flyer.title}
                </h4>
                <p className="text-xs text-ug-muted flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-ug-red" />
                  <span>{flyer.venue}, {flyer.city}</span>
                </p>

                {flyer.ticketLink && (
                  <a
                    href={flyer.ticketLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-ug-border hover:bg-ug-gold hover:text-black text-white font-bold text-xs uppercase py-2.5 rounded-xl transition"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Get Tickets</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
