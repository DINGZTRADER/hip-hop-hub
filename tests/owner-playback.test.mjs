import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function fixture(session, owner = 'owner', range = false) {
  let reads = 0;
  const schema = {tracks: {id:'id',deletedAt:'deleted'}, artists:{id:'artist',userId:'user',deletedAt:'deleted'}};
  const rows = [[{artistId:'artist',fileUrl:'https://store.private.blob.vercel-storage.com/song.mp3',filesizeBytes:100}], [{userId:owner}]];
  const loaded = new Module(import.meta.url);
  const aliases = {'next/server':{NextResponse:Response}, '@/lib/auth':{getSession:async()=>session}, '@/db':{schema,requireDb:()=>({select:()=>({from:()=>({where:()=>({limit:async()=>rows.shift()})})})})}, 'drizzle-orm':{and:(...x)=>x,eq:(...x)=>x,isNull:x=>x}, '@/lib/errors':{createErrorResponse:(code,message,status)=>Response.json({code,message},{status}),handleApiError:()=>new Response(null,{status:500})}, '@vercel/blob':{get:async(url,options)=>{reads++; assert.equal(options.access,'private'); if(range) assert.equal(options.headers.Range,'bytes=10-19'); return {statusCode:200,stream:new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));c.close();}}),headers:new Headers(range?{'content-range':'bytes 10-19/100','content-length':'10'}:{'content-length':'100'})};}}};
  loaded.require=id=>Object.hasOwn(aliases,id)?aliases[id]:require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync('src/app/api/tracks/[id]/stream/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'stream.cjs');
  return {get:()=>loaded.exports.GET(new Request('https://test/api/tracks/track/stream',{headers:range?{Range:'bytes=10-19'}:{}}),{params:Promise.resolve({id:'track'})}),reads:()=>reads};
}
test('full MP3 streaming denies signed-out users and other artists before reading media',async()=>{
 for(const session of [null,{userId:'other'}]) {const f=fixture(session); assert.equal((await f.get()).status,session?403:401);assert.equal(f.reads(),0);}
});
test('owner playback streams private audio without download counters',async()=>{const f=fixture({userId:'owner'});const r=await f.get();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(f.reads(),1);});
test('owner playback preserves byte ranges for seeking',async()=>{const f=fixture({userId:'owner'},'owner',true);const r=await f.get();assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 10-19/100');});
