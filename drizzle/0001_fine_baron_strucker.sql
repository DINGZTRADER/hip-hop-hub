CREATE TABLE "media_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(10) NOT NULL,
	"pathname" text NOT NULL,
	"blob_url" text,
	"reserved_bytes" bigint NOT NULL,
	"actual_bytes" bigint,
	"status" varchar(10) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "media_uploads_pathname_unique" UNIQUE("pathname"),
	CONSTRAINT "media_uploads_blob_url_unique" UNIQUE("blob_url")
);
--> statement-breakpoint
ALTER TABLE "media_uploads" ADD CONSTRAINT "media_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_uploads_user_status" ON "media_uploads" USING btree ("user_id","status");