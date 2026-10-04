import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import ts from 'typescript';
import { normalizeVideoIds, MAX_SAVED_VIDEOS } from '../src/lib/cypher-playlist.ts';

const require = createRequire(import.meta.url);
function route(session, db) {
  class AppError extends Error { constructor(code, message, statusCode) { super(message); Object.assign(this, {code, statusCode}); } }
  const aliases = {
    '@/lib/auth': {getSession: async () => session},
    '@/db': {requireDb: () => { if (!db) throw new Error('Database must not be reached'); return db; }, schema: {cypherPlaylists: {userId: 'user_id'}, users: {id: 'id'}}},
    '@/lib/cypher-playlist': {normalizeVideoIds, MAX_SAVED_VIDEOS},
    '@/lib/errors': {AppError, handleApiError: error => Response.json({error: {code: error.code, message: error.message}}, {status: error.statusCode ?? 500})},
  };
  const loaded = new Module(import.meta.url);
  loaded.require = id => Object.hasOwn(aliases, id) ? aliases[id] : require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync(new URL('../src/app/api/cypher-playlist/route.ts', import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, 'cypher-playlist-route.cjs');
  return loaded.exports;
}
function request(origin, body) { return {headers: new Headers({origin}), nextUrl: new URL('https://hub.test/api/cypher-playlist'), json: async () => body}; }

test('anonymous reads stay empty and anonymous or cross-origin writes never access database', async () => {
  const handlers = route(null);
  const read = await handlers.GET();
  assert.deepEqual(await read.json(), {authenticated: false, canAdd: false, videoIds: []});
  assert.equal(read.headers.get('cache-control'), 'private, no-store');
  assert.equal((await handlers.POST(request('https://hub.test', {videoIds: ['abcdefghijk']}))).status, 401);
  assert.equal((await handlers.POST(request('https://evil.test', {videoIds: ['abcdefghijk']}))).status, 403);
});

test('invalid and oversized additions are rejected before database access', async () => {
  const handlers = route({userId: 'account-1', role: 'ARTIST'});
  for (const videoIds of [['bad'], Array(101).fill('abcdefghijk'), null])
    assert.equal((await handlers.POST(request('https://hub.test', {videoIds}))).status, 400);
});

test('saving merges existing videos, preserves order and writes only to session account', async () => {
  let written;
  const tx = {
    select: selection => ({from: () => ({where: () => selection ? {for: async () => [{id: 'account-1', role: 'ARTIST', deletedAt: null}]} : Promise.resolve([{videoIds: ['abcdefghijk']}])})}),
    insert: () => ({values: value => {written = value; return {onConflictDoUpdate: async () => {}};}}),
  };
  const handlers = route({userId: 'account-1', role: 'ARTIST'}, {transaction: callback => callback(tx)});
  const response = await handlers.POST(request('https://hub.test', {userId: 'other-account', videoIds: ['zyxwvutsrqp', 'abcdefghijk']}));
  assert.equal(response.status, 200);
  assert.deepEqual(written, {userId: 'account-1', videoIds: ['abcdefghijk', 'zyxwvutsrqp']});
  assert.deepEqual((await response.json()).videoIds, written.videoIds);
});

 test('fans and admins cannot add videos or import browser lists', async () => {
  for (const role of ['FAN', 'ADMIN']) {
    const handlers = route({userId: 'account-1', role});
    assert.equal((await handlers.POST(request('https://hub.test', {videoIds: ['abcdefghijk']}))).status, 403);
    const read = await handlers.GET();
    assert.deepEqual(await read.json(), {authenticated: true, canAdd: false, videoIds: []});
  }
});

test('an artist session cannot write after the database role changes to fan', async () => {
  const tx = {
    select: () => ({from: () => ({where: () => ({for: async () => [{id: 'account-1', role: 'FAN', deletedAt: null}]})})}),
    insert: () => {throw new Error('No write permitted');},
  };
  const handlers = route({userId: 'account-1', role: 'ARTIST'}, {transaction: callback => callback(tx)});
  assert.equal((await handlers.POST(request('https://hub.test', {videoIds: ['abcdefghijk']}))).status, 403);
});
