import { NextRequest, NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length > 255 || password.length < 12 || password.length > 128) {
      return createErrorResponse("VALIDATION_ERROR", "Enter a valid email, name, and password of 12-128 characters.", 400);
    }
    const role: import("@/types").UserRole = body.role === "ARTIST" ? "ARTIST" : "FAN";
    const db = requireDb();
    const [user] = await db.insert(schema.users).values({
      email, name, role, passwordHash: await hashPassword(password),
    }).returning({ id: schema.users.id });
    const session = { userId: user.id, email, name, role };
    await setSessionCookie(session);
    return NextResponse.json({ success: true, user: { id: user.id, email, name, role } }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return createErrorResponse("EMAIL_TAKEN", "An account with this email already exists.", 409);
    }
    return handleApiError(error);
  }
}
