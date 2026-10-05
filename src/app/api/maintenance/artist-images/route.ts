import { NextRequest, NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { cleanupArtistImages } from "@/lib/artist-images";
import { cleanupMediaUploads } from "@/lib/media-uploads";
import { createErrorResponse, handleApiError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return createErrorResponse("UNAUTHORIZED", "Unauthorized.", 401);
  try { const result=await cleanupArtistImages();const musicRemoved=await cleanupMediaUploads();await requireDb().delete(schema.trackPlayEvents).where(lt(schema.trackPlayEvents.createdAt,new Date(Date.now()-30*86400000)));return NextResponse.json({...result,musicRemoved}); }
  catch (error) { return handleApiError(error); }
}
