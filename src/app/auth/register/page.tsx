"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"FAN" | "ARTIST">("ARTIST");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Registration failed.");
      router.push(role === "ARTIST" ? "/dashboard/onboarding" : "/");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Registration failed."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-8 text-white">
      <h1 className="text-2xl font-black">Join HipHop-UG</h1>
      <p className="text-sm text-ug-muted mt-2">Choose how you want to use the platform.</p>
      {error && <p role="alert" className="text-red-300 mt-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4 mt-6">
        <fieldset>
          <legend className="text-sm mb-2">Account type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["ARTIST", "FAN"] as const).map(value =>
              <button key={value} type="button" onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={"rounded-xl border py-3 " + (role === value ? "border-ug-gold text-ug-gold" : "border-ug-border")}>
                {value === "ARTIST" ? "Artist" : "Fan"}
              </button>)}
          </div>
        </fieldset>
        <label className="block text-sm">Name
          <input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            autoComplete="name" className="mt-1 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3" />
        </label>
        <label className="block text-sm">Email
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="email" className="mt-1 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3" />
        </label>
        <label className="block text-sm">Password (12 or more characters)
          <input type="password" required minLength={12} maxLength={128} value={password}
            onChange={e => setPassword(e.target.value)} autoComplete="new-password"
            className="mt-1 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3" />
        </label>
        <button type="submit" disabled={busy}
          className="w-full bg-ug-gold text-black font-bold rounded-xl py-3 disabled:opacity-50">
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ug-muted">Already registered? <Link href="/auth/login" className="text-ug-gold">Sign in</Link></p>
    </div>
  </main>;
}
