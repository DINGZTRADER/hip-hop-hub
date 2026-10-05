import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {Pool,neonConfig} from '@neondatabase/serverless';import {drizzle} from 'drizzle-orm/neon-serverless';import {loadSource} from './load-source.mjs';
neonConfig.webSocketConstructor=WebSocket;
if(process.env.ARTIST_MEDIA_ENV_FILE)process.loadEnvFile(process.env.ARTIST_MEDIA_ENV_FILE);
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL or ARTIST_MEDIA_ENV_FILE is required');
const name='artist_media_test_'+randomUUID().replaceAll('-','');
const admin=new Pool({connectionString:process.env.DATABASE_URL});
let pool;
try{
 await admin.query(`CREATE SCHEMA "${name}"`);
 for(const table of ['users','artists','tracks','media_uploads','purchases','artist_wallets','artist_youtube_videos','artist_services','event_flyers','freestyles','wallet_transactions']) await admin.query(`CREATE TABLE "${name}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
 const directUrl=new URL(process.env.DATABASE_URL);directUrl.hostname=directUrl.hostname.replace('-pooler.','.');
 pool=new Pool({connectionString:directUrl.toString(),options:`-c search_path=${name},public`});
 const client=await pool.connect();try{await client.query(fs.readFileSync('drizzle/artist-media-zone.sql','utf8'));await client.query(fs.readFileSync('drizzle/artist-media-zone.sql','utf8'));}finally{client.release();}
 const schema=loadSource('src/db/schema.ts');const db=drizzle(pool,{schema});const aliases={'@/db':{schema,requireDb:()=>db},'@vercel/blob':{}};
 const api=loadSource('src/lib/data-service.ts',aliases);const quota=loadSource('src/lib/media-quota.ts',aliases);const profile=loadSource('src/lib/artist-profile.ts',aliases);const statistics=loadSource('src/lib/track-statistics.ts',aliases);
 const userId=randomUUID(),artistId=randomUUID();await db.insert(schema.users).values({id:userId,email:'fixture@example.test',name:'Fixture Artist',role:'ARTIST'});await db.insert(schema.artists).values({id:artistId,userId,stageName:'Artist Media Fixture',realName:'Fixture',dob:'2000-01-01',storageUsedBytes:45000});
 for(let i=0;i<9;i++)await db.insert(schema.tracks).values({artistId,title:'Fixture '+i,durationSeconds:180,fileUrl:'https://private.test/fixture'+i,previewUrl:'',filesizeBytes:5000});
 const uploads=[0,1].map(i=>({id:randomUUID(),userId,kind:'master',pathname:'test/'+randomUUID(),blobUrl:'https://private.test/new'+i,reservedBytes:5000,actualBytes:5000,status:'UPLOADED',expiresAt:new Date(Date.now()+60000)}));await db.insert(schema.mediaUploads).values(uploads);
 const results=await Promise.allSettled(uploads.map(u=>api.addTrackToArtist(artistId,{title:'Concurrent tenth',durationSeconds:180,fileUrl:u.blobUrl,filesizeBytes:5000,priceUgx:3000,priceUsd:0.99,isPublished:true},userId)));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='TRACK_LIMIT_EXCEEDED').length,1);
 await pool.query('UPDATE artists SET storage_used_bytes=524286000');await pool.query("UPDATE media_uploads SET status='CLAIMED'");
 const reserve=()=>db.transaction(async tx=>{const artist=await quota.lockMediaOwner(tx,userId);await quota.assertMediaCapacity(tx,userId,1000,artist);await tx.insert(schema.artistImageAssets).values({id:randomUUID(),userId,purpose:'gallery',filename:'test.webp',width:10,height:10,pathname:randomUUID(),reservedBytes:1000,status:'PENDING',expiresAt:new Date(Date.now()+60000)});});
 const reservations=await Promise.allSettled([reserve(),reserve(),reserve()]);assert.equal(reservations.filter(r=>r.status==='fulfilled').length,2);assert.equal(reservations.filter(r=>r.status==='rejected').length,1);
 await pool.query('UPDATE artists SET storage_used_bytes=50000');await pool.query('DELETE FROM artist_image_assets');
 const imageId=randomUUID();await db.insert(schema.artistImageAssets).values({id:imageId,userId,purpose:'portrait',filename:'portrait.webp',width:512,height:512,pathname:randomUUID(),blobUrl:'https://store.private.blob.vercel-storage.com/test.webp',reservedBytes:1000,actualBytes:1000,status:'UPLOADED',expiresAt:new Date(Date.now()+60000)});
 const artist=(await db.select().from(schema.artists))[0];await db.transaction(tx=>profile.applyArtistProfile(tx,userId,artist,{portraitImageId:imageId,websiteUrl:'https://example.test'}));const saved=await api.getArtistById(artistId);assert.equal(saved.portrait.id,imageId);assert.equal(saved.websiteUrl,'https://example.test');assert.equal(saved.storageUsedBytes,51000);
 const trackId=results.find(r=>r.status==='fulfilled').value.id;
 const purchase={id:randomUUID(),buyerId:userId,trackId,artistId,amountPaidUgx:3000,platformCommissionUgx:600,artistEarningsUgx:2400,paymentMethod:'CARD',paymentReference:randomUUID(),status:'COMPLETED',downloadExpiresAt:new Date(Date.now()+60000),downloadCount:4};await db.insert(schema.purchases).values(purchase);let counts=await statistics.getTrackStatistics([trackId]);assert.equal(counts[0].purchaseCount,1);await pool.query("UPDATE purchases SET status='PENDING'");counts=await statistics.getTrackStatistics([trackId]);assert.equal(counts[0].purchaseCount,0);
 console.log('PASS: additive migration twice; concurrent tenth-track cap; cross-media quota serialization; image/profile save and reload; buys separate from downloads.');
}finally{if(pool)await pool.end();if(/^artist_media_test_[a-f0-9]{32}$/.test(name))await admin.query(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);await admin.end();}
