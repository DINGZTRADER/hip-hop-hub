import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { beginPurchase, reconcilePurchase } from "@/lib/payments";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in to buy a track.", 401);
    const body = await request.json();
    const method = body.paymentMethod;
    if (typeof body.trackId !== "string" ||
      !["MTN_MOMO", "AIRTEL_MONEY", "CARD"].includes(method))
      return createErrorResponse("VALIDATION_ERROR", "Choose a track and payment method.", 400);
    const phone = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    if (method !== "CARD" && !/^(\+256|0)7\d{8}$/.test(phone))
      return createErrorResponse("VALIDATION_ERROR", "Enter a valid Uganda mobile money number.", 400);
    const result = await beginPurchase({ buyerId: session.userId, email: session.email,
      name: session.name, trackId: body.trackId, method, phone: phone || undefined });
    return NextResponse.json({ success: true, status: "PENDING", ...result }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in required.", 401);
    const p = new URL(request.url).searchParams;
    const reference = p.get("reference");
    if (!reference) return createErrorResponse("VALIDATION_ERROR", "Purchase reference required.", 400);
    const db = requireDb();
    let [purchase] = await db.select().from(schema.purchases).where(and(
      eq(schema.purchases.paymentReference, reference), eq(schema.purchases.buyerId, session.userId))).limit(1);
    if (!purchase) return createErrorResponse("PURCHASE_NOT_FOUND", "Purchase not found.", 404);
    const transactionId = Number(p.get("transaction_id"));
    if (purchase.status === "PENDING" && Number.isSafeInteger(transactionId) && transactionId > 0) {
      await reconcilePurchase(reference, transactionId);
      [purchase] = await db.select().from(schema.purchases)
        .where(eq(schema.purchases.id, purchase.id)).limit(1);
    }
    return NextResponse.json({ status: purchase.status, reference,
      downloadUrl: purchase.status === "COMPLETED"
        ? "/api/tracks/" + purchase.trackId + "/download?token=" + purchase.downloadToken : null },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
