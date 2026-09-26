import { NextRequest, NextResponse } from "next/server";
import { getArtistByStageName, updateArtistHeroVideo } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stageName: string }> }
) {
  try {
    const { stageName } = await params;
    const artist = await getArtistByStageName(stageName);

    if (!artist) {
      return createErrorResponse(
        "ARTIST_NOT_FOUND",
        `Artist "${decodeURIComponent(stageName)}" was not found on HipHop-UG.`,
        404
      );
    }

    return NextResponse.json({ artist }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/artists/[stageName] - Replace 10s MP4 video or update details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stageName: string }> }
) {
  try {
    const { stageName } = await params;
    const artist = await getArtistByStageName(stageName);

    if (!artist) {
      return createErrorResponse("ARTIST_NOT_FOUND", "Artist not found.", 404);
    }

    const body = await request.json();

    if (body.heroVideoMp4Url) {
      const updated = await updateArtistHeroVideo(artist.id, body.heroVideoMp4Url);
      return NextResponse.json({ success: true, artist: updated }, { status: 200 });
    }

    return NextResponse.json({ success: true, artist }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
