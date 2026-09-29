import React from "react";
import { notFound } from "next/navigation";
import { getArtistByStageName } from "@/lib/data-service";
import { VirtualDjBooth } from "@/components/artist/VirtualDjBooth";
import { TrackCrate } from "@/components/artist/TrackCrate";
import { YouTubeGallery } from "@/components/artist/YouTubeGallery";
import { FreestyleVault } from "@/components/artist/FreestyleVault";
import { FlyerCarousel } from "@/components/artist/FlyerCarousel";
import { ServiceBookingModal } from "@/components/artist/ServiceBookingModal";
import {
  MapPin,
  CheckCircle2,
  Instagram,
  Twitter,
  Youtube,
  Disc3,
} from "lucide-react";
import Link from "next/link";

interface ArtistPageProps {
  params: Promise<{ stageName: string }>;
}

export const revalidate = 60; // ISR cache

export default async function ArtistZonePage({ params }: ArtistPageProps) {
  const { stageName } = await params;
  const artist = await getArtistByStageName(stageName);

  if (!artist) {
    notFound();
  }

  const birthYear = artist.dob ? new Date(artist.dob).getFullYear() : "";

  return (
    <div className="min-h-screen pb-24">
      {/* Top Breadcrumb & Quick Nav */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-4 flex items-center justify-between text-xs text-ug-muted">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-white font-bold">{artist.stageName}&apos;s Zone</span>
        </div>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ug-card border border-ug-border text-ug-gold font-mono font-bold">
          <Disc3 className="w-3.5 h-3.5 animate-spin-slow" />
          <span>VIRTUAL ARTIST ZONE</span>
        </span>
      </div>

      {/* Artist Hero Header */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#171924] via-[#151722] to-[#12131C] border border-ug-border p-6 md:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-ug-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              {/* Artist Vinyl Avatar */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full vinyl-grooves border-4 border-ug-border flex items-center justify-center shrink-0 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-ug-gold flex items-center justify-center shadow">
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    {artist.stageName}
                  </h1>
                  {artist.isVerified && (
                    <span title="Verified Ugandan Hip-Hop Artist">
                      <CheckCircle2 className="w-6 h-6 text-ug-gold fill-current" />
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-ug-card text-ug-gold border border-ug-border">
                    {artist.subgenre}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-ug-muted">
                  {artist.realName} • {birthYear ? `Born ${birthYear}` : ""} •{" "}
                  <span className="text-white inline-flex items-center gap-1 font-semibold">
                    <MapPin className="w-3 h-3 text-ug-red" />
                    {artist.region}
                  </span>
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-3 mt-3">
                  {artist.socials.instagram && (
                    <a
                      href={artist.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ug-muted hover:text-pink-400 transition"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {artist.socials.x && (
                    <a
                      href={artist.socials.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ug-muted hover:text-white transition"
                      title="X / Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {artist.socials.youtube && (
                    <a
                      href={artist.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ug-muted hover:text-ug-red transition"
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-col items-start md:items-end gap-2 text-xs">
              <span className="bg-ug-card px-4 py-2 rounded-xl border border-ug-border text-ug-muted">
                Storage Used:{" "}
                <strong className="text-white">
                  {(artist.storageUsedBytes / (1024 * 1024)).toFixed(1)}MB / 500MB
                </strong>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mobile Money Direct Downloads Active
              </span>
            </div>
          </div>

          {/* Artist Bio */}
          {artist.bio && (
            <div className="mt-6 pt-6 border-t border-ug-border/60">
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed max-w-4xl">
                {artist.bio}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Virtual Zone Layout */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-12">
        {/* 1. Virtual DJ Booth / Turntable Console */}
        <section>
          <VirtualDjBooth artist={artist} />
        </section>

        {/* 2. The Music Crate (MP3 Songs to buy) */}
        <section>
          <TrackCrate tracks={artist.tracks || []} stageName={artist.stageName} />
        </section>

        {/* 3. Official YouTube Visuals (3 videos) */}
        <section>
          <YouTubeGallery videos={artist.youtubeVideos} stageName={artist.stageName} />
        </section>

        {/* 4. Freestyle & Cypher Sessions */}
        {artist.freestyles && artist.freestyles.length > 0 && (
          <section>
            <FreestyleVault freestyles={artist.freestyles} stageName={artist.stageName} />
          </section>
        )}

        {/* 5. Live Shows & Event Flyers */}
        {artist.eventFlyers && artist.eventFlyers.length > 0 && (
          <section>
            <FlyerCarousel flyers={artist.eventFlyers} />
          </section>
        )}

        {/* 6. Function & Wedding Booking Desk */}
        <section>
          <ServiceBookingModal
            services={artist.services}
            artistId={artist.id}
            stageName={artist.stageName}
          />
        </section>
      </div>
    </div>
  );
}
