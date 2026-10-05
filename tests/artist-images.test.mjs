import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {loadSource} from './load-source.mjs';
const errors={'@/db':{},'@vercel/blob':{}};
test('image decoder verifies content, source size, dimensions, animation and crop',async()=>{
 const api=loadSource('src/lib/image-processing.ts',errors);
 const png=await sharp({create:{width:900,height:600,channels:3,background:'red'}}).png().toBuffer();
 const result=await api.optimizeArtistImage(png,'portrait');const meta=await sharp(result.data).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,512);assert.equal(meta.height,512);assert.equal(meta.exif,undefined);
 const gallery=await api.optimizeArtistImage(png,'gallery');assert.ok(gallery.width<=1600);
 for(const buffer of [Buffer.from('<svg/>'),Buffer.from('not a picture'),Buffer.alloc(2097153)]) await assert.rejects(api.optimizeArtistImage(buffer,'portrait'));
 await assert.rejects(api.optimizeArtistImage(png,'portrait',{left:-1,top:0,size:500}));
 const huge=await sharp({create:{width:5000,height:5000,channels:3,background:'white'}}).png().toBuffer();await assert.rejects(api.optimizeArtistImage(huge,'gallery'));
});
test('request reader stops oversized streamed bodies even without content length',async()=>{const {readBoundedBody}=loadSource('src/lib/request-body.ts');const request=new Request('https://example.test',{method:'POST',body:new ReadableStream({start(c){c.enqueue(new Uint8Array(20));c.close();}}),duplex:'half'});await assert.rejects(readBoundedBody(request,10));});
