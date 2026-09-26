import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema";
import { MOCK_ARTISTS, MOCK_USERS, MOCK_WALLETS } from "../src/lib/mock-data";

neonConfig.fetchConnectionCache = true;

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is missing. Set it in .env.local to seed Neon Postgres.");
    process.exit(1);
  }

  console.log("Connecting to Neon PostgreSQL...");
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log("Seeding users...");
  for (const u of MOCK_USERS) {
    try {
      await db
        .insert(schema.users)
        .values({
          email: u.email,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
          isEmailVerified: u.isEmailVerified,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        })
        .onConflictDoNothing();
    } catch (e) {
      console.warn(`User ${u.email} already exists or error:`, e);
    }
  }

  console.log("Seeding artists, tracks, and media...");
  for (const a of MOCK_ARTISTS) {
    try {
      // Find user id for artist
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, `${a.stageName.toLowerCase().replace(/\s+/g, "")}@hiphopug.com`),
      });

      if (!existingUser) continue;

      const [insertedArtist] = await db
        .insert(schema.artists)
        .values({
          userId: existingUser.id,
          stageName: a.stageName,
          realName: a.realName,
          dob: a.dob,
          bio: a.bio,
          region: a.region,
          subgenre: a.subgenre,
          socialInstagram: a.socials.instagram,
          socialX: a.socials.x,
          socialTiktok: a.socials.tiktok,
          socialYoutube: a.socials.youtube,
          socialFacebook: a.socials.facebook,
          phoneForBookings: a.phoneForBookings,
          bookingEmail: a.bookingEmail,
          heroVideoMp4Url: a.heroVideoMp4Url,
          heroVideoDurationSecs: a.heroVideoDurationSecs ? String(a.heroVideoDurationSecs) : "10.0",
          storageUsedBytes: a.storageUsedBytes,
          subscriptionTier: a.subscriptionTier,
          isVerified: a.isVerified,
        })
        .onConflictDoNothing()
        .returning();

      const artistId = insertedArtist ? insertedArtist.id : null;
      if (!artistId) continue;

      // Seed initial tracks
      if (a.tracks && a.tracks.length > 0) {
        for (const t of a.tracks) {
          await db
            .insert(schema.tracks)
            .values({
              artistId,
              title: t.title,
              durationSeconds: t.durationSeconds,
              fileUrl: t.fileUrl,
              previewUrl: t.previewUrl,
              filesizeBytes: t.filesizeBytes,
              priceUgx: t.priceUgx,
              priceUsd: String(t.priceUsd),
              playCount: t.playCount,
              downloadCount: t.downloadCount,
              isPublished: t.isPublished,
            })
            .onConflictDoNothing();
        }
      }

      // Seed YouTube videos
      if (a.youtubeVideos && a.youtubeVideos.length > 0) {
        for (const y of a.youtubeVideos) {
          await db
            .insert(schema.artistYoutubeVideos)
            .values({
              artistId,
              youtubeUrl: y.youtubeUrl,
              videoTitle: y.videoTitle,
              orderIndex: y.orderIndex,
            })
            .onConflictDoNothing();
        }
      }

      // Seed Event Flyers
      if (a.eventFlyers && a.eventFlyers.length > 0) {
        for (const f of a.eventFlyers) {
          await db
            .insert(schema.eventFlyers)
            .values({
              artistId,
              title: f.title,
              eventDate: new Date(f.eventDate),
              venue: f.venue,
              city: f.city,
              flyerImageUrl: f.flyerImageUrl,
              ticketLink: f.ticketLink,
            })
            .onConflictDoNothing();
        }
      }

      // Seed Freestyles
      if (a.freestyles && a.freestyles.length > 0) {
        for (const fr of a.freestyles) {
          await db
            .insert(schema.freestyles)
            .values({
              artistId,
              title: fr.title,
              mediaType: fr.mediaType,
              mediaUrl: fr.mediaUrl,
              thumbnailUrl: fr.thumbnailUrl,
              durationSeconds: fr.durationSeconds,
            })
            .onConflictDoNothing();
        }
      }

      // Seed Services
      if (a.services && a.services.length > 0) {
        for (const s of a.services) {
          await db
            .insert(schema.artistServices)
            .values({
              artistId,
              serviceName: s.serviceName,
              description: s.description,
              priceUgx: s.priceUgx,
              priceUsd: s.priceUsd ? String(s.priceUsd) : null,
              isAvailable: s.isAvailable,
            })
            .onConflictDoNothing();
        }
      }

      // Seed Wallet
      await db
        .insert(schema.artistWallets)
        .values({
          artistId,
          currentBalanceUgx: 5000000,
          totalEarnedUgx: 7500000,
          totalWithdrawnUgx: 2500000,
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn(`Error seeding artist ${a.stageName}:`, err);
    }
  }

  console.log("Neon database seeding completed successfully.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
