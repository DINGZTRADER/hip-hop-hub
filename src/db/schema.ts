import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  bigint,
  integer,
  numeric,
  smallint,
  pgEnum,
  index,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["FAN", "ARTIST", "ADMIN"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["FREE", "PRO"]);
export const mediaTypeEnum = pgEnum("media_type", ["AUDIO", "VIDEO"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "COMPLETED",
]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

// 1. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    googleId: varchar("google_id", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    phoneNumber: varchar("phone_number", { length: 50 }),
    role: userRoleEnum("role").default("FAN").notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_google").on(table.googleId),
  ]
);

// 2. Artists Profile Table
export const artists = pgTable(
  "artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    stageName: varchar("stage_name", { length: 150 }).notNull().unique(),
    realName: varchar("real_name", { length: 255 }).notNull(),
    dob: date("dob").notNull(),
    bio: text("bio"),
    region: varchar("region", { length: 100 }).default("Kampala").notNull(),
    subgenre: varchar("subgenre", { length: 100 }).default("Luga Flow").notNull(),
    socialInstagram: varchar("social_instagram", { length: 255 }),
    socialX: varchar("social_x", { length: 255 }),
    socialTiktok: varchar("social_tiktok", { length: 255 }),
    socialYoutube: varchar("social_youtube", { length: 255 }),
    socialFacebook: varchar("social_facebook", { length: 255 }),
    phoneForBookings: varchar("phone_for_bookings", { length: 50 }),
    bookingEmail: varchar("booking_email", { length: 255 }),
    heroVideoMp4Url: text("hero_video_mp4_url"),
    heroVideoDurationSecs: numeric("hero_video_duration_secs", { precision: 4, scale: 1 }).default("10.0"),
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).default(0).notNull(),
    subscriptionTier: subscriptionTierEnum("subscription_tier").default("FREE").notNull(),
    subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_artists_cursor").on(table.createdAt, table.id),
    index("idx_artists_stagename").on(table.stageName),
  ]
);

// 3. MP3 Tracks (Min 3, Max 10 Free Tier)
export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    fileUrl: text("file_url").notNull(),
    previewUrl: text("preview_url").notNull(),
    filesizeBytes: bigint("filesize_bytes", { mode: "number" }).notNull(),
    priceUgx: integer("price_ugx").default(3000).notNull(),
    priceUsd: numeric("price_usd", { precision: 6, scale: 2 }).default("0.99").notNull(),
    playCount: bigint("play_count", { mode: "number" }).default(0).notNull(),
    downloadCount: bigint("download_count", { mode: "number" }).default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_tracks_artist").on(table.artistId, table.createdAt),
    index("idx_tracks_cursor").on(table.createdAt, table.id),
  ]
);

export const mediaUploads = pgTable(
  "media_uploads",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 10 }).notNull(),
    pathname: text("pathname").notNull().unique(),
    blobUrl: text("blob_url").unique(),
    reservedBytes: bigint("reserved_bytes", { mode: "number" }).notNull(),
    actualBytes: bigint("actual_bytes", { mode: "number" }),
    status: varchar("status", { length: 10 }).default("PENDING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_media_uploads_user_status").on(table.userId, table.status)]
);

// 4. YouTube Videos (Up to 3)
export const artistYoutubeVideos = pgTable("artist_youtube_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  youtubeUrl: text("youtube_url").notNull(),
  videoTitle: varchar("video_title", { length: 255 }),
  orderIndex: smallint("order_index").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 5. Event Flyers
export const eventFlyers = pgTable("event_flyers", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).default("Kampala").notNull(),
  flyerImageUrl: text("flyer_image_url").notNull(),
  ticketLink: text("ticket_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 6. Freestyles
export const freestyles = pgTable("freestyles", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 7. Artist Services for Functions (Weddings, Parties, Features)
export const artistServices = pgTable("artist_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  serviceName: varchar("service_name", { length: 150 }).notNull(),
  description: text("description"),
  priceUgx: integer("price_ugx").notNull(),
  priceUsd: numeric("price_usd", { precision: 8, scale: 2 }),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 8. Service Bookings
export const serviceBookings = pgTable("service_bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => artistServices.id),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  clientPhone: varchar("client_phone", { length: 50 }).notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  eventLocation: text("event_location").notNull(),
  notes: text("notes"),
  quotedPriceUgx: integer("quoted_price_ugx").notNull(),
  status: bookingStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 9. Purchases & 80/20 Split
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id").references(() => users.id),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    amountPaidUgx: integer("amount_paid_ugx").notNull(),
    platformCommissionUgx: integer("platform_commission_ugx").notNull(), // 20%
    artistEarningsUgx: integer("artist_earnings_ugx").notNull(), // 80%
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    paymentReference: varchar("payment_reference", { length: 255 }).unique().notNull(),
    status: purchaseStatusEnum("status").default("PENDING").notNull(),
    downloadToken: uuid("download_token").defaultRandom().unique().notNull(),
    downloadExpiresAt: timestamp("download_expires_at", { withTimezone: true }).notNull(),
    downloadCount: integer("download_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_purchases_buyer").on(table.buyerId, table.createdAt),
    index("idx_purchases_artist").on(table.artistId, table.createdAt),
  ]
);

// 10. Artist Wallets
export const artistWallets = pgTable("artist_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: "cascade" }),
  currentBalanceUgx: bigint("current_balance_ugx", { mode: "number" }).default(0).notNull(),
  totalEarnedUgx: bigint("total_earned_ugx", { mode: "number" }).default(0).notNull(),
  totalWithdrawnUgx: bigint("total_withdrawn_ugx", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => artistWallets.id),
  purchaseId: uuid("purchase_id").unique().references(() => purchases.id),
  amountUgx: integer("amount_ugx").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'CREDIT_SALE' | 'DEBIT_PAYOUT'
  balanceAfterUgx: bigint("balance_after_ugx", { mode: "number" }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  artistProfile: one(artists, {
    fields: [users.id],
    references: [artists.userId],
  }),
  purchases: many(purchases),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
  tracks: many(tracks),
  youtubeVideos: many(artistYoutubeVideos),
  eventFlyers: many(eventFlyers),
  freestyles: many(freestyles),
  services: many(artistServices),
  wallet: one(artistWallets, {
    fields: [artists.id],
    references: [artistWallets.artistId],
  }),
}));

export const cypherPlaylists = pgTable("cypher_playlists", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  videoIds: text("video_ids").array().default([]).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
