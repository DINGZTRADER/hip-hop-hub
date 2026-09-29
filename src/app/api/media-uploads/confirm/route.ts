import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { finalizeMediaUpload, releaseMediaUpload } from "@/lib/media-uploads";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
    const body = await request.json();
    if (typeof body?.id !== "string" || typeof body?.url !== "string")
      throw new AppError("INVALID_UPLOAD", "Upload details are missing.", 400);
    const row = await finalizeMediaUpload(session.userId, body.id, body.url);
    return NextResponse.json({ id: row.id, url: row.blobUrl, size: row.actualBytes });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
    const body = await request.json();
    if (typeof body?.id !== "string") throw new AppError("INVALID_UPLOAD", "Upload ID is missing.", 400);
    await releaseMediaUpload(session.userId, body.id);
    return NextResponse.json({ success: true });
  } catch (error) { return handleApiError(error); }
}
