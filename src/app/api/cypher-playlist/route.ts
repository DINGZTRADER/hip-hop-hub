import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { MAX_SAVED_VIDEOS, normalizeVideoIds } from "@/lib/cypher-playlist";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ authenticated: false, canAdd: false, videoIds: [] }, { headers: { "Cache-Control": "private, no-store" } });
    if (session.role !== "ARTIST") return NextResponse.json({ authenticated: true, canAdd: false, videoIds: [] }, { headers: { "Cache-Control": "private, no-store" } });
    const [playlist] = await requireDb().select().from(schema.cypherPlaylists)
      .where(eq(schema.cypherPlaylists.userId, session.userId));
    return NextResponse.json({ authenticated: true, canAdd: true, videoIds: playlist?.videoIds ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin)
      throw new AppError("FORBIDDEN", "Invalid request origin.", 403);
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHORIZED", "Sign in to save videos.", 401);
    if (session.role !== "ARTIST") throw new AppError("FORBIDDEN", "Only signed-in artists can add videos.", 403);
    let body;
    try { body = await request.json(); }
    catch { throw new AppError("INVALID_PLAYLIST", "Invalid video list.", 400); }
    const incoming = normalizeVideoIds(body?.videoIds);
    if (!incoming?.length) throw new AppError("INVALID_PLAYLIST", "Choose valid videos outside the featured rotation.", 400);
    const videoIds = await requireDb().transaction(async tx => {
      const [user] = await tx.select({ id: schema.users.id, role: schema.users.role, deletedAt: schema.users.deletedAt }).from(schema.users)
        .where(eq(schema.users.id, session.userId)).for("update");
      if (!user || user.deletedAt) throw new AppError("UNAUTHORIZED", "Sign in again to save videos.", 401);
      if (user.role !== "ARTIST") throw new AppError("FORBIDDEN", "Only signed-in artists can add videos.", 403);
      const [playlist] = await tx.select().from(schema.cypherPlaylists)
        .where(eq(schema.cypherPlaylists.userId, session.userId));
      const merged = [...new Set([...(playlist?.videoIds ?? []), ...incoming])];
      if (merged.length > MAX_SAVED_VIDEOS) throw new AppError("PLAYLIST_FULL", "You can save up to 100 additional videos.", 409);
      await tx.insert(schema.cypherPlaylists).values({ userId: session.userId, videoIds: merged })
        .onConflictDoUpdate({ target: schema.cypherPlaylists.userId, set: { videoIds: merged, updatedAt: new Date() } });
      return merged;
    });
    return NextResponse.json({ authenticated: true, canAdd: true, videoIds }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
