import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const missing = new Error('not found');
function page(artist = null, session = null) {
  const lookups = [];
  const loaded = new Module(import.meta.url);
  loaded.require = id => {
    if (id === '@/lib/auth') return {getSession: async () => session};
    if (id === 'next/navigation') return {notFound: () => {throw missing;}};
    if (id === '@/lib/data-service') return {getArtistByStageName: async name => {lookups.push(name); return artist;}};
    if (id.startsWith('@/components/')) return {};
    if (id === 'lucide-react' || id === 'next/link') return {};
    return require(id);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync('src/app/artist/[stageName]/page.tsx', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022}}).outputText, 'artist-page.cjs');
  return {render: loaded.exports.default, lookups};
}
test('artist page decodes names once before looking them up', async () => {
  for (const name of ['DEEJAY DINGS', 'A&B', '100% Flow', 'Émile', 'Literal%20Name']) {
    const fixture = page();
    await assert.rejects(fixture.render({params: Promise.resolve({stageName: encodeURIComponent(name)})}), error => error === missing);
    assert.deepEqual(fixture.lookups, [name]);
  }
});
test('malformed encoded artist names return not found without a database lookup', async () => {
  const fixture = page();
  await assert.rejects(fixture.render({params: Promise.resolve({stageName: '%ZZ'})}), error => error === missing);
  assert.deepEqual(fixture.lookups, []);
});

 test('only the owner page receives a full MP3 playback URL, without mutating public artist data', async () => {
  const artist = {userId: 'owner', stageName: 'Artist', socials: {}, storageUsedBytes: 0, youtubeVideos: [], services: [], tracks: [{id: 'track', previewUrl: ''}]};
  function boothProps(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.props?.artist) return node.props.artist;
    for (const child of [node.props?.children].flat()) {const found = boothProps(child); if (found) return found;}
    return null;
  }
  for (const session of [null, {userId: 'other'}, {userId: 'owner'}]) {
    const result = await page(artist, session).render({params: Promise.resolve({stageName: 'Artist'})});
    assert.equal(boothProps(result).tracks[0].playbackUrl, session?.userId === 'owner' ? '/api/tracks/track/stream' : undefined);
  }
  assert.equal(artist.tracks[0].playbackUrl, undefined);
 });
