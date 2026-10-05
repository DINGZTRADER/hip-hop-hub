import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
class AppError extends Error {constructor(code, message) {super(message); this.code = code;}}
function load(file, aliases) {
  const loaded = new Module(import.meta.url);
  loaded.require = id => Object.hasOwn(aliases, id) ? aliases[id] : require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, 'test-loaded.cjs');
  return loaded.exports;
}
const operators = {and: (...args) => args, eq: (...args) => args, isNull: value => value, sql: () => 'count'};
function service(count, uploads, tier = 'FREE') {
  const schema = {artists: {id: 'artist-id', deletedAt: 'deleted'}, tracks: {artistId: 'artist-id', deletedAt: 'deleted'}, mediaUploads: {id: 'upload-id', userId: 'user-id', status: 'status', blobUrl: 'url'}};
  const updates = [];
  let inserted;
  const tx = {
    select: selection => ({from: table => ({where: condition => {
      const rows = selection ? [{count}] : table === schema.artists ? [{id: 'artist', userId: 'owner', subscriptionTier: tier, storageUsedBytes: 0}] : uploads;
      if (table === schema.mediaUploads) {
        assert.deepEqual(condition, [['user-id', 'owner'], ['status', 'UPLOADED'], ['url', 'https://private.test/song.mp3']]);
      }
      return {then: resolve => Promise.resolve(rows).then(resolve), for: () => ({limit: async () => rows})};
    }})}),
    insert: () => ({values: value => {inserted = value; return {returning: async () => [{...value, id: 'track', createdAt: new Date(), updatedAt: new Date()}]};}}),
    update: table => ({set: value => ({where: async () => {updates.push({table, value});}})}),
  };
  const api = load('src/lib/data-service.ts', {'drizzle-orm': operators, '@/db': {requireDb: () => ({transaction: cb => cb(tx)}), schema}, './pagination': {}, './track-statistics': {}, './artist-images': {}, './artist-profile': {}, './artist-profile-input': {validateArtistProfileInput: () => ({})}, './media-quota': {lockMediaOwner: async () => undefined}, './artist-media-policy': {normalizeArtistVideos: () => []}, './artist-track-policy': {MAX_ARTIST_TRACKS: 10}, './errors': {AppError}});
  return {api, updates, schema, inserted: () => inserted};
}
const data = {title: 'Song', fileUrl: 'https://private.test/song.mp3', durationSeconds: 180, filesizeBytes: 5000, priceUgx: 3000, priceUsd: 0.99, isPublished: true};
test('dashboard publication enforces ten tracks for free and pro artists', async () => {
  for (const tier of ['FREE', 'PRO']) {
    await assert.rejects(service(10, [], tier).api.addTrackToArtist('artist', data), error => error.code === 'TRACK_LIMIT_EXCEEDED');
  }
});
test('publication accepts an owned verified master, stores no preview, claims upload and accounts for bytes', async () => {
  const fixture = service(9, [{id: 'upload', kind: 'master', actualBytes: 5000}]);
  const track = await fixture.api.addTrackToArtist('artist', data);
  assert.equal(fixture.inserted().previewUrl, '');
  assert.equal(track.previewUrl, '');
  assert.equal(track.fileUrl, '');
  assert.deepEqual(fixture.updates[0], {table: fixture.schema.mediaUploads, value: {status: 'CLAIMED'}});
  assert.equal(fixture.updates[1].value.storageUsedBytes, 5000);
});
test('publication rejects missing, wrong-kind and mismatched-size masters', async () => {
  for (const uploads of [[], [{kind: 'preview', actualBytes: 5000}], [{kind: 'master', actualBytes: 4000}]])
    await assert.rejects(service(0, uploads).api.addTrackToArtist('artist', data), error => error.code === 'INVALID_TRACK');
});
test('new preview upload reservations are rejected before accessing storage or database', async () => {
  const api = load('src/lib/media-uploads.ts', {'@vercel/blob': {}, 'drizzle-orm': operators, '@/lib/errors': {AppError}, '@/db': {requireDb: () => {throw new Error('Database must not be reached');}}, './media-quota': {}, './media-upload-policy': {parseUploadPath: () => ({id: 'upload', kind: 'preview'})}});
  await assert.rejects(api.reserveMediaUpload('owner', 'preview-path', 5000), error => error.code === 'PREVIEW_DISABLED');
});
