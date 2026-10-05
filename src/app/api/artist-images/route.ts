import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { uploadArtistImage, retireDraftImage } from "@/lib/artist-images";
import { requireSameOrigin, readBoundedBody } from "@/lib/request-body";
import { MAX_IMAGE_BYTES } from "@/lib/artist-media-policy";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in to upload artist photos.", 401);
    const bytes = await readBoundedBody(request, MAX_IMAGE_BYTES + 65536);
    const body = new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") || "" }, body: bytes as BodyInit });
    const form = await body.formData();
    const file = form.get("file"), purpose = form.get("purpose");
    if (!(file instanceof File) || !["portrait", "gallery"].includes(String(purpose))) throw new AppError("INVALID_IMAGE", "Choose a portrait or gallery image.", 400);
    const cropValue = form.get("crop");
    let crop;
    try { crop = cropValue ? JSON.parse(String(cropValue)) : undefined; }
    catch { throw new AppError("INVALID_IMAGE", "Invalid crop.", 400); }
    const image = await uploadArtistImage(session.userId, file, purpose as "portrait" | "gallery", crop);
    return NextResponse.json({ image }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
    const { id } = await request.json();
    await retireDraftImage(session.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) { return handleApiError(error); }
}
