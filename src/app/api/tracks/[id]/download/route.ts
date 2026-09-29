import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in required.", 401);
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return createErrorResponse("UNAUTHORIZED", "Download token required.", 401);
    const db = requireDb();
    const [purchase] = await db.select().from(schema.purchases).where(and(
      eq(schema.purchases.trackId, id), eq(schema.purchases.buyerId, session.userId),
      eq(schema.purchases.downloadToken, token), eq(schema.purchases.status, "COMPLETED"))).limit(1);
    if (!purchase || purchase.downloadExpiresAt <= new Date())
      return createErrorResponse("FORBIDDEN", "Download access expired or invalid.", 403);
    const [track] = await db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).limit(1);
    if (!track) return createErrorResponse("TRACK_NOT_FOUND", "Track not found.", 404);
    const source = new URL(track.fileUrl);
    let stream: ReadableStream<Uint8Array>;
    if (source.hostname.endsWith(".private.blob.vercel-storage.com")) {
      const result = await get(track.fileUrl, { access: "private" });
      if (!result || result.statusCode !== 200 || !result.stream)
        return createErrorResponse("MEDIA_UNAVAILABLE", "Media is temporarily unavailable.", 502);
      stream = result.stream;
    } else {
      const originHost = process.env.MEDIA_ORIGIN_HOST;
      const originToken = process.env.MEDIA_ORIGIN_TOKEN;
      if (!originHost || !originToken)
        return createErrorResponse("MEDIA_UNAVAILABLE", "Media delivery is not configured.", 503);
      if (source.protocol !== "https:" || source.hostname !== originHost || source.username || source.password)
        return createErrorResponse("MEDIA_UNAVAILABLE", "Media source is invalid.", 503);
      const upstream = await fetch(source, { headers: { Authorization: "Bearer " + originToken },
        cache: "no-store", redirect: "error" });
      if (!upstream.ok || !upstream.body)
        return createErrorResponse("MEDIA_UNAVAILABLE", "Media is temporarily unavailable.", 502);
      stream = upstream.body;
    }
    await db.update(schema.purchases).set({ downloadCount: sql`${schema.purchases.downloadCount} + 1` })
      .where(eq(schema.purchases.id, purchase.id));
    await db.update(schema.tracks).set({ downloadCount: sql`${schema.tracks.downloadCount} + 1` })
      .where(eq(schema.tracks.id, track.id));
    const filename = track.title.replace(/[^a-z0-9_-]/gi, "_").slice(0, 100) + ".mp3";
    return new NextResponse(stream, { headers: {
      "Content-Type": "audio/mpeg", "Content-Disposition": "attachment; filename=\"" + filename + "\"",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return handleApiError(error); }
}
