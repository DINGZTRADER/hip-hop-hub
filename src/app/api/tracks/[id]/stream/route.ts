import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createErrorResponse("UNAUTHORIZED", "Sign in required.", 401);
    const { id } = await params;
    const db = requireDb();
    const [track] = await db.select().from(schema.tracks).where(and(eq(schema.tracks.id, id), isNull(schema.tracks.deletedAt))).limit(1);
    if (!track) return createErrorResponse("TRACK_NOT_FOUND", "Track not found.", 404);
    const [artist] = await db.select().from(schema.artists).where(and(eq(schema.artists.id, track.artistId), isNull(schema.artists.deletedAt))).limit(1);
    if (!artist || artist.userId !== session.userId) return createErrorResponse("FORBIDDEN", "Only the track owner can play the full master here.", 403);
    const range = request.headers.get("range");
    if (range && !/^bytes=\d*-\d*$/.test(range)) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${track.filesizeBytes}`, "Cache-Control": "private, no-store" } });
    const source = new URL(track.fileUrl);
    if (source.protocol !== "https:" || source.username || source.password) return createErrorResponse("MEDIA_UNAVAILABLE", "Invalid media source.", 503);
    let stream: ReadableStream<Uint8Array>;
    let upstreamHeaders: Headers;
    if (source.hostname.endsWith(".private.blob.vercel-storage.com")) {
      const result = await get(track.fileUrl, { access: "private", headers: range ? { Range: range } : undefined, abortSignal: request.signal });
      if (!result || result.statusCode !== 200 || !result.stream) return createErrorResponse("MEDIA_UNAVAILABLE", "Audio temporarily unavailable.", 502);
      stream = result.stream;
      upstreamHeaders = new Headers();
      result.headers.forEach((value, name) => upstreamHeaders.set(name, value));
    } else {
      if (source.hostname !== process.env.MEDIA_ORIGIN_HOST || !process.env.MEDIA_ORIGIN_TOKEN) return createErrorResponse("MEDIA_UNAVAILABLE", "Media delivery is not configured.", 503);
      const upstream = await fetch(source, { headers: { Authorization: `Bearer ${process.env.MEDIA_ORIGIN_TOKEN}`, ...(range ? { Range: range } : {}) }, cache: "no-store", redirect: "error", signal: request.signal });
      if (!upstream.ok || !upstream.body) return createErrorResponse("MEDIA_UNAVAILABLE", "Audio temporarily unavailable.", 502);
      stream = upstream.body;
      upstreamHeaders = upstream.headers;
    }
    const headers = new Headers({ "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
    for (const name of ["content-length", "content-range"]) {
      const value = upstreamHeaders.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(stream, { status: headers.has("content-range") ? 206 : 200, headers });
  } catch (error) { return handleApiError(error); }
}

