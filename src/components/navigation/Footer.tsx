import React from "react";
import Link from "next/link";
import { Disc3, Heart, Shield, Radio, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-ug-border/80 text-white pt-12 pb-24 md:pb-16 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1: Brand & Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-ug-gold animate-spin-slow" />
            <span className="text-xl font-black tracking-tight">HIP HOP HUB</span>
          </div>

          <p className="text-xs text-ug-muted leading-relaxed">
            The dedicated digital stage and marketplace for authentic Ugandan Hip-Hop artists.
            Empowering Luga Flow, Uga-Flow, and indigenous emcees with direct-to-fan Mobile Money sales and virtual DJ booth zones.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-ug-gold font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>80% Artist Net Payout Guarantee</span>
          </div>
        </div>

        {/* Col 2: Hip-Hop Subgenres */}
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-ug-gold mb-3">
            Ugandan Hip-Hop Movements
          </h4>
          <ul className="text-xs space-y-2 text-ug-muted">
            <li>Luga Flow (Luganda Rhymes)</li>
            <li>Uga-Flow & English Boom-Bap</li>
            <li>Luo Flow (Northern Uganda - Gulu)</li>
            <li>Runya-Flow (Western Region)</li>
            <li>Kampala Afro-Drill & Trap</li>
            <li>Underground Street Cyphers</li>
          </ul>
        </div>

        {/* Col 3: Regional Hubs */}
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-ug-gold mb-3">
            Regional Hubs & Scenes
          </h4>
          <ul className="text-xs space-y-2 text-ug-muted">
            <li>Central Hub: Kampala & Entebbe</li>
            <li>Northern Hub: Gulu & Lira</li>
            <li>Eastern Hub: Jinja & Mbale</li>
            <li>Western Hub: Mbarara & Fort Portal</li>
            <li>Diaspora: UK, US, South Africa, UAE</li>
          </ul>
        </div>

        {/* Col 4: Tech & Monetization */}
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-ug-gold mb-3">
            Platform Economics
          </h4>
          <ul className="text-xs space-y-2 text-ug-muted">
            <li>Artist Registration: 100% Free</li>
            <li>Commission: 20% platform / 80% artist</li>
            <li>Payments: MTN MoMo, Airtel Money, Cards</li>
            <li>Storage: 500MB free quota per emcee</li>
            <li>Backend: Neon Serverless PostgreSQL</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-ug-border/40 flex flex-col md:flex-row items-center justify-between text-xs text-ug-muted gap-4">
        <p>© 2026 Hip Hop Hub. Built for the Culture of Ugandan Hip-Hop.</p>

        <p className="flex items-center gap-1">
          <span>Engineered with pride in Kampala • Hosted on Vercel & Neon</span>
        </p>
      </div>
    </footer>
  );
}
