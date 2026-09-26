import { NextRequest, NextResponse } from "next/server";
import { processPurchase } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const { trackId, paymentMethod, phoneNumber } = body;

    if (!trackId) {
      return createErrorResponse("MISSING_TRACK_ID", "Track ID is required.", 400);
    }

    if (!paymentMethod || !["MTN_MOMO", "AIRTEL_MONEY", "CARD"].includes(paymentMethod)) {
      return createErrorResponse(
        "INVALID_PAYMENT_METHOD",
        "Valid payment method is required: MTN_MOMO, AIRTEL_MONEY, or CARD.",
        400
      );
    }

    if ((paymentMethod === "MTN_MOMO" || paymentMethod === "AIRTEL_MONEY") && !phoneNumber) {
      return createErrorResponse(
        "PHONE_NUMBER_REQUIRED",
        "Mobile money phone number (e.g., 077... or 075...) is required for Uganda Mobile Money.",
        400
      );
    }

    // Generate unique payment transaction reference (e.g., MTN-UG-1234567)
    const ref = `${paymentMethod.replace("_", "-")}-UG-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const purchase = await processPurchase({
      buyerId: session?.userId,
      trackId,
      paymentMethod,
      paymentReference: ref,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment confirmed. Download token generated.",
        purchase,
        downloadUrl: `/api/tracks/${trackId}/download?token=${purchase.downloadToken}`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
