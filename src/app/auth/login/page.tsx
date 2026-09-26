"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Disc3, Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials.");
      }

      if (data.user?.role === "ARTIST") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          email: "artist.google@hiphopug.com",
          name: "Ugandan Google Emcee",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Google sign-in failed.");

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoArtist = async (stageName: string, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: "password123" }),
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Quick login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-8 shadow-2xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ug-card border border-ug-border mb-3 shadow">
            <Disc3 className="w-7 h-7 text-ug-gold animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to Hip Hop Hub</h1>

          <p className="text-xs text-ug-muted mt-1">
            Access your Artist Hub or Fan Collection with persistent memory
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-ug-red/20 border border-ug-red text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-ug-red" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs uppercase py-3.5 rounded-xl transition shadow mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-ug-border flex-1" />
          <span className="text-[11px] font-mono text-ug-muted uppercase">OR EMAIL & PASSWORD</span>
          <div className="h-px bg-ug-border flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ug-muted mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ug-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emcee@hiphopug.com"
                className="w-full bg-ug-card border border-ug-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ug-muted mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ug-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-ug-card border border-ug-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase py-3.5 rounded-xl transition shadow-lg transform hover:scale-102 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Cypher</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Emcee Login */}
        <div className="mt-8 pt-6 border-t border-ug-border">
          <p className="text-[11px] font-mono text-ug-gold font-bold uppercase mb-2 text-center">
            ⚡ Quick Demo Emcee Logins:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Navio", email: "navio@hiphopug.com" },
              { name: "GNL Zamba", email: "gnlzamba@hiphopug.com" },
              { name: "Feffe Bussi", email: "feffe@hiphopug.com" },
            ].map((demo) => (
              <button
                key={demo.name}
                type="button"
                onClick={() => handleQuickDemoArtist(demo.name, demo.email)}
                className="bg-ug-card hover:bg-ug-border text-[11px] text-gray-300 py-1.5 px-2 rounded-lg border border-ug-border transition font-semibold truncate"
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-ug-muted">
          New Ugandan artist?{" "}
          <Link href="/dashboard/onboarding" className="text-ug-gold font-bold hover:underline">
            Register for Free
          </Link>
        </div>
      </div>
    </div>
  );
}
