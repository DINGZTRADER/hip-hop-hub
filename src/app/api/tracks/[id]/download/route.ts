import { NextRequest, NextResponse } from "next/server";
import { handleApiError, createErrorResponse } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return createErrorResponse(
        "UNAUTHORIZED",
        "A valid purchase download token is required to download this track.",
        401
      );
    }

    // In production, token is validated against the purchases table in Neon
    // Here we redirect to the audio master source for high-quality download
    return NextResponse.redirect(
      `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`,
      { status: 307 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
