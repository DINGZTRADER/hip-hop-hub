import { NextRequest, NextResponse } from "next/server";
import { reconcilePurchase, webhookAuthorized } from "@/lib/payments";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  if (!webhookAuthorized(request.headers.get("verif-hash")))
    return new NextResponse(null, { status: 401 });
  try {
    const event = await request.json();
    if (event.event === "charge.completed" &&
      typeof event.data?.tx_ref === "string" &&
      Number.isSafeInteger(Number(event.data?.id))) {
      await reconcilePurchase(event.data.tx_ref, Number(event.data.id));
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) { return handleApiError(error); }
}
