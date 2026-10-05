BEGIN;
SELECT pg_advisory_xact_lock(8210505);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS website_url text;
CREATE TABLE IF NOT EXISTS artist_image_assets (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
 purpose varchar(10) NOT NULL CHECK (purpose IN ('portrait','gallery')),
 order_index smallint NOT NULL DEFAULT 0 CHECK (order_index BETWEEN 0 AND 10),
 filename varchar(255) NOT NULL,
 width integer NOT NULL CHECK (width > 0), height integer NOT NULL CHECK (height > 0),
 pathname text NOT NULL UNIQUE, blob_url text,
 reserved_bytes bigint NOT NULL CHECK (reserved_bytes > 0 AND reserved_bytes <= 2097152),
 actual_bytes bigint CHECK (actual_bytes > 0 AND actual_bytes <= reserved_bytes),
 status varchar(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','UPLOADED','CLAIMED','RETIRED')),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 CHECK (status <> 'CLAIMED' OR (artist_id IS NOT NULL AND blob_url IS NOT NULL AND actual_bytes IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_artist_images_owner_status ON artist_image_assets(user_id,status);
CREATE INDEX IF NOT EXISTS idx_artist_images_artist ON artist_image_assets(artist_id,order_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_images_portrait ON artist_image_assets(artist_id) WHERE status='CLAIMED' AND purpose='portrait';
CREATE TABLE IF NOT EXISTS track_play_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 window_start timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(track_id,user_id,window_start)
);
CREATE INDEX IF NOT EXISTS idx_track_play_events_created ON track_play_events(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_track_status ON purchases(track_id,status);
COMMIT;
