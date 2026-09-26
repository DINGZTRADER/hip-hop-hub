import { NextRequest, NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { handleApiError, createErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return createErrorResponse(
        "MISSING_FIELDS",
        "Email, password, and name are required.",
        400
      );
    }

    if (password.length < 6) {
      return createErrorResponse(
        "PASSWORD_TOO_SHORT",
        "Password must be at least 6 characters long.",
        400
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user-${Date.now()}`;
    const userRole = role === "ARTIST" ? "ARTIST" : "FAN";

    const sessionPayload = {
      userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: userRole,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email: sessionPayload.email,
          name: sessionPayload.name,
          role: sessionPayload.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
