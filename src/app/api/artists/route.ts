import { NextRequest, NextResponse } from "next/server";
import { getArtists, registerArtist } from "@/lib/data-service";
import { getSession, setSessionCookie } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await getArtists({ cursor: p.get("cursor"), limit: Number(p.get("limit") || 8),
      region: p.get("region"), subgenre: p.get("subgenre"), search: p.get("search") });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ARTIST" || session.artistId)
      return createErrorResponse("FORBIDDEN", "An artist account without a profile is required.", 403);
    const body = await request.json();
    if (typeof body.stageName !== "string" || !body.stageName.trim() ||
      typeof body.realName !== "string" || !body.realName.trim() ||
      typeof body.dob !== "string" || Number.isNaN(Date.parse(body.dob)) ||
      !Array.isArray(body.initialTracks))
      return createErrorResponse("VALIDATION_ERROR", "Invalid artist profile.", 400);
    const artist = await registerArtist({ ...body, userId: session.userId });
    await setSessionCookie({ ...session, artistId: artist.id, stageName: artist.stageName });
    return NextResponse.json({ success: true, artist }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
