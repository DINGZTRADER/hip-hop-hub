"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State = { status: string; downloadUrl: string | null; error?: string };

function PurchaseResult() {
  const params = useSearchParams();
  const reference = params.get("tx_ref");
  const transactionId = params.get("transaction_id");
  const [state, setState] = useState<State>({ status: "PENDING", downloadUrl: null });

  useEffect(() => {
    if (!reference) { setState({ status: "ERROR", downloadUrl: null, error: "Missing payment reference." }); return; }
    let active = true;
    async function refresh() {
      try {
        const url = new URL("/api/purchases", window.location.origin);
        url.searchParams.set("reference", reference!);
        if (transactionId) url.searchParams.set("transaction_id", transactionId);
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Could not verify payment.");
        if (active) setState({ status: data.status, downloadUrl: data.downloadUrl });
      } catch (cause) {
        if (active) setState({ status: "ERROR", downloadUrl: null,
          error: cause instanceof Error ? cause.message : "Could not verify payment." });
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [reference, transactionId]);

  return <main className="min-h-screen max-w-xl mx-auto px-4 py-20 text-center">
    <h1 className="text-3xl font-black text-white">
      {state.status === "COMPLETED" ? "Payment confirmed" :
        state.status === "FAILED" ? "Payment failed" : "Checking payment"}
    </h1>
    <p className="text-ug-muted mt-4">
      {state.error || (state.status === "COMPLETED" ? "Your track is ready." :
        state.status === "FAILED" ? "No charge was confirmed for this purchase." :
        "Waiting for confirmation from the payment provider.")}
    </p>
    {state.downloadUrl && <a href={state.downloadUrl}
      className="inline-block mt-8 rounded-xl bg-ug-gold px-6 py-3 font-bold text-black">Download track</a>}
    <div className="mt-8"><Link href="/" className="text-ug-gold">Return to music</Link></div>
  </main>;
}

export default function Page() {
  return <Suspense fallback={<main className="min-h-screen p-20 text-center">Checking payment...</main>}>
    <PurchaseResult />
  </Suspense>;
}
