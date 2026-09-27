import { randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { matchesPurchase } from "./payment-validation";
import { requireDb, schema } from "@/db";
import { AppError } from "@/lib/errors";

type VerifiedPayment = { id: number; tx_ref: string; status: string; amount: number; currency: string };

function secretKey() {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new AppError("PAYMENTS_UNAVAILABLE", "Payments are temporarily unavailable.", 503);
  return key;
}

export function webhookAuthorized(value: string | null): boolean {
  const expected = process.env.FLW_WEBHOOK_SECRET_HASH;
  if (!expected || !value) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyPayment(transactionId: number): Promise<VerifiedPayment> {
  if (!Number.isSafeInteger(transactionId) || transactionId <= 0)
    throw new AppError("INVALID_TRANSACTION", "Invalid payment transaction.", 400);
  const response = await fetch("https://api.flutterwave.com/v3/transactions/" + transactionId + "/verify", {
    headers: { Authorization: "Bearer " + secretKey() }, cache: "no-store",
  });
  if (!response.ok) throw new AppError("PAYMENT_VERIFICATION_FAILED", "Could not verify payment.", 502);
  const payload = await response.json();
  if (payload.status !== "success" || !payload.data)
    throw new AppError("PAYMENT_VERIFICATION_FAILED", "Could not verify payment.", 502);
  return payload.data as VerifiedPayment;
}

export async function beginPurchase(params: {
  buyerId: string; email: string; name: string; trackId: string;
  method: "MTN_MOMO" | "AIRTEL_MONEY" | "CARD"; phone?: string;
}) {
  const key = secretKey();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || !/^https:\/\//.test(baseUrl))
    throw new AppError("PAYMENTS_UNAVAILABLE", "Payment URL is not configured.", 503);
  const db = requireDb();
  const [track] = await db.select().from(schema.tracks).where(and(
    eq(schema.tracks.id, params.trackId), eq(schema.tracks.isPublished, true))).limit(1);
  if (!track || track.deletedAt || !Number.isSafeInteger(track.priceUgx) || track.priceUgx < 1000)
    throw new AppError("TRACK_NOT_FOUND", "Track is unavailable.", 404);
  const reference = randomUUID();
  const commission = Math.round(track.priceUgx * 0.2);
  const [purchase] = await db.insert(schema.purchases).values({
    buyerId: params.buyerId, trackId: track.id, artistId: track.artistId,
    amountPaidUgx: track.priceUgx, platformCommissionUgx: commission,
    artistEarningsUgx: track.priceUgx - commission, paymentMethod: params.method,
    paymentReference: reference, status: "PENDING",
    downloadExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).returning({ id: schema.purchases.id });
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref: reference, amount: track.priceUgx, currency: "UGX",
      redirect_url: new URL("/purchase/complete", baseUrl).toString(),
      payment_options: params.method === "CARD" ? "card" : "mobilemoneyuganda",
      customer: { email: params.email, name: params.name, phonenumber: params.phone },
      customizations: { title: "HipHop-UG", description: track.title } }),
    cache: "no-store",
  });
  if (!response.ok) {
    await db.update(schema.purchases).set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(schema.purchases.id, purchase.id));
    throw new AppError("PAYMENT_INIT_FAILED", "Could not start payment.", 502);
  }
  const result = await response.json();
  if (result.status !== "success" || typeof result.data?.link !== "string") {
    await db.update(schema.purchases).set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(schema.purchases.id, purchase.id));
    throw new AppError("PAYMENT_INIT_FAILED", "Could not start payment.", 502);
  }
  const link = new URL(result.data.link);
  if (link.protocol !== "https:" || !link.hostname.endsWith(".flutterwave.com"))
    throw new AppError("PAYMENT_INIT_FAILED", "Invalid payment link.", 502);
  return { reference, checkoutUrl: link.toString() };
}

export async function settlePurchase(reference: string, verified: VerifiedPayment) {
  const db = requireDb();
  return db.transaction(async tx => {
    const [purchase] = await tx.select().from(schema.purchases)
      .where(eq(schema.purchases.paymentReference, reference)).for("update").limit(1);
    if (!purchase) throw new AppError("PURCHASE_NOT_FOUND", "Purchase not found.", 404);
    if (purchase.status === "COMPLETED") return purchase;
    if (purchase.status !== "PENDING") return purchase;
    if (!matchesPurchase(verified, reference, purchase.amountPaidUgx))
      throw new AppError("PAYMENT_MISMATCH", "Payment details do not match this purchase.", 409);
    const [wallet] = await tx.select().from(schema.artistWallets)
      .where(eq(schema.artistWallets.artistId, purchase.artistId)).for("update").limit(1);
    if (!wallet) throw new Error("Artist wallet missing");
    const balance = wallet.currentBalanceUgx + purchase.artistEarningsUgx;
    await tx.update(schema.artistWallets).set({ currentBalanceUgx: balance,
      totalEarnedUgx: wallet.totalEarnedUgx + purchase.artistEarningsUgx,
      updatedAt: new Date() }).where(eq(schema.artistWallets.id, wallet.id));
    await tx.insert(schema.walletTransactions).values({
      walletId: wallet.id, purchaseId: purchase.id, amountUgx: purchase.artistEarningsUgx,
      type: "CREDIT_SALE", balanceAfterUgx: balance,
      description: "Verified track sale",
    });
    const [completed] = await tx.update(schema.purchases).set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(schema.purchases.id, purchase.id)).returning();
    return completed;
  });
}

export async function reconcilePurchase(reference: string, transactionId: number) {
  const verified = await verifyPayment(transactionId);
  if (verified.status === "successful") return settlePurchase(reference, verified);
  const db = requireDb();
  if (verified.tx_ref === reference && verified.status === "failed")
    await db.update(schema.purchases).set({ status: "FAILED", updatedAt: new Date() })
      .where(and(eq(schema.purchases.paymentReference, reference), eq(schema.purchases.status, "PENDING")));
  const [purchase] = await db.select().from(schema.purchases)
    .where(eq(schema.purchases.paymentReference, reference)).limit(1);
  return purchase;
}
