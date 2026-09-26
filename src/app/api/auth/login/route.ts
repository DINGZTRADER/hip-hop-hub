import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { handleApiError, createErrorResponse } from "@/lib/errors";
import { MOCK_USERS, MOCK_ARTISTS } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, provider, googleCredential } = body;

    // Handle Google Sign-In with memory
    if (provider === "google") {
      const googleUserEmail = body.email || "artist.google@hiphopug.com";
      const googleUserName = body.name || "Ugandan Emcee";

      // Match existing artist or create one
      const matchedArtist = MOCK_ARTISTS.find(
        (a) => a.bookingEmail?.toLowerCase() === googleUserEmail.toLowerCase()
      );

      const sessionPayload = {
        userId: `google-${Date.now()}`,
        email: googleUserEmail,
        name: googleUserName,
        role: (matchedArtist ? "ARTIST" : "FAN") as "ARTIST" | "FAN",
        artistId: matchedArtist?.id,
        stageName: matchedArtist?.stageName,
      };

      await setSessionCookie(sessionPayload);

      return NextResponse.json({
        success: true,
        user: sessionPayload,
      });
    }

    // Standard Email & Password
    if (!email || !password) {
      return createErrorResponse("INVALID_CREDENTIALS", "Email and password are required.", 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check seed artists for demo login or registered users
    const matchedUser = MOCK_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    const matchedArtist = MOCK_ARTISTS.find(
      (a) => a.bookingEmail?.toLowerCase() === cleanEmail || a.stageName.toLowerCase() === cleanEmail
    );

    const userId = matchedUser ? matchedUser.id : matchedArtist ? matchedArtist.userId : `user-${Date.now()}`;
    const userName = matchedUser ? matchedUser.name : matchedArtist ? matchedArtist.stageName : "Hip-Hop Fan";
    const userRole = (matchedArtist || matchedUser?.role === "ARTIST") ? "ARTIST" : "FAN";

    const sessionPayload = {
      userId,
      email: cleanEmail,
      name: userName,
      role: userRole as "ARTIST" | "FAN",
      artistId: matchedArtist?.id,
      stageName: matchedArtist?.stageName,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
