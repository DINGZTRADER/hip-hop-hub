import { NextRequest, NextResponse } from "next/server";
import { getTracks, addTrackToArtist, getArtistById } from "@/lib/data-service";
import { getSession } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await getTracks({ cursor: p.get("cursor"), limit: Number(p.get("limit") || 10),
      artistId: p.get("artistId"), search: p.get("search") });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in required.", 401);
    const body = await request.json();
    const artistId = session.artistId;
    if (!artistId || body.artistId !== artistId)
      return createErrorResponse("FORBIDDEN", "Not your artist profile.", 403);
    const artist = await getArtistById(artistId);
    if (!artist || artist.userId !== session.userId)
      return createErrorResponse("FORBIDDEN", "Not your artist profile.", 403);
    if (body.originalsConfirmed !== true) return createErrorResponse("ORIGINALS_REQUIRED", "Confirm this is your original music.", 400);
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 255 ||
      typeof body.fileUrl !== "string" || !/^https:\/\//i.test(body.fileUrl) ||
      (body.previewUrl !== undefined && body.previewUrl !== "") ||
      !Number.isSafeInteger(body.filesizeBytes) || body.filesizeBytes <= 0 ||
      !Number.isSafeInteger(body.priceUgx) || body.priceUgx < 1000 ||
      !Number.isSafeInteger(body.durationSeconds) || body.durationSeconds <= 0)
      return createErrorResponse("VALIDATION_ERROR", "Invalid track metadata.", 400);
    const track = await addTrackToArtist(artistId, { title: body.title.trim(),
      durationSeconds: body.durationSeconds, fileUrl: body.fileUrl, previewUrl: body.previewUrl,
      filesizeBytes: body.filesizeBytes, priceUgx: body.priceUgx,
      priceUsd: Number(body.priceUsd) || 0.99, isPublished: true }, session.userId);
    return NextResponse.json({ success: true, track }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
