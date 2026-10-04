"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Sign in failed.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next === "onboarding" ? "/dashboard/onboarding" : next === "cypher" ? "/cypher-tv" : data.user?.role === "ARTIST" ? "/dashboard" : "/");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-8 text-white">
      <h1 className="text-2xl font-black">Sign in to HipHop-UG</h1>
      <p className="text-sm text-ug-muted mt-2">Access your music and artist account.</p>
      {error && <p role="alert" className="text-red-300 mt-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4 mt-6">
        <label className="block text-sm">Email
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3" />
        </label>
        <label className="block text-sm">Password
          <input type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3" />
        </label>
        <button type="submit" disabled={busy}
          className="w-full bg-ug-gold text-black font-bold rounded-xl py-3 disabled:opacity-50">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ug-muted">New here? <Link href="/auth/register" className="text-ug-gold">Create an account</Link></p>
    </div>
  </main>;
}
