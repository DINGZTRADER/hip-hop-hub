"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Disc3,
  Mail,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  Loader2,
  Mic,
  Headphones,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"FAN" | "ARTIST">("ARTIST");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed.");
      }

      if (role === "ARTIST") {
        router.push("/dashboard/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          email: `${role.toLowerCase()}.${Date.now()}@google-ug.com`,
          name: role === "ARTIST" ? "New Ugandan Emcee" : "Hip-Hop Fan",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Google sign-up failed.");

      if (role === "ARTIST") {
        router.push("/dashboard/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-up failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-8 shadow-2xl">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ug-card border border-ug-border mb-3 shadow">
            <Disc3 className="w-7 h-7 text-ug-gold animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-white">Join Hip Hop Hub</h1>

          <p className="text-xs text-ug-muted mt-1">
            The dedicated home for Ugandan Hip-Hop culture & direct monetization
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-ug-red/20 border border-ug-red text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-ug-red" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-ug-card rounded-2xl border border-ug-border">
          <button
            type="button"
            onClick={() => setRole("ARTIST")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition ${
              role === "ARTIST"
                ? "bg-ug-gold text-black shadow-md"
                : "text-ug-muted hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Ugandan Emcee</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("FAN")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition ${
              role === "FAN"
                ? "bg-ug-red text-white shadow-md"
                : "text-ug-muted hover:text-white"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Hip-Hop Fan</span>
          </button>
        </div>

        <p className="text-[11px] text-ug-muted text-center mb-5">
          {role === "ARTIST"
            ? "🎤 Free 500MB storage, 80% payout on mobile money sales, 10s hero reel."
            : "🎧 Stream cyphers, buy tracks directly via MTN/Airtel MoMo, book artists."}
        </p>

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
          <span>Sign Up with Google</span>
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-ug-border flex-1" />
          <span className="text-[11px] font-mono text-ug-muted uppercase">OR EMAIL SIGNUP</span>
          <div className="h-px bg-ug-border flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ug-muted mb-1">
              {role === "ARTIST" ? "Stage / Legal Name" : "Your Name"}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-ug-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "ARTIST" ? "e.g. Navio or GNL Zamba" : "e.g. Kenneth Kato"}
                className="w-full bg-ug-card border border-ug-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold"
              />
            </div>
          </div>

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
                placeholder="name@example.com"
                className="w-full bg-ug-card border border-ug-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ug-muted mb-1">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ug-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {role === "ARTIST" ? "Create Artist Account & Onboard" : "Create Fan Account"}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-ug-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-ug-gold font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
