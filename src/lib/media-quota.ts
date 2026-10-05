import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { AppError } from "./errors";
import { storageQuotaBytes } from "./artist-media-policy";

export type ArtistTransaction = Parameters<Parameters<ReturnType<typeof requireDb>["transaction"]>[0]>[0];
export async function lockMediaOwner(tx: ArtistTransaction, userId: string) {
  const [user] = await tx.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt))).for("update").limit(1);
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  const [artist] = await tx.select().from(schema.artists).where(and(eq(schema.artists.userId, userId), isNull(schema.artists.deletedAt))).for("update").limit(1);
  return artist;
}
export async function assertMediaCapacity(tx: ArtistTransaction, userId: string, bytes: number, artist: typeof schema.artists.$inferSelect | undefined) {
  const [music] = await tx.select({ bytes: sql<number>`coalesce(sum(${schema.mediaUploads.reservedBytes}), 0)::bigint` }).from(schema.mediaUploads).where(and(eq(schema.mediaUploads.userId, userId), inArray(schema.mediaUploads.status, ["PENDING", "UPLOADED"])));
  const [images] = await tx.select({ bytes: sql<number>`coalesce(sum(${schema.artistImageAssets.reservedBytes}), 0)::bigint` }).from(schema.artistImageAssets).where(and(eq(schema.artistImageAssets.userId, userId), inArray(schema.artistImageAssets.status, ["PENDING", "UPLOADED"])));
  if ((artist?.storageUsedBytes || 0) + Number(music.bytes) + Number(images.bytes) + bytes > storageQuotaBytes(artist?.subscriptionTier || "FREE")) throw new AppError("STORAGE_LIMIT", "Artist storage quota would be exceeded.", 400);
}
