import { NextRequest, NextResponse } from "next/server";
import { getArtistWallet } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId") || session?.artistId;

    if (!artistId) {
      return createErrorResponse(
        "ARTIST_ID_REQUIRED",
        "Artist ID or logged-in artist session is required.",
        400
      );
    }

    const walletData = await getArtistWallet(artistId);

    return NextResponse.json({
      success: true,
      wallet: walletData.wallet,
      transactions: walletData.transactions,
      platformCommissionRate: "20%",
      artistShareRate: "80%",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
