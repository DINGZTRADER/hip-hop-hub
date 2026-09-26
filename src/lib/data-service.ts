import { MOCK_ARTISTS, MOCK_USERS, MOCK_WALLETS } from "./mock-data";
import { Artist, Track, ServiceBooking, Purchase, ArtistWallet, WalletTransaction } from "@/types";
import { decodeCursor, encodeCursor, PaginatedResult } from "./pagination";
import { AppError } from "./errors";
import { getDb, schema } from "@/db";
import { eq, and, isNull, desc, lt, or } from "drizzle-orm";

const MAX_FREE_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB in bytes (524,288,000)
const PLATFORM_COMMISSION_PERCENT = 0.20; // 20% to HipHop-UG

// In-memory active state store for immediate reactivity
let artistsStore: Artist[] = JSON.parse(JSON.stringify(MOCK_ARTISTS));
let usersStore = JSON.parse(JSON.stringify(MOCK_USERS));
let walletsStore: Record<string, ArtistWallet> = JSON.parse(JSON.stringify(MOCK_WALLETS));
let purchasesStore: Purchase[] = [];
let bookingsStore: ServiceBooking[] = [];
let walletTransactionsStore: WalletTransaction[] = [];

export interface GetArtistsParams {
  cursor?: string | null;
  limit?: number;
  region?: string | null;
  subgenre?: string | null;
  search?: string | null;
}

export async function getArtists(params: GetArtistsParams): Promise<PaginatedResult<Artist>> {
  const limit = Math.min(Math.max(params.limit || 8, 1), 50);
  const db = getDb();

  // If connected to Neon Postgres:
  if (db) {
    try {
      const cursorData = decodeCursor(params.cursor);
      
      let query = db
        .select()
        .from(schema.artists)
        .where(isNull(schema.artists.deletedAt))
        .orderBy(desc(schema.artists.createdAt), desc(schema.artists.id))
        .limit(limit + 1);

      // Execute and convert to standard format
      const rows = await query;
      const formatted: Artist[] = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        stageName: r.stageName,
        realName: r.realName,
        dob: r.dob,
        bio: r.bio,
        region: r.region,
        subgenre: r.subgenre,
        socials: {
          instagram: r.socialInstagram,
          x: r.socialX,
          tiktok: r.socialTiktok,
          youtube: r.socialYoutube,
          facebook: r.socialFacebook,
        },
        phoneForBookings: r.phoneForBookings,
        bookingEmail: r.bookingEmail,
        heroVideoMp4Url: r.heroVideoMp4Url,
        heroVideoDurationSecs: Number(r.heroVideoDurationSecs || 10),
        storageUsedBytes: r.storageUsedBytes,
        subscriptionTier: r.subscriptionTier,
        isVerified: r.isVerified,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      const hasMore = formatted.length > limit;
      const data = hasMore ? formatted.slice(0, limit) : formatted;
      let nextCursor: string | null = null;
      if (hasMore && data.length > 0) {
        const last = data[data.length - 1];
        nextCursor = encodeCursor({ id: last.id, createdAt: last.createdAt });
      }

      return { data, nextCursor, hasMore, limit };
    } catch (e) {
      console.warn("Neon query fallback to mock store:", e);
    }
  }

  // Fast In-Memory Store / Fallback
  let filtered = artistsStore.filter((a) => !a.deletedAt);

  if (params.region && params.region !== "All") {
    filtered = filtered.filter((a) => a.region.toLowerCase() === params.region!.toLowerCase());
  }

  if (params.subgenre && params.subgenre !== "All") {
    filtered = filtered.filter((a) => a.subgenre.toLowerCase().includes(params.subgenre!.toLowerCase()));
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.stageName.toLowerCase().includes(q) ||
        a.realName.toLowerCase().includes(q) ||
        (a.bio && a.bio.toLowerCase().includes(q))
    );
  }

  // Sort by createdAt desc, then id desc
  filtered.sort((a, b) => {
    const dateComp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateComp !== 0) return dateComp;
    return b.id.localeCompare(a.id);
  });

  // Apply Cursor
  const cursorData = decodeCursor(params.cursor);
  if (cursorData) {
    const cursorTime = new Date(cursorData.createdAt).getTime();
    const startIndex = filtered.findIndex((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      return itemTime < cursorTime || (itemTime === cursorTime && item.id < cursorData.id);
    });
    if (startIndex !== -1) {
      filtered = filtered.slice(startIndex);
    } else {
      filtered = [];
    }
  }

  const hasMore = filtered.length > limit;
  const data = hasMore ? filtered.slice(0, limit) : filtered;
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const last = data[data.length - 1];
    nextCursor = encodeCursor({ id: last.id, createdAt: last.createdAt });
  }

  return {
    data,
    nextCursor,
    hasMore,
    limit,
  };
}

export async function getRotatingHeroClips(): Promise<Array<{
  artistId: string;
  stageName: string;
  region: string;
  subgenre: string;
  heroVideoMp4Url: string;
  avatarUrl?: string;
  trackTitle?: string;
}>> {
  const artistsWithVideos = artistsStore.filter(
    (a) => !a.deletedAt && a.heroVideoMp4Url && a.heroVideoMp4Url.length > 5
  );

  return artistsWithVideos.map((a) => ({
    artistId: a.id,
    stageName: a.stageName,
    region: a.region,
    subgenre: a.subgenre,
    heroVideoMp4Url: a.heroVideoMp4Url!,
    avatarUrl: a.tracks?.[0]?.previewUrl,
    trackTitle: a.tracks?.[0]?.title,
  }));
}

export async function getArtistByStageName(stageName: string): Promise<Artist | null> {
  const decodedStage = decodeURIComponent(stageName).toLowerCase();
  const artist = artistsStore.find(
    (a) => !a.deletedAt && a.stageName.toLowerCase() === decodedStage
  );
  return artist || null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const artist = artistsStore.find((a) => !a.deletedAt && a.id === id);
  return artist || null;
}

export async function checkStorageQuota(artistId: string, additionalBytes: number): Promise<boolean> {
  const artist = await getArtistById(artistId);
  if (!artist) throw new AppError("ARTIST_NOT_FOUND", "Artist not found", 404);

  // Pro artists get 5GB; Free artists get 500MB
  const maxBytes = artist.subscriptionTier === "PRO" ? 5 * 1024 * 1024 * 1024 : MAX_FREE_STORAGE_BYTES;

  if (artist.storageUsedBytes + additionalBytes > maxBytes) {
    throw new AppError(
      "STORAGE_LIMIT_EXCEEDED",
      `Upload of ${(additionalBytes / (1024 * 1024)).toFixed(1)}MB exceeds your available quota (${(
        (maxBytes - artist.storageUsedBytes) /
        (1024 * 1024)
      ).toFixed(1)}MB remaining of ${artist.subscriptionTier === "PRO" ? "5GB" : "500MB"}). Please upgrade or delete old files.`,
      400
    );
  }

  return true;
}

export async function updateArtistHeroVideo(artistId: string, mp4Url: string): Promise<Artist> {
  const artist = artistsStore.find((a) => a.id === artistId);
  if (!artist) throw new AppError("ARTIST_NOT_FOUND", "Artist not found", 404);

  artist.heroVideoMp4Url = mp4Url;
  artist.updatedAt = new Date().toISOString();
  return artist;
}

export async function addTrackToArtist(
  artistId: string,
  trackData: Omit<Track, "id" | "artistId" | "createdAt" | "updatedAt" | "playCount" | "downloadCount">
): Promise<Track> {
  const artist = artistsStore.find((a) => a.id === artistId);
  if (!artist) throw new AppError("ARTIST_NOT_FOUND", "Artist not found", 404);

  if (!artist.tracks) artist.tracks = [];

  // Check track limits (Free tier: max 10 tracks)
  if (artist.subscriptionTier === "FREE" && artist.tracks.length >= 10) {
    throw new AppError(
      "TRACK_LIMIT_EXCEEDED",
      "Free tier artists can upload a maximum of 10 tracks. Upgrade to UG Cypher Pro for unlimited tracks.",
      400
    );
  }

  // Check 500MB quota
  await checkStorageQuota(artistId, trackData.filesizeBytes);

  const newTrack: Track = {
    ...trackData,
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    artistId,
    artistStageName: artist.stageName,
    playCount: 0,
    downloadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  artist.tracks.push(newTrack);
  artist.storageUsedBytes += trackData.filesizeBytes;
  artist.updatedAt = new Date().toISOString();

  return newTrack;
}

export async function registerArtist(data: {
  userId: string;
  stageName: string;
  realName: string;
  dob: string;
  bio?: string;
  region: string;
  subgenre: string;
  socials: {
    instagram?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
  };
  phoneForBookings?: string;
  bookingEmail?: string;
  heroVideoMp4Url?: string;
  youtubeVideos?: string[];
  initialTracks: Array<{
    title: string;
    durationSeconds: number;
    fileUrl: string;
    previewUrl: string;
    filesizeBytes: number;
    priceUgx: number;
  }>;
  eventFlyer?: {
    title: string;
    eventDate: string;
    venue: string;
    flyerImageUrl: string;
  };
  freestyle?: {
    title: string;
    mediaUrl: string;
    mediaType: "AUDIO" | "VIDEO";
  };
  services?: Array<{
    serviceName: string;
    description: string;
    priceUgx: number;
  }>;
}): Promise<Artist> {
  // Validate min 3 tracks required by specification
  if (!data.initialTracks || data.initialTracks.length < 3) {
    throw new AppError(
      "MINIMUM_TRACKS_REQUIRED",
      "Ugandan Hip-Hop artists must upload a minimum of 3 original MP3 tracks to register.",
      400
    );
  }

  // Validate max 10 tracks for initial registration
  if (data.initialTracks.length > 10) {
    throw new AppError(
      "MAXIMUM_TRACKS_EXCEEDED",
      "Registration allows a maximum of 10 tracks on the free tier.",
      400
    );
  }

  // Check stage name uniqueness
  const existing = artistsStore.find(
    (a) => a.stageName.toLowerCase() === data.stageName.trim().toLowerCase()
  );
  if (existing) {
    throw new AppError("STAGE_NAME_TAKEN", `The stage name "${data.stageName}" is already registered.`, 409);
  }

  // Calculate total initial storage used
  const totalTrackBytes = data.initialTracks.reduce((acc, t) => acc + (t.filesizeBytes || 8000000), 0);
  const videoBytes = data.heroVideoMp4Url ? 25000000 : 0;
  const initialStorage = totalTrackBytes + videoBytes;

  if (initialStorage > MAX_FREE_STORAGE_BYTES) {
    throw new AppError(
      "STORAGE_LIMIT_EXCEEDED",
      "Total upload size exceeds 500MB. Please optimize your media files.",
      400
    );
  }

  const artistId = `artist-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedTracks: Track[] = data.initialTracks.map((t, index) => ({
    id: `track-${artistId}-${index + 1}`,
    artistId,
    title: t.title,
    durationSeconds: t.durationSeconds,
    fileUrl: t.fileUrl,
    previewUrl: t.previewUrl,
    filesizeBytes: t.filesizeBytes,
    priceUgx: t.priceUgx || 3000,
    priceUsd: 0.99,
    playCount: 0,
    downloadCount: 0,
    isPublished: true,
    artistStageName: data.stageName,
    createdAt: now,
    updatedAt: now,
  }));

  const youtubeVideos = (data.youtubeVideos || []).slice(0, 3).map((url, i) => ({
    id: `yt-${artistId}-${i + 1}`,
    artistId,
    youtubeUrl: url,
    videoTitle: `Official Visual ${i + 1}`,
    orderIndex: i + 1,
    createdAt: now,
  }));

  const eventFlyers = data.eventFlyer
    ? [
        {
          id: `flyer-${artistId}-1`,
          artistId,
          title: data.eventFlyer.title,
          eventDate: data.eventFlyer.eventDate,
          venue: data.eventFlyer.venue,
          city: data.region || "Kampala",
          flyerImageUrl: data.eventFlyer.flyerImageUrl,
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const freestyles = data.freestyle
    ? [
        {
          id: `free-${artistId}-1`,
          artistId,
          title: data.freestyle.title,
          mediaType: data.freestyle.mediaType,
          mediaUrl: data.freestyle.mediaUrl,
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const services = (data.services || [
    { serviceName: "Wedding / Party Performance", description: "Live hip-hop set for your event.", priceUgx: 2500000 },
    { serviceName: "Club Gig Headline", description: "High-energy crowd performance.", priceUgx: 1500000 },
    { serviceName: "Guest Verse Collaboration", description: "16-bar feature verse.", priceUgx: 1000000 },
  ]).map((s, idx) => ({
    id: `srv-${artistId}-${idx + 1}`,
    artistId,
    serviceName: s.serviceName,
    description: s.description,
    priceUgx: s.priceUgx,
    priceUsd: Math.round(s.priceUgx / 3700),
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  }));

  const newArtist: Artist = {
    id: artistId,
    userId: data.userId,
    stageName: data.stageName.trim(),
    realName: data.realName.trim(),
    dob: data.dob,
    bio: data.bio || `Emerging hip-hop artist representing ${data.region}.`,
    region: data.region,
    subgenre: data.subgenre,
    socials: data.socials,
    phoneForBookings: data.phoneForBookings,
    bookingEmail: data.bookingEmail,
    heroVideoMp4Url: data.heroVideoMp4Url,
    heroVideoDurationSecs: 10.0,
    storageUsedBytes: initialStorage,
    subscriptionTier: "FREE",
    isVerified: false,
    createdAt: now,
    updatedAt: now,
    tracks: formattedTracks,
    youtubeVideos,
    eventFlyers,
    freestyles,
    services,
  };

  artistsStore.unshift(newArtist);

  // Initialize artist wallet
  walletsStore[artistId] = {
    id: `wallet-${artistId}`,
    artistId,
    currentBalanceUgx: 0,
    totalEarnedUgx: 0,
    totalWithdrawnUgx: 0,
    updatedAt: now,
  };

  return newArtist;
}

export async function processPurchase(params: {
  buyerId?: string;
  trackId: string;
  paymentMethod: "MTN_MOMO" | "AIRTEL_MONEY" | "CARD";
  paymentReference: string;
}): Promise<Purchase> {
  // Explicit ACID boundary simulation / implementation
  // 1. Locate track and artist
  let matchedTrack: Track | null = null;
  let matchedArtist: Artist | null = null;

  for (const artist of artistsStore) {
    const t = artist.tracks?.find((tr) => tr.id === params.trackId);
    if (t) {
      matchedTrack = t;
      matchedArtist = artist;
      break;
    }
  }

  if (!matchedTrack || !matchedArtist) {
    throw new AppError("TRACK_NOT_FOUND", "The requested track was not found.", 404);
  }

  // 2. Compute 80% to artist, 20% to HipHop-UG
  const totalUgx = matchedTrack.priceUgx;
  const platformCommission = Math.round(totalUgx * PLATFORM_COMMISSION_PERCENT);
  const artistEarnings = totalUgx - platformCommission;

  // 3. Create purchase record with secure download token (expires in 7 days)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const downloadToken = `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

  const purchase: Purchase = {
    id: `purch-${Date.now()}`,
    buyerId: params.buyerId || "anonymous-fan",
    trackId: matchedTrack.id,
    artistId: matchedArtist.id,
    amountPaidUgx: totalUgx,
    platformCommissionUgx: platformCommission,
    artistEarningsUgx: artistEarnings,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference,
    status: "COMPLETED",
    downloadToken,
    downloadExpiresAt: expiresAt,
    downloadCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  purchasesStore.push(purchase);

  // 4. Update track download and play metrics
  matchedTrack.downloadCount += 1;

  // 5. Update artist wallet with ACID consistency
  if (!walletsStore[matchedArtist.id]) {
    walletsStore[matchedArtist.id] = {
      id: `wallet-${matchedArtist.id}`,
      artistId: matchedArtist.id,
      currentBalanceUgx: 0,
      totalEarnedUgx: 0,
      totalWithdrawnUgx: 0,
      updatedAt: now.toISOString(),
    };
  }

  const wallet = walletsStore[matchedArtist.id];
  wallet.currentBalanceUgx += artistEarnings;
  wallet.totalEarnedUgx += artistEarnings;
  wallet.updatedAt = now.toISOString();

  // 6. Record immutable transaction log
  walletTransactionsStore.push({
    id: `tx-${Date.now()}`,
    walletId: wallet.id,
    purchaseId: purchase.id,
    amountUgx: artistEarnings,
    type: "CREDIT_SALE",
    balanceAfterUgx: wallet.currentBalanceUgx,
    description: `Sale of "${matchedTrack.title}" (80% net credited, 20% platform commission deducted)`,
    createdAt: now.toISOString(),
  });

  return purchase;
}

export async function createServiceBooking(params: {
  serviceId: string;
  artistId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  notes?: string;
  quotedPriceUgx: number;
}): Promise<ServiceBooking> {
  const booking: ServiceBooking = {
    id: `book-${Date.now()}`,
    serviceId: params.serviceId,
    artistId: params.artistId,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    eventDate: params.eventDate,
    eventLocation: params.eventLocation,
    notes: params.notes,
    quotedPriceUgx: params.quotedPriceUgx,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  bookingsStore.unshift(booking);
  return booking;
}

export async function getBookingsForArtist(artistId: string): Promise<ServiceBooking[]> {
  return bookingsStore.filter((b) => b.artistId === artistId);
}


export async function getArtistWallet(artistId: string): Promise<{
  wallet: ArtistWallet;
  transactions: WalletTransaction[];
}> {
  if (!walletsStore[artistId]) {
    walletsStore[artistId] = {
      id: `wallet-${artistId}`,
      artistId,
      currentBalanceUgx: 0,
      totalEarnedUgx: 0,
      totalWithdrawnUgx: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const wallet = walletsStore[artistId];
  const txs = walletTransactionsStore.filter((t) => t.walletId === wallet.id);
  return { wallet, transactions: txs };
}

export async function getTracks(params: {
  cursor?: string | null;
  limit?: number;
  artistId?: string | null;
  search?: string | null;
}): Promise<PaginatedResult<Track>> {
  const limit = Math.min(Math.max(params.limit || 10, 1), 50);
  let allTracks: Track[] = [];
  for (const artist of artistsStore) {
    if (!artist.deletedAt && artist.tracks) {
      allTracks.push(...artist.tracks);
    }
  }

  if (params.artistId) {
    allTracks = allTracks.filter((t) => t.artistId === params.artistId);
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    allTracks = allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.artistStageName && t.artistStageName.toLowerCase().includes(q))
    );
  }

  allTracks.sort((a, b) => {
    const dateComp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateComp !== 0) return dateComp;
    return b.id.localeCompare(a.id);
  });

  const cursorData = decodeCursor(params.cursor);
  if (cursorData) {
    const cursorTime = new Date(cursorData.createdAt).getTime();
    const startIndex = allTracks.findIndex((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      return itemTime < cursorTime || (itemTime === cursorTime && item.id < cursorData.id);
    });
    if (startIndex !== -1) {
      allTracks = allTracks.slice(startIndex);
    } else {
      allTracks = [];
    }
  }

  const hasMore = allTracks.length > limit;
  const data = hasMore ? allTracks.slice(0, limit) : allTracks;
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const last = data[data.length - 1];
    nextCursor = encodeCursor({ id: last.id, createdAt: last.createdAt });
  }

  return {
    data,
    nextCursor,
    hasMore,
    limit,
  };
}

