import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const accepted = new Error('validated uploads; reached artist insert');
function service(uploads = []) {
  class AppError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const tx = {
    select: () => ({from: () => ({where: () => ({for: async () => uploads})})}),
    insert: () => {throw accepted;},
  };
  const schema = {mediaUploads: {userId: 'user', status: 'status', blobUrl: 'url'}};
  const aliases = {
    'drizzle-orm': {and: (...args) => args, eq: (...args) => args, inArray: (...args) => args},
    '@/db': {requireDb: () => ({transaction: cb => cb(tx)}), schema},
    './track-statistics': {}, './artist-images': {}, './artist-profile': {}, './artist-profile-input': {validateArtistProfileInput: () => ({})}, './media-quota': {lockMediaOwner: async () => undefined}, './artist-media-policy': {normalizeArtistVideos: () => []}, './artist-track-policy': {MAX_ARTIST_TRACKS: 10}, './pagination': {}, './media': {}, './errors': {AppError},
  };
  const loaded = new Module(import.meta.url);
  loaded.require = id => Object.hasOwn(aliases, id) ? aliases[id] : require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync(new URL('../src/lib/data-service.ts', import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, 'data-service.cjs');
  return loaded.exports;
}
const track = {title: 'Song', durationSeconds: 180, fileUrl: 'https://private.test/song.mp3', filesizeBytes: 5000, priceUgx: 3000};
const profile = {userId: 'owner', stageName: 'Artist', realName: 'Name', dob: '1998-05-14', socials: {}};
test('one verified master without a preview reaches artist creation', async () => {
  const api = service([{kind: 'master', blobUrl: track.fileUrl, actualBytes: 5000}]);
  await assert.rejects(api.registerArtist({...profile, initialTracks: [track]}), error => error === accepted);
});
test('registration rejects zero and eleven tracks', async () => {
  for (const tracks of [[], Array.from({length: 11}, () => track)])
    await assert.rejects(service().registerArtist({...profile, initialTracks: tracks}), error => error.code === 'TRACK_COUNT');
});
test('preview URLs cannot expose a master as a free preview', async () => {
  await assert.rejects(service().registerArtist({...profile, initialTracks: [{...track, previewUrl: track.fileUrl}]}), error => error.code === 'INVALID_TRACK');
});
test('unowned, unverified, wrong-kind and mismatched-size uploads cannot register', async () => {
  for (const uploads of [[], [{kind: 'preview', blobUrl: track.fileUrl, actualBytes: 5000}], [{kind: 'master', blobUrl: track.fileUrl, actualBytes: 4000}]])
    await assert.rejects(service(uploads).registerArtist({...profile, initialTracks: [track]}), error => error.code === 'INVALID_TRACK');
});

test('ten distinct owned masters reach registration', async () => {
 const tracks = Array.from({length:10}, (_,i)=>({...track,fileUrl:track.fileUrl+i}));
 const api=service(tracks.map(t=>({kind:'master',blobUrl:t.fileUrl,actualBytes:5000})));
 await assert.rejects(api.registerArtist({...profile,initialTracks:tracks}),e=>e===accepted);
});
