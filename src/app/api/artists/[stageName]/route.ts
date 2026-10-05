import { NextRequest, NextResponse } from "next/server";
import { getArtistByStageName, updateArtistHeroVideo } from "@/lib/data-service";
import { updateArtistProfile } from "@/lib/artist-profile";
import { requireSameOrigin } from "@/lib/request-body";
import { getSession } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ stageName: string }> }) {
  try {
    const { stageName } = await params;
    const artist = await getArtistByStageName(stageName);
    if (!artist) return createErrorResponse("ARTIST_NOT_FOUND", "Artist not found.", 404);
    return NextResponse.json({ artist });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ stageName: string }> }) {
  try {
    requireSameOrigin(request);
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in required.", 401);
    const { stageName } = await params;
    const artist = await getArtistByStageName(stageName);
    if (!artist) return createErrorResponse("ARTIST_NOT_FOUND", "Artist not found.", 404);
    if (artist.userId !== session.userId) return createErrorResponse("FORBIDDEN", "Not your artist profile.", 403);
    const body = await request.json();
    if (!Object.hasOwn(body, "heroVideoMp4Url")) {
      const updated = await updateArtistProfile(session.userId, artist.id, body);
      return NextResponse.json({success: true, artist: updated}, {headers: {"Cache-Control": "private, no-store"}});
    }
    const url = body.heroVideoMp4Url;
    if (typeof url !== "string" || !/^https:\/\//i.test(url) || url.length > 2048)
      return createErrorResponse("VALIDATION_ERROR", "A valid HTTPS video URL is required.", 400);
    const updated = await updateArtistHeroVideo(artist.id, url);
    return NextResponse.json({ success: true, artist: updated });
  } catch (error) { return handleApiError(error); }
}
