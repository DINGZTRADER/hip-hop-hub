import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {loadSource} from './load-source.mjs';
test('the same track renews expired and ended play sessions without changing selection',async()=>{
 const values=[],effects=[];let cursor=0,now=100000,starts=0,audio;
 const react={...React,useState:initial=>{const i=cursor++;if(!(i in values))values[i]=initial;return[values[i],value=>values[i]=typeof value==='function'?value(values[i]):value];},useRef:initial=>{const i=cursor++;return values[i]??={current:initial};},useEffect:fn=>{const i=cursor++;if(!values[i]){values[i]=true;effects.push(fn);}}};
 const saved={Audio:global.Audio,window:global.window,fetch:global.fetch,now:Date.now};Date.now=()=>now;global.window={};
 global.Audio=class{constructor(){audio=this;this.events={};this.currentTime=0;this.paused=true;}addEventListener(name,fn){this.events[name]=fn;}removeEventListener(){}pause(){this.paused=true;this.events.pause();}async play(){this.paused=false;this.events.play();}};
 global.fetch=async(url,options)=>{if(JSON.parse(options.body).phase==='start')starts++;return{ok:true,json:async()=>({ticket:'ticket',seconds:30,playCount:1})};};
 try{const c=loadSource('src/components/audio/AudioContext.tsx',{react});const render=()=>{cursor=0;return c.AudioProvider({children:null}).props.value;};let context=render();effects.forEach(fn=>fn());const track={id:'track',previewUrl:'/preview'};context.playTrack(track);await Promise.resolve();assert.equal(starts,1);context=render();context.pauseTrack();now+=31*60*1000;context=render();context.togglePlay();await Promise.resolve();assert.equal(starts,2);audio.events.ended();now+=31*60*1000;context=render();context.playTrack(track);await Promise.resolve();assert.equal(starts,3);
 }finally{global.Audio=saved.Audio;global.window=saved.window;global.fetch=saved.fetch;Date.now=saved.now;}
});
