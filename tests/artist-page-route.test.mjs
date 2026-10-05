import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const missing = new Error('not found');
function page() {
  const lookups = [];
  const loaded = new Module(import.meta.url);
  loaded.require = id => {
    if (id === 'next/navigation') return {notFound: () => {throw missing;}};
    if (id === '@/lib/data-service') return {getArtistByStageName: async name => {lookups.push(name); return null;}};
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
