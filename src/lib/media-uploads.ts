import { del, head } from "@vercel/blob";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { lockMediaOwner, assertMediaCapacity } from "./media-quota";
import { AppError } from "@/lib/errors";
import { isUuid, MAX_MASTER_BYTES, MAX_PREVIEW_BYTES, parseUploadPath, validUploadSize } from "./media-upload-policy";

export async function reserveMediaUpload(userId: string, pathname: string, requestedBytes: number) {
  const parsed = parseUploadPath(pathname, userId);
  if (!parsed) throw new AppError("INVALID_UPLOAD", "Invalid upload path.", 400);
  const { id, kind } = parsed;
  if (kind !== "master") throw new AppError("PREVIEW_DISABLED", "Short preview uploads are disabled for now.", 400);
  const limit = kind === "master" ? MAX_MASTER_BYTES : MAX_PREVIEW_BYTES;
  if (!validUploadSize(kind, requestedBytes))
    throw new AppError("UPLOAD_SIZE", `MP3 must be between 1 KB and ${limit / 1048576} MB.`, 400);
  const db = requireDb();
  await cleanupMediaUploads(userId);
  await db.transaction(async tx => {
    const artist = await lockMediaOwner(tx, userId);
    await assertMediaCapacity(tx, userId, requestedBytes, artist);
    const [usage] = await tx.select({ bytes: sql<number>`coalesce(sum(${schema.mediaUploads.reservedBytes}), 0)::bigint`,
      masters: sql<number>`count(*) filter (where ${schema.mediaUploads.kind} = 'master')::int`,
      previews: sql<number>`count(*) filter (where ${schema.mediaUploads.kind} = 'preview')::int` })
      .from(schema.mediaUploads).where(and(eq(schema.mediaUploads.userId, userId), inArray(schema.mediaUploads.status, ['PENDING', 'UPLOADED'])));
    if ((kind === "master" ? usage.masters : usage.previews) >= 11)
      throw new AppError("UPLOAD_LIMIT", "Too many unfinished MP3 uploads. Remove an unused upload before trying again.", 400);
    await tx.insert(schema.mediaUploads).values({ id, userId, kind, pathname,
      reservedBytes: requestedBytes, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  });
  return { id, kind, limit };
}

export async function finalizeMediaUpload(userId: string, id: string, blobUrl: string) {
  if (!isUuid(id)) throw new AppError("INVALID_UPLOAD", "Invalid upload ID.", 400);
  const db = requireDb();
  const [row] = await db.select().from(schema.mediaUploads)
    .where(and(eq(schema.mediaUploads.id, id), eq(schema.mediaUploads.userId, userId))).limit(1);
  if (!row || row.status === "CLAIMED") throw new AppError("UPLOAD_NOT_FOUND", "Upload not found.", 404);
  if (row.status === "UPLOADED" && row.blobUrl === blobUrl) return row;
  const url = new URL(blobUrl);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".private.blob.vercel-storage.com") ||
      url.pathname !== `/${row.pathname}` || url.search || url.hash)
    throw new AppError("INVALID_UPLOAD", "Upload location is invalid.", 400);
  const metadata = await head(blobUrl);
  if (metadata.pathname !== row.pathname || metadata.size < 1024 || metadata.size > row.reservedBytes ||
      !["audio/mpeg", "audio/mp3"].includes(metadata.contentType))
    throw new AppError("INVALID_UPLOAD", "Uploaded file is not a valid MP3 for this slot.", 400);
  const [saved] = await db.update(schema.mediaUploads).set({ status: "UPLOADED", blobUrl,
    actualBytes: metadata.size, expiresAt: new Date(Date.now() + 86400000) }).where(and(eq(schema.mediaUploads.id, id),
    eq(schema.mediaUploads.userId, userId), eq(schema.mediaUploads.status, "PENDING"))).returning();
  if (!saved) {
    const [completed] = await db.select().from(schema.mediaUploads).where(and(
      eq(schema.mediaUploads.id, id), eq(schema.mediaUploads.userId, userId),
      eq(schema.mediaUploads.status, "UPLOADED"), eq(schema.mediaUploads.blobUrl, blobUrl))).limit(1);
    if (completed) return completed;
    throw new AppError("UPLOAD_NOT_FOUND", "Upload is no longer available.", 409);
  }
  return saved;
}

export async function releaseMediaUpload(userId: string, id: string) {
  if (!isUuid(id)) throw new AppError("INVALID_UPLOAD", "Invalid upload ID.", 400);
  const db = requireDb();
  const row = await db.transaction(async tx => {
    await lockMediaOwner(tx, userId);
    const [upload] = await tx.select().from(schema.mediaUploads).where(and(eq(schema.mediaUploads.id, id), eq(schema.mediaUploads.userId, userId))).for("update").limit(1);
    if (!upload || upload.status === "CLAIMED") return null;
    await tx.update(schema.mediaUploads).set({status: "RETIRED"}).where(eq(schema.mediaUploads.id, id));
    return upload;
  });
  if (!row) return;
  await del(row.blobUrl || row.pathname);
  await db.delete(schema.mediaUploads).where(and(eq(schema.mediaUploads.id, id), eq(schema.mediaUploads.userId, userId), eq(schema.mediaUploads.status, "RETIRED")));
}

export async function cleanupMediaUploads(userId?: string) {
  const db = requireDb();
  const eligible = or(eq(schema.mediaUploads.status, "RETIRED"), and(inArray(schema.mediaUploads.status, ["PENDING", "UPLOADED"]), lt(schema.mediaUploads.expiresAt, new Date())));
  const rows = await db.select().from(schema.mediaUploads).where(userId ? and(eq(schema.mediaUploads.userId, userId), eligible) : eligible).limit(50);
  let removed = 0;
  for (const row of rows) {
    try {
      const retired = await db.transaction(async tx => {
        await lockMediaOwner(tx, row.userId);
        const [current] = await tx.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, row.id)).for("update").limit(1);
        if (!current || current.status === "CLAIMED" || (current.status !== "RETIRED" && current.expiresAt > new Date())) return null;
        await tx.update(schema.mediaUploads).set({status: "RETIRED"}).where(eq(schema.mediaUploads.id, row.id));
        return current;
      });
      if (!retired) continue;
      await del(retired.blobUrl || retired.pathname);
      await db.delete(schema.mediaUploads).where(and(eq(schema.mediaUploads.id, retired.id), eq(schema.mediaUploads.status, "RETIRED")));
      removed++;
    } catch { /* A retired upload stays inaccessible and is retried by daily cleanup. */ }
  }
  return removed;
}
