import { and, desc, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { requireDb, schema } from "@/db";
import { Artist, Track, ServiceBooking, ArtistWallet, WalletTransaction } from "@/types";
import { decodeCursor, encodeCursor, PaginatedResult } from "./pagination";
import { AppError } from "./errors";
import { validateMasterUrl, validatePreviewUrl } from "./media";

const FREE_STORAGE_BYTES = 500 * 1024 * 1024;
const PRO_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;

function artistFromRow(row: typeof schema.artists.$inferSelect): Artist {
  return {
    id: row.id, userId: row.userId, stageName: row.stageName, realName: row.realName,
    dob: row.dob, bio: row.bio, region: row.region, subgenre: row.subgenre,
    socials: { instagram: row.socialInstagram, x: row.socialX, tiktok: row.socialTiktok,
      youtube: row.socialYoutube, facebook: row.socialFacebook },
    phoneForBookings: row.phoneForBookings, bookingEmail: row.bookingEmail,
    heroVideoMp4Url: row.heroVideoMp4Url, heroVideoDurationSecs: Number(row.heroVideoDurationSecs || 10),
    storageUsedBytes: row.storageUsedBytes, subscriptionTier: row.subscriptionTier,
    subscriptionExpiresAt: row.subscriptionExpiresAt?.toISOString(), isVerified: row.isVerified,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
  };
}

function trackFromRow(row: typeof schema.tracks.$inferSelect, stageName?: string): Track {
  return {
    id: row.id, artistId: row.artistId, title: row.title, durationSeconds: row.durationSeconds,
    fileUrl: "", previewUrl: row.previewUrl.includes(".private.blob.vercel-storage.com/")
      ? `/api/tracks/${row.id}/preview` : row.previewUrl, filesizeBytes: row.filesizeBytes,
    priceUgx: row.priceUgx, priceUsd: Number(row.priceUsd), playCount: row.playCount,
    downloadCount: row.downloadCount, isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString(), artistStageName: stageName,
  };
}

export interface GetArtistsParams {
  cursor?: string | null;
  limit?: number;
  region?: string | null;
  subgenre?: string | null;
  search?: string | null;
}

export async function getArtists(params: GetArtistsParams): Promise<PaginatedResult<Artist>> {
  const db = requireDb();
  const limit = Math.min(Math.max(Number.isFinite(params.limit) ? params.limit! : 8, 1), 50);
  const cursor = decodeCursor(params.cursor);
  const filters = [isNull(schema.artists.deletedAt)];
  if (params.region && params.region !== "All") filters.push(eq(schema.artists.region, params.region));
  if (params.subgenre && params.subgenre !== "All") filters.push(ilike(schema.artists.subgenre, "%" + params.subgenre + "%"));
  if (params.search) filters.push(or(ilike(schema.artists.stageName, "%" + params.search + "%"),
    ilike(schema.artists.realName, "%" + params.search + "%"))!);
  if (cursor) {
    const date = new Date(cursor.createdAt);
    if (Number.isNaN(date.getTime())) throw new AppError("INVALID_CURSOR", "Invalid pagination cursor", 400);
    filters.push(or(lt(schema.artists.createdAt, date),
      and(eq(schema.artists.createdAt, date), lt(schema.artists.id, cursor.id)))!);
  }
  const rows = await db.select().from(schema.artists).where(and(...filters))
    .orderBy(desc(schema.artists.createdAt), desc(schema.artists.id)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map(artistFromRow);
  const last = data[data.length - 1];
  return { data, limit, hasMore, nextCursor: hasMore && last ? encodeCursor({ id: last.id, createdAt: last.createdAt }) : null };
}

export async function getRotatingHeroClips() {
  const db = requireDb();
  const rows = await db.select().from(schema.artists)
    .where(and(isNull(schema.artists.deletedAt), sql`${schema.artists.heroVideoMp4Url} IS NOT NULL`))
    .orderBy(desc(schema.artists.createdAt)).limit(30);
  return rows.map(a => ({ artistId: a.id, stageName: a.stageName, region: a.region,
    subgenre: a.subgenre, heroVideoMp4Url: a.heroVideoMp4Url! }));
}

async function loadArtist(row: typeof schema.artists.$inferSelect): Promise<Artist> {
  const db = requireDb();
  const [trackRows, videoRows, flyerRows, freestyleRows, serviceRows] = await Promise.all([
    db.select().from(schema.tracks).where(and(eq(schema.tracks.artistId, row.id), isNull(schema.tracks.deletedAt), eq(schema.tracks.isPublished, true))),
    db.select().from(schema.artistYoutubeVideos).where(and(eq(schema.artistYoutubeVideos.artistId, row.id), isNull(schema.artistYoutubeVideos.deletedAt))),
    db.select().from(schema.eventFlyers).where(and(eq(schema.eventFlyers.artistId, row.id), isNull(schema.eventFlyers.deletedAt))),
    db.select().from(schema.freestyles).where(and(eq(schema.freestyles.artistId, row.id), isNull(schema.freestyles.deletedAt))),
    db.select().from(schema.artistServices).where(and(eq(schema.artistServices.artistId, row.id), isNull(schema.artistServices.deletedAt))),
  ]);
  return { ...artistFromRow(row),
    tracks: trackRows.map(t => trackFromRow(t, row.stageName)),
    youtubeVideos: videoRows.map(v => ({ id: v.id, artistId: v.artistId, youtubeUrl: v.youtubeUrl,
      videoTitle: v.videoTitle, orderIndex: v.orderIndex, createdAt: v.createdAt.toISOString() })),
    eventFlyers: flyerRows.map(f => ({ id: f.id, artistId: f.artistId, title: f.title,
      eventDate: f.eventDate.toISOString(), venue: f.venue, city: f.city, flyerImageUrl: f.flyerImageUrl,
      ticketLink: f.ticketLink, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() })),
    freestyles: freestyleRows.map(f => ({ id: f.id, artistId: f.artistId, title: f.title, mediaType: f.mediaType,
      mediaUrl: f.mediaUrl, thumbnailUrl: f.thumbnailUrl, durationSeconds: f.durationSeconds,
      createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() })),
    services: serviceRows.map(s => ({ id: s.id, artistId: s.artistId, serviceName: s.serviceName,
      description: s.description, priceUgx: s.priceUgx, priceUsd: s.priceUsd ? Number(s.priceUsd) : null,
      isAvailable: s.isAvailable, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() })),
  };
}

export async function getArtistByStageName(stageName: string): Promise<Artist | null> {
  const db = requireDb();
  const [row] = await db.select().from(schema.artists)
    .where(and(ilike(schema.artists.stageName, stageName), isNull(schema.artists.deletedAt))).limit(1);
  return row ? loadArtist(row) : null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const db = requireDb();
  const [row] = await db.select().from(schema.artists)
    .where(and(eq(schema.artists.id, id), isNull(schema.artists.deletedAt))).limit(1);
  return row ? loadArtist(row) : null;
}

export async function updateArtistHeroVideo(artistId: string, mp4Url: string): Promise<Artist> {
  const db = requireDb();
  const [row] = await db.update(schema.artists).set({ heroVideoMp4Url: mp4Url, updatedAt: new Date() })
    .where(and(eq(schema.artists.id, artistId), isNull(schema.artists.deletedAt))).returning();
  if (!row) throw new AppError("ARTIST_NOT_FOUND", "Artist not found", 404);
  return loadArtist(row);
}

export async function addTrackToArtist(artistId: string, data: {
  title: string; durationSeconds: number; fileUrl: string; previewUrl: string;
  filesizeBytes: number; priceUgx: number; priceUsd: number; isPublished: boolean;
}): Promise<Track> {
  data.fileUrl = validateMasterUrl(data.fileUrl);
  data.previewUrl = validatePreviewUrl(data.previewUrl);
  if (!data.title.trim() || data.title.length > 255 || !Number.isSafeInteger(data.durationSeconds) ||
    data.durationSeconds <= 0 || !Number.isSafeInteger(data.filesizeBytes) || data.filesizeBytes <= 0 ||
    !Number.isSafeInteger(data.priceUgx) || data.priceUgx < 1000)
    throw new AppError("INVALID_TRACK", "Invalid track metadata.", 400);
  const db = requireDb();
  return db.transaction(async tx => {
    const [artist] = await tx.select().from(schema.artists)
      .where(and(eq(schema.artists.id, artistId), isNull(schema.artists.deletedAt))).for("update").limit(1);
    if (!artist) throw new AppError("ARTIST_NOT_FOUND", "Artist not found", 404);
    const [countRow] = await tx.select({ count: sql<number>`count(*)::int` }).from(schema.tracks)
      .where(and(eq(schema.tracks.artistId, artistId), isNull(schema.tracks.deletedAt)));
    if (artist.subscriptionTier === "FREE" && countRow.count >= 10)
      throw new AppError("TRACK_LIMIT_EXCEEDED", "Free artists can publish at most 10 tracks", 400);
    const quota = artist.subscriptionTier === "PRO" ? PRO_STORAGE_BYTES : FREE_STORAGE_BYTES;
    if (artist.storageUsedBytes + data.filesizeBytes > quota)
      throw new AppError("STORAGE_LIMIT_EXCEEDED", "Storage quota exceeded", 400);
    const [track] = await tx.insert(schema.tracks).values({
      artistId, title: data.title, durationSeconds: data.durationSeconds,
      fileUrl: data.fileUrl, previewUrl: data.previewUrl, filesizeBytes: data.filesizeBytes,
      priceUgx: data.priceUgx, priceUsd: data.priceUsd.toFixed(2),
    }).returning();
    await tx.update(schema.artists).set({ storageUsedBytes: artist.storageUsedBytes + data.filesizeBytes,
      updatedAt: new Date() }).where(eq(schema.artists.id, artistId));
    return trackFromRow(track, artist.stageName);
  });
}

export async function registerArtist(data: {
  userId: string; stageName: string; realName: string; dob: string; bio?: string;
  region: string; subgenre: string; socials: { instagram?: string; x?: string; tiktok?: string; youtube?: string; facebook?: string };
  phoneForBookings?: string; bookingEmail?: string; heroVideoMp4Url?: string; youtubeVideos?: string[];
  initialTracks: Array<{ title: string; durationSeconds: number; fileUrl: string; previewUrl?: string; filesizeBytes: number; priceUgx: number }>;
  eventFlyer?: { title: string; eventDate: string; venue: string; flyerImageUrl: string };
  freestyle?: { title: string; mediaUrl: string; mediaType: "AUDIO" | "VIDEO" };
  services?: Array<{ serviceName: string; description: string; priceUgx: number }>;
}): Promise<Artist> {
  if (!Array.isArray(data.initialTracks) || data.initialTracks.length !== 1)
    throw new AppError("TRACK_COUNT", "Provide exactly one MP3 track", 400);
  if (!data.stageName?.trim() || !data.realName?.trim() || !data.dob ||
    Number.isNaN(Date.parse(data.dob)) || !data.socials)
    throw new AppError("INVALID_ARTIST", "Invalid artist profile.", 400);
  for (const track of data.initialTracks) {
    if (typeof track.title !== "string" || !track.title.trim() || track.title.length > 255 ||
      !Number.isSafeInteger(track.durationSeconds) || track.durationSeconds <= 0 ||
      !Number.isSafeInteger(track.filesizeBytes) || track.filesizeBytes <= 0 ||
      !Number.isSafeInteger(track.priceUgx) || track.priceUgx < 1000 ||
      typeof track.fileUrl !== "string" || !track.fileUrl ||
      (track.previewUrl !== undefined && track.previewUrl !== ""))
    throw new AppError("INVALID_TRACK", "Invalid track metadata.", 400);
  }
  const db = requireDb();
  const artistId = await db.transaction(async tx => {
    const urls = data.initialTracks.map(t => t.fileUrl);
    if (new Set(urls).size !== urls.length) throw new AppError("INVALID_TRACK", "Use distinct files for every track.", 400);
    const uploads = await tx.select().from(schema.mediaUploads).where(and(
      eq(schema.mediaUploads.userId, data.userId), eq(schema.mediaUploads.status, "UPLOADED"),
      inArray(schema.mediaUploads.blobUrl, urls))).for("update");
    if (uploads.length !== urls.length) throw new AppError("INVALID_TRACK", "Upload the full MP3 first.", 400);
    const byUrl = new Map(uploads.map(upload => [upload.blobUrl, upload]));
    for (const track of data.initialTracks) {
      const master = byUrl.get(track.fileUrl);
      if (!master || master.kind !== "master" || master.actualBytes !== track.filesizeBytes)
        throw new AppError("INVALID_TRACK", "Track uploads do not match the submitted files.", 400);
    }
    const totalBytes = uploads.reduce((n, upload) => n + (upload.actualBytes || 0), 0);
    if (!Number.isSafeInteger(totalBytes) || totalBytes > FREE_STORAGE_BYTES)
      throw new AppError("STORAGE_LIMIT_EXCEEDED", "Storage quota exceeded", 400);
    const [artist] = await tx.insert(schema.artists).values({
      userId: data.userId, stageName: data.stageName.trim(), realName: data.realName.trim(),
      dob: data.dob, bio: data.bio || null, region: data.region, subgenre: data.subgenre,
      socialInstagram: data.socials.instagram, socialX: data.socials.x,
      socialTiktok: data.socials.tiktok, socialYoutube: data.socials.youtube,
      socialFacebook: data.socials.facebook, phoneForBookings: data.phoneForBookings,
      bookingEmail: data.bookingEmail, heroVideoMp4Url: data.heroVideoMp4Url,
      storageUsedBytes: totalBytes,
    }).returning({ id: schema.artists.id });
    await tx.insert(schema.artistWallets).values({ artistId: artist.id });
    await tx.insert(schema.tracks).values(data.initialTracks.map(t => ({
      artistId: artist.id, title: t.title, durationSeconds: t.durationSeconds,
      fileUrl: t.fileUrl, previewUrl: "", filesizeBytes: t.filesizeBytes,
      priceUgx: t.priceUgx,
    })));
    await tx.update(schema.mediaUploads).set({ status: "CLAIMED" })
      .where(inArray(schema.mediaUploads.id, uploads.map(upload => upload.id)));
    await tx.update(schema.users).set({ role: "ARTIST", updatedAt: new Date() })
      .where(eq(schema.users.id, data.userId));
    if (data.youtubeVideos?.length) await tx.insert(schema.artistYoutubeVideos).values(
      data.youtubeVideos.slice(0, 3).map((url, i) => ({ artistId: artist.id, youtubeUrl: url, orderIndex: i + 1 })));
    if (data.eventFlyer) await tx.insert(schema.eventFlyers).values({
      artistId: artist.id, title: data.eventFlyer.title, eventDate: new Date(data.eventFlyer.eventDate),
      venue: data.eventFlyer.venue, flyerImageUrl: data.eventFlyer.flyerImageUrl,
    });
    if (data.freestyle) await tx.insert(schema.freestyles).values({
      artistId: artist.id, title: data.freestyle.title, mediaUrl: data.freestyle.mediaUrl,
      mediaType: data.freestyle.mediaType,
    });
    if (data.services?.length) await tx.insert(schema.artistServices).values(data.services.map(s => ({
      artistId: artist.id, serviceName: s.serviceName, description: s.description, priceUgx: s.priceUgx,
    })));
    return artist.id;
  });
  const artist = await getArtistById(artistId);
  if (!artist) throw new Error("Artist insert failed");
  return artist;
}

export async function createServiceBooking(data: {
  serviceId: string; artistId: string; clientName: string; clientEmail: string; clientPhone: string;
  eventDate: string; eventLocation: string; notes?: string; quotedPriceUgx?: number;
}): Promise<ServiceBooking> {
  const db = requireDb();
  const [service] = await db.select().from(schema.artistServices).where(and(
    eq(schema.artistServices.id, data.serviceId), eq(schema.artistServices.artistId, data.artistId),
    eq(schema.artistServices.isAvailable, true), isNull(schema.artistServices.deletedAt))).limit(1);
  if (!service) throw new AppError("SERVICE_NOT_FOUND", "Service unavailable", 404);
  const [row] = await db.insert(schema.serviceBookings).values({
    serviceId: service.id, artistId: service.artistId, clientName: data.clientName,
    clientEmail: data.clientEmail, clientPhone: data.clientPhone, eventDate: new Date(data.eventDate),
    eventLocation: data.eventLocation, notes: data.notes, quotedPriceUgx: service.priceUgx,
  }).returning();
  return { ...row, eventDate: row.eventDate.toISOString(), createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(), deletedAt: row.deletedAt?.toISOString() };
}

export async function getBookingsForArtist(artistId: string): Promise<ServiceBooking[]> {
  const db = requireDb();
  const rows = await db.select().from(schema.serviceBookings).where(and(
    eq(schema.serviceBookings.artistId, artistId), isNull(schema.serviceBookings.deletedAt)))
    .orderBy(desc(schema.serviceBookings.createdAt)).limit(100);
  return rows.map(row => ({ ...row, eventDate: row.eventDate.toISOString(),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() }));
}

export async function getArtistWallet(artistId: string): Promise<{ wallet: ArtistWallet; transactions: WalletTransaction[] }> {
  const db = requireDb();
  const [row] = await db.select().from(schema.artistWallets).where(eq(schema.artistWallets.artistId, artistId)).limit(1);
  if (!row) throw new AppError("WALLET_NOT_FOUND", "Wallet not found", 404);
  const txs = await db.select().from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.walletId, row.id))
    .orderBy(desc(schema.walletTransactions.createdAt)).limit(100);
  return { wallet: { ...row, updatedAt: row.updatedAt.toISOString() },
    transactions: txs.map(t => ({ ...t, type: t.type as "CREDIT_SALE" | "DEBIT_PAYOUT",
      createdAt: t.createdAt.toISOString() })) };
}

export async function getTracks(params: {
  cursor?: string | null; limit?: number; artistId?: string | null; search?: string | null;
}): Promise<PaginatedResult<Track>> {
  const db = requireDb();
  const limit = Math.min(Math.max(Number.isFinite(params.limit) ? params.limit! : 10, 1), 50);
  const cursor = decodeCursor(params.cursor);
  const filters = [isNull(schema.tracks.deletedAt), eq(schema.tracks.isPublished, true),
    isNull(schema.artists.deletedAt)];
  if (params.artistId) filters.push(eq(schema.tracks.artistId, params.artistId));
  if (params.search) filters.push(ilike(schema.tracks.title, "%" + params.search + "%"));
  if (cursor) {
    const date = new Date(cursor.createdAt);
    if (Number.isNaN(date.getTime())) throw new AppError("INVALID_CURSOR", "Invalid pagination cursor", 400);
    filters.push(or(lt(schema.tracks.createdAt, date),
      and(eq(schema.tracks.createdAt, date), lt(schema.tracks.id, cursor.id)))!);
  }
  const rows = await db.select({ track: schema.tracks, stageName: schema.artists.stageName })
    .from(schema.tracks).innerJoin(schema.artists, eq(schema.tracks.artistId, schema.artists.id))
    .where(and(...filters)).orderBy(desc(schema.tracks.createdAt), desc(schema.tracks.id)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map(r => trackFromRow(r.track, r.stageName));
  const last = data[data.length - 1];
  return { data, limit, hasMore, nextCursor: hasMore && last ? encodeCursor({ id: last.id, createdAt: last.createdAt }) : null };
}
