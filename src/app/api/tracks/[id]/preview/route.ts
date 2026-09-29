import { get } from "@vercel/blob";
import { and, eq, isNull } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = requireDb();
    const [track] = await db.select({ previewUrl: schema.tracks.previewUrl }).from(schema.tracks)
      .where(and(eq(schema.tracks.id, id), eq(schema.tracks.isPublished, true),
        isNull(schema.tracks.deletedAt))).limit(1);
    if (!track) return createErrorResponse("TRACK_NOT_FOUND", "Track not found.", 404);
    const source = new URL(track.previewUrl);
    if (source.protocol !== "https:" || !source.hostname.endsWith(".private.blob.vercel-storage.com"))
      return createErrorResponse("MEDIA_UNAVAILABLE", "Preview is unavailable.", 503);
    const result = await get(track.previewUrl, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream)
      return createErrorResponse("MEDIA_UNAVAILABLE", "Preview is unavailable.", 502);
    return new Response(result.stream, { headers: { "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return handleApiError(error); }
}
