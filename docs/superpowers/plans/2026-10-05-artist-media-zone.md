# Artist Media Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved compact artist stage, owner-managed images/contacts, and consistent ten-track/ten-video limits across Hip Hop Hub.

**Architecture:** Extend the existing Next.js/Drizzle artist flow with an owned image-asset lifecycle in private Blob storage. Reuse a single profile editor for registration and dashboard, shared catalog policies for every API/UI, and a responsive public stage with coordinated MP3/YouTube playback. Apply the additive database migration before activating the new deployment.

**Tech Stack:** Next.js 15.5.26, React 19, TypeScript, Neon PostgreSQL/Drizzle, Vercel Blob 2.8.0, sharp 0.35.4, existing Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-05-artist-media-zone-design.md`

**Execution:** Native execution by the primary agent, with one independent whole-change review before release. This follows the user's instruction to choose an affordable, high-quality approach; no execution-option selection is needed. Work in the current isolated clone at `work/hip-hop-hub`, branch `codex/single-mp3`. Preserve unrelated checkouts. Written plan review is the remaining skill gate.

## Global Constraints

- MP3 catalog: maximum 10 non-deleted tracks for every tier. Registration accepts 1–10 tracks. Each MP3 retains its 50 MB maximum and no separate preview upload.
- YouTube: 0–10 original-music links, canonical IDs, no duplicate videos or non-YouTube hosts.
- Images: one portrait plus at most 10 gallery photos; source maximum 2 MiB; JPEG/PNG/WebP only; no animation; decoded area maximum 20 megapixels.
- Optimized WebP strips metadata; portrait maximum 512 square; gallery maximum edge 1600. Photos advance every six seconds with pause/navigation and reduced-motion support.
- Preserve existing storage entitlements, saved catalog, purchases, services, contacts, flyers, and artist URLs. Never reveal private Blob locations in profile responses.
- Keep Hip Hop Hub branding. Do not add a gallery library, reseed production, or use destructive schema push.
- Publish booking fields only; never infer them from account sign-in contacts. Keep private owner playback and paid downloads protected.

## Review Focus

1. A replacement upload failing midway must leave the previous saved portrait visible and usable (Task 2/3).
2. Concurrent MP3/image requests near quota or catalog limits must not both spend the same available capacity (Task 1/2).
3. PATCH omission must preserve a field, while explicit empty values clear only the intended optional field (Task 2).
4. Existing YouTube links containing playlists/timestamps and empty galleries must render correctly without crashing (Task 1/4).
5. Late YouTube events from a replaced iframe must not pause unrelated/current audio; keyboard and reduced-motion users must control the slideshow (Task 4).

## Task 1: Shared catalog policy and safe ten-item publication

**Files:** Modify `src/lib/artist-track-policy.ts`, `src/lib/data-service.ts`, `src/lib/media-uploads.ts`, `src/lib/media-upload-policy.ts`, `src/app/api/artists/route.ts`, `src/app/api/tracks/route.ts`, `src/db/schema.ts`. Create `src/lib/artist-media-policy.ts`. Modify `tests/onboarding-single-track.test.mjs`, `tests/track-publication.test.mjs`, `tests/artist-track-policy.test.mjs`; create `tests/artist-media-policy.test.mjs`.

**Interfaces:** Export `MAX_ARTIST_TRACKS = 10` from the existing module. Export `MAX_ARTIST_VIDEOS = 10`, `MAX_ARTIST_PHOTOS = 10`, `MAX_IMAGE_BYTES = 2 * 1024 * 1024`, and `getYouTubeVideoId(url: string): string | null` from the new policy module. `normalizeArtistVideos(videos: Array<{youtubeUrl: string; videoTitle?: string}>): Array<{youtubeUrl: string; videoTitle: string; orderIndex: number}>` rejects invalid/duplicate/over-limit lists. `storageQuotaBytes(tier: SubscriptionTier): number` returns existing FREE 500 MiB / PRO 5 GiB entitlements.

- [ ] Write policy/publication tests: registration accepts counts 1 and 10, rejects 0 and 11; catalog count 9 admits one track, count 10 denies it for both tiers. `assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=omnvXEdvgbI&list=example&t=13s'), 'omnvXEdvgbI')`; reject `youtube.com.evil.test`, invalid IDs, duplicate forms of one ID, and 11 links. Preserve no-preview, owned-master, and size-match tests.
- [ ] Run `npm.cmd test`; verify the changed-limit tests fail against the one-track/top-three implementation.
- [ ] Implement shared policy and validated registration without silent `slice(0, 3)` truncation. Preserve optional old string-array registration input by normalizing it to the new video objects. Require original-music confirmation for new submissions without retroactively changing saved data.
- [ ] Change MP3 reservation counting to separate pending/unclaimed slots from claimed catalog records. Permit at most 11 outstanding masters for ten-track registration plus one replacement. Consolidate quota reservations and mutation locks in the order user, artist, upload assets; do not reverse lock order in registration. Keep artist catalog cap under the artist row lock.
- [ ] Test concurrent cap/quota mutations with two transactions in an isolated test database; both near-cap requests cannot publish. Run `npm.cmd test` and `npx.cmd tsc --noEmit --incremental false`; commit policy/publication changes.

## Task 2: Image assets and atomic profile persistence

**Files:** Modify `src/db/schema.ts`, `src/types/index.ts`, `src/lib/data-service.ts`, `src/lib/media-uploads.ts`, `src/app/api/artists/route.ts`, `src/app/api/artists/[stageName]/route.ts`, `package.json`, `package-lock.json`. Create `src/lib/artist-images.ts`, `src/lib/artist-profile.ts`, `src/lib/request-body.ts`, `src/app/api/artist-images/route.ts`, `src/app/api/artist-images/[id]/route.ts`, `src/app/api/maintenance/artist-images/route.ts`, `drizzle/artist-media-zone.sql`, `scripts/migrate-artist-media-zone.mjs`, `tests/artist-images.test.mjs`, `tests/artist-profile.test.mjs`, and `vercel.json` if none exists.

**Interfaces:** Add `ArtistImage = {id: string; url: string; purpose: 'portrait' | 'gallery'; orderIndex: number; filesizeBytes: number; width: number; height: number; filename: string}` to types. Extend `Artist` with optional `websiteUrl`, `portrait`, and `photos`. Add `ArtistProfileInput` with optional booking fields, website, `portraitImageId: string | null`, `galleryImageIds: string[]`, normalized video objects, and original-music confirmation. `updateArtistProfile(userId: string, artistId: string, input: ArtistProfileInput): Promise<Artist>` preserves omitted fields. `uploadArtistImage(userId: string, file: File, purpose: 'portrait' | 'gallery', crop?: {left: number; top: number; size: number}): Promise<ArtistImage>` returns a proxy URL. `retireDraftImage(userId: string, id: string): Promise<void>` refuses to retire claimed assets outside a profile save. `cleanupArtistImages(limit = 100): Promise<{removed: number; failed: number}>` is idempotent.

- [ ] Write tests for denied cross-account uploads/claims/saves, hostile Origin, oversize bodies without Content-Length, spoofed MIME, SVG/GIF/animation, corrupt raster bytes, >20 MP images, invalid/out-of-bounds crop, stripped EXIF, 512-square portraits, and gallery edge <=1600. Assert failed replacement leaves the old claimed asset/public response unchanged.
- [ ] Write profile tests for omitted vs cleared booking fields/website, unsafe website protocols, more than ten gallery IDs, repeated asset IDs, wrong-purpose portrait assets, duplicate YouTube links, and transaction rollback. Assert draft images are private, retired/deleted-artist images cannot be fetched, and private locations never appear in API data. Write cleanup retry and concurrent image/MP3 quota tests.
- [ ] Run those tests and observe missing interfaces fail. Add sharp 0.35.4 as an explicit dependency with `npm.cmd install --save-exact sharp@0.35.4`, keeping the lockfile reproducible.
- [ ] Add nullable `artists.website_url` and `artist_image_assets` columns: UUID ID/user/artist, purpose, ordering, filename, optimized width/height, Blob URL, reserved/actual bytes, status PENDING/UPLOADED/CLAIMED/RETIRED, timestamps and expiry. Add ownership/status indexes, positive size/dimension checks, and a partial unique claimed-portrait index. SQL migration uses an advisory lock and transaction, checks existing column/table definitions, and is rerunnable without destroying data. Migration script reads DATABASE_URL and logs no credentials.
- [ ] Implement bounded multipart reading: maximum body `MAX_IMAGE_BYTES + 65536`, reject streaming overflow before `formData`/decode, then enforce individual file bytes. Validate raster decoder metadata, rotate/crop/resize, encode WebP, reserve before Blob `put`, and finalize DB state after success. Stable server-generated paths make failed writes discoverable by cleanup. Draft expiry is 24 hours; PENDING write lease is one hour.
- [ ] Share quota calculations with MP3 reservation paths: sum claimed bytes plus pending/unclaimed reserved bytes across both asset tables exactly once. Adjust reservation to actual optimized bytes on finalize. Profile save claims new IDs and retires removed assets under consistent locks, updates byte counters, and replaces the YouTube list atomically. Registration performs the same claims inside its transaction. Preserve the existing hero-video PATCH contract.
- [ ] Image GET joins active artist state for claimed public assets, returns `image/webp` and nosniff; drafts require the owning session and private/no-store. Use conservative public cache revalidation so retired IDs cease delivery; do not promise permanent visibility revocation while issuing long immutable public caches. Maintenance route uses authenticated CRON_SECRET and daily Vercel cron (compatible with lowest-cost plan); retire visibility first and retry deletion safely.
- [ ] Run tests/typecheck. Apply migration to isolated database and exercise rerun/rollback compatibility. Commit additive schema and image/profile implementation.

## Task 3: Reusable registration and dashboard media editor

**Files:** Create `src/components/artist/ArtistProfileEditor.tsx`, `src/components/artist/ArtistImageUpload.tsx`, `src/components/artist/YouTubeLinksEditor.tsx`. Modify `src/app/dashboard/onboarding/ArtistOnboarding.tsx`, `src/app/dashboard/page.tsx`, `src/components/audio/Mp3Upload.tsx` only where pending upload coordination needs it. Create `tests/artist-profile-editor.test.mjs`; modify existing registration/upload-display tests.

**Interfaces:** `ArtistProfileEditor({value, onChange, onBusyChange, onError})` consumes a controlled draft of Task 2 profile input plus preview asset objects. `ArtistImageUpload({purpose, value, onUploaded, onBusyChange, onError})` uploads via POST `/api/artist-images`. `YouTubeLinksEditor({value, onChange})` manages up to ten titled rows using Task 1 normalization. No implicit profile save during file selection.

- [ ] Write editor tests for ten-item limits, stable IDs while reordering/removing, visible verified filenames, failed image replacement preserving saved value, cropping preview, and disabled save while uploads are pending. Confirm original-music declaration is required only for submitted new music/video changes.
- [ ] Run failing tests. Implement preview/crop controls, keyboard-accessible gallery ordering/removal, upload progress via XMLHttpRequest, recoverable errors, and shared 2 MiB helper text. Display booking fields as public before saving.
- [ ] Add editor to registration and dashboard. PATCH refreshes local artist data from server; success means persisted save. Preserve draft IDs during MP3 step navigation. Add/remove MP3 rows from 1 to 10, track active uploads by row ID rather than a single boolean, and release removed unclaimed drafts. Render actual storage entitlement and ten-item counters.
- [ ] Run editor tests and `npm.cmd test`; commit editing flow.

## Task 4: Compact responsive artist stage and playback coordination

**Files:** Create `src/components/artist/ArtistPhotoSlideshow.tsx`, `src/components/artist/ArtistContactPanel.tsx`, `src/components/artist/ArtistStage.tsx`. Modify `src/components/artist/VirtualDjBooth.tsx`, `src/components/artist/YouTubeGallery.tsx`, `src/components/artist/ArtistCard.tsx`, `src/components/audio/AudioContext.tsx`, `src/app/artist/[stageName]/page.tsx`, `src/app/page.tsx`, `src/app/pricing/page.tsx`, and relevant CSS in `src/app/globals.css`. Create `tests/artist-stage.test.mjs`, `tests/artist-playback-coordination.test.mjs`; extend global wording tests.

**Interfaces:** `ArtistStage({artist}: {artist: Artist})` combines Task 2 artist data with protected owner `playbackUrl` fields already assigned by the server page. `ArtistPhotoSlideshow({photos, stageName})` consumes optimized asset proxy URLs. `ArtistContactPanel({artist})` renders only supplied booking/social/website data. Extend audio context with `pauseTrack` usage and a playback-start subscription/event for the mounted YouTube player; do not change paid download routes.

- [ ] Write tests for portrait/fallback rendering, absent contact fields, valid tel/mailto/website links, empty/one/ten-photo galleries, six-second advancement, pause/manual controls, reduced-motion changes, and unmount timer cleanup. Assert only one iframe for ten videos and preserved canonical ID handling for old links.
- [ ] Write coordination tests: YouTube PLAYING pauses MP3; MP3 play pauses current video; stale iframe events and invalid-origin/source messages are ignored; iframe API loading and listeners clean up on route change. Preserve existing owner-playback access tests.
- [ ] Run failing tests. Implement three-column stage with 280-pixel-minimum centre, compact header, circular portrait label, a single selected video and list, responsive stacking, and reduced-motion CSS. Keep stage name readable outside the rotating portrait. Retain record play/pause accessibility and compact current-track details.
- [ ] Use the YouTube iframe API; lazy-load it once, register only the active player, and tear it down on selection change. Catch embed errors and show a direct YouTube link without claiming playback succeeded. MP3 autoplay rejection retains paused state.
- [ ] Remove duplicate oversized profile/video blocks from the server page, preserve lower catalog/services content, and apply portrait styling to artist cards. Audit global copy with `git grep -n -E 'One original|exactly one|Top 3|MP3 Track \(1\)|slice\(0, 3\)' -- src tests`; replace only artist-catalog claims, not unrelated limits.
- [ ] Run all tests/typecheck/build; commit public stage changes.

## Task 5: Independent review, migration, deployment, and live acceptance

**Files:** Create `docs/artist-media-zone-release.md`; update plan checkboxes and spec status with actual evidence.

**Interfaces:** Release consumes the tested immutable commit, migration script from Task 2, cleanup configuration, and the existing Hip Hop Hub production project. Evidence explicitly separates automated/local, migration, deployment, and authenticated browser checks.

- [ ] Run `npm.cmd test`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd run build`, and `git diff --check`. Require exit code zero; inspect warnings rather than hiding failures.
- [ ] Request one independent whole-change review under the chosen native workflow. Resolve material findings and rerun affected checks before release.
- [ ] Confirm connected Vercel project `prj_CFc3imGteBGB2cO2nlfX3tbY66uO`, team `team_CM4YELT8DQK5Mos2UE4ZbnSD`, current production commit, and the exact linked Neon database/branch without printing secrets. If database/config access is unavailable, complete source/tests and report that specific release blocker; do not deploy schema-dependent code first.
- [ ] Apply the additive migration to the verified production DB, ensure Blob credentials/store and CRON_SECRET are configured, verify migration rerun is harmless, and deploy the reviewed commit to production. Keep the previous deployment ID in release notes. Do not replace the user's content with test fixtures.
- [ ] Verify Vercel READY and commit match; authenticated artist page still plays Change with advancing elapsed time. Verify persisted benign profile updates after reload only if artist-supplied values exist. Use isolated fixtures for real image uploads, failed replacements, ten-item boundaries, and concurrency; clean them through lifecycle controls.
- [ ] Verify public/signed-out page fallbacks, portrait/gallery/image visibility, desktop/mobile layouts, and actual YouTube/MP3 coordination in Chrome. Save a screenshot of the deployed stage. List any upload checks blocked on supplied real assets or external YouTube restrictions; do not manufacture artist photos.
- [ ] Document commands/results, migration/config/deployment IDs, known limits, and rollback steps. Final response names the delivered global changes, verification, and any remaining concrete limitations.
