"use client";

import React, { useState } from "react";
import { useAudio } from "../audio/AudioContext";
import { X, Smartphone, CreditCard, Loader2 } from "lucide-react";

export function CheckoutModal() {
  const { selectedTrackForPurchase, closeCheckout } = useAudio();
  const [paymentMethod, setPaymentMethod] = useState<"MTN_MOMO" | "AIRTEL_MONEY" | "CARD">("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  if (!selectedTrackForPurchase) return null;
  const track = selectedTrackForPurchase;

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    setProcessing(true);
    setError("");
    try {
      const response = await fetch("/api/purchases", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, paymentMethod, phoneNumber: phone }) });
      const result = await response.json();
      if (response.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      if (!response.ok || !result.checkoutUrl)
        throw new Error(result.error?.message || "Could not start payment.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start payment.");
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-6 md:p-8 text-white">
        <button onClick={closeCheckout} aria-label="Close checkout"
          className="absolute top-5 right-5 text-ug-muted hover:text-white"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-black">Buy {track.title}</h2>
        <p className="text-sm text-ug-muted mt-2">UGX {track.priceUgx.toLocaleString()} via secure checkout</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        <form onSubmit={handlePay} className="space-y-5 mt-6">
          <fieldset>
            <legend className="text-xs font-semibold text-ug-muted mb-2">Payment method</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["MTN_MOMO", "AIRTEL_MONEY", "CARD"] as const).map(method => (
                <button type="button" key={method} onClick={() => setPaymentMethod(method)}
                  aria-pressed={paymentMethod === method}
                  className={"p-3 rounded-xl border text-xs flex flex-col items-center gap-2 " +
                    (paymentMethod === method ? "border-ug-gold text-ug-gold" : "border-ug-border text-ug-muted")}>
                  {method === "CARD" ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  {method === "MTN_MOMO" ? "MTN MoMo" : method === "AIRTEL_MONEY" ? "Airtel Money" : "Card"}
                </button>
              ))}
            </div>
          </fieldset>
          {paymentMethod !== "CARD" && <label className="block text-xs text-ug-muted">
            Uganda mobile money number
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="077..." className="mt-2 w-full bg-ug-card border border-ug-border rounded-xl px-4 py-3 text-white" />
          </label>}
          <p className="text-xs text-ug-muted">Artist receives 80% after payment is verified.</p>
          <button type="submit" disabled={processing}
            className="w-full flex items-center justify-center gap-2 bg-ug-gold text-black font-extrabold py-3 rounded-xl disabled:opacity-50">
            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue to payment
          </button>
        </form>
      </div>
    </div>
  );
}
