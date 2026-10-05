"use client";

import React from "react";
import Link from "next/link";
import { Check, Headphones, Crown } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen py-16 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Title & Market Context */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-ug-gold">
          UGANDA HIP-HOP MONETIZATION TIERS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mt-2">
          Fair Economics for Emcees & Superfans
        </h1>
        <p className="text-xs md:text-sm text-ug-muted mt-3 leading-relaxed">
          Tailored for Uganda&apos;s music industry realities. Keep your master rights, get paid via MTN MoMo and Airtel Money, and step up to Pro for maximum reach and lower platform commissions.
        </p>
      </div>

      {/* Artist Tiers */}
      <div className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-5 h-5 text-ug-gold" />
          <h2 className="text-xl md:text-2xl font-black text-white">
            Artist Tiers: Free vs. UG Cypher Pro
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Artist Free Tier */}
          <div className="bg-ug-surface rounded-3xl border border-ug-border p-8 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-ug-muted uppercase">
                EMCEE STARTER
              </span>
              <h3 className="text-2xl font-black text-white mt-1">Free Tier</h3>
              <p className="text-xs text-ug-muted mt-1">
                Zero barrier to entry for every Ugandan hip-hop artist.
              </p>

              <div className="my-6">
                <span className="text-4xl font-black text-white">UGX 0</span>
                <span className="text-xs text-ug-muted ml-1">/ Forever</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Original MP3 Track • No Short Preview Required</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10-Second Rotating MP4 Hero Reel on Homepage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 Embedded Official YouTube Videos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>500MB Dedicated Storage Quota</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Function Rate Cards (Weddings, Gigs, Parties)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>80% Artist Net Payout on Every Track Sold (20% Platform Fee)</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard/onboarding"
              className="mt-8 w-full text-center bg-ug-card hover:bg-ug-border text-white font-bold text-xs uppercase py-3.5 rounded-xl border border-ug-border transition"
            >
              Start Free Registration
            </Link>
          </div>

          {/* Artist Pro Tier */}
          <div className="relative bg-gradient-to-b from-[#1C1A14] to-ug-surface rounded-3xl border-2 border-ug-gold p-8 shadow-2xl flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 bg-ug-gold text-black px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
              RECOMMENDED FOR SERIOUS ARTISTS
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-ug-gold uppercase">
                MIC BOSS TIER
              </span>
              <h3 className="text-2xl font-black text-white mt-1">UG Cypher Pro</h3>
              <p className="text-xs text-ug-muted mt-1">
                Supercharge your music revenue and dominate the Kampala spotlight.
              </p>

              <div className="my-6">
                <span className="text-4xl font-black text-ug-gold">UGX 30,000</span>
                <span className="text-xs text-ug-muted ml-1">/ month (~$8 USD)</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <strong className="text-white">1 Original MP3 Track for Now • No Short Preview Required</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <strong className="text-emerald-400">Reduced 10% Platform Fee (Keep 90% Net)</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <strong className="text-white">3x Priority Rotation in Homepage 10s Reel</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <span>5GB Expanded Cloud Storage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <span>Golden Mic Verified Artist Checkmark</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <span>Direct WhatsApp & SMS Function Booking Leads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-ug-gold shrink-0" />
                  <span>Custom Artist Zone Vanity URL (hiphopug.com/navio)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert("UG Cypher Pro checkout via MTN MoMo / Airtel Money (UGX 30,000) selected. Feature active upon prompt.")}
              className="mt-8 w-full bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase py-3.5 rounded-xl shadow-lg transition transform hover:scale-102"
            >
              Upgrade to UG Cypher Pro
            </button>
          </div>
        </div>
      </div>

      {/* Fan / User Paid Tier */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Headphones className="w-5 h-5 text-ug-accent" />
          <h2 className="text-xl md:text-2xl font-black text-white">
            Fan Tier: The Backstage VIP Pass
          </h2>
        </div>

        <div className="bg-gradient-to-r from-[#111827] via-ug-surface to-[#161d2a] rounded-3xl border border-ug-border p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-mono font-bold text-ug-accent uppercase">
              FOR TRUE UG HIP-HOP HEADS
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
              UG Hip-Hop Backstage Pass
            </h3>
            <p className="text-xs md:text-sm text-ug-muted mt-2 leading-relaxed">
              Support Ugandan lyricists while getting high-resolution audio, mobile data savings, and exclusive cypher perks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-ug-accent shrink-0" />
                <span>15% Discount on All Track Downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-ug-accent shrink-0" />
                <span>Master Quality FLAC / WAV Option</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-ug-accent shrink-0" />
                <span>Offline Vault (Saves Mobile Data)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-ug-accent shrink-0" />
                <span>Early 48-Hour Cypher Drops</span>
              </div>
            </div>
          </div>

          <div className="text-center md:text-right shrink-0 bg-black/40 p-6 rounded-2xl border border-ug-border">
            <p className="text-3xl font-black text-ug-accent">UGX 10,000</p>
            <p className="text-xs text-ug-muted mt-0.5">/ month (~$2.70 USD)</p>
            <button
              onClick={() => alert("Backstage VIP Pass subscribed via MTN / Airtel Mobile Money.")}
              className="mt-4 bg-ug-accent hover:bg-cyan-400 text-black font-extrabold text-xs uppercase px-8 py-3 rounded-full shadow-lg transition"
            >
              Get Backstage Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
