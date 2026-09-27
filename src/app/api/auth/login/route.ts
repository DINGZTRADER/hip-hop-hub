import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.provider) {
      return createErrorResponse("UNSUPPORTED_PROVIDER", "Google sign-in is not configured.", 400);
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return createErrorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }
    const db = requireDb();
    const [user] = await db.select().from(schema.users).where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt))).limit(1);
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return createErrorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }
    const [artist] = await db.select({ id: schema.artists.id, stageName: schema.artists.stageName })
      .from(schema.artists).where(and(eq(schema.artists.userId, user.id), isNull(schema.artists.deletedAt))).limit(1);
    const session = { userId: user.id, email: user.email, name: user.name, role: user.role, artistId: artist?.id, stageName: artist?.stageName };
    await setSessionCookie(session);
    return NextResponse.json({ success: true, user: session });
  } catch (error) {
    return handleApiError(error);
  }
}
