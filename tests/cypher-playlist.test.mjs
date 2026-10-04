import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURED_IDS, normalizeVideoIds, youtubeId } from '../src/lib/cypher-playlist.ts';

test('accepts YouTube watch, Shorts and short links without trusting lookalike hosts', () => {
  const id = 'abcdefghijk';
  for (const url of [`https://www.youtube.com/watch?v=${id}&t=5`, `https://youtube.com/shorts/${id}`, `https://youtu.be/${id}`]) assert.equal(youtubeId(url), id);
  for (const url of [`http://youtube.com/watch?v=${id}`, `https://youtube.com.evil.test/watch?v=${id}`, 'https://youtu.be/short', 'garbage']) assert.equal(youtubeId(url), null);
});

test('saved IDs are bounded, validated, deduplicated and keep addition order', () => {
  assert.deepEqual(normalizeVideoIds(['abcdefghijk', FEATURED_IDS[0], 'zyxwvutsrqp', 'abcdefghijk']), ['abcdefghijk', 'zyxwvutsrqp']);
  assert.equal(normalizeVideoIds(['bad']), null);
  assert.equal(normalizeVideoIds([null]), null);
  assert.equal(normalizeVideoIds({videoIds: []}), null);
  assert.equal(normalizeVideoIds(Array(101).fill('abcdefghijk')), null);
});
