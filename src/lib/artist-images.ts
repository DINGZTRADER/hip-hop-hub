import { put, del } from "@vercel/blob";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { ArtistImage } from "@/types";
import { AppError } from "./errors";
import { optimizeArtistImage, ImageCrop } from "./image-processing";
import { assertMediaCapacity, lockMediaOwner } from "./media-quota";
import { isUuid } from "./media-upload-policy";

export function imageFromRow(row: typeof schema.artistImageAssets.$inferSelect): ArtistImage {
  return { id: row.id, url: `/api/artist-images/${row.id}`, purpose: row.purpose as ArtistImage["purpose"], orderIndex: row.orderIndex, filesizeBytes: row.actualBytes || row.reservedBytes, width: row.width, height: row.height, filename: row.filename };
}
export async function uploadArtistImage(userId: string, file: File, purpose: "portrait" | "gallery", crop?: ImageCrop): Promise<ArtistImage> {
  const optimized = await optimizeArtistImage(Buffer.from(await file.arrayBuffer()), purpose, crop);
  const id = crypto.randomUUID();
  const pathname = `artists/${userId}/${purpose}/${id}.webp`;
  const db = requireDb();
  await db.transaction(async tx => {
    const artist = await lockMediaOwner(tx, userId);
    await assertMediaCapacity(tx, userId, optimized.data.length, artist);
    const [count] = await tx.select({ count: sql<number>`count(*)::int` }).from(schema.artistImageAssets).where(and(eq(schema.artistImageAssets.userId, userId), inArray(schema.artistImageAssets.status, ["PENDING", "UPLOADED"])));
    if (count.count >= 12) throw new AppError("UPLOAD_LIMIT", "Save your selected photos or remove unused drafts before uploading more.", 400);
    await tx.insert(schema.artistImageAssets).values({ id, userId, purpose, pathname, filename: file.name.slice(0, 255), width: optimized.width, height: optimized.height, reservedBytes: optimized.data.length, expiresAt: new Date(Date.now() + 3600000) });
  });
  try {
    const blob = await put(pathname, optimized.data, { access: "private", contentType: "image/webp", addRandomSuffix: false, allowOverwrite: false });
    const [saved] = await db.update(schema.artistImageAssets).set({ blobUrl: blob.url, actualBytes: optimized.data.length, status: "UPLOADED", expiresAt: new Date(Date.now() + 86400000) }).where(and(eq(schema.artistImageAssets.id, id), eq(schema.artistImageAssets.status, "PENDING"))).returning();
    if (!saved) { await del(blob.url); throw new AppError("UPLOAD_EXPIRED", "Image upload expired. Please retry.", 409); }
    return imageFromRow(saved);
  } catch (error) {
    await db.update(schema.artistImageAssets).set({ status: "RETIRED" }).where(eq(schema.artistImageAssets.id, id));
    throw error;
  }
}
export async function retireDraftImage(userId: string, id: string) {
  if (!isUuid(id)) throw new AppError("INVALID_IMAGE", "Invalid image ID.", 400);
  await requireDb().transaction(async tx => {
    await lockMediaOwner(tx, userId);
    await tx.update(schema.artistImageAssets).set({ status: "RETIRED" }).where(and(eq(schema.artistImageAssets.id, id), eq(schema.artistImageAssets.userId, userId), inArray(schema.artistImageAssets.status, ["PENDING", "UPLOADED"])));
  });
}
export async function cleanupArtistImages(limit = 100) {
  const db = requireDb();
  const candidates = await db.select().from(schema.artistImageAssets).where(or(eq(schema.artistImageAssets.status, "RETIRED"), and(inArray(schema.artistImageAssets.status, ["PENDING", "UPLOADED"]), lt(schema.artistImageAssets.expiresAt, new Date())))).limit(Math.min(100, Math.max(1, limit)));
  let removed = 0, failed = 0;
  for (const row of candidates) {
    try {
      const retired = await db.transaction(async tx => {
        await lockMediaOwner(tx, row.userId);
        const [current] = await tx.select().from(schema.artistImageAssets).where(eq(schema.artistImageAssets.id, row.id)).for("update").limit(1);
        if (!current || current.status === "CLAIMED" || (current.status !== "RETIRED" && current.expiresAt > new Date())) return null;
        await tx.update(schema.artistImageAssets).set({ status: "RETIRED" }).where(eq(schema.artistImageAssets.id, row.id));
        return current;
      });
      if (!retired) continue;
      await del(retired.blobUrl || retired.pathname);
      await db.delete(schema.artistImageAssets).where(and(eq(schema.artistImageAssets.id, row.id), eq(schema.artistImageAssets.status, "RETIRED")));
      removed++;
    } catch { failed++; }
  }
  return { removed, failed };
}
