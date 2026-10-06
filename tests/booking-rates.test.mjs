import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {loadSource} from './load-source.mjs';
const id='94ac2bb9-ddc2-4ae7-9fd3-20181ef0a310';
test('booking rate edits require distinct service IDs and positive whole UGX amounts',()=>{
 const api=loadSource('src/lib/artist-profile-input.ts');assert.deepEqual(api.validateArtistProfileInput({bookingRates:[{serviceId:id,priceUgx:750000}]}).bookingRates,[{serviceId:id,priceUgx:750000}]);
 for(const priceUgx of [0,-1,1.5,'3000',NaN,2147483648])assert.throws(()=>api.validateArtistProfileInput({bookingRates:[{serviceId:id,priceUgx}]}));
 assert.throws(()=>api.validateArtistProfileInput({bookingRates:[{serviceId:id,priceUgx:1},{serviceId:id,priceUgx:2}]}));assert.throws(()=>api.validateArtistProfileInput({bookingRates:[{serviceId:'bad',priceUgx:1}]}));
});
test('rate updates reject another artists service before any profile mutations',async()=>{
 const schema={artistServices:{artistId:'artist',id:'id',deletedAt:'deleted'}};const writes=[];const tx={select:()=>({from:()=>({where:()=>({for:async()=>[]})})}),update:()=>({set:()=>({where:async()=>writes.push(1)})})};
 const api=loadSource('src/lib/artist-profile.ts',{'@/db':{schema},'./media-quota':{}});await assert.rejects(api.applyArtistProfile(tx,'owner',{id:'artist'},{bookingRates:[{serviceId:id,priceUgx:1}]}),error=>error.code==='INVALID_SERVICE');assert.deepEqual(writes,[]);
});
test('My Hub exposes editable booking rates without changing existing quotes',()=>{
 const api=loadSource('src/components/artist/BookingRatesEditor.tsx');const html=renderToStaticMarkup(React.createElement(api.BookingRatesEditor,{artist:{id:'artist',services:[{id,serviceName:'Wedding performance',priceUgx:1000000}]},onSaved:()=>{}}));assert.match(html,/Wedding performance/);assert.match(html,/Save booking rates/);assert.match(html,/1000000/);assert.match(html,/Existing booking quotes/);
});
