import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSource} from './load-source.mjs';
test('catalog policy allows ten tracks and videos',()=>{const p=loadSource('src/lib/artist-track-policy.ts');assert.equal(p.MAX_ARTIST_TRACKS,10);});
test('YouTube normalization validates actual host and canonical duplicate IDs',()=>{const p=loadSource('src/lib/artist-media-policy.ts');assert.equal(p.getYouTubeVideoId('https://www.youtube.com/watch?v=omnvXEdvgbI&list=example&t=13s'),'omnvXEdvgbI');for(const u of ['https://youtube.com.evil.test/watch?v=omnvXEdvgbI','https://youtube.com/watch?v=short','javascript:alert(1)'])assert.equal(p.getYouTubeVideoId(u),null);assert.throws(()=>p.normalizeArtistVideos([{youtubeUrl:'https://youtu.be/omnvXEdvgbI'},{youtubeUrl:'https://youtube.com/shorts/omnvXEdvgbI'}]));assert.throws(()=>p.normalizeArtistVideos(Array.from({length:11},()=>({youtubeUrl:'https://youtu.be/omnvXEdvgbI'}))));assert.equal(p.MAX_IMAGE_BYTES,2097152);});
