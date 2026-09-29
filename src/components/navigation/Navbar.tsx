"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut, LayoutDashboard, Menu, X, PlusCircle, Sparkles, Clapperboard } from "lucide-react";

interface NavSession {
  name: string;
  role: "ARTIST" | "FAN";
  stageName?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<NavSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      setSessionLoading(true);
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Session check failed");
        const data = await response.json();
        if (!controller.signal.aborted) setSession(data.authenticated ? data.user : null);
      } catch {
        if (!controller.signal.aborted) setSession(null);
      } finally {
        if (!controller.signal.aborted) setSessionLoading(false);
      }
    };

    void checkSession();
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#08090C]/90 backdrop-blur-md border-b border-ug-border/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="shrink-0 rounded-md bg-white p-1 transition hover:ring-2 hover:ring-ug-gold" aria-label="Hip-Hop-Hub home">
          <Image
            src="/brand/hip-hop-hub-logo.png"
            alt="Hip-Hop-Hub"
            width={221}
            height={100}
            className="h-11 w-auto md:h-14"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
          <Link href="/" className="hover:text-ug-gold transition">
            Explore Artists
          </Link>
          <Link href="/pricing" className="hover:text-ug-gold transition flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-ug-gold" />
            <span>Tiers & Monetization</span>
          </Link>
          <Link href="/cypher-tv" className="hover:text-ug-gold transition flex items-center gap-1.5">
            <Clapperboard className="w-4 h-4 text-ug-gold" /> Cypher TV
          </Link>
          {session?.role === "ARTIST" && (
            <Link
              href="/dashboard"
              className="hover:text-ug-gold transition flex items-center gap-1 text-ug-gold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Artist Dashboard</span>
            </Link>
          )}
        </div>

        {/* Right CTA / Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-ug-card px-3 py-1.5 rounded-full border border-ug-border text-xs">
                <User className="w-3.5 h-3.5 text-ug-gold" />
                <span className="font-bold text-white truncate max-w-[120px]">
                  {session.stageName || session.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-ug-gold text-black">
                  {session.role}
                </span>
              </div>

              {session.role === "ARTIST" ? (
                <Link
                  href="/dashboard"
                  className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-4 py-2 rounded-full transition shadow-md"
                >
                  My Hub
                </Link>
              ) : (
                <Link
                  href="/dashboard/onboarding"
                  className="bg-ug-card hover:bg-ug-border text-white font-bold text-xs uppercase px-4 py-2 rounded-full border border-ug-border transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-ug-gold" />
                  <span>Register as an Artist</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-ug-card text-ug-muted hover:text-white transition text-xs font-bold"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : sessionLoading ? (
            <span className="h-9 w-40 animate-pulse rounded-full bg-ug-card" aria-label="Checking sign-in status" />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-bold text-gray-300 hover:text-white px-3 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard/onboarding"
                className="flex items-center gap-1.5 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-4 py-2 rounded-full shadow-md transition transform hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register as an Artist</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-ug-muted hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-ug-border mt-3 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-300 hover:text-ug-gold"
          >
            Explore Artists
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-300 hover:text-ug-gold"
          >
            Tiers & Monetization
          </Link>
          <Link href="/cypher-tv" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-ug-gold">
            Cypher TV
          </Link>
          {session ? (
            <div className="pt-2 border-t border-ug-border space-y-2">
              <p className="text-xs text-ug-muted">Signed in as {session.name}</p>
              {session.role === "ARTIST" ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-ug-gold"
                >
                  Artist Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-ug-gold"
                >
                  Register as an Artist
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-ug-red hover:underline block pt-1"
              >
                Sign Out
              </button>
            </div>
          ) : sessionLoading ? (
            <p className="text-xs text-ug-muted">Checking sign-in status...</p>
          ) : (
            <div className="pt-2 border-t border-ug-border flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-bold text-white bg-ug-card rounded-xl border border-ug-border"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-black text-black bg-ug-gold rounded-xl uppercase"
              >
                Register as an Artist
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
