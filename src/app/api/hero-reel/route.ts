import { NextResponse } from "next/server";
import { getRotatingHeroClips } from "@/lib/data-service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const clips = await getRotatingHeroClips();
    return NextResponse.json({ clips }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
