# Artist stage and media release

Prepared 5 October 2026 for Hip Hop Hub. Implementation is complete locally; production activation remains pending.

## Result

Artists can upload 1–10 original full MP3s without a short preview, manage up to ten original YouTube music links, and publish a record portrait and up to ten gallery photos. Images accept JPEG, PNG and WebP up to 2 MiB, enforce a 20-million-pixel decode limit, and are optimized to WebP with metadata removed. My Hub exposes the MP3 upload form and shared profile/video editor. Desktop artist stages put booking contacts and website beside the record and video player; phone layouts stack these panels.

Plays qualify after 30 seconds of listening, or half the duration for shorter tracks. Signed-in listeners are deduplicated by track and 30-minute window. Seeking does not add listening time. Replay and expired-session resume renew the signed play ticket. Anonymous previews are not counted. This retains the existing owner-only full-master playback and protected purchase-download behavior.

Buy totals count `COMPLETED` purchases. Failed, pending and refunded payments do not count; repeated downloads remain a separate statistic. No historical sales are inferred from download counts.

## Evidence

- Final unit/component suite: **45 passed, zero failed**. New regression tests reproduce and prevent stale upload callbacks, unrelated dashboard changes discarding profile drafts, image draft removal, and same-track play-session expiry/replay failures.
- TypeScript checks and `next build` passed on the final source. `git diff --check` passed.
- Disposable Neon schema: additive migration applied twice; concurrent tenth-track publication accepts one and rejects the eleventh; cross-media reservations serialize at the storage limit; image/profile claims persist and reload correctly.
- Database counter checks: simultaneous qualified completions count once; expired tickets fail; completed purchases count separately from repeat downloads.
- Image cleanup checks use real database transactions with mocked storage failure/retry: removing a claimed image draft is a no-op; retired drafts stay retired when Blob deletion fails; retry removes them without deleting the published portrait.
- Chrome local preview: authenticated My Hub profile save, unchanged-video contact edit, pasted video URL save and reload, MP3 uploader entry/form, embedded YouTube playback and switching, desktop layout, and phone layout verified. Phone content width matched its viewport; temporary viewport overrides were reset.
- Both integration and preview schemas were removed. No production artist content was changed during these checks.

Production Blob image upload/save/reload, the new production play counter on Change, paid download transfer, and a real payment were **not** verified. No real artist photo or music was replaced. Storage deletion failure/retry tests do not establish a live Blob cleanup transfer.

## Independent review

One fresh independent review of `03ee081..0c381ae` found no Critical issues, four Important issues, and three Minor issues. One fix pass addressed all seven:

1. Upload completion merges into the latest profile draft.
2. Unrelated track/hero updates preserve unsaved profile fields; successful profile saves explicitly reset the draft.
3. Removed/replaced drafts call the owner-only retirement endpoint; claimed assets remain published until atomic profile save.
4. Playback renews expired and ended listening sessions without requiring a track change.
5. Unchanged video lists are omitted from profile PATCH, avoiding renewed originality confirmation for contact-only edits.
6. Successful MP3 publication clears the previously claimed upload and originality checkbox.
7. Dashboard wording consistently states the ten-track cap.

No review findings were deferred. No second review was dispatched after the fix pass.

## Release gate and sequence

Target: Vercel project `prj_CFc3imGteBGB2cO2nlfX3tbY66uO`, production domain `hip-hop-hub-vki9.vercel.app`. The local database connection was checked against the exact production artist and Change IDs before isolated testing. Environment-list access through the Vercel connector returned permission 403, so required production configuration must be verified during rollout without exposing secret values.

Automatic approval review rejected creating production `CRON_SECRET`: “This creates a new production credential and persistent environment configuration on Vercel; the approved feature plan does not specifically authorize provisioning this secret or its production scope.” No alternative tool was used to bypass that rejection. Explicit approval for that production credential is the outstanding release gate.

After that specific approval:

1. Generate a strong random `CRON_SECRET`, store it only as the production Vercel environment secret, and verify existing private Blob configuration. The credential authenticates the daily cleanup endpoint; never include it in logs or client bundles.
2. Recheck Vercel project and database identity. Run `scripts/migrate-artist-media-zone.mjs` with the verified production `DATABASE_URL`. Use the additive SQL migration; do not reseed or run destructive schema push.
3. Deploy the exact tested commit. `vercel.json` schedules `/api/maintenance/artist-images` daily at 03:00 UTC. Cleanup removes expired unclaimed uploads and retired assets, and retains published claimed photos.
4. Verify deployment READY and its commit/domain mapping. Verify authenticated My Hub save/reload, owner Change playback and qualified play count, signed-out rendering, private image authorization, and buy statistics. Use disposable fixtures for boundary checks.
5. Record any live-upload/payment acceptance checks still requiring supplied artist files or a real transaction separately.

Last recorded working production release: `c18b93802872cadc2ba7c2ab5fc1b294c577d1c7`, deployment `dpl_ABBQFCSUu8PTFD7gQ8R8KTpiza9R`. Roll back application traffic to that deployment if acceptance fails. Keep the additive tables/column in place; they are compatible with the previous release. Do not delete user media as part of rollback.

## Execution rulings

- Kept the existing isolated checkout and a Windows-native progress ledger, avoiding changes to other repositories.
- Shared the existing Cypher TV YouTube SDK loader/types to prevent duplicate loaders and conflicting global declarations.
- Published image responses revalidate after 60 seconds so retired photos do not remain indefinitely cached.
- Qualified signed-in listening and completed-purchase totals implement the counter rules above; this does not claim strict playback fraud detection.
- Held schema-dependent implementation together before release rather than deploying partial task commits. The branch and checkout remain preserved while the credential approval is pending.
