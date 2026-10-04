CREATE TABLE "cypher_playlists" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"video_ids" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cypher_playlists" ADD CONSTRAINT "cypher_playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;