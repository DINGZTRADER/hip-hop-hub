# Artist media zone and global catalog limits

Status: layout, limits, and written spec approved in conversation.

## Outcome

Every artist can manage a record portrait, a looping photo gallery, public booking contacts, an optional website, up to ten original MP3 tracks, and up to ten original YouTube music videos. The public zone uses the space beside the spinning record instead of separate oversized profile and video sections. Existing tracks, purchases, contacts, videos, and artist URLs remain intact.

This is Hip Hop Hub client work, retaining its existing identity and colors.

## Public layout

Use a compact artist identity header followed by a responsive three-column stage. The left panel contains biography, region, booking phone/email, website, social links, and a photo slideshow. The centre contains the existing interactive spinning record, with the chosen portrait clipped inside the yellow/orange label, and the current track information. The right panel contains one YouTube player and a selectable list of the artist's videos. The crate, booking services, flyers, and freestyle sections remain below.

On small screens, stack profile/photos, record, and videos; avoid horizontal overflow. Portraits use object-fit cover, a square crop preview, and a centred default crop. Keep the gradient label when no portrait exists. Use the same portrait on artist cards and the compact zone header. Missing contact fields render no empty links. Public booking details are intentionally published; never substitute private sign-in email or account phone.

Photos advance every six seconds, include previous/next and pause controls, and stop automatic advancement for reduced-motion preferences. Give images meaningful artist-based alt text. Only the active YouTube video loads an iframe; selecting another video replaces it. Starting a YouTube video pauses MP3 playback, and starting MP3 playback pauses the active YouTube player. Use YouTube's documented iframe API and validate message origin/source.

## Shared limits

- MP3 catalog: maximum 10 non-deleted tracks for every tier. Registration accepts 1–10 tracks; existing artists add tracks through the dashboard. Each MP3 retains its 50 MB maximum and no separate preview upload.
- YouTube: 0–10 links, editable during registration and in the dashboard. Normalize valid YouTube watch, short-link, Shorts, and embed URLs to canonical video IDs; reject other hosts, malformed IDs, and duplicate videos. An artist confirms that submitted tracks and videos are their original music. This declaration does not claim independent copyright verification. YouTube may still restrict playback or embedding.
- Images: one record portrait plus up to 10 gallery photos, each source at most 2 MiB. Accept JPEG, PNG, and WebP; reject SVG, GIF, animated files, invalid image data, and excessive decoded dimensions. Maximum decoded image area is 20 megapixels. Auto-orient, remove metadata, and encode optimized WebP at a maximum edge of 1600 pixels. Portrait output is a square crop, at most 512 pixels per edge.
- Preserve the existing quota entitlement rather than changing tier storage pricing. Include images in quota accounting and show the actual quota in the interface. Shared limit constants drive interfaces and server validation.

## Storage and persistence

Add an optional website URL to artists and an additive artist image asset table. Asset records contain ID, owning user, optional artist ID, portrait/gallery purpose, ordering, internal Blob location, reserved and actual bytes, lifecycle status, timestamps, and expiry. Existing artist records require no new mandatory values or backfill.

Reuse private Vercel Blob storage. A dedicated authenticated image upload endpoint accepts one bounded multipart file, checks request origin, limits body size before decoding, validates image bytes, optimizes the image, and saves it to a server-generated immutable path. Server upload is appropriate for the 2 MiB constraint and avoids enlarging the MP3 upload token permissions. Declare sharp as a direct dependency using the version already installed through Next.js; add no gallery or slider library.

Reserve quota before writing storage and finalize only verified assets. Check database ownership when attaching image IDs to a profile; clients cannot publish arbitrary remote URLs or another user's assets. Serialize quota and publication mutations using a consistent user-then-artist lock order, so concurrent image and MP3 uploads cannot oversubscribe storage. Account for both active catalog bytes and pending reservations without double-counting claimed uploads.

Only claimed images of active artists are publicly readable through an image delivery route. Draft images require their owner's session. Public responses return proxy URLs and metadata, never private Blob URLs or credentials. Immutable asset URLs allow safe CDN caching after publication; replacing a portrait creates a new asset ID. Retirement removes public visibility before deleting bytes. Failed deletion must not resurrect retired assets. Provide an idempotent scheduled cleanup for expired drafts and retired assets; configure its authentication and schedule as part of rollout.

Profile edits atomically save booking contacts, website, portrait, gallery order, and YouTube list. Validate lengths, email format, phone length, and HTTP(S) website URLs without credentials; reject unsafe protocols. Missing PATCH fields retain existing values; explicit empty values clear optional fields. Preserve the existing hero-video update contract. New registration can claim its own draft images within the same registration transaction. Failed registration or save leaves drafts recoverable until expiry rather than claiming partial data.

## Artist editing experience

Extend the registration profile step and dashboard with the same reusable editor for portrait, gallery, contacts, website, and YouTube links. Show file names, size limits, upload progress, chosen crop, and saved/draft state. Artists can replace the portrait, add/reorder/remove gallery images, and edit video titles/order. Do not discard an existing saved image until its replacement is verified and the profile save succeeds.

Change the registration MP3 step to add/remove rows up to ten, retaining stable upload IDs. Track additions preserve transactional ownership checks, per-file size checks, and the catalog cap. Pending upload limits must allow a verified replacement without making ten claimed masters block every new draft; catalog limits and temporary upload limits are distinct.

Audit all global wording and behavior: homepage, pricing, artist cards, registration steps, dashboard counters, upload errors, schema comments, API validation, gallery slicing, and tests. Remove obsolete one-track/exactly-one and top-three-video claims. Keep protected owner master playback and paid download authorization unchanged. This feature does not introduce free public master playback.

## Migration and release

Use an additive SQL migration with explicit indexes and constraints; do not run a destructive schema push or reseed production. Verify the target Vercel project and Neon database before applying it. Deploy the migration before code that selects the new fields. Retain the previous working deployment for rollback; the additive schema remains compatible with it. Confirm required Blob and cleanup configuration before activating uploads.

## Acceptance evidence

Automated checks cover registration with 1 and 10 masters; rejection of 0 and 11; dashboard acceptance of the tenth and rejection of the eleventh; concurrent quota/cap protection; unchanged no-preview and purchase-download rules; valid, duplicate, hostile-host, and oversized YouTube lists; owner-only profile editing and image claiming; image formats, byte/dimension limits, optimization and metadata removal; draft visibility, replacement failure, quota accounting, and cleanup retry behavior.

Run the complete existing suite, TypeScript checks, and production build. Verify production deployment matches the tested commit. In the authenticated artist session, check existing Change playback and that saved profile metadata survives reload. Use isolated temporary fixtures for destructive boundary tests; do not overwrite the artist's real photos or music. Verify signed-out public rendering, image URLs, empty-state fallbacks, mobile layout, reduced-motion behavior, and YouTube/MP3 pause coordination. Record separately any acceptance check requiring artist-supplied files; never claim those passed without real upload evidence.
