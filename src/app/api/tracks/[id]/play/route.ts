import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { requireDb, schema } from "@/db";
import { AppError, handleApiError } from "@/lib/errors";
import { requireSameOrigin } from "@/lib/request-body";
import { createPlayTicket, PLAY_WINDOW_MS, qualifyingPlaySeconds, verifyPlayTicket } from "@/lib/track-play-policy";
import { isUuid } from "@/lib/media-upload-policy";

export async function POST(request: NextRequest, {params}: {params:Promise<{id:string}>}) {
  try {
    requireSameOrigin(request);
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in to count a play.", 401);
    const {id} = await params;
    if (!isUuid(id)) throw new AppError("NOT_FOUND", "Track not found.", 404);
    const db = requireDb();
    const [row] = await db.select({track:schema.tracks,ownerId:schema.artists.userId}).from(schema.tracks).innerJoin(schema.artists,eq(schema.artists.id,schema.tracks.artistId)).where(and(eq(schema.tracks.id,id),eq(schema.tracks.isPublished,true),isNull(schema.tracks.deletedAt),isNull(schema.artists.deletedAt))).limit(1);
    if (!row) throw new AppError("NOT_FOUND", "Track not found.", 404);
    if (row.ownerId !== session.userId && !row.track.previewUrl) throw new AppError("FORBIDDEN", "No playable audio is available for this account.", 403);
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("Playback signing is not configured");
    const body = await request.json();
    const seconds = qualifyingPlaySeconds(row.track.durationSeconds);
    if (body.phase === "start") return NextResponse.json({ticket:createPlayTicket(session.userId,id,Date.now(),secret),seconds}, {headers:{"Cache-Control":"private, no-store"}});
    if (body.phase !== "complete" || typeof body.ticket !== "string" || !verifyPlayTicket(body.ticket,session.userId,id,Date.now(),seconds,secret)) throw new AppError("INVALID_PLAY", "Playback has not qualified yet.", 400);
    const playCount = await db.transaction(async tx => {
      const [track] = await tx.select().from(schema.tracks).where(and(eq(schema.tracks.id,id),isNull(schema.tracks.deletedAt))).for("update").limit(1);
      if (!track) throw new AppError("NOT_FOUND", "Track not found.", 404);
      const windowStart = new Date(Math.floor(Date.now()/PLAY_WINDOW_MS)*PLAY_WINDOW_MS);
      const inserted = await tx.insert(schema.trackPlayEvents).values({trackId:id,userId:session.userId,windowStart}).onConflictDoNothing().returning({id:schema.trackPlayEvents.id});
      if (!inserted.length) return track.playCount;
      const [updated] = await tx.update(schema.tracks).set({playCount:sql`${schema.tracks.playCount} + 1`}).where(eq(schema.tracks.id,id)).returning({playCount:schema.tracks.playCount});
      return updated.playCount;
    });
    return NextResponse.json({playCount},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) {return handleApiError(error);}
}
