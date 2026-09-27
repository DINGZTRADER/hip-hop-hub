CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('AUDIO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('FREE', 'PRO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('FAN', 'ARTIST', 'ADMIN');--> statement-breakpoint
CREATE TABLE "artist_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"service_name" varchar(150) NOT NULL,
	"description" text,
	"price_ugx" integer NOT NULL,
	"price_usd" numeric(8, 2),
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "artist_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"current_balance_ugx" bigint DEFAULT 0 NOT NULL,
	"total_earned_ugx" bigint DEFAULT 0 NOT NULL,
	"total_withdrawn_ugx" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_wallets_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "artist_youtube_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"youtube_url" text NOT NULL,
	"video_title" varchar(255),
	"order_index" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stage_name" varchar(150) NOT NULL,
	"real_name" varchar(255) NOT NULL,
	"dob" date NOT NULL,
	"bio" text,
	"region" varchar(100) DEFAULT 'Kampala' NOT NULL,
	"subgenre" varchar(100) DEFAULT 'Luga Flow' NOT NULL,
	"social_instagram" varchar(255),
	"social_x" varchar(255),
	"social_tiktok" varchar(255),
	"social_youtube" varchar(255),
	"social_facebook" varchar(255),
	"phone_for_bookings" varchar(50),
	"booking_email" varchar(255),
	"hero_video_mp4_url" text,
	"hero_video_duration_secs" numeric(4, 1) DEFAULT '10.0',
	"storage_used_bytes" bigint DEFAULT 0 NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'FREE' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "artists_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "artists_stage_name_unique" UNIQUE("stage_name")
);
--> statement-breakpoint
CREATE TABLE "event_flyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"venue" varchar(255) NOT NULL,
	"city" varchar(100) DEFAULT 'Kampala' NOT NULL,
	"flyer_image_url" text NOT NULL,
	"ticket_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "freestyles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"media_type" "media_type" NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid,
	"track_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"amount_paid_ugx" integer NOT NULL,
	"platform_commission_ugx" integer NOT NULL,
	"artist_earnings_ugx" integer NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_reference" varchar(255) NOT NULL,
	"status" "purchase_status" DEFAULT 'PENDING' NOT NULL,
	"download_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"download_expires_at" timestamp with time zone NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_payment_reference_unique" UNIQUE("payment_reference"),
	CONSTRAINT "purchases_download_token_unique" UNIQUE("download_token")
);
--> statement-breakpoint
CREATE TABLE "service_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(255) NOT NULL,
	"client_phone" varchar(50) NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"event_location" text NOT NULL,
	"notes" text,
	"quoted_price_ugx" integer NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"duration_seconds" integer NOT NULL,
	"file_url" text NOT NULL,
	"preview_url" text NOT NULL,
	"filesize_bytes" bigint NOT NULL,
	"price_ugx" integer DEFAULT 3000 NOT NULL,
	"price_usd" numeric(6, 2) DEFAULT '0.99' NOT NULL,
	"play_count" bigint DEFAULT 0 NOT NULL,
	"download_count" bigint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"google_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"phone_number" varchar(50),
	"role" "user_role" DEFAULT 'FAN' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"purchase_id" uuid,
	"amount_ugx" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"balance_after_ugx" bigint NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_purchase_id_unique" UNIQUE("purchase_id")
);
--> statement-breakpoint
ALTER TABLE "artist_services" ADD CONSTRAINT "artist_services_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_wallets" ADD CONSTRAINT "artist_wallets_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_youtube_videos" ADD CONSTRAINT "artist_youtube_videos_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_flyers" ADD CONSTRAINT "event_flyers_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freestyles" ADD CONSTRAINT "freestyles_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_service_id_artist_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."artist_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_artist_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."artist_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artists_cursor" ON "artists" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "idx_artists_stagename" ON "artists" USING btree ("stage_name");--> statement-breakpoint
CREATE INDEX "idx_purchases_buyer" ON "purchases" USING btree ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_purchases_artist" ON "purchases" USING btree ("artist_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tracks_artist" ON "tracks" USING btree ("artist_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tracks_cursor" ON "tracks" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_google" ON "users" USING btree ("google_id");