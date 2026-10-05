import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { createErrorResponse, handleApiError } from "@/lib/errors";
import { isUuid } from "@/lib/media-upload-policy";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return createErrorResponse("NOT_FOUND", "Image not found.", 404);
    const db = requireDb();
    const [image] = await db.select().from(schema.artistImageAssets).where(eq(schema.artistImageAssets.id, id)).limit(1);
    if (!image || !image.blobUrl || !["UPLOADED", "CLAIMED"].includes(image.status)) return createErrorResponse("NOT_FOUND", "Image not found.", 404);
    let published = false;
    if (image.status === "CLAIMED" && image.artistId) {
      const [artist] = await db.select({ id: schema.artists.id }).from(schema.artists).where(and(eq(schema.artists.id, image.artistId), isNull(schema.artists.deletedAt))).limit(1);
      published = !!artist;
    }
    if (!published) {
      const session = await getSession();
      if (image.status !== "UPLOADED" || image.expiresAt <= new Date() || session?.userId !== image.userId) return createErrorResponse("NOT_FOUND", "Image not found.", 404);
    }
    const source = new URL(image.blobUrl);
    if (source.protocol !== "https:" || !source.hostname.endsWith(".private.blob.vercel-storage.com")) return createErrorResponse("MEDIA_UNAVAILABLE", "Image unavailable.", 502);
    const result = await get(image.blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return createErrorResponse("MEDIA_UNAVAILABLE", "Image unavailable.", 502);
    return new NextResponse(result.stream, { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": published ? "public, max-age=0, s-maxage=60, must-revalidate" : "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
