import React from "react";
import { getArtists, getRotatingHeroClips } from "@/lib/data-service";
import { HeroVideoReel } from "@/components/hero/HeroVideoReel";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { Search, MapPin, Music, Sparkles, Flame, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    region?: string;
    subgenre?: string;
    search?: string;
    cursor?: string;
  }>;
}

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region || "All";
  const subgenre = params.subgenre || "All";
  const search = params.search || "";

  // 1. Fetch 10-second rotating hero video clips
  const heroClips = await getRotatingHeroClips();

  // 2. Fetch paginated artists with filters
  const { data: artists, nextCursor, hasMore } = await getArtists({
    limit: 12,
    region: region !== "All" ? region : undefined,
    subgenre: subgenre !== "All" ? subgenre : undefined,
    search: search || undefined,
  });

  const regionsList = ["All", "Kampala", "Gulu", "Jinja", "Mbarara", "Tororo"];
  const subgenresList = ["All", "Luga Flow", "Uga-Flow / Hip Hop", "Luo Rap / Northern Flow", "Fast Rap", "Boom-Bap"];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ug-red animate-pulse" />
              <span className="text-xs uppercase tracking-widest font-mono text-ug-gold font-black">
                UGANDA HIP-HOP LIVE ROTATION
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              The 10-Second Ugandan Cypher Reel
            </h1>
          </div>

          <p className="text-xs md:text-sm text-ug-muted max-w-md">
            Rotating 10s video highlights from Uganda&apos;s finest emcees. Watch their flow, tap in to their virtual zone, and support directly via Mobile Money.
          </p>
        </div>

        {/* 10-Second Rotating MP4 Hero Reel */}
        <HeroVideoReel initialClips={heroClips} />
      </section>

      {/* Ugandan Hip-Hop Market Highlights Banner */}
      <section className="border-y border-ug-border/80 bg-ug-surface/60 py-6 mb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-black text-ug-gold">100% Free</p>
            <p className="text-xs text-ug-muted mt-0.5">Artist Registration</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-black text-emerald-400">80% Payout</p>
            <p className="text-xs text-ug-muted mt-0.5">Direct to Artist Wallet</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-black text-white">MTN & Airtel</p>
            <p className="text-xs text-ug-muted mt-0.5">Instant Mobile Money Buys</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-black text-ug-red">10s MP4</p>
            <p className="text-xs text-ug-muted mt-0.5">Rotating Homepage Spotlight</p>
          </div>
        </div>
      </section>

      {/* Main Artist Directory / The Cypher Grid */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-ug-gold" />
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Ugandan Hip-Hop Artists ({artists.length})
              </h2>
            </div>
            <p className="text-xs text-ug-muted mt-1">
              Select an artist box to step inside their custom Virtual Zone & DJ Booth
            </p>
          </div>

          {/* Search Input Form */}
          <form method="GET" action="/" className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-ug-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search stage name, Luga Flow..."
              className="w-full bg-ug-surface border border-ug-border rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-ug-muted focus:outline-none focus:border-ug-gold"
            />
          </form>
        </div>

        {/* Region & Genre Filter Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          {/* Region Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-mono font-bold text-ug-muted uppercase mr-1 shrink-0">
              Region:
            </span>
            {regionsList.map((r) => {
              const isActive = region === r;
              return (
                <Link
                  key={r}
                  href={`/?region=${encodeURIComponent(r)}&subgenre=${encodeURIComponent(subgenre)}`}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider transition shrink-0 ${
                    isActive
                      ? "bg-ug-gold text-black shadow-md"
                      : "bg-ug-surface text-ug-muted hover:text-white border border-ug-border"
                  }`}
                >
                  {r}
                </Link>
              );
            })}
          </div>

          {/* Subgenre Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-mono font-bold text-ug-muted uppercase mr-1 shrink-0">
              Flow:
            </span>
            {subgenresList.map((g) => {
              const isActive = subgenre === g;
              return (
                <Link
                  key={g}
                  href={`/?region=${encodeURIComponent(region)}&subgenre=${encodeURIComponent(g)}`}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition shrink-0 ${
                    isActive
                      ? "bg-ug-red text-white shadow-md"
                      : "bg-ug-surface text-ug-muted hover:text-white border border-ug-border"
                  }`}
                >
                  {g}
                </Link>
              );
            })}
          </div>
        </div>

        {/* The Grid of Artist Boxes */}
        {artists.length === 0 ? (
          <div className="text-center py-20 bg-ug-surface rounded-3xl border border-ug-border">
            <Music className="w-12 h-12 text-ug-muted mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">No Artists Found in this Category</h3>
            <p className="text-xs text-ug-muted mt-1 max-w-sm mx-auto">
              Be the first emcee to represent your region or reset your filters to see other artists.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block bg-ug-card text-ug-gold text-xs font-bold px-4 py-2 rounded-full border border-ug-border"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* Call-to-action for Ugandan Emcees */}
        <div className="mt-16 bg-gradient-to-r from-[#171924] via-[#1a1226] to-[#25101a] rounded-3xl border border-ug-border p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ug-gold">
              CALLING ALL UGANDAN RAPPERS
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-white mt-1">
              Drop Your Bars & Monetize Your Craft
            </h3>
            <p className="text-xs md:text-sm text-ug-muted mt-2 leading-relaxed">
              Upload minimum 3 MP3 tracks, 3 YouTube videos, your 10s rotating hero video clip, and event flyers for free. Keep 80% on every mobile money download.
            </p>
          </div>

          <Link
            href="/dashboard/onboarding"
            className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-8 py-4 rounded-full shadow-xl transition transform hover:scale-105 shrink-0"
          >
            Register as Artist (Free)
          </Link>
        </div>
      </section>
    </div>
  );
}
