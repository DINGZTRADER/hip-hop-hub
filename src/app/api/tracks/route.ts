import { NextRequest, NextResponse } from "next/server";
import { getTracks, addTrackToArtist } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";
import { getSession } from "@/lib/auth";

// GET /api/tracks - Stateless cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const artistId = searchParams.get("artistId");
    const search = searchParams.get("search");

    const result = await getTracks({
      cursor,
      limit,
      artistId,
      search,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tracks - Add track to artist crate (with 500MB storage check and 10 track cap)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      artistId,
      title,
      durationSeconds,
      fileUrl,
      previewUrl,
      filesizeBytes,
      priceUgx,
      priceUsd,
    } = body;

    const targetArtistId = artistId || session?.artistId;

    if (!targetArtistId) {
      return createErrorResponse(
        "UNAUTHORIZED",
        "Artist identifier is required to upload tracks.",
        401
      );
    }

    if (!title || !fileUrl || !previewUrl || !filesizeBytes) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Title, audio file URL, preview URL, and filesize are required.",
        400
      );
    }

    const newTrack = await addTrackToArtist(targetArtistId, {
      title,
      durationSeconds: Number(durationSeconds) || 180,
      fileUrl,
      previewUrl,
      filesizeBytes: Number(filesizeBytes),
      priceUgx: Number(priceUgx) || 3000,
      priceUsd: Number(priceUsd) || 0.99,
      isPublished: true,
    });

    return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
