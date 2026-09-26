import { NextRequest, NextResponse } from "next/server";
import { getArtists, registerArtist } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";
import { getSession } from "@/lib/auth";

// GET /api/artists - Stateless cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const region = searchParams.get("region");
    const subgenre = searchParams.get("subgenre");
    const search = searchParams.get("search");

    const result = await getArtists({
      cursor,
      limit,
      region,
      subgenre,
      search,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Cache for 60 seconds at edge, stale-while-revalidate for 5 minutes
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/artists - Register new artist
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      stageName,
      realName,
      dob,
      bio,
      region,
      subgenre,
      socials,
      phoneForBookings,
      bookingEmail,
      heroVideoMp4Url,
      youtubeVideos,
      initialTracks,
      eventFlyer,
      freestyle,
      services,
    } = body;

    if (!stageName || !realName || !dob) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Stage name, real name, and date of birth are required.",
        400
      );
    }

    if (!initialTracks || initialTracks.length < 3) {
      return createErrorResponse(
        "MIN_TRACKS_REQUIRED",
        "You must upload at least 3 original MP3 tracks to register as a HipHop-UG artist.",
        400
      );
    }

    const userId = session?.userId || `user-${Date.now()}`;

    const newArtist = await registerArtist({
      userId,
      stageName,
      realName,
      dob,
      bio,
      region: region || "Kampala",
      subgenre: subgenre || "Luga Flow",
      socials: socials || {},
      phoneForBookings,
      bookingEmail,
      heroVideoMp4Url,
      youtubeVideos: youtubeVideos || [],
      initialTracks,
      eventFlyer,
      freestyle,
      services,
    });

    return NextResponse.json({ success: true, artist: newArtist }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
