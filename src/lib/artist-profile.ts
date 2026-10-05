import { and, eq, inArray } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { AppError } from "./errors";
import { ArtistProfileInput, validateArtistProfileInput } from "./artist-profile-input";
import { ArtistTransaction, lockMediaOwner } from "./media-quota";
import { storageQuotaBytes } from "./artist-media-policy";

export async function applyArtistProfile(tx: ArtistTransaction, userId: string, artist: typeof schema.artists.$inferSelect, input: ArtistProfileInput) {
  const current = await tx.select().from(schema.artistImageAssets).where(and(eq(schema.artistImageAssets.artistId, artist.id), eq(schema.artistImageAssets.status, "CLAIMED"))).for("update");
  const portraitId = input.portraitImageId === undefined ? current.find(row => row.purpose === "portrait")?.id : input.portraitImageId;
  const galleryIds = input.galleryImageIds ?? current.filter(row => row.purpose === "gallery").sort((a, b) => a.orderIndex - b.orderIndex).map(row => row.id);
  const ids = [...(portraitId ? [portraitId] : []), ...galleryIds];
  if (new Set(ids).size !== ids.length) throw new AppError("INVALID_IMAGE", "Use a separate image for each photo slot.", 400);
  const selected = ids.length ? await tx.select().from(schema.artistImageAssets).where(and(eq(schema.artistImageAssets.userId, userId), inArray(schema.artistImageAssets.id, ids))).for("update") : [];
  for (const id of ids) {
    const row = selected.find(value => value.id === id);
    const purpose = id === portraitId ? "portrait" : "gallery";
    if (!row || row.purpose !== purpose || !row.blobUrl || !row.actualBytes || !["UPLOADED", "CLAIMED"].includes(row.status) || (row.status === "CLAIMED" && row.artistId !== artist.id) || (row.status === "UPLOADED" && row.expiresAt <= new Date())) throw new AppError("INVALID_IMAGE", "Upload and verify your own photos before saving.", 400);
  }
  const removed = current.filter(row => !ids.includes(row.id));
  const added = selected.filter(row => row.status !== "CLAIMED");
  const bytes = artist.storageUsedBytes - removed.reduce((n, row) => n + (row.actualBytes || 0), 0) + added.reduce((n, row) => n + (row.actualBytes || 0), 0);
  if (bytes < 0 || bytes > storageQuotaBytes(artist.subscriptionTier)) throw new AppError("STORAGE_LIMIT", "Artist storage quota would be exceeded.", 400);
  if (removed.length) await tx.update(schema.artistImageAssets).set({ status: "RETIRED" }).where(inArray(schema.artistImageAssets.id, removed.map(row => row.id)));
  for (const row of selected) await tx.update(schema.artistImageAssets).set({ artistId: artist.id, status: "CLAIMED", orderIndex: row.id === portraitId ? 0 : galleryIds.indexOf(row.id) }).where(eq(schema.artistImageAssets.id, row.id));
  if (input.youtubeVideos !== undefined) {
    await tx.delete(schema.artistYoutubeVideos).where(eq(schema.artistYoutubeVideos.artistId, artist.id));
    if (input.youtubeVideos.length) await tx.insert(schema.artistYoutubeVideos).values(input.youtubeVideos.map((video, i) => ({ artistId: artist.id, ...video, orderIndex: i + 1 })));
  }
  const fields = Object.fromEntries(["bio", "phoneForBookings", "bookingEmail", "websiteUrl"].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key as keyof ArtistProfileInput]]));
  await tx.update(schema.artists).set({ ...fields, storageUsedBytes: bytes, updatedAt: new Date() }).where(eq(schema.artists.id, artist.id));
}
export async function updateArtistProfile(userId: string, artistId: string, raw: Record<string, unknown>) {
  const input = validateArtistProfileInput(raw);
  await requireDb().transaction(async tx => {
    const artist = await lockMediaOwner(tx, userId);
    if (!artist || artist.id !== artistId) throw new AppError("FORBIDDEN", "Not your artist profile.", 403);
    await applyArtistProfile(tx, userId, artist, input);
  });
  const { getArtistById } = await import("./data-service");
  return getArtistById(artistId);
}
