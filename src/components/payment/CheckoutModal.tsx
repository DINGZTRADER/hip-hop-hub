"use client";

import React, { useState } from "react";
import { useAudio } from "../audio/AudioContext";
import { X, CheckCircle, Smartphone, CreditCard, ShieldCheck, Download, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export function CheckoutModal() {
  const { selectedTrackForPurchase, closeCheckout } = useAudio();
  const [paymentMethod, setPaymentMethod] = useState<"MTN_MOMO" | "AIRTEL_MONEY" | "CARD">("MTN_MOMO");
  const [phone, setPhone] = useState<string>("0772123456");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedPurchase, setCompletedPurchase] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!selectedTrackForPurchase) return null;

  const track = selectedTrackForPurchase;
  const platformFee = Math.round(track.priceUgx * 0.20);
  const artistShare = track.priceUgx - platformFee;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          paymentMethod,
          phoneNumber: phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Payment failed.");
      }

      setCompletedPurchase(data);

      // Fire victory confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFCC00", "#E60000", "#00E5FF"],
        });
      } catch (e) {
        // ignore if canvas not supported
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-ug-surface border border-ug-border rounded-3xl p-6 md:p-8 shadow-2xl text-white">
        <button
          onClick={closeCheckout}
          className="absolute top-5 right-5 text-ug-muted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {completedPurchase ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white">Payment Confirmed!</h3>
            <p className="text-sm text-ug-muted mt-2">
              You now own the 320kbps master MP3 of <strong className="text-white">&quot;{track.title}&quot;</strong>.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-ug-card border border-ug-border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ug-muted">Transaction Ref:</span>
                <span className="font-mono text-white">{completedPurchase.purchase.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ug-muted">Payment Channel:</span>
                <span className="text-ug-gold font-bold">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ug-muted">Artist Royalty (80%):</span>
                <span className="text-emerald-400 font-bold">UGX {artistShare.toLocaleString()}</span>
              </div>
            </div>

            <a
              href={completedPurchase.downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-sm uppercase py-3.5 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download 320kbps Master MP3</span>
            </a>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-ug-gold text-xs font-mono font-bold uppercase mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Uganda Direct Music Purchase</span>
              </div>
              <h3 className="text-xl font-black text-white">{track.title}</h3>
              <p className="text-xs text-ug-muted">By {track.artistStageName || "Ugandan Emcee"}</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-ug-red/20 border border-ug-red text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-ug-muted mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("MTN_MOMO")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "MTN_MOMO"
                      ? "border-ug-gold bg-ug-gold/10 text-ug-gold font-bold"
                      : "border-ug-border bg-ug-card text-ug-muted hover:text-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-yellow-400" />
                  <span className="text-[11px]">MTN MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("AIRTEL_MONEY")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "AIRTEL_MONEY"
                      ? "border-ug-red bg-ug-red/10 text-ug-red font-bold"
                      : "border-ug-border bg-ug-card text-ug-muted hover:text-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-red-500" />
                  <span className="text-[11px]">Airtel Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "CARD"
                      ? "border-ug-accent bg-ug-accent/10 text-ug-accent font-bold"
                      : "border-ug-border bg-ug-card text-ug-muted hover:text-white"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <span className="text-[11px]">Card / Visa</span>
                </button>
              </div>
            </div>

            {/* Mobile Money Phone Input */}
            {(paymentMethod === "MTN_MOMO" || paymentMethod === "AIRTEL_MONEY") && (
              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Mobile Money Phone Number (Uganda)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold font-mono"
                  placeholder="077... or 075..."
                />
                <p className="text-[10px] text-ug-muted mt-1">
                  Prompt will be sent to your handset to enter PIN.
                </p>
              </div>
            )}

            {/* 80/20 Transparent Price Breakdown */}
            <div className="p-4 rounded-2xl bg-ug-card/70 border border-ug-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ug-muted">Track Price:</span>
                <span className="font-bold text-white">UGX {track.priceUgx.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Artist Share (80%):</span>
                <span>UGX {artistShare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-ug-muted">
                <span>HipHop-UG Commission (20%):</span>
                <span>UGX {platformFee.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-ug-red to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-extrabold text-sm uppercase py-3.5 rounded-xl shadow-lg transition transform hover:scale-102 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <span>Pay UGX {track.priceUgx.toLocaleString()} & Download</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
