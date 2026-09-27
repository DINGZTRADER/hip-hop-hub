import { NextRequest, NextResponse } from "next/server";
import { getArtistWallet, getArtistById } from "@/lib/data-service";
import { getSession } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.artistId) return createErrorResponse("UNAUTHORIZED", "Artist sign in required.", 401);
    const artistId = new URL(request.url).searchParams.get("artistId") || session.artistId;
    if (artistId !== session.artistId) return createErrorResponse("FORBIDDEN", "Not your wallet.", 403);
    const artist = await getArtistById(artistId);
    if (!artist || artist.userId !== session.userId)
      return createErrorResponse("FORBIDDEN", "Not your wallet.", 403);
    const result = await getArtistWallet(artistId);
    return NextResponse.json({ success: true, ...result, platformCommissionRate: "20%", artistShareRate: "80%" },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
